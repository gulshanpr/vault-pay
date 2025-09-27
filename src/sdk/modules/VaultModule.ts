/**
 * Vault Module - Handles yield-bearing vault operations
 */

import type { 
  VaultInfo,
  VaultOperationRequest,
  VaultOperationResult,
  VaultBalance,
  AutoYieldConfig,
  APIResponse 
} from '../types';
import type { APIClient } from '../utils/api-client';

export class VaultModule {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get available vaults
   */
  async getAvailableVaults(token?: string): Promise<APIResponse<VaultInfo[]>> {
    const params = token ? `?token=${token}` : '';
    return this.apiClient.get(`/vaults${params}`);
  }

  /**
   * Get vault information
   */
  async getVaultInfo(vaultAddress: string): Promise<APIResponse<VaultInfo>> {
    return this.apiClient.get(`/vaults/${vaultAddress}`);
  }

  /**
   * Deposit tokens to vault
   */
  async deposit(
    vaultAddress: string, 
    token: string, 
    amount: string,
    orderId?: string
  ): Promise<APIResponse<VaultOperationResult>> {
    const request: VaultOperationRequest = {
      vaultAddress,
      token,
      amount,
      operation: 'deposit',
      orderId
    };

    return this.apiClient.post('/vaults/deposit', request);
  }

  /**
   * Withdraw tokens from vault
   */
  async withdraw(
    vaultAddress: string, 
    token: string, 
    amount: string,
    orderId?: string
  ): Promise<APIResponse<VaultOperationResult>> {
    const request: VaultOperationRequest = {
      vaultAddress,
      token,
      amount,
      operation: 'withdraw',
      orderId
    };

    return this.apiClient.post('/vaults/withdraw', request);
  }

  /**
   * Get vault balances for merchant
   */
  async getBalances(): Promise<APIResponse<VaultBalance[]>> {
    return this.apiClient.get('/vaults/balances');
  }

  /**
   * Get vault balance for specific vault
   */
  async getVaultBalance(vaultAddress: string): Promise<APIResponse<VaultBalance>> {
    return this.apiClient.get(`/vaults/${vaultAddress}/balance`);
  }

  /**
   * Enable auto-yield for payments
   */
  async enableAutoYield(config: AutoYieldConfig): Promise<APIResponse<boolean>> {
    return this.apiClient.post('/vaults/auto-yield/enable', config);
  }

  /**
   * Disable auto-yield
   */
  async disableAutoYield(): Promise<APIResponse<boolean>> {
    return this.apiClient.post('/vaults/auto-yield/disable');
  }

  /**
   * Get auto-yield configuration
   */
  async getAutoYieldConfig(): Promise<APIResponse<AutoYieldConfig>> {
    return this.apiClient.get('/vaults/auto-yield/config');
  }

  /**
   * Get vault earnings report
   */
  async getEarningsReport(period: {
    start: number;
    end: number;
  }): Promise<APIResponse<any>> {
    return this.apiClient.post('/vaults/earnings-report', period);
  }

  /**
   * Get best vault for token (highest APY)
   */
  async getBestVault(token: string, riskLevel?: 'low' | 'medium' | 'high'): Promise<APIResponse<VaultInfo>> {
    const params = new URLSearchParams({ token });
    if (riskLevel) params.append('riskLevel', riskLevel);
    
    return this.apiClient.get(`/vaults/best?${params.toString()}`);
  }

  /**
   * Quick earn - deposit to best available vault
   */
  async quickEarn(
    token: string, 
    amount: string, 
    riskLevel: 'low' | 'medium' | 'high' = 'low'
  ): Promise<APIResponse<VaultOperationResult>> {
    return this.apiClient.post('/vaults/quick-earn', {
      token,
      amount,
      riskLevel,
      timestamp: Date.now()
    });
  }
}