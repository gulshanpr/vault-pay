import { useState, useCallback } from "react";
import {
  useAccount,
  useWalletClient,
  usePublicClient,
  useSwitchChain,
} from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  vaultSwapService,
  VaultSwapParams,
  SwapCallbacks,
} from "@/lib/swapService";
import { Token } from "@/lib/tokenService";

export interface UseVaultSwapReturn {
  isLoading: boolean;
  isApproving: boolean;
  error: string | null;
  approvalHash: string | null;
  orderHash: string | null;
  orderStatus: string | null;
  executeVaultSwap: (
    params: VaultSwapParams,
    callbacks?: SwapCallbacks
  ) => Promise<void>;
  approveToken: (tokenAddress: string, chainId: number) => Promise<void>;
  getSwapRoute: (fromChainId: number, fromTokenAddress: string) => any;
  reset: () => void;
}

export function useVaultSwap(): UseVaultSwapReturn {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { wallets } = useWallets();
  const { authenticated } = usePrivy();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalHash, setApprovalHash] = useState<string | null>(null);
  const [orderHash, setOrderHash] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string | null>(null);

  // Get wallet address (prioritize Wagmi, fallback to Privy)
  const walletAddress = address || wallets[0]?.address || "";

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsApproving(false);
    setError(null);
    setApprovalHash(null);
    setOrderHash(null);
    setOrderStatus(null);
  }, []);

  const approveToken = useCallback(
    async (tokenAddress: string, chainId: number) => {
      if (!walletClient || !publicClient || !walletAddress) {
        const errorMsg = "Wallet not connected";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setIsApproving(true);
      setError(null);
      setApprovalHash(null);

      try {
        // Switch to the correct chain if needed
        if (publicClient.chain.id !== chainId) {
          console.log(`Switching to chain ${chainId}`);
          await switchChain({ chainId });
          // Wait for chain switch to complete
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        const hash = await vaultSwapService.approveToken(
          tokenAddress,
          chainId,
          walletClient,
          publicClient
        );

        setApprovalHash(hash);
        setIsApproving(false);
      } catch (err: any) {
        console.error("Error in approveToken:", err);
        setError(err.message || "Approval failed");
        setIsApproving(false);
        throw err;
      }
    },
    [walletClient, publicClient, walletAddress, switchChain]
  );

  const executeVaultSwap = useCallback(
    async (params: VaultSwapParams, callbacks?: SwapCallbacks) => {
      if (!walletClient || !publicClient || !walletAddress) {
        const errorMsg = "Wallet not connected";
        setError(errorMsg);
        callbacks?.onError?.(new Error(errorMsg));
        return;
      }

      setIsLoading(true);
      setError(null);
      setOrderHash(null);
      setOrderStatus("Initializing...");

      const enhancedCallbacks: SwapCallbacks = {
        onQuoteReceived: (quote) => {
          setOrderStatus("Quote received");
          callbacks?.onQuoteReceived?.(quote);
        },
        onOrderPlaced: (hash) => {
          setOrderHash(hash);
          setOrderStatus("Order placed, waiting for fills...");
          callbacks?.onOrderPlaced?.(hash);
        },
        onFillFound: (fill) => {
          setOrderStatus("Fill found, submitting secret...");
          callbacks?.onFillFound?.(fill);
        },
        onOrderComplete: () => {
          setOrderStatus("Swap completed successfully!");
          setIsLoading(false);
          callbacks?.onOrderComplete?.();
        },
        onError: (error) => {
          console.error("Vault swap error:", error);
          setError(error.message || "Swap failed");
          setOrderStatus("Swap failed");
          setIsLoading(false);
          callbacks?.onError?.(error);
        },
      };

      try {
        // Switch to source chain if needed
        if (publicClient.chain.id !== params.fromChainId) {
          console.log(`Switching to source chain ${params.fromChainId}`);
          await switchChain({ chainId: params.fromChainId });
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        await vaultSwapService.executeVaultSwap(
          { ...params, walletAddress },
          walletClient,
          publicClient,
          enhancedCallbacks
        );
      } catch (err: any) {
        console.error("Error in executeVaultSwap:", err);
        setError(err.message || "Swap failed");
        setOrderStatus("Swap failed");
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, walletAddress, switchChain]
  );

  const getSwapRoute = useCallback(
    (fromChainId: number, fromTokenAddress: string) => {
      return vaultSwapService.getSwapRoute(fromChainId, fromTokenAddress);
    },
    []
  );

  return {
    isLoading,
    isApproving,
    error,
    approvalHash,
    orderHash,
    orderStatus,
    executeVaultSwap,
    approveToken,
    getSwapRoute,
    reset,
  };
}
