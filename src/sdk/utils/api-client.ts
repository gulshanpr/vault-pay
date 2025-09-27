/**
 * VaultPay SDK API Client
 * 
 * Handles all communication with the VaultPay backend API
 */

import type { APIResponse, VaultPayConfig, SDKError } from '../types';

export class APIClient {
  private config: VaultPayConfig;
  private baseUrl: string;

  constructor(config: VaultPayConfig) {
    this.config = config;
    this.baseUrl = config.apiUrl || this.getDefaultApiUrl(config.environment || 'production');
  }

  /**
   * Get default API URL based on environment
   */
  private getDefaultApiUrl(environment: string): string {
    switch (environment) {
      case 'development':
        return 'http://localhost:3001/api';
      case 'staging':
        return 'https://staging-api.vaultpay.io';
      case 'production':
      default:
        return 'https://api.vaultpay.io';
    }
  }

  /**
   * Make HTTP request to the API
   */
  async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<APIResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      if (this.config.debugMode) {
        console.log(`🌐 API Request: ${method} ${url}`, data);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'X-Merchant-ID': this.config.merchantId,
        'X-SDK-Version': '2.0.0'
      };

      const requestOptions: RequestInit = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      };

      const response = await fetch(url, requestOptions);
      const result = await response.json();

      if (this.config.debugMode) {
        console.log(`🌐 API Response: ${response.status}`, result);
      }

      if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: result.data,
        message: result.message,
        timestamp: Date.now()
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (this.config.debugMode) {
        console.error('❌ API Error:', errorMessage);
      }

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now()
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, 'GET');
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, 'POST', data);
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, 'PUT', data);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, 'DELETE');
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<APIResponse<any>> {
    return this.get('/health');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VaultPayConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.apiUrl) {
      this.baseUrl = newConfig.apiUrl;
    }

    if (this.config.debugMode) {
      console.log('⚙️ API Client config updated:', this.config);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): VaultPayConfig {
    return { ...this.config };
  }
}