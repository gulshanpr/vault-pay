/**
 * Swap-specific types and interfaces
 */

export interface SwapHistory {
  swapId: string;
  orderId?: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  rate: string;
  fees: string;
  status: string;
  timestamp: number;
  transactionHash?: string;
}

export interface CrossChainSwap {
  fromChain: number;
  toChain: number;
  bridgeProtocol: string;
  estimatedTime: number;
  bridgeFee: string;
}

export interface SwapLimits {
  token: string;
  minAmount: string;
  maxAmount: string;
  dailyLimit: string;
}