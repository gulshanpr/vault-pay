// =============================================
// VAULT PAY SDK - COMPREHENSIVE MERCHANT SDK
// =============================================

// Main SDK Class - Complete merchant payment solution
export { VaultPaySDK } from './VaultPaySDK';
// Default export handled at bottom of file

// Feature Modules (for advanced usage)
export { PaymentModule } from './modules/PaymentModule';
export { SwapModule } from './modules/SwapModule';
export { VaultModule } from './modules/VaultModule';
export { ContractModule } from './modules/ContractModule';

// Utilities
export { APIClient } from './utils/api-client';

// Types - Comprehensive type definitions
export type {
  // Core Configuration
  VaultPayConfig,
  
  // Payment Types
  PaymentRequest,
  PaymentResult,
  PaymentStatus,
  RefundRequest,
  RefundResult,
  
  // Swap Types
  SwapQuoteRequest,
  SwapQuote,
  SwapRequest,
  SwapResult,
  
  // Vault Types
  VaultInfo,
  VaultOperationRequest,
  VaultOperationResult,
  VaultBalance,
  AutoYieldConfig,
  
  // Contract Types
  MerchantRegistration,
  ContractCallRequest,
  ContractCallResult,
  
  // Utility Types
  APIResponse,
  WebhookPayload,
  HealthCheck,
  SDKError,
  ErrorCode,
  SupportedChain,
  SupportedToken,
  NetworkInfo,
  TokenInfo
} from './types';

// Simple convenience functions
import { VaultPaySDK } from './VaultPaySDK';
import type { VaultPayConfig } from './types';

/**
 * Create a new VaultPay SDK instance with simplified configuration
 * 
 * @example
 * ```typescript
 * import { createVaultPaySDK } from './src/sdk';
 * 
 * const sdk = createVaultPaySDK({
 *   apiUrl: 'http://localhost:3001/api',
 *   chainId: 1,
 *   merchantAddress: '0x...',
 *   debug: true
 * });
 * ```
 */
export function createVaultPaySDK(config: VaultPayConfig): VaultPaySDK {
  return new VaultPaySDK(config);
}

/**
 * SDK Information
 */
export const SDK_INFO = {
  name: 'VaultPay SDK',
  version: '2.0.0',
  description: 'Simple backend API wrapper for merchant payments',
  features: [
    'Backend API integration',
    'Merchant payment processing',
    'Token swap quotes',
    'Vault information',
    'Health monitoring'
  ],
  supported: {
    chains: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'Base'],
    tokens: ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC'],
    endpoints: ['Payment', 'Swap', 'Vault', 'Health']
  }
};

// Default export
export { VaultPaySDK as default };