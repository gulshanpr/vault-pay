"use client";

import { useState } from "react";
import { useFusionPlusCrossChain } from "@/hooks/useFusionPlusCrossChain";
import { NetworkEnum } from "@1inch/cross-chain-sdk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function CrossChainSwapInterface() {
  const [srcChainId, setSrcChainId] = useState<number>(NetworkEnum.ARBITRUM);
  const [dstChainId, setDstChainId] = useState<number>(NetworkEnum.COINBASE);
  const [srcToken, setSrcToken] = useState<string>(
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
  );
  const [dstToken, setDstToken] = useState<string>(
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
  );
  const [amount, setAmount] = useState<string>("200000");

  const {
    loading,
    error,
    quote,
    orderHash,
    getQuote,
    placeOrderAndHandleFills,
    approveIfNeeded,
  } = useFusionPlusCrossChain();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Select
          value={String(srcChainId)}
          onValueChange={(v) => setSrcChainId(Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="From chain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(NetworkEnum.ARBITRUM)}>
              Arbitrum
            </SelectItem>
            <SelectItem value={String(NetworkEnum.COINBASE)}>Base</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={String(dstChainId)}
          onValueChange={(v) => setDstChainId(Number(v))}
        >
          <SelectTrigger>
            <SelectValue placeholder="To chain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={String(NetworkEnum.ARBITRUM)}>
              Arbitrum
            </SelectItem>
            <SelectItem value={String(NetworkEnum.COINBASE)}>Base</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Input
        placeholder="From token"
        value={srcToken}
        onChange={(e) => setSrcToken(e.target.value)}
      />
      <Input
        placeholder="To token"
        value={dstToken}
        onChange={(e) => setDstToken(e.target.value)}
      />
      <Input
        placeholder="Amount (raw units)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => approveIfNeeded(srcToken as `0x${string}`)}
          disabled={loading}
        >
          Approve
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            getQuote({
              srcChainId,
              dstChainId,
              srcTokenAddress: srcToken,
              dstTokenAddress: dstToken,
              amount,
            })
          }
          disabled={loading}
        >
          Get Quote
        </Button>
        <Button
          onClick={() => placeOrderAndHandleFills()}
          disabled={loading || !quote}
        >
          Place Order
        </Button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {quote && (
        <div className="text-sm text-muted-foreground">
          Quote ready (secretsCount: {quote.getPreset().secretsCount})
        </div>
      )}
      {orderHash && <div className="text-sm">Order Hash: {orderHash}</div>}
    </div>
  );
}
