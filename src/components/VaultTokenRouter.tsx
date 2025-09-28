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
import { tokenService, SupportedChain, Token } from "@/lib/tokenService";
import {
  isCombinationSupported,
  getBestTargetCombination,
  SupportedCombination,
  SUPPORTED_COMBINATIONS,
} from "@/config/supportedCombinations";
import { useVaultSwap } from "@/hooks/useVaultSwap";
import { useFusionSwap } from "@/hooks/useFusionSwap";
import { NetworkEnum, PresetEnum } from "@1inch/fusion-sdk";
import { parseUnits } from "viem";

interface VaultTokenRouterProps {
  onRoute?: (
    chainId: number,
    fromToken: Token,
    toTokenAddress: string,
    amount: string,
    needsSwap: boolean,
    toChainId?: number
  ) => void;
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
  1101: NetworkEnum.POLYGON_ZKEVM,
  324: NetworkEnum.ZKSYNC,
  59144: NetworkEnum.LINEA,
  534352: NetworkEnum.SCROLL,
};

export function VaultTokenRouter({ onRoute }: VaultTokenRouterProps) {
  const [chains, setChains] = useState<SupportedChain[]>([]);
  const [selectedChain, setSelectedChain] = useState<SupportedChain | null>(
    null
  );
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isLoadingChains, setIsLoadingChains] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-swap logic state
  const [needsSwap, setNeedsSwap] = useState(false);
  const [targetCombination, setTargetCombination] =
    useState<SupportedCombination | null>(null);
  const [swapMessage, setSwapMessage] = useState<string | null>(null);
  const [isSameChainSwap, setIsSameChainSwap] = useState(false);

  // Cross-chain swap hook (Fusion+)
  const {
    isLoading: isSwapping,
    isApproving,
    error: swapError,
    approvalHash,
    orderHash,
    orderStatus,
    executeVaultSwap,
    approveToken,
    reset: resetSwap,
  } = useVaultSwap();

  // Same-chain swap hook (Fusion)
  const {
    isLoading: isFusionSwapping,
    error: fusionError,
    orderHash: fusionOrderHash,
    executeSwap: executeFusionSwap,
    reset: resetFusionSwap,
    isFusionSupported,
  } = useFusionSwap();

  // Load supported chains on component mount (load ALL chains, not filtered)
  useEffect(() => {
    const loadChains = async () => {
      setIsLoadingChains(true);
      setError(null);

      try {
        const chainsData = await tokenService.getSupportedChains();

        if (Array.isArray(chainsData)) {
          console.log("Loaded chains data:", chainsData);
          setChains(chainsData);

          // Auto-select first chain if available
          if (chainsData.length > 0) {
            setSelectedChain(chainsData[0]);
          }
        } else {
          console.error("Invalid chains data format:", chainsData);
          setError("Invalid response format from server");
        }
      } catch (error) {
        console.error("Error loading chains:", error);
        setError("Failed to load supported chains");
        setChains([]);
      } finally {
        setIsLoadingChains(false);
      }
    };

    loadChains();
  }, []);

  // Load tokens when chain is selected
  useEffect(() => {
    const loadTokens = async () => {
      if (!selectedChain) {
        setTokens({});
        setFromToken(null);
        return;
      }

      setIsLoadingTokens(true);
      setError(null);

      try {
        const tokensData = await tokenService.getTokensForChain(
          selectedChain.chain_id
        );
        console.log(
          "Loaded tokens data for chain",
          selectedChain.chain_id,
          ":",
          tokensData
        );

        if (typeof tokensData === "object" && tokensData !== null) {
          setTokens(tokensData);

          const tokensArray = Object.values(tokensData);

          // Auto-select native token as from token
          const nativeToken = tokensArray.find(
            (token) =>
              token.address?.toLowerCase() ===
              selectedChain.native_token.address.toLowerCase()
          );

          if (nativeToken) {
            setFromToken(nativeToken);
          }
        } else {
          console.error("Invalid tokens data format:", tokensData);
          setError("Invalid response format from server");
        }
      } catch (error) {
        console.error("Error loading tokens:", error);
        setError(`Failed to load tokens for ${selectedChain.chain_name}`);
        setTokens({});
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
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
        setIsSameChainSwap(false);
      } else {
        // Need to swap - find best target
        setNeedsSwap(true);
        const bestTarget = getBestTargetCombination(selectedChain.chain_id);
        setTargetCombination(bestTarget);

        // Check if it's a same-chain swap
        const sameChain = bestTarget.chainId === selectedChain.chain_id;
        setIsSameChainSwap(sameChain);

        const targetChainName =
          bestTarget.chainId === 8453
            ? "Base"
            : bestTarget.chainId === 42161
            ? "Arbitrum"
            : "Unichain";

        if (sameChain) {
          setSwapMessage(
            `${fromToken.symbol} is not supported. Will swap to ${bestTarget.symbol} on ${targetChainName} using Fusion.`
          );
        } else {
          setSwapMessage(
            `${fromToken.symbol} on ${selectedChain.chain_name} is not supported. Will swap to ${bestTarget.symbol} on ${targetChainName} using Fusion+.`
          );
        }
      }
    }
  }, [selectedChain, fromToken]);

  const handleChainSelect = (chainId: string) => {
    const chain = chains.find((c) => c.chain_id.toString() === chainId);
    if (chain) {
      setSelectedChain(chain);
      setError(null);
    }
  };

  const handleFromTokenSelect = (tokenAddress: string) => {
    const token = tokens[tokenAddress];
    if (token) {
      setFromToken(token);
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
    console.log("isSameChainSwap:", isSameChainSwap);
    console.log("isFusionSupported:", isFusionSupported);

    if (needsSwap && !targetCombination) {
      setError("Unable to find suitable swap target");
      return;
    }

    try {
      if (needsSwap && targetCombination) {
        if (isSameChainSwap) {
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
          // Cross-chain swap using Fusion+ (existing logic)
          console.log("Starting cross-chain Fusion+ swap...");
          console.log(
            "From:",
            fromToken.symbol,
            "on chain",
            selectedChain.chain_id
          );
          console.log(
            "To:",
            targetCombination.symbol,
            "on chain",
            targetCombination.chainId
          );

          // First approve the token
          await approveToken(fromToken.address, selectedChain.chain_id);

          // Then execute the swap
          await executeVaultSwap(
            {
              fromChainId: selectedChain.chain_id,
              fromToken,
              toChainId: targetCombination.chainId,
              toTokenAddress: targetCombination.address,
              amount,
              walletAddress: "", // Will be filled by the hook
            },
            {
              onOrderComplete: () => {
                console.log(
                  "Cross-chain swap completed! Ready for vault deposit"
                );
                onRoute?.(
                  selectedChain.chain_id, // chainId (source)
                  fromToken, // fromToken
                  targetCombination.address, // toTokenAddress
                  amount, // amount
                  true, // needsSwap
                  targetCombination.chainId // toChainId (destination)
                );
              },
            }
          );
        }
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

  const tokensArray = Object.values(tokens);

  // Get chain name helper
  const getChainName = (chainId: number): string => {
    switch (chainId) {
      case 8453:
        return "Base";
      case 42161:
        return "Arbitrum";
      case 1301:
        return "Unichain";
      default:
        return `Chain ${chainId}`;
    }
  };

  // Determine which loading state to show
  const isCurrentlySwapping = isSameChainSwap ? isFusionSwapping : isSwapping;
  const currentSwapError = isSameChainSwap ? fusionError : swapError;
  const currentOrderHash = isSameChainSwap ? fusionOrderHash : orderHash;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Universal Vault Router
          </CardTitle>
          <CardDescription>
            Pay with any token on any chain. We'll automatically route it to our
            supported vaults using Fusion for same-chain swaps and Fusion+ for
            cross-chain.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Supported Combinations Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div className="font-medium mb-2">
                  We support direct deposits to:
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
                  Other tokens will be automatically swapped: Fusion for
                  same-chain, Fusion+ for cross-chain.
                </div>
              </div>
            </div>
          </div>

          {/* Chain Selection */}
          <div className="space-y-2">
            <Label htmlFor="chain-select">Select Any Blockchain Network</Label>
            <Select
              value={selectedChain?.chain_id.toString() || ""}
              onValueChange={handleChainSelect}
              disabled={isLoadingChains}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose any blockchain network" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px] overflow-auto">
                {isLoadingChains ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading chains...
                  </div>
                ) : chains.length === 0 ? (
                  <div className="flex items-center justify-center p-4 text-sm text-slate-500">
                    No chains available
                  </div>
                ) : (
                  chains.map((chain) => {
                    const isDirectlySupported = SUPPORTED_COMBINATIONS.some(
                      (combo) => combo.chainId === chain.chain_id
                    );

                    return (
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
                          {isDirectlySupported && (
                            <span className="text-xs text-green-600 bg-green-100 px-1 rounded">
                              Direct
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Token Selection */}
          {selectedChain && (
            <>
              <div className="space-y-2">
                <Label htmlFor="from-token">Select Any Token</Label>
                <Select
                  value={fromToken?.address || ""}
                  onValueChange={handleFromTokenSelect}
                  disabled={isLoadingTokens}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select any token" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTokens ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading tokens...
                      </div>
                    ) : tokensArray.length === 0 ? (
                      <div className="flex items-center justify-center p-4 text-sm text-slate-500">
                        No tokens available
                      </div>
                    ) : (
                      tokensArray.map((token) => {
                        const isSupported = isCombinationSupported(
                          selectedChain.chain_id,
                          token.address
                        );

                        return (
                          <SelectItem key={token.address} value={token.address}>
                            <div className="flex items-center gap-2">
                              {token.logoURI && (
                                <img
                                  src={token.logoURI}
                                  alt={token.symbol}
                                  className="w-4 h-4 rounded-full"
                                />
                              )}
                              <span className="font-medium">
                                {token.symbol}
                              </span>
                              <span className="text-slate-500 text-xs">
                                {token.name}
                              </span>
                              {isSupported && (
                                <span className="text-xs text-green-600 bg-green-100 px-1 rounded">
                                  Supported
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
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
                      Auto-Swap Required (
                      {isSameChainSwap ? "Fusion" : "Fusion+"})
                      {isSameChainSwap && !isFusionSupported && (
                        <span className="text-red-600 ml-2">
                          ⚠️ Network Not Supported
                        </span>
                      )}
                    </div>
                    <div className="mb-2">{swapMessage}</div>
                    {isSameChainSwap && !isFusionSupported && (
                      <div className="text-xs text-red-600 bg-red-100 p-2 rounded mb-2">
                        This network is not supported by Fusion SDK. Please
                        switch to Ethereum, Polygon, Arbitrum, Optimism, or Base
                        for same-chain swaps.
                      </div>
                    )}
                    <div className="text-xs bg-orange-100 dark:bg-orange-800 p-2 rounded">
                      <strong>Route:</strong> {fromToken?.symbol} on{" "}
                      {selectedChain?.chain_name} → {targetCombination.symbol}{" "}
                      on {getChainName(targetCombination.chainId)} → Vault
                      Deposit
                      <br />
                      <strong>Method:</strong>{" "}
                      {isSameChainSwap
                        ? "Fusion (same-chain)"
                        : "Fusion+ (cross-chain)"}
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
          {(error || currentSwapError) && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error || currentSwapError}
            </div>
          )}

          {/* Route Button */}
          <Button
            onClick={handleRoute}
            disabled={
              !selectedChain ||
              !fromToken ||
              !amount ||
              isLoadingChains ||
              isLoadingTokens ||
              isCurrentlySwapping ||
              isApproving
            }
            className="w-full"
          >
            {isApproving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Approving Token...
              </>
            ) : isCurrentlySwapping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isSameChainSwap ? "Fusion Swapping..." : "Fusion+ Swapping..."}
              </>
            ) : isLoadingChains || isLoadingTokens ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : needsSwap ? (
              <>
                <Zap className="w-4 h-4 mr-2" />
                {isSameChainSwap
                  ? "Fusion Swap & Deposit"
                  : "Fusion+ Swap & Deposit"}
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
                        {getChainName(targetCombination.chainId)}
                      </div>
                      <div>Then deposit to: Vault Contract</div>
                      <div className="text-orange-600 font-medium text-xs">
                        ⚡ 2-step process:{" "}
                        {isSameChainSwap ? "Fusion" : "Fusion+"} Swap → Vault
                        Deposit
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

          {/* Add swap status display */}
          {(approvalHash ||
            currentOrderHash ||
            orderStatus ||
            currentSwapError) && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div className="font-medium mb-2">
                  {isSameChainSwap ? "Fusion" : "Fusion+"} Swap Status:
                </div>
                {approvalHash && (
                  <div className="text-xs">
                    Approval TX: {approvalHash.slice(0, 10)}...
                    {approvalHash.slice(-8)}
                  </div>
                )}
                {currentOrderHash && (
                  <div className="text-xs">
                    Order Hash: {currentOrderHash.slice(0, 10)}...
                    {currentOrderHash.slice(-8)}
                  </div>
                )}
                {orderStatus && (
                  <div className="text-xs font-medium">
                    Status: {orderStatus}
                  </div>
                )}
                {currentSwapError && (
                  <div className="text-xs text-red-600 bg-red-100 p-2 rounded mt-2">
                    Error: {currentSwapError}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
