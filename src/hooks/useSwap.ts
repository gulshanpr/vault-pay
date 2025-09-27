"use client";

import { useState, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { swapService, SwapParams } from "@/lib/swapService";
import { NetworkEnum } from "@1inch/cross-chain-sdk";

export interface SwapState {
  isLoading: boolean;
  quote: any | null;
  orderHash: string | null;
  orderStatus: string | null;
  error: string | null;
}

export function useSwap() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [state, setState] = useState<SwapState>({
    isLoading: false,
    quote: null,
    orderHash: null,
    orderStatus: null,
    error: null,
  });

  const walletAddress = wallets[0]?.address;

  const getQuote = useCallback(async (params: SwapParams) => {
    if (!ready || !authenticated || !walletAddress) {
      setState(prev => ({ ...prev, error: "Wallet not connected" }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const quote = await swapService.getQuote({
        ...params,
        walletAddress,
      });

      setState(prev => ({
        ...prev,
        quote,
        isLoading: false,
      }));

      return quote;
    } catch (error) {
      console.error("Error getting quote:", error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to get quote",
        isLoading: false,
      }));
    }
  }, [ready, authenticated, walletAddress]);

  const placeOrder = useCallback(async (quote: any) => {
    if (!ready || !authenticated || !walletAddress) {
      setState(prev => ({ ...prev, error: "Wallet not connected" }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const orderHash = await swapService.placeOrder(quote, walletAddress);

      setState(prev => ({
        ...prev,
        orderHash,
        isLoading: false,
      }));

      return orderHash;
    } catch (error) {
      console.error("Error placing order:", error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to place order",
        isLoading: false,
      }));
    }
  }, [ready, authenticated, walletAddress]);

  const getOrderStatus = useCallback(async (orderHash: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const status = await swapService.getOrderStatus(orderHash);

      setState(prev => ({
        ...prev,
        orderStatus: status.status,
        isLoading: false,
      }));

      return status;
    } catch (error) {
      console.error("Error getting order status:", error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to get order status",
        isLoading: false,
      }));
    }
  }, []);

  const monitorOrderStatus = useCallback(async (orderHash: string, onStatusUpdate?: (status: string) => void) => {
    const intervalId = setInterval(async () => {
      try {
        const status = await swapService.getOrderStatus(orderHash);

        setState(prev => ({
          ...prev,
          orderStatus: status.status,
        }));

        onStatusUpdate?.(status.status);

        if (status.status === 'executed') {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Error monitoring order status:", error);
        clearInterval(intervalId);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const getReadyToAcceptSecretFills = useCallback(async (orderHash: string) => {
    try {
      return await swapService.getReadyToAcceptSecretFills(orderHash);
    } catch (error) {
      console.error("Error getting ready to accept secret fills:", error);
      throw error;
    }
  }, []);

  const submitSecret = useCallback(async (orderHash: string, secret: string) => {
    try {
      await swapService.submitSecret(orderHash, secret);
    } catch (error) {
      console.error("Error submitting secret:", error);
      throw error;
    }
  }, []);

  return {
    ...state,
    getQuote,
    placeOrder,
    getOrderStatus,
    monitorOrderStatus,
    getReadyToAcceptSecretFills,
    submitSecret,
    isWalletConnected: ready && authenticated && walletAddress,
  };
}
