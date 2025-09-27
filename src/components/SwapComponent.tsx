"use client";

import React, { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { useSwap } from "../utils/useSwap";
import { TOKEN_ADDRESSES } from "../utils/swapUtils";

export default function SwapComponent() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const {
    executeSwap,
    approveToken,
    isLoading,
    isApproving,
    error,
    approvalHash,
    isApprovalConfirmed,
  } = useSwap();

  const [amount, setAmount] = useState("200000"); // Default amount in token units
  const [invert, setInvert] = useState(false);
  const [orderHash, setOrderHash] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("");

  const handleApprove = async () => {
    if (!isConnected) return;

    try {
      // Determine which token to approve based on current chain and invert setting
      let tokenAddress: string;
      let approvalChainId: number;

      if (invert) {
        // If inverted, we're swapping from Base to Arbitrum
        tokenAddress = TOKEN_ADDRESSES.BASE_USDC;
        approvalChainId = 8453; // Base
      } else {
        // Normal: swapping from Arbitrum to Base
        tokenAddress = TOKEN_ADDRESSES.ARBITRUM_USDC;
        approvalChainId = 42161; // Arbitrum
      }

      await approveToken(tokenAddress, approvalChainId);
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const handleSwap = async () => {
    if (!isConnected || !address) return;

    const swapParams = {
      srcChainId: 42161, // Arbitrum
      dstChainId: 8453, // Base
      srcTokenAddress: TOKEN_ADDRESSES.ARBITRUM_USDC,
      dstTokenAddress: TOKEN_ADDRESSES.BASE_USDC,
      amount,
      walletAddress: address,
      invert,
    };

    const callbacks = {
      onQuoteReceived: (quote: any) => {
        console.log("Quote received:", quote);
        setOrderStatus("Quote received");
      },
      onOrderPlaced: (hash: string) => {
        setOrderHash(hash);
        setOrderStatus("Order placed, waiting for fills...");
      },
      onFillFound: (fillInfo: any) => {
        setOrderStatus("Fill found, submitting secret...");
      },
      onOrderComplete: () => {
        setOrderStatus("Order completed successfully!");
      },
      onError: (error: any) => {
        console.error("Swap error:", error);
        setOrderStatus(`Error: ${error.message}`);
      },
    };

    await executeSwap(swapParams, callbacks);
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Cross-Chain Swap</h2>
        <p>Please connect your wallet to use the swap functionality.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Cross-Chain Swap</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Amount (in token units):
        </label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="200000"
        />
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={invert}
            onChange={(e) => setInvert(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">
            Invert direction (Base → Arbitrum instead of Arbitrum → Base)
          </span>
        </label>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className={`w-full font-bold py-2 px-4 rounded transition-colors ${
            isApprovalConfirmed
              ? "bg-green-500 text-white cursor-default"
              : isApproving
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isApprovalConfirmed
            ? "✓ Token Approved"
            : isApproving
            ? "Approving..."
            : "Approve Token"}
        </button>

        {approvalHash && (
          <div className="text-sm">
            <p
              className={`${
                isApprovalConfirmed ? "text-green-600" : "text-blue-600"
              }`}
            >
              Approval TX: {approvalHash.slice(0, 10)}...
              {approvalHash.slice(-8)}
              {isApprovalConfirmed && " ✓"}
            </p>
          </div>
        )}

        <button
          onClick={handleSwap}
          disabled={isLoading || !isApprovalConfirmed}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {isLoading ? "Swapping..." : "Execute Swap"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {orderStatus && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Status: {orderStatus}
        </div>
      )}

      {orderHash && (
        <div className="mt-4 p-3 bg-gray-100 border rounded">
          <p className="text-sm font-medium">Order Hash:</p>
          <p className="text-xs break-all">{orderHash}</p>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-600">
        <p>Connected: {address}</p>
        <p>Chain ID: {chainId}</p>
        <p>Direction: {invert ? "Base → Arbitrum" : "Arbitrum → Base"}</p>
        <p>
          Approval Status:{" "}
          {isApprovalConfirmed
            ? "Confirmed"
            : approvalHash
            ? "Pending"
            : "Not approved"}
        </p>
      </div>
    </div>
  );
}
