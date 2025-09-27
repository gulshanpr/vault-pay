"use client";

import React, { useState } from "react";
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  approveABI,
  AGGREGATION_ROUTER_V6,
  TOKEN_ADDRESSES,
} from "../utils/swapUtils";

export default function DebugSwap() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [error, setError] = useState<string | null>(null);

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleDirectApproval = async () => {
    if (!isConnected) return;

    setError(null);

    try {
      console.log("Direct approval attempt:");
      console.log("Chain ID:", chainId);
      console.log("Address:", address);
      console.log("Token:", TOKEN_ADDRESSES.ARBITRUM_USDC);
      console.log("Spender:", AGGREGATION_ROUTER_V6);

      writeContract({
        address: TOKEN_ADDRESSES.ARBITRUM_USDC as `0x${string}`,
        abi: approveABI,
        functionName: "approve",
        args: [
          AGGREGATION_ROUTER_V6,
          BigInt("1000000000"), // 1000 USDC (6 decimals)
        ],
      });
    } catch (err: any) {
      console.error("Direct approval error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Debug Approval</h2>

      <div className="space-y-3">
        <div className="text-sm">
          <p>Connected: {isConnected ? "Yes" : "No"}</p>
          <p>Address: {address || "None"}</p>
          <p>Chain ID: {chainId || "None"}</p>
        </div>

        <button
          onClick={handleDirectApproval}
          disabled={!isConnected || isPending || isConfirming}
          className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          {isPending
            ? "Initiating..."
            : isConfirming
            ? "Confirming..."
            : "Direct Approve (1000 USDC)"}
        </button>

        {hash && (
          <div className="text-sm">
            <p className="text-green-600">
              TX Hash: {hash.slice(0, 10)}...{hash.slice(-8)}
              {isSuccess && " ✓"}
            </p>
          </div>
        )}

        {writeError && (
          <div className="text-sm text-red-600">
            Write Error: {writeError.message}
          </div>
        )}

        {error && <div className="text-sm text-red-600">Error: {error}</div>}

        <div className="text-xs text-gray-600 space-y-1">
          <p>isPending: {isPending ? "true" : "false"}</p>
          <p>isConfirming: {isConfirming ? "true" : "false"}</p>
          <p>isSuccess: {isSuccess ? "true" : "false"}</p>
        </div>
      </div>
    </div>
  );
}
