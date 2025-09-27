"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle, CheckCircle, ArrowRightLeft } from "lucide-react";
import { tokenService, SupportedChain, Token } from "@/lib/tokenService";

interface VaultTokenRouterProps {
  onRoute?: (chainId: number, fromToken: Token, toToken: Token, amount: string) => void;
}

export function VaultTokenRouter({ onRoute }: VaultTokenRouterProps) {
  const [chains, setChains] = useState<SupportedChain[]>([]);
  const [selectedChain, setSelectedChain] = useState<SupportedChain | null>(null);
  const [tokens, setTokens] = useState<Record<string, Token>>({});
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [isLoadingChains, setIsLoadingChains] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load supported chains on component mount
  useEffect(() => {
    const loadChains = async () => {
      setIsLoadingChains(true);
      setError(null);

      try {
        const chainsData = await tokenService.getSupportedChains();

        // Ensure chainsData is an array
        if (Array.isArray(chainsData)) {
          console.log('Loaded chains data:', chainsData);
          console.log('Number of chains:', chainsData.length);
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
        setChains([]); // Ensure chains is always an array
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
        setToToken(null);
        return;
      }

      setIsLoadingTokens(true);
      setError(null);

      try {
        const tokensData = await tokenService.getTokensForChain(selectedChain.chain_id);
        console.log('Loaded tokens data for chain', selectedChain.chain_id, ':', tokensData);

        // Ensure tokensData is an object
        if (typeof tokensData === 'object' && tokensData !== null) {
          setTokens(tokensData);

          // Convert tokens object to array for easier handling
          const tokensArray = Object.values(tokensData);
          console.log('Tokens array length:', tokensArray.length);

          // Auto-select native token as from token
          const nativeToken = tokensArray.find(token =>
            token.address?.toLowerCase() === selectedChain.native_token.address.toLowerCase()
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
        setTokens({}); // Ensure tokens is always an object
      } finally {
        setIsLoadingTokens(false);
      }
    };

    loadTokens();
  }, [selectedChain]);

  const handleChainSelect = (chainId: string) => {
    const chain = chains.find(c => c.chain_id.toString() === chainId);
    if (chain) {
      setSelectedChain(chain);
      setError(null); // Clear any previous errors
    }
  };

  const handleFromTokenSelect = (tokenAddress: string) => {
    const token = tokens[tokenAddress];
    if (token) {
      setFromToken(token);
    }
  };

  const handleToTokenSelect = (tokenAddress: string) => {
    const token = tokens[tokenAddress];
    if (token) {
      setToToken(token);
    }
  };

  const handleRoute = () => {
    if (!selectedChain || !fromToken || !toToken || !amount) {
      setError("Please select chain, tokens, and enter amount");
      return;
    }

    onRoute?.(selectedChain.chain_id, fromToken, toToken, amount);
  };

  const tokensArray = Object.values(tokens);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Vault Token Router
          </CardTitle>
          <CardDescription>
            Select a blockchain network and tokens to route through vault positions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chain Selection */}
          <div className="space-y-2">
            <Label htmlFor="chain-select">Select Blockchain Network</Label>
            <Select
              value={selectedChain?.chain_id.toString() || ""}
              onValueChange={handleChainSelect}
              disabled={isLoadingChains}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a blockchain network" />
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
                  chains.map((chain) => (
                    <SelectItem key={chain.chain_id} value={chain.chain_id.toString()}>
                      <div className="flex items-center gap-2">
                        <img
                          src={chain.chain_icon}
                          alt={chain.chain_name}
                          className="w-4 h-4 rounded-full"
                        />
                        {chain.chain_name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Token Selection */}
          {selectedChain && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* From Token */}
                <div className="space-y-2">
                  <Label htmlFor="from-token">From Token</Label>
                  <Select
                    value={fromToken?.address || ""}
                    onValueChange={handleFromTokenSelect}
                    disabled={isLoadingTokens}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select token" />
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
                        tokensArray.map((token) => (
                          <SelectItem key={token.address} value={token.address}>
                            <div className="flex items-center gap-2">
                              {token.logoURI && (
                                <img
                                  src={token.logoURI}
                                  alt={token.symbol}
                                  className="w-4 h-4 rounded-full"
                                />
                              )}
                              <span className="font-medium">{token.symbol}</span>
                              <span className="text-slate-500 text-xs">{token.name}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>


              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount to route"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="any"
                />
              </div>
            </>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Route Button */}
          <Button
            onClick={handleRoute}
            disabled={!selectedChain || !fromToken || !toToken || !amount || isLoadingChains || isLoadingTokens}
            className="w-full"
          >
            {(isLoadingChains || isLoadingTokens) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              "Route Tokens"
            )}
          </Button>

          {/* Selection Summary */}
          {selectedChain && fromToken && toToken && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <div className="font-medium mb-1">Route Summary:</div>
                <div>Network: {selectedChain.chain_name}</div>
                <div>From: {fromToken.symbol} ({fromToken.name})</div>
                <div>To: {toToken.symbol} ({toToken.name})</div>
                <div>Amount: {amount}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
