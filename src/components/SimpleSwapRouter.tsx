"use client";

import React, { useState } from "react";
import { useAccount, useChainId } from "wagmi";
import { useSwap } from "../utils/useSwap";
import {
  SUPPORTED_CHAIN_TOKENS,
  isDirectlySupported,
  findBestTarget,
  CHAIN_TO_NETWORK_ENUM,
} from "../utils/swapUtils";

interface TokenOption {
  symbol: string;
  address: string;
}

interface ChainOption {
  id: number;
  name: string;
  tokens: TokenOption[];
}

export default function SimpleSwapRouter() {
  const { address, isConnected } = useAccount();
  const currentChainId = useChainId();
  const {
    executeSwap,
    approveToken,
    isLoading,
    isApproving,
    error,
    approvalHash,
    isApprovalConfirmed,
  } = useSwap();

  const [selectedChainId, setSelectedChainId] = useState<number>(42161); // Default to Arbitrum
  const [selectedTokenAddress, setSelectedTokenAddress] = useState<string>("");
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string>("");
  const [amount, setAmount] = useState<string>("1000000"); // Default 1 USDC (6 decimals)
  const [swapRoute, setSwapRoute] = useState<{
    needsSwap: boolean;
    targetChain: number;
    targetToken: string;
    targetChainName: string;
  } | null>(null);

  // Prepare chain options
  const chainOptions: ChainOption[] = Object.entries(
    SUPPORTED_CHAIN_TOKENS
  ).map(([chainId, config]) => ({
    id: parseInt(chainId),
    name: config.name,
    tokens: Object.entries(config.tokens).map(([symbol, address]) => ({
      symbol,
      address,
    })),
  }));

  // Get tokens for selected chain
  const availableTokens =
    chainOptions.find((chain) => chain.id === selectedChainId)?.tokens || [];

  // Handle chain selection
  const handleChainChange = (chainId: number) => {
    setSelectedChainId(chainId);
    setSelectedTokenAddress("");
    setSelectedTokenSymbol("");
    setSwapRoute(null);
  };

  // Handle token selection
  const handleTokenChange = (tokenAddress: string, tokenSymbol: string) => {
    setSelectedTokenAddress(tokenAddress);
    setSelectedTokenSymbol(tokenSymbol);

    // Determine if swap is needed
    const directlySupported = isDirectlySupported(
      selectedChainId,
      tokenAddress
    );

    if (directlySupported) {
      setSwapRoute({
        needsSwap: false,
        targetChain: selectedChainId,
        targetToken: tokenAddress,
        targetChainName:
          SUPPORTED_CHAIN_TOKENS[
            selectedChainId as keyof typeof SUPPORTED_CHAIN_TOKENS
          ].name,
      });
    } else {
      // Find best target for this token
      const bestTarget = findBestTarget(tokenSymbol);
      if (bestTarget) {
        setSwapRoute({
          needsSwap: true,
          targetChain: bestTarget.chainId,
          targetToken: bestTarget.tokenAddress,
          targetChainName: bestTarget.chainName,
        });
      }
    }
  };

  const handleApprove = async () => {
    if (!selectedTokenAddress) return;
    await approveToken(selectedTokenAddress, selectedChainId);
  };

  const handleExecute = async () => {
    if (!swapRoute || !address) return;

    if (swapRoute.needsSwap) {
      // Execute cross-chain swap
      const srcNetworkId =
        CHAIN_TO_NETWORK_ENUM[
          selectedChainId as keyof typeof CHAIN_TO_NETWORK_ENUM
        ];
      const dstNetworkId =
        CHAIN_TO_NETWORK_ENUM[
          swapRoute.targetChain as keyof typeof CHAIN_TO_NETWORK_ENUM
        ];

      if (!srcNetworkId || !dstNetworkId) {
        alert("One or both chains are not supported by 1inch cross-chain swap");
        return;
      }

      const swapParams = {
        srcChainId: srcNetworkId,
        dstChainId: dstNetworkId,
        srcTokenAddress: selectedTokenAddress,
        dstTokenAddress: swapRoute.targetToken,
        amount,
        walletAddress: address,
      };

      const callbacks = {
        onQuoteReceived: (quote: any) => {
          console.log("Quote received:", quote);
        },
        onOrderPlaced: (orderHash: string) => {
          console.log("Order placed:", orderHash);
        },
        onOrderComplete: () => {
          console.log("Swap completed! Ready to interact with vault contracts");
          alert(
            `Swap completed! Your tokens are now on ${swapRoute.targetChainName}. You can now interact with the vault contracts.`
          );
        },
        onError: (error: any) => {
          console.error("Swap error:", error);
        },
      };

      await executeSwap(swapParams, callbacks);
    } else {
      // Direct interaction with vault contracts
      console.log("Direct interaction with vault contracts");
      alert(
        `Your tokens are already on the supported chain (${swapRoute.targetChainName}). You can directly interact with vault contracts!`
      );
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Vault Token Router</h2>
        <p>Please connect your wallet to continue.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-4">Vault Token Router</h2>
      <p className="text-sm text-gray-600 mb-6">
        Select your token and chain. We'll automatically route it to our
        supported vault contracts.
      </p>

      {/* Chain Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Chain:</label>
        <select
          value={selectedChainId}
          onChange={(e) => handleChainChange(parseInt(e.target.value))}
          className="w-full p-2 border rounded-md"
        >
          <option value="">Select a chain...</option>
          {chainOptions.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </div>

      {/* Token Selection */}
      {selectedChainId && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select Token:
          </label>
          <select
            value={selectedTokenAddress}
            onChange={(e) => {
              const selectedToken = availableTokens.find(
                (token) => token.address === e.target.value
              );
              if (selectedToken) {
                handleTokenChange(selectedToken.address, selectedToken.symbol);
              }
            }}
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a token...</option>
            {availableTokens.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol} ({token.address.slice(0, 6)}...
                {token.address.slice(-4)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Amount Input */}
      {selectedTokenAddress && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Amount:</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter amount (in token units)"
          />
        </div>
      )}

      {/* Route Information */}
      {swapRoute && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Route Analysis:</h3>
          {swapRoute.needsSwap ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">
                  Cross-chain Swap Required
                </span>
              </div>
              <p className="text-sm text-gray-700">
                <strong>From:</strong> {selectedTokenSymbol} on{" "}
                {
                  SUPPORTED_CHAIN_TOKENS[
                    selectedChainId as keyof typeof SUPPORTED_CHAIN_TOKENS
                  ].name
                }
              </p>
              <p className="text-sm text-gray-700">
                <strong>To:</strong> {selectedTokenSymbol} on{" "}
                {swapRoute.targetChainName}
              </p>
              <p className="text-xs text-gray-600">
                After the swap, you'll be able to interact with vault contracts
                on {swapRoute.targetChainName}.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">
                  Direct Support
                </span>
              </div>
              <p className="text-sm text-gray-700">
                Your {selectedTokenSymbol} on {swapRoute.targetChainName} is
                directly supported!
              </p>
              <p className="text-xs text-gray-600">
                You can directly interact with vault contracts.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {swapRoute && (
        <div className="space-y-3">
          {swapRoute.needsSwap ? (
            <>
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
                  : "Approve Token for Swap"}
              </button>

              <button
                onClick={handleExecute}
                disabled={isLoading || !isApprovalConfirmed}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                {isLoading
                  ? "Executing Cross-chain Swap..."
                  : "Execute Swap to Vault Chain"}
              </button>
            </>
          ) : (
            <button
              onClick={handleExecute}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Proceed to Vault Contracts
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Status Info */}
      <div className="mt-6 text-xs text-gray-600 space-y-1">
        <p>Connected: {address}</p>
        <p>Current Chain: {currentChainId}</p>
        {selectedChainId && (
          <p>
            Selected Chain:{" "}
            {
              SUPPORTED_CHAIN_TOKENS[
                selectedChainId as keyof typeof SUPPORTED_CHAIN_TOKENS
              ]?.name
            }
          </p>
        )}
        {selectedTokenSymbol && <p>Selected Token: {selectedTokenSymbol}</p>}
      </div>
    </div>
  );
}
