import { useState, useCallback } from "react";
import {
  useAccount,
  useWalletClient,
  usePublicClient,
  useChainId,
} from "wagmi";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  fusionSwapService,
  FusionSwapParams,
  FusionQuoteParams,
  SwapCallbacks,
} from "@/lib/fusionSwapService";
import { NetworkEnum, PresetEnum } from "@1inch/fusion-sdk";

// Chain ID to NetworkEnum mapping - Updated with correct mappings
const CHAIN_TO_NETWORK: Record<number, NetworkEnum> = {
  1: NetworkEnum.ETHEREUM,
  137: NetworkEnum.POLYGON,
  42161: NetworkEnum.ARBITRUM,
  10: NetworkEnum.OPTIMISM,
  8453: NetworkEnum.COINBASE, // Base
  56: NetworkEnum.BINANCE,
  43114: NetworkEnum.AVALANCHE,
  250: NetworkEnum.FANTOM,
  100: NetworkEnum.GNOSIS,
  // Note: Some networks might not be supported by Fusion SDK
  // 1101: NetworkEnum.POLYGON_ZKEVM,
  // 324: NetworkEnum.ZKSYNC,
  // 59144: NetworkEnum.LINEA,
  // 534352: NetworkEnum.SCROLL,
};

export interface UseFusionSwapReturn {
  isLoading: boolean;
  error: string | null;
  quote: any | null;
  orderHash: string | null;
  getQuote: (params: FusionQuoteParams) => Promise<any>;
  executeSwap: (
    params: Omit<FusionSwapParams, "walletAddress" | "network">,
    callbacks?: SwapCallbacks
  ) => Promise<void>;
  getActiveOrders: (page?: number, limit?: number) => Promise<any>;
  getAllActiveOrders: (page?: number, limit?: number) => Promise<any>;
  reset: () => void;
  isWalletConnected: boolean;
  currentNetwork: NetworkEnum | null;
  isFusionSupported: boolean;
}

export function useFusionSwap(): UseFusionSwapReturn {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const chainId = useChainId();
  const { wallets } = useWallets();
  const { authenticated } = usePrivy();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<any | null>(null);
  const [orderHash, setOrderHash] = useState<string | null>(null);

  // Get wallet address (prioritize Wagmi, fallback to Privy)
  const walletAddress = address || wallets[0]?.address || "";
  const isWalletConnected = authenticated && !!walletAddress;
  const currentNetwork = chainId ? CHAIN_TO_NETWORK[chainId] : null;
  const isFusionSupported = !!currentNetwork;

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setQuote(null);
    setOrderHash(null);
  }, []);

  const getQuote = useCallback(
    async (params: FusionQuoteParams) => {
      if (!currentNetwork) {
        const errorMsg = `Network ${chainId} is not supported by Fusion SDK`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!params.fromTokenAddress || !params.toTokenAddress) {
        const errorMsg = "Token addresses are required";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      if (!params.amount || params.amount === "0") {
        const errorMsg = "Valid amount is required";
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log(
          "Getting quote for network:",
          currentNetwork,
          "with params:",
          params
        );

        const quoteResult = await fusionSwapService.getQuote(
          params,
          currentNetwork
        );

        setQuote(quoteResult);
        setIsLoading(false);
        return quoteResult;
      } catch (err: any) {
        console.error("Error getting quote:", err);

        let errorMessage = "Failed to get quote";
        if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setIsLoading(false);
        throw new Error(errorMessage);
      }
    },
    [currentNetwork, chainId]
  );

  const executeSwap = useCallback(
    async (
      params: Omit<FusionSwapParams, "walletAddress" | "network">,
      callbacks?: SwapCallbacks
    ) => {
      if (!walletClient || !publicClient || !walletAddress || !currentNetwork) {
        const errorMsg =
          !walletClient || !publicClient || !walletAddress
            ? "Wallet not connected"
            : `Network ${chainId} not supported by Fusion SDK`;
        setError(errorMsg);
        callbacks?.onError?.(new Error(errorMsg));
        return;
      }

      if (!params.fromTokenAddress || !params.toTokenAddress) {
        const errorMsg = "Token addresses are required";
        setError(errorMsg);
        callbacks?.onError?.(new Error(errorMsg));
        return;
      }

      if (!params.amount || params.amount === "0") {
        const errorMsg = "Valid amount is required";
        setError(errorMsg);
        callbacks?.onError?.(new Error(errorMsg));
        return;
      }

      setIsLoading(true);
      setError(null);
      setOrderHash(null);

      const enhancedCallbacks: SwapCallbacks = {
        onQuoteReceived: (quote) => {
          console.log("Quote received in hook:", quote);
          setQuote(quote);
          callbacks?.onQuoteReceived?.(quote);
        },
        onOrderPlaced: (hash) => {
          console.log("Order placed in hook:", hash);
          setOrderHash(hash);
          callbacks?.onOrderPlaced?.(hash);
        },
        onOrderComplete: () => {
          console.log("Order completed in hook");
          setIsLoading(false);
          callbacks?.onOrderComplete?.();
        },
        onError: (error) => {
          console.error("Fusion swap error in hook:", error);

          let errorMessage = "Swap failed";
          if (error instanceof Error) {
            errorMessage = error.message;
          }

          setError(errorMessage);
          setIsLoading(false);
          callbacks?.onError?.(error);
        },
      };

      try {
        console.log("Executing swap with params:", {
          ...params,
          walletAddress,
          network: currentNetwork,
        });

        await fusionSwapService.executeSwap(
          {
            ...params,
            walletAddress,
            network: currentNetwork,
          },
          walletClient,
          publicClient,
          enhancedCallbacks
        );
      } catch (err: any) {
        console.error("Error in executeSwap:", err);

        let errorMessage = "Swap failed";
        if (err instanceof Error) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setIsLoading(false);
      }
    },
    [walletClient, publicClient, walletAddress, currentNetwork, chainId]
  );

  const getActiveOrders = useCallback(
    async (page: number = 1, limit: number = 10) => {
      if (!walletAddress || !currentNetwork) {
        throw new Error("Wallet not connected or unsupported network");
      }

      try {
        return await fusionSwapService.getActiveOrders(
          currentNetwork,
          walletAddress,
          page,
          limit
        );
      } catch (err: any) {
        console.error("Error getting active orders:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get active orders";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [walletAddress, currentNetwork]
  );

  const getAllActiveOrders = useCallback(
    async (page: number = 1, limit: number = 10) => {
      if (!currentNetwork) {
        throw new Error("Unsupported network");
      }

      try {
        return await fusionSwapService.getAllActiveOrders(
          currentNetwork,
          page,
          limit
        );
      } catch (err: any) {
        console.error("Error getting all active orders:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to get all active orders";
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [currentNetwork]
  );

  return {
    isLoading,
    error,
    quote,
    orderHash,
    getQuote,
    executeSwap,
    getActiveOrders,
    getAllActiveOrders,
    reset,
    isWalletConnected,
    currentNetwork,
    isFusionSupported,
  };
}
