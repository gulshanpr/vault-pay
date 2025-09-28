"use client";

import { useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  vaultSwapService,
  VaultSwapParams,
  SwapCallbacks,
} from "@/lib/swapService";
import { NetworkEnum } from "@1inch/cross-chain-sdk";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";

export interface SwapState {
  isLoading: boolean;
  quote: any | null;
  orderHash: string | null;
  orderStatus: string | null;
  error: string | null;
}

export interface SwapParams {
  srcChainId: NetworkEnum;
  dstChainId: NetworkEnum;
  srcTokenAddress: string;
  dstTokenAddress: string;
  amount: string;
  walletAddress: string;
}

export function useSwap() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [state, setState] = useState<SwapState>({
    isLoading: false,
    quote: null,
    orderHash: null,
    orderStatus: null,
    error: null,
  });

  // Get wallet address (prioritize Wagmi, fallback to Privy)
  const walletAddress = address || wallets[0]?.address || "";
  const isWalletConnected = ready && authenticated && !!walletAddress;

  const getQuote = useCallback(
    async (params: SwapParams) => {
      if (!walletClient || !publicClient || !walletAddress) {
        setState((prev) => ({ ...prev, error: "Wallet not connected" }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const sdk = vaultSwapService["createSDK"](walletClient, publicClient);
        const quote = await sdk.getQuote({
          srcChainId: params.srcChainId as any,
          dstChainId: params.dstChainId as any,
          srcTokenAddress: params.srcTokenAddress,
          dstTokenAddress: params.dstTokenAddress,
          amount: params.amount,
          enableEstimate: true,
          walletAddress: params.walletAddress,
        });

        setState((prev) => ({
          ...prev,
          quote,
          isLoading: false,
          orderStatus: "Quote received",
        }));

        return quote;
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || "Failed to get quote",
          isLoading: false,
        }));
        throw error;
      }
    },
    [walletClient, publicClient, walletAddress]
  );

  const placeOrder = useCallback(
    async (quote: any) => {
      if (!walletClient || !publicClient || !walletAddress) {
        setState((prev) => ({ ...prev, error: "Wallet not connected" }));
        return;
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // This is a simplified version - you might need to implement the full order placement logic
        // For now, we'll use the vault swap service
        throw new Error(
          "Use useVaultSwap hook instead for full swap functionality"
        );
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          error: error.message || "Failed to place order",
          isLoading: false,
        }));
        throw error;
      }
    },
    [walletClient, publicClient, walletAddress]
  );

  const monitorOrderStatus = useCallback(
    (orderHash: string, callback?: (status: string) => void) => {
      // Simplified monitoring - implement as needed
      console.log("Monitoring order:", orderHash);
      if (callback) callback("monitoring");
    },
    []
  );

  return {
    ...state,
    getQuote,
    placeOrder,
    monitorOrderStatus,
    isWalletConnected,
  };
}
