"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useChainId } from "wagmi";
import {
  analyzeRoute,
  getRouteDescription,
  UserTokenInput,
  RouteAnalysis,
} from "../utils/smartRouting";
import { useSwap } from "../utils/useSwap";
import { AVAILABLE_VAULTS, SUPPORTED_CHAINS } from "../utils/vaultConfig";

export default function SmartSwapRouter() {
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

  const [tokenAddress, setTokenAddress] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [amount, setAmount] = useState("1000000"); // Default 1 USDC (6 decimals)
  const [preferredProtocol, setPreferredProtocol] = useState<
    "morpho" | "euler" | ""
  >("");
  const [routeAnalysis, setRouteAnalysis] = useState<RouteAnalysis | null>(
    null
  );
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Analyze route when inputs change
  useEffect(() => {
    if (!tokenAddress || !chainId) {
      setRouteAnalysis(null);
      return;
    }

    const userInput: UserTokenInput = {
      chainId,
      tokenAddress,
      tokenSymbol: tokenSymbol || undefined,
      amount,
      preferredProtocol: preferredProtocol || undefined,
    };

    const analysis = analyzeRoute(userInput);
    setRouteAnalysis(analysis);
    setSelectedRouteIndex(0);
  }, [tokenAddress, tokenSymbol, amount, preferredProtocol, chainId]);

  const handleApprove = async () => {
    if (!routeAnalysis?.recommendedRoute) return;

    const route =
      routeAnalysis.availableRoutes[selectedRouteIndex] ||
      routeAnalysis.recommendedRoute;
    await approveToken(route.sourceToken, route.sourceChain);
  };

  const handleExecuteRoute = async () => {
    if (!routeAnalysis || !address) return;

    const route =
      routeAnalysis.availableRoutes[selectedRouteIndex] ||
      routeAnalysis.recommendedRoute;

    if (!route) return;

    if (route.needsSwap && route.swapParams) {
      // Execute cross-chain swap
      const swapParams = {
        ...route.swapParams,
        walletAddress: address,
      };

      const callbacks = {
        onQuoteReceived: (quote: any) => console.log("Quote received:", quote),
        onOrderPlaced: (hash: string) => console.log("Order placed:", hash),
        onOrderComplete: () => {
          console.log(
            "Swap completed! Now you can deposit to vault:",
            route.targetVault.vaultAddress
          );
          // Here you could automatically trigger the vault deposit
        },
        onError: (error: any) => console.error("Swap error:", error),
      };

      await executeSwap(swapParams, callbacks);
    } else {
      // Direct deposit to vault (you'll implement this separately)
      console.log("Direct deposit to vault:", route.targetVault.vaultAddress);
      alert(
        `Ready to deposit directly to ${route.targetVault.protocol} vault on ${route.targetVault.chainName}!`
      );
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Smart Vault Router</h2>
        <p>
          Please connect your wallet to use the smart routing functionality.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Smart Vault Router</h2>
      <p className="text-sm text-gray-600 mb-6">
        Enter any token and we'll find the best route to deposit into your
        preferred vault
      </p>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Token Address:
          </label>
          <input
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="0x..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Token Symbol (optional):
            </label>
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="USDC, USDT, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Amount:</label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="1000000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Preferred Protocol:
          </label>
          <select
            value={preferredProtocol}
            onChange={(e) =>
              setPreferredProtocol(e.target.value as "morpho" | "euler" | "")
            }
            className="w-full p-2 border rounded-md"
          >
            <option value="">No preference</option>
            <option value="morpho">Morpho</option>
            <option value="euler">Euler</option>
          </select>
        </div>
      </div>

      {/* Route Analysis */}
      {routeAnalysis && (
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="font-bold mb-3">Route Analysis</h3>

          {routeAnalysis.isDirectlySupported ? (
            <div className="bg-green-100 p-3 rounded mb-4">
              <p className="text-green-800 font-medium">
                ✅ Direct Support Available!
              </p>
              <p className="text-sm text-green-700">
                Your token is directly supported on this chain.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-100 p-3 rounded mb-4">
              <p className="text-yellow-800 font-medium">
                🔄 Cross-chain swap required
              </p>
              <p className="text-sm text-yellow-700">
                We found {routeAnalysis.availableRoutes.length} possible routes
                to supported vaults.
              </p>
            </div>
          )}

          {/* Available Routes */}
          {routeAnalysis.availableRoutes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Available Routes:</h4>
              {routeAnalysis.availableRoutes.map((route, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded cursor-pointer ${
                    index === selectedRouteIndex
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                  onClick={() => setSelectedRouteIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        {route.targetVault.protocol.toUpperCase()} -{" "}
                        {route.targetVault.token.symbol} on{" "}
                        {route.targetVault.chainName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {getRouteDescription(route)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          route.needsSwap
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-green-200 text-green-800"
                        }`}
                      >
                        {route.needsSwap ? "Swap Required" : "Direct"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {routeAnalysis.availableRoutes.length === 0 && (
            <div className="bg-red-100 p-3 rounded">
              <p className="text-red-800 font-medium">❌ No routes available</p>
              <p className="text-sm text-red-700">
                Your current chain/token combination cannot be routed to our
                supported vaults.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {routeAnalysis &&
        Array.isArray(routeAnalysis.availableRoutes) &&
        routeAnalysis.availableRoutes.length > 0 && (
          <div className="space-y-3">
            {!routeAnalysis.availableRoutes[selectedRouteIndex]?.needsSwap ? (
              <button
                onClick={handleExecuteRoute}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
            >
              Deposit Directly to Vault
            </button>
          ) : (
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
                onClick={handleExecuteRoute}
                disabled={isLoading || !isApprovalConfirmed}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                {isLoading ? "Executing Swap..." : "Execute Smart Route"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {/* Current Status */}
      <div className="mt-6 text-xs text-gray-600 space-y-1">
        <p>Connected: {address}</p>
        <p>Current Chain: {chainId}</p>
        {routeAnalysis?.recommendedRoute && (
          <p>
            Recommended: {getRouteDescription(routeAnalysis.recommendedRoute)}
          </p>
        )}
      </div>

      {/* Supported Vaults Info */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm font-medium">
          View All Supported Vaults
        </summary>
        <div className="mt-2 text-xs space-y-1">
          {AVAILABLE_VAULTS.map((vault, index) => (
            <div key={index} className="flex justify-between">
              <span>
                {vault.protocol} - {vault.chainName}
              </span>
              <span>{vault.token.symbol}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
