/**
 * VaultPay SDK - Comprehensive Merchant Payment SDK
 * 
 * Complete SDK for merchant payment processing, swaps, vault operations,
 * and smart contract interactions via backend API.
 */

import type { 
  VaultPayConfig, 
  PaymentRequest, 
  SwapQuoteRequest,
  VaultInfo,
  AutoYieldConfig,
  APIResponse,
  HealthCheck
} from './types';
import { APIClient } from './utils/api-client';
import { PaymentModule } from './modules/PaymentModule';
import { SwapModule } from './modules/SwapModule';
import { VaultModule } from './modules/VaultModule';
import { ContractModule } from './modules/ContractModule';

export class VaultPaySDK {
  // Core components
  private config: VaultPayConfig;
  private apiClient: APIClient;

  // Feature modules
  public payments: PaymentModule;
  public swaps: SwapModule;
  public vaults: VaultModule;
  public contracts: ContractModule;

  constructor(config: VaultPayConfig) {
    // Validate required configuration
    this.validateConfig(config);

    this.config = {
      environment: 'production',
      supportedChains: [1, 137, 42161, 10, 8453], // Ethereum, Polygon, Arbitrum, Optimism, Base
      defaultChain: 1,
      autoYieldEnabled: false,
      multiChainEnabled: true,
      debugMode: false,
      ...config
    };

    // Initialize API client
    this.apiClient = new APIClient(this.config);

    // Initialize feature modules
    this.payments = new PaymentModule(this.apiClient);
    this.swaps = new SwapModule(this.apiClient);
    this.vaults = new VaultModule(this.apiClient);
    this.contracts = new ContractModule(this.apiClient);

    if (this.config.debugMode) {
      console.log('🚀 VaultPay SDK initialized:', {
        merchantId: this.config.merchantId,
        environment: this.config.environment,
        features: {
          payments: '✅',
          swaps: '✅',
          vaults: '✅',
          contracts: '✅'
        }
      });
    }
  }

  // =============================================
  // QUICK ACCESS METHODS (Convenience)
  // =============================================

  /**
   * Quick payment method for simple integration
   */
  async quickPay(
    amount: string, 
    currency: string, 
    orderId: string,
    options?: Partial<PaymentRequest>
  ) {
    return this.payments.quickPay(amount, currency, orderId, options);
  }

  /**
   * Quick swap quote
   */
  async getSwapQuote(
    fromToken: string,
    toToken: string,
    amount: string,
    options?: Partial<SwapQuoteRequest>
  ) {
    const request: SwapQuoteRequest = {
      fromToken,
      toToken,
      amount,
      ...options
    };
    return this.swaps.getQuote(request);
  }

  /**
   * Quick earn yield
   */
  async quickEarn(
    token: string, 
    amount: string, 
    riskLevel: 'low' | 'medium' | 'high' = 'low'
  ) {
    return this.vaults.quickEarn(token, amount, riskLevel);
  }

  /**
   * Swap and pay in one transaction
   */
  async swapAndPay(
    fromToken: string,
    toToken: string,
    amount: string,
    orderId?: string
  ) {
    return this.swaps.swapAndPay(
      fromToken, 
      toToken, 
      amount, 
      this.config.merchantAddress, 
      orderId
    );
  }

  // =============================================
  // AUTO-YIELD MANAGEMENT
  // =============================================

  /**
   * Enable automatic yield earning on payments
   */
  async enableAutoYield(config?: Partial<AutoYieldConfig>) {
    const autoYieldConfig: AutoYieldConfig = {
      enabled: true,
      tokens: ['USDC', 'USDT', 'DAI'],
      strategy: 'conservative',
      ...config
    };

    const result = await this.vaults.enableAutoYield(autoYieldConfig);
    
    if (result.success) {
      this.config.autoYieldEnabled = true;
    }

    return result;
  }

  /**
   * Disable automatic yield earning
   */
  async disableAutoYield() {
    const result = await this.vaults.disableAutoYield();
    
    if (result.success) {
      this.config.autoYieldEnabled = false;
    }

    return result;
  }

  // =============================================
  // MERCHANT MANAGEMENT
  // =============================================

  /**
   * Register merchant (one-time setup)
   */
  async registerMerchant(merchantInfo: {
    businessName: string;
    businessType: string;
    country: string;
    website?: string;
    email?: string;
  }) {
    return this.contracts.registerMerchant({
      merchantId: this.config.merchantId,
      walletAddress: this.config.merchantAddress,
      ...merchantInfo
    });
  }

  /**
   * Get merchant status and information
   */
  async getMerchantInfo() {
    return this.contracts.getMerchantStatus(this.config.merchantAddress);
  }

  // =============================================
  // ANALYTICS & REPORTING
  // =============================================

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(period: { start: number; end: number }) {
    return this.payments.getPaymentAnalytics(period);
  }

  /**
   * Get vault earnings report
   */
  async getEarningsReport(period: { start: number; end: number }) {
    return this.vaults.getEarningsReport(period);
  }

  /**
   * Get complete dashboard data
   */
  async getDashboardData() {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    const [
      paymentAnalytics,
      earningsReport,
      vaultBalances,
      recentPayments
    ] = await Promise.all([
      this.payments.getPaymentAnalytics({ start: thirtyDaysAgo, end: now }),
      this.vaults.getEarningsReport({ start: thirtyDaysAgo, end: now }),
      this.vaults.getBalances(),
      this.payments.listPayments({ limit: 10 })
    ]);

    return {
      analytics: paymentAnalytics.data,
      earnings: earningsReport.data,
      balances: vaultBalances.data,
      recentPayments: recentPayments.data
    };
  }

  // =============================================
  // SYSTEM MANAGEMENT
  // =============================================

  /**
   * Health check
   */
  async healthCheck(): Promise<APIResponse<HealthCheck>> {
    return this.apiClient.healthCheck();
  }

  /**
   * Update SDK configuration
   */
  updateConfig(newConfig: Partial<VaultPayConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.apiClient.updateConfig(newConfig);

    if (this.config.debugMode) {
      console.log('⚙️ SDK configuration updated:', this.config);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): VaultPayConfig {
    return { ...this.config };
  }

  /**
   * Get SDK version and info
   */
  getInfo() {
    return {
      name: 'VaultPay SDK',
      version: '2.0.0',
      description: 'Comprehensive merchant payment SDK',
      features: ['payments', 'swaps', 'vaults', 'contracts'],
      supportedChains: this.config.supportedChains,
      environment: this.config.environment
    };
  }

  // =============================================
  // PRIVATE METHODS
  // =============================================

  /**
   * Validate SDK configuration
   */
  private validateConfig(config: VaultPayConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    if (!config.merchantId) {
      throw new Error('Merchant ID is required');
    }

    if (!config.merchantAddress) {
      throw new Error('Merchant address is required');
    }

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(config.merchantAddress)) {
      throw new Error('Invalid merchant address format');
    }
  }
}

// Default export
export default VaultPaySDK;