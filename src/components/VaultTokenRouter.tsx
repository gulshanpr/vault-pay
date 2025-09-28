"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRightLeft,
  Zap,
  Info,
} from "lucide-react";
import {
  isCombinationSupported,
  getBestTargetCombination,
  SupportedCombination,
  SUPPORTED_COMBINATIONS,
  SUPPORTED_CHAINS,
  getSupportedCombinationsForChain,
} from "@/config/supportedCombinations";
import { useFusionSwap } from "@/hooks/useFusionSwap";
import { NetworkEnum, PresetEnum } from "@1inch/fusion-sdk";
import { parseUnits } from "viem";

interface VaultTokenRouterProps {
  onRoute?: (
    chainId: number,
    fromToken: SupportedToken,
    toTokenAddress: string,
    amount: string,
    needsSwap: boolean,
    toChainId?: number
  ) => void;
}

// Supported chains with their details
const SUPPORTED_CHAIN_DETAILS = [
  {
    chain_id: SUPPORTED_CHAINS.BASE,
    chain_name: "Base",
    chain_icon:
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png", // You can update with actual Base icon
  },
  {
    chain_id: SUPPORTED_CHAINS.ARBITRUM,
    chain_name: "Arbitrum",
    chain_icon:
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png", // You can update with actual Arbitrum icon
  },
  {
    chain_id: SUPPORTED_CHAINS.UNICHAIN,
    chain_name: "Unichain",
    chain_icon:
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png", // You can update with actual Unichain icon
  },
];

// Token details for supported tokens
const TOKEN_DETAILS = {
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    logoURI:
      "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    decimals: 6,
  },
  EURC: {
    symbol: "EURC",
    name: "Euro Coin",
    logoURI:
      "https://assets.coingecko.com/coins/images/26045/small/euro-coin.png",
    decimals: 6,
  },
  USDS: {
    symbol: "USDS",
    name: "USD Stablecoin",
    logoURI:
      "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png", // Update with actual USDS icon
    decimals: 18,
  },
  WETH: {
    symbol: "WETH",
    name: "Wrapped Ether",
    logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
    decimals: 18,
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    logoURI: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    decimals: 6,
  },
};

interface SupportedChain {
  chain_id: number;
  chain_name: string;
  chain_icon: string;
}

interface SupportedToken {
  symbol: string;
  name: string;
  address: string;
  logoURI: string;
  decimals: number;
}

// Chain ID to NetworkEnum mapping for Fusion SDK
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
};

export function VaultTokenRouter({ onRoute }: VaultTokenRouterProps) {
  const [selectedChain, setSelectedChain] = useState<SupportedChain | null>(
    null
  );
  const [fromToken, setFromToken] = useState<SupportedToken | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Auto-swap logic state
  const [needsSwap, setNeedsSwap] = useState(false);
  const [targetCombination, setTargetCombination] =
    useState<SupportedCombination | null>(null);
  const [swapMessage, setSwapMessage] = useState<string | null>(null);

  // Same-chain swap hook (Fusion)
  const {
    isLoading: isFusionSwapping,
    error: fusionError,
    orderHash: fusionOrderHash,
    executeSwap: executeFusionSwap,
    reset: resetFusionSwap,
    isFusionSupported,
  } = useFusionSwap();

  // Get supported tokens for selected chain
  const getSupportedTokensForChain = (chainId: number): SupportedToken[] => {
    const combinations = getSupportedCombinationsForChain(chainId);
    return combinations.map((combo) => ({
      symbol: combo.symbol,
      name:
        TOKEN_DETAILS[combo.symbol as keyof typeof TOKEN_DETAILS]?.name ||
        combo.symbol,
      address: combo.address,
      logoURI:
        TOKEN_DETAILS[combo.symbol as keyof typeof TOKEN_DETAILS]?.logoURI ||
        "",
      decimals:
        TOKEN_DETAILS[combo.symbol as keyof typeof TOKEN_DETAILS]?.decimals ||
        18,
    }));
  };

  // Auto-select first chain on mount
  useEffect(() => {
    if (SUPPORTED_CHAIN_DETAILS.length > 0) {
      setSelectedChain(SUPPORTED_CHAIN_DETAILS[0]);
    }
  }, []);

  // Auto-select first token when chain changes
  useEffect(() => {
    if (selectedChain) {
      const tokens = getSupportedTokensForChain(selectedChain.chain_id);
      if (tokens.length > 0) {
        setFromToken(tokens[0]);
      }
    }
  }, [selectedChain]);

  // Check if swap is needed when chain/token changes
  useEffect(() => {
    if (selectedChain && fromToken) {
      const isSupported = isCombinationSupported(
        selectedChain.chain_id,
        fromToken.address
      );

      if (isSupported) {
        // Direct support - no swap needed
        setNeedsSwap(false);
        setTargetCombination(null);
        setSwapMessage(null);
      } else {
        // Need to swap - find best target on same chain
        setNeedsSwap(true);
        const bestTarget = getBestTargetCombination(selectedChain.chain_id);
        setTargetCombination(bestTarget);

        setSwapMessage(
          `${fromToken.symbol} is not supported. Will swap to ${bestTarget.symbol} on ${selectedChain.chain_name} using Fusion.`
        );
      }
    }
  }, [selectedChain, fromToken]);

  const handleChainSelect = (chainId: string) => {
    const chain = SUPPORTED_CHAIN_DETAILS.find(
      (c) => c.chain_id.toString() === chainId
    );
    if (chain) {
      setSelectedChain(chain);
      setError(null);
    }
  };

  const handleFromTokenSelect = (tokenAddress: string) => {
    if (selectedChain) {
      const tokens = getSupportedTokensForChain(selectedChain.chain_id);
      const token = tokens.find((t) => t.address === tokenAddress);
      if (token) {
        setFromToken(token);
      }
    }
  };

  const handleRoute = async () => {
    if (!selectedChain || !fromToken || !amount) {
      setError("Please select chain, token, and enter amount");
      return;
    }

    console.log("=== HANDLE ROUTE DEBUG ===");
    console.log("selectedChain:", selectedChain);
    console.log("fromToken:", fromToken);
    console.log("amount:", amount);
    console.log("needsSwap:", needsSwap);
    console.log("targetCombination:", targetCombination);
    console.log("isFusionSupported:", isFusionSupported);

    if (needsSwap && !targetCombination) {
      setError("Unable to find suitable swap target");
      return;
    }

    try {
      if (needsSwap && targetCombination) {
        // Same-chain swap using Fusion SDK
        console.log("Starting same-chain Fusion swap...");
        console.log(
          "From:",
          fromToken.symbol,
          "to:",
          targetCombination.symbol,
          "on chain",
          selectedChain.chain_id
        );

        // Check if the network is supported by Fusion SDK
        if (!isFusionSupported) {
          throw new Error(
            `Chain ${selectedChain.chain_id} (${selectedChain.chain_name}) is not supported by Fusion SDK. Please use a supported network like Ethereum, Polygon, Arbitrum, Optimism, or Base.`
          );
        }

        // Validate token decimals
        const tokenDecimals = fromToken.decimals || 18;
        if (tokenDecimals < 1 || tokenDecimals > 18) {
          throw new Error(`Invalid token decimals: ${tokenDecimals}`);
        }

        // Convert amount to wei with proper validation
        let amountInWei: string;
        try {
          amountInWei = parseUnits(amount, tokenDecimals).toString();
          console.log("Amount converted to wei:", amountInWei);
        } catch (error) {
          throw new Error(
            `Failed to convert amount to wei: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }

        await executeFusionSwap(
          {
            fromTokenAddress: fromToken.address,
            toTokenAddress: targetCombination.address,
            amount: amountInWei,
            preset: PresetEnum.medium,
          },
          {
            onQuoteReceived: (quote) => {
              console.log("Fusion quote received:", quote);
            },
            onOrderPlaced: (hash) => {
              console.log("Fusion order placed:", hash);
            },
            onOrderComplete: () => {
              console.log(
                "Same-chain Fusion swap completed! Ready for vault deposit"
              );
              onRoute?.(
                selectedChain.chain_id, // chainId (source)
                fromToken, // fromToken
                targetCombination.address, // toTokenAddress
                amount, // amount
                true, // needsSwap
                targetCombination.chainId // toChainId (destination - same as source)
              );
            },
            onError: (error) => {
              console.error("Fusion swap error:", error);
              setError(error.message || "Fusion swap failed");
            },
          }
        );
      } else {
        console.log("=== DIRECT DEPOSIT PATH ===");
        console.log("Calling onRoute with:");
        console.log("- chainId:", selectedChain.chain_id);
        console.log("- fromToken:", fromToken);
        console.log("- toTokenAddress:", fromToken.address);
        console.log("- amount:", amount);
        console.log("- needsSwap:", false);

        // Direct deposit - no swap needed
        onRoute?.(
          selectedChain.chain_id, // chainId
          fromToken, // fromToken
          fromToken.address, // toTokenAddress (same as fromToken for direct deposits)
          amount, // amount
          false, // needsSwap
          selectedChain.chain_id // toChainId (same as chainId for direct deposits)
        );
      }
    } catch (error: any) {
      console.error("Error in handleRoute:", error);
      setError(error.message || "Transaction failed");
    }
  };

  const supportedTokens = selectedChain
    ? getSupportedTokensForChain(selectedChain.chain_id)
    : [];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Vault Router (Supported Tokens Only)
          </CardTitle>
          <CardDescription>
            Pay with supported tokens. Same-chain swaps use Fusion for optimal
            rates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Supported Combinations Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div className="font-medium mb-2">
                  Supported vault deposits:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="font-medium">Base:</div>
                    <div>USDC, EURC, USDS</div>
                  </div>
                  <div>
                    <div className="font-medium">Arbitrum:</div>
                    <div>USDC, WETH</div>
                  </div>
                  <div>
                    <div className="font-medium">Unichain:</div>
                    <div>USDC, USDT</div>
                  </div>
                </div>
                <div className="mt-2 text-xs opacity-75">
                  Same-chain swaps use Fusion for best rates.
                </div>
              </div>
            </div>
          </div>

          {/* Chain Selection */}
          <div className="space-y-2">
            <Label htmlFor="chain-select">Select Supported Network</Label>
            <Select
              value={selectedChain?.chain_id.toString() || ""}
              onValueChange={handleChainSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a supported network" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CHAIN_DETAILS.map((chain) => (
                  <SelectItem
                    key={chain.chain_id}
                    value={chain.chain_id.toString()}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={chain.chain_icon}
                        alt={chain.chain_name}
                        className="w-4 h-4 rounded-full"
                      />
                      {chain.chain_name}
                      <span className="text-xs text-green-600 bg-green-100 px-1 rounded">
                        Supported
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Token Selection */}
          {selectedChain && (
            <>
              <div className="space-y-2">
                <Label htmlFor="from-token">Select Token</Label>
                <Select
                  value={fromToken?.address || ""}
                  onValueChange={handleFromTokenSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a token" />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedTokens.map((token) => {
                      const isSupported = isCombinationSupported(
                        selectedChain.chain_id,
                        token.address
                      );

                      return (
                        <SelectItem key={token.address} value={token.address}>
                          <div className="flex items-center gap-2">
                            <img
                              src={token.logoURI}
                              alt={token.symbol}
                              className="w-4 h-4 rounded-full"
                            />
                            <span className="font-medium">{token.symbol}</span>
                            <span className="text-slate-500 text-xs">
                              {token.name}
                            </span>
                            {isSupported && (
                              <span className="text-xs text-green-600 bg-green-100 px-1 rounded">
                                Direct
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="any"
                />
              </div>

              {/* Auto-Swap Notice */}
              {needsSwap && swapMessage && targetCombination && (
                <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium mb-1">
                      Same-Chain Swap Required (Fusion)
                      {!isFusionSupported && (
                        <span className="text-red-600 ml-2">
                          ⚠️ Network Not Supported
                        </span>
                      )}
                    </div>
                    <div className="mb-2">{swapMessage}</div>
                    {!isFusionSupported && (
                      <div className="text-xs text-red-600 bg-red-100 p-2 rounded mb-2">
                        This network is not supported by Fusion SDK. Please
                        switch to Ethereum, Polygon, Arbitrum, Optimism, or Base
                        for same-chain swaps.
                      </div>
                    )}
                    <div className="text-xs bg-orange-100 dark:bg-orange-800 p-2 rounded">
                      <strong>Route:</strong> {fromToken?.symbol} →{" "}
                      {targetCombination.symbol} → Vault Deposit
                      <br />
                      <strong>Method:</strong> Fusion (same-chain)
                    </div>
                  </div>
                </div>
              )}

              {/* Direct Support Notice */}
              {!needsSwap && fromToken && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Direct Support Available!</div>
                    <div className="text-xs">
                      {fromToken.symbol} on {selectedChain?.chain_name} can be
                      deposited directly to our vaults.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Error Display */}
          {(error || fusionError) && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error || fusionError}
            </div>
          )}

          {/* Route Button */}
          <Button
            onClick={handleRoute}
            disabled={
              !selectedChain ||
              !fromToken ||
              !amount ||
              isFusionSwapping ||
              (needsSwap && !isFusionSupported)
            }
            className="w-full"
          >
            {isFusionSwapping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fusion Swapping...
              </>
            ) : needsSwap ? (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Fusion Swap & Deposit
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Deposit Directly to Vault
              </>
            )}
          </Button>

          {/* Route Summary */}
          {selectedChain && fromToken && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
              <div className="text-sm text-slate-700 dark:text-slate-300">
                <div className="font-medium mb-2">Transaction Summary:</div>
                <div className="space-y-1">
                  <div>
                    From: {fromToken.symbol} on {selectedChain.chain_name}
                  </div>
                  <div>Amount: {amount}</div>
                  {needsSwap && targetCombination ? (
                    <>
                      <div>
                        Will swap to: {targetCombination.symbol} on{" "}
                        {selectedChain.chain_name}
                      </div>
                      <div>Then deposit to: Vault Contract</div>
                      <div className="text-orange-600 font-medium text-xs">
                        ⚡ 2-step process: Fusion Swap → Vault Deposit
                      </div>
                    </>
                  ) : (
                    <>
                      <div>Will deposit to: Vault Contract</div>
                      <div className="text-green-600 font-medium text-xs">
                        ✅ Direct deposit (no swap needed)
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Swap Status Display */}
          {fusionOrderHash && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div className="font-medium mb-2">Fusion Swap Status:</div>
                <div className="text-xs">
                  Order Hash: {fusionOrderHash.slice(0, 10)}...
                  {fusionOrderHash.slice(-8)}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
