"use client";

import { useMemo, useRef, useState } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { SDK, HashLock, NetworkEnum } from "@1inch/cross-chain-sdk";
import {
  NextApiHttpProvider,
  WagmiPrivyBlockchainProvider,
} from "@/lib/fusionPlusProviders";
import { getContract } from "viem";

const APPROVE_ABI = [
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

const ONEINCH_ROUTER_V6 = "0x111111125421ca6dc452d289314280a0f8842a65";

export type FusionPlusQuoteParams = {
  srcChainId: NetworkEnum | number;
  dstChainId: NetworkEnum | number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  amount: string;
  walletAddress: string;
  enableEstimate?: boolean;
};

export function useFusionPlusCrossChain() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [quote, setQuote] = useState<any>(null);
  const [orderHash, setOrderHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sdkRef = useRef<SDK | null>(null);

  const sdk = useMemo(() => {
    if (!walletClient || !publicClient) return null;
    const httpProvider = new NextApiHttpProvider();
    const blockchainProvider = new WagmiPrivyBlockchainProvider(
      walletClient,
      publicClient
    );
    const instance = new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      httpProvider,
      blockchainProvider,
    });
    sdkRef.current = instance;
    return instance;
  }, [walletClient, publicClient]);

  async function approveIfNeeded(token: `0x${string}`) {
    if (!walletClient || !publicClient || !address)
      throw new Error("Wallet not ready");
    const tokenContract = getContract({
      address: token,
      abi: APPROVE_ABI as any,
      client: { public: publicClient, wallet: walletClient },
    });
    const txHash = await walletClient.writeContract({
      address: token,
      abi: APPROVE_ABI as any,
      functionName: "approve",
      args: [
        ONEINCH_ROUTER_V6,
        BigInt(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        ),
      ],
    });
    await publicClient.waitForTransactionReceipt({ hash: txHash });
    return txHash;
  }

  async function getQuote(
    params: Omit<FusionPlusQuoteParams, "walletAddress">
  ) {
    if (!sdk || !address) throw new Error("SDK not ready");
    setLoading(true);
    setError(null);
    try {
      const q = await sdk.getQuote({
        ...params,
        walletAddress: address,
        enableEstimate: true,
      });
      setQuote(q);
      return q;
    } catch (e: any) {
      setError(e?.message || "Failed to get quote");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function placeOrderAndHandleFills() {
    if (!sdk || !quote || !address) throw new Error("SDK or quote not ready");
    setLoading(true);
    setError(null);
    try {
      const secretsCount = quote.getPreset().secretsCount as number;
      const secrets = Array.from({ length: secretsCount }).map(() =>
        HashLock.getSecret()
      );
      const secretHashes = secrets.map((s) => HashLock.hashSecret(s));

      const hashLock =
        secretsCount === 1
          ? HashLock.forSingleFill(secrets[0])
          : HashLock.forMultipleFills(
              secretHashes.map((secretHash, i) =>
                HashLock.hashFill(i, secretHash.toString())
              )
            );

      const resp = await sdk.placeOrder(quote, {
        walletAddress: address,
        hashLock,
        secretHashes,
      });
      const oh = resp.orderHash as string;
      setOrderHash(oh);

      const poll = async () => {
        try {
          const order = await sdk.getOrderStatus(oh);
          if (order.status === "executed") return true;
          const fillsObj = await sdk.getReadyToAcceptSecretFills(oh);
          if (fillsObj?.fills?.length) {
            for (const fill of fillsObj.fills) {
              try {
                await sdk.submitSecret(oh, secrets[fill.idx]);
              } catch {}
            }
          }
        } catch {}
        return false;
      };

      await new Promise<void>((resolve, reject) => {
        let tries = 0;
        const id = setInterval(async () => {
          tries++;
          const done = await poll();
          if (done || tries > 120) {
            clearInterval(id);
            done ? resolve() : reject(new Error("Order not executed in time"));
          }
        }, 5000);
      });

      return { orderHash: oh };
    } catch (e: any) {
      setError(e?.message || "Failed to place order");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return {
    sdk,
    quote,
    orderHash,
    loading,
    error,
    getQuote,
    approveIfNeeded,
    placeOrderAndHandleFills,
  };
}
