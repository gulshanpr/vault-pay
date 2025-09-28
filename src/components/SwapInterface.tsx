"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowDown, Settings, Loader2, ChevronDown, AlertCircle } from "lucide-react";
import { TokenSelector } from "./TokenSelector";
import { useSwap } from "@/hooks/useSwap";
import { NetworkEnum } from "@1inch/cross-chain-sdk";

interface Token {
  symbol: string;
  name: string;
  address: string;
  logoURI?: string;
  balance?: string;
  price?: number;
}

const MOCK_TOKENS: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0x0000000000000000000000000000000000000000",
    logoURI: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    balance: "0.999573",
    price: 3990.25,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png",
    balance: "0",
    price: 1,
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    address: "0x4200000000000000000000000000000000000006",
    logoURI: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
    balance: "0",
    price: 3990.25,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xfde4C96c8593536E31F229EA8cc4eFFc1Bd215E",
    logoURI: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
    balance: "0",
    price: 1,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    address: "0x03C7054BCB39f7b2e5B2c7AcB37583e16D1E901",
    logoURI: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
    balance: "0",
    price: 67000,
  },
  {
    symbol: "1INCH",
    name: "1inch",
    address: "0x111111111117dC0aa78b770fA6A738034120C302",
    logoURI: "https://assets.coingecko.com/coins/images/13469/small/1inch-token.png",
    balance: "0",
    price: 0.4,
  },
];

export function SwapInterface() {
  const [fromToken, setFromToken] = useState<Token | null>(MOCK_TOKENS[0]); // ETH
  const [toToken, setToToken] = useState<Token | null>(MOCK_TOKENS[1]); // USDC
  const [fromAmount, setFromAmount] = useState<string>("1");
  const [toAmount, setToAmount] = useState<string>("3996.51");
  const [showTokenSelector, setShowTokenSelector] = useState<{
    type: "from" | "to";
    isOpen: boolean;
  }>({ type: "from", isOpen: false });

  const {
    isLoading,
    quote,
    orderHash,
    orderStatus,
    error,
    getQuote,
    placeOrder,
    monitorOrderStatus,
    isWalletConnected
  } = useSwap();

  // Auto-update quote when tokens or amounts change
  useEffect(() => {
    if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
      const amountInWei = (parseFloat(fromAmount) * Math.pow(10, 18)).toString(); // Convert to wei for ETH

      getQuote({
        srcChainId: NetworkEnum.ETHEREUM,
        dstChainId: NetworkEnum.ETHEREUM,
        srcTokenAddress: fromToken.address,
        dstTokenAddress: toToken.address,
        amount: amountInWei,
        walletAddress: "", // Will be set by the hook
      });
    }
  }, [fromToken, toToken, fromAmount, getQuote]);

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount || !quote) return;

    try {
      await placeOrder(quote);
      // The placeOrder function handles the order placement internally
      // If we get here without an error, the order was placed successfully
      console.log("Swap order placed successfully!");
    } catch (error: any) {
      console.error("Swap failed:", error);
    }
  };

  const handleTokenSelect = (token: Token) => {
    if (showTokenSelector.type === "from") {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowTokenSelector({ type: "from", isOpen: false });
  };

  const openTokenSelector = (type: "from" | "to") => {
    setShowTokenSelector({ type, isOpen: true });
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDown className="w-5 h-5" />
            Swap Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* From Token Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">You pay</label>
            <div className="relative">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                <div className="flex items-center gap-2 flex-1">
                  {fromToken && (
                    <>
                      <img
                        src={fromToken.logoURI}
                        alt={fromToken.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-medium">{fromToken.symbol}</span>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </>
                  )}
                </div>
                <Input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  placeholder="0"
                  className="bg-transparent border-0 text-right p-0 h-auto focus-visible:ring-0"
                />
              </div>
              <button
                onClick={() => openTokenSelector("from")}
                className="absolute inset-0 w-full h-full opacity-0"
              />
            </div>
            {fromToken && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>Balance: {fromToken.balance}</span>
                <span>~${fromToken.price ? (parseFloat(fromAmount || "0") * fromToken.price).toFixed(2) : "0.00"}</span>
              </div>
            )}
          </div>

          {/* Swap Direction Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-8 w-8"
              onClick={() => {
                const temp = fromToken;
                setFromToken(toToken);
                setToToken(temp);
                setFromAmount(toAmount);
                setToAmount(fromAmount);
              }}
            >
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>

          {/* To Token Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">You receive</label>
            <div className="relative">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border">
                <div className="flex items-center gap-2 flex-1">
                  {toToken && (
                    <>
                      <img
                        src={toToken.logoURI}
                        alt={toToken.symbol}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-medium">{toToken.symbol}</span>
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    </>
                  )}
                </div>
                <Input
                  type="number"
                  value={toAmount}
                  onChange={(e) => setToAmount(e.target.value)}
                  placeholder="0"
                  className="bg-transparent border-0 text-right p-0 h-auto focus-visible:ring-0"
                />
              </div>
              <button
                onClick={() => openTokenSelector("to")}
                className="absolute inset-0 w-full h-full opacity-0"
              />
            </div>
            {toToken && (
              <div className="flex justify-between text-sm text-slate-500">
                <span>Balance: {toToken.balance}</span>
                <span>~${toToken.price ? (parseFloat(toAmount || "0") * toToken.price).toFixed(2) : "0.00"}</span>
              </div>
            )}
          </div>

          {/* Exchange Rate */}
          <div className="flex justify-between items-center text-sm text-slate-500 py-2">
            <span>1 {fromToken?.symbol} = {toToken && fromToken ? (parseFloat(toAmount || "0") / parseFloat(fromAmount || "1")).toFixed(6) : "0.000000"} {toToken?.symbol}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Order Status */}
          {orderStatus && (
            <div className="text-sm text-slate-600 dark:text-slate-300 text-center">
              Order Status: <span className="font-medium">{orderStatus}</span>
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={isLoading || !fromToken || !toToken || !fromAmount || !isWalletConnected || !quote}
            className="w-full h-12"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : !isWalletConnected ? (
              "Connect Wallet"
            ) : (
              "Swap"
            )}
          </Button>

          {/* Slippage Warning */}
          <div className="text-xs text-slate-500 text-center">
            ~$0.31 gas fee • Free $0.31 ↓
          </div>
        </CardContent>
      </Card>

      {/* Token Selector Modal */}
      {showTokenSelector.isOpen && (
        <TokenSelector
          tokens={MOCK_TOKENS}
          onSelect={handleTokenSelect}
          onClose={() => setShowTokenSelector({ type: "from", isOpen: false })}
          selectedToken={showTokenSelector.type === "from" ? fromToken : toToken}
        />
      )}
    </div>
  );
}
