import { useState, useCallback } from "react";
import {
  useAccount,
  useWalletClient,
  usePublicClient,
  useChainId,
} from "wagmi";
import { parseUnits } from "viem";
import { getContractAddress } from "@/config/abi";

interface RedeemParams {
  vaultAddress: string;
  amount: string;
  recipient: string;
  minOut?: string;
  isEulerVault?: boolean;
}

interface WithdrawParams {
  vaultAddress: string;
  assets: string;
  recipient: string;
  maxSharesIn?: string;
  isEulerVault?: boolean;
}

interface TransferParams {
  vaultAddress: string;
  amount: string;
  recipient: string;
}

export function useVaultRedeem() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setTxHash(null);
  }, []);

  const redeemShares = useCallback(
    async (params: RedeemParams) => {
      if (!walletClient || !publicClient || !address || !chainId) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const contractAddress = getContractAddress(
          chainId,
          params.isEulerVault ? "EULER_VAULT_ADAPTER" : "VAULT_ADAPTER"
        );

        const sharesAmount = parseUnits(params.amount, 18);
        const minOut = params.minOut ? parseUnits(params.minOut, 18) : 0n;

        const hash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: vaultAdapterABI,
          functionName: "redeemShares",
          args: [
            params.vaultAddress as `0x${string}`,
            sharesAmount,
            params.recipient as `0x${string}`,
            minOut,
          ],
        });

        setTxHash(hash);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
          throw new Error("Transaction failed");
        }

        return hash;
      } catch (err: any) {
        console.error("Redeem failed:", err);
        setError(err.message || "Redeem failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, address, chainId]
  );

  const withdrawAssets = useCallback(
    async (params: WithdrawParams) => {
      if (!walletClient || !publicClient || !address || !chainId) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const contractAddress = getContractAddress(
          chainId,
          params.isEulerVault ? "EULER_VAULT_ADAPTER" : "VAULT_ADAPTER"
        );

        const assetsAmount = parseUnits(params.assets, 18);
        const maxSharesIn = params.maxSharesIn
          ? parseUnits(params.maxSharesIn, 18)
          : assetsAmount;

        const hash = await walletClient.writeContract({
          address: contractAddress as `0x${string}`,
          abi: vaultAdapterABI,
          functionName: "withdrawAssets",
          args: [
            params.vaultAddress as `0x${string}`,
            assetsAmount,
            params.recipient as `0x${string}`,
            maxSharesIn,
          ],
        });

        setTxHash(hash);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
          throw new Error("Transaction failed");
        }

        return hash;
      } catch (err: any) {
        console.error("Withdraw failed:", err);
        setError(err.message || "Withdraw failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, address, chainId]
  );

  const transferShares = useCallback(
    async (params: TransferParams) => {
      if (!walletClient || !publicClient || !address) {
        throw new Error("Wallet not connected");
      }

      setIsLoading(true);
      setError(null);
      setTxHash(null);

      try {
        const sharesAmount = parseUnits(params.amount, 18);

        const hash = await walletClient.writeContract({
          address: params.vaultAddress as `0x${string}`,
          abi: erc20ABI,
          functionName: "transfer",
          args: [params.recipient as `0x${string}`, sharesAmount],
        });

        setTxHash(hash);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (receipt.status !== "success") {
          throw new Error("Transaction failed");
        }

        return hash;
      } catch (err: any) {
        console.error("Transfer failed:", err);
        setError(err.message || "Transfer failed");
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, address]
  );

  return {
    isLoading,
    error,
    txHash,
    redeemShares,
    withdrawAssets,
    transferShares,
    reset,
  };
}

// ABIs
const vaultAdapterABI = [
  {
    name: "redeemShares",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vault", type: "address" },
      { name: "shares", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "minAssetsOut", type: "uint256" },
    ],
    outputs: [{ name: "assetsReceived", type: "uint256" }],
  },
  {
    name: "withdrawAssets",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "vault", type: "address" },
      { name: "assets", type: "uint256" },
      { name: "recipient", type: "address" },
      { name: "maxSharesIn", type: "uint256" },
    ],
    outputs: [{ name: "sharesBurned", type: "uint256" }],
  },
] as const;

const erc20ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
