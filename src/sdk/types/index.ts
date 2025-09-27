/**
 * VaultPay SDK Types - Comprehensive Merchant SDK
 * 
 * Complete type definitions for all merchant operations
 */

// =============================================
// CORE SDK CONFIGURATION
// =============================================

export interface VaultPayConfig {
  // API Configuration
  apiKey: string;
  apiUrl?: string;
  environment?: 'development' | 'staging' | 'production';
  
  // Merchant Configuration
  merchantId: string;
  merchantAddress: string;
  merchantName?: string;
  
  // Webhook Configuration
  webhookUrl?: string;
  webhookSecret?: string;
  
  // Chain Configuration
  supportedChains?: number[];
  defaultChain?: number;
  
  // Feature Flags
  autoYieldEnabled?: boolean;
  multiChainEnabled?: boolean;
  debugMode?: boolean;
}

// =============================================
// PAYMENT TYPES
// =============================================

export interface PaymentRequest {
  // Order Information
  orderId: string;
  amount: string;
  currency: string;
  description?: string;
  
  // Customer Information
  customerAddress?: string;
  customerEmail?: string;
  customerId?: string;
  
  // Payment Configuration
  acceptedTokens?: string[];
  acceptedChains?: number[];
  
  // Advanced Options
  expiresAt?: number;
  metadata?: Record<string, any>;
  webhookData?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  orderId: string;
  transactionHash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  amount: string;
  currency: string;
  fees?: {
    networkFee: string;
    serviceFee: string;
    totalFee: string;
  };
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaymentStatus {
  paymentId: string;
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  transactionHash?: string;
  confirmations?: number;
  requiredConfirmations?: number;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
}

// =============================================
// SWAP TYPES
// =============================================

export interface SwapQuoteRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  fromChain?: number;
  toChain?: number;
  slippage?: number;
}

export interface SwapQuote {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  fromChain: number;
  toChain: number;
  rate: string;
  priceImpact: string;
  fees: {
    swapFee: string;
    bridgeFee: string;
    gasFee: string;
    totalFee: string;
  };
  route: string[];
  estimatedTime: number;
  validUntil: number;
}

export interface SwapRequest {
  quoteId: string;
  recipientAddress: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

export interface SwapResult {
  success: boolean;
  swapId: string;
  transactionHash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fromAmount: string;
  toAmount: string;
  actualToAmount?: string;
  error?: string;
}

// =============================================
// VAULT TYPES
// =============================================

export interface VaultInfo {
  address: string;
  name: string;
  protocol: string;
  asset: string;
  apy: string;
  tvl: string;
  riskLevel: 'low' | 'medium' | 'high';
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface VaultOperationRequest {
  vaultAddress: string;
  token: string;
  amount: string;
  operation: 'deposit' | 'withdraw';
  orderId?: string;
}

export interface VaultOperationResult {
  success: boolean;
  operationId: string;
  transactionHash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  amount: string;
  token: string;
  vaultAddress: string;
  error?: string;
}

export interface VaultBalance {
  vaultAddress: string;
  token: string;
  balance: string;
  valueUSD: string;
  apy: string;
  earned: string;
  earnedUSD: string;
}

export interface AutoYieldConfig {
  enabled: boolean;
  tokens: string[];
  strategy: 'conservative' | 'moderate' | 'aggressive';
  minAmount?: string;
  maxAmount?: string;
  vaultPreferences?: string[];
}

// =============================================
// SMART CONTRACT TYPES
// =============================================

export interface MerchantRegistration {
  merchantId: string;
  businessName: string;
  businessType: string;
  walletAddress: string;
  country: string;
  website?: string;
  email?: string;
  metadata?: Record<string, any>;
}

export interface ContractCallRequest {
  contractAddress: string;
  methodName: string;
  parameters: any[];
  value?: string;
  gasLimit?: number;
}

export interface ContractCallResult {
  success: boolean;
  transactionHash?: string;
  result?: any;
  gasUsed?: string;
  error?: string;
}

// =============================================
// UTILITY TYPES
// =============================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: number;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
  signature: string;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    api: boolean;
    payments: boolean;
    swaps: boolean;
    vaults: boolean;
    contracts: boolean;
  };
  latency: number;
  timestamp: number;
}

// =============================================
// ERROR TYPES
// =============================================

export interface SDKError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

export type ErrorCode = 
  | 'INVALID_CONFIG'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'PAYMENT_FAILED'
  | 'SWAP_FAILED'
  | 'VAULT_ERROR'
  | 'CONTRACT_ERROR'
  | 'INSUFFICIENT_BALANCE'
  | 'EXPIRED_QUOTE'
  | 'INVALID_ADDRESS'
  | 'UNSUPPORTED_TOKEN'
  | 'UNSUPPORTED_CHAIN';

// =============================================
// SUPPORTED NETWORKS AND TOKENS
// =============================================

export type SupportedChain = 1 | 137 | 42161 | 10 | 8453; // Ethereum, Polygon, Arbitrum, Optimism, Base
export type SupportedToken = 'ETH' | 'WETH' | 'USDC' | 'USDT' | 'DAI' | 'WBTC';

export interface NetworkInfo {
  chainId: number;
  name: string;
  nativeCurrency: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  isTestnet: boolean;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chainId: number;
  logoUrl?: string;
  isStablecoin: boolean;
}

// =============================================
// EVENT TYPES
// =============================================

export interface SDKEvent {
  type: string;
  data: any;
  timestamp: number;
}

export type PaymentEventType = 
  | 'payment:created'
  | 'payment:processing'
  | 'payment:completed'
  | 'payment:failed'
  | 'payment:expired';

export type SwapEventType = 
  | 'swap:quote'
  | 'swap:started'
  | 'swap:completed'
  | 'swap:failed';

export type VaultEventType = 
  | 'vault:deposit'
  | 'vault:withdraw'
  | 'vault:earnings';

// Export all types
export * from './payment';
export * from './swap';
export * from './vault';