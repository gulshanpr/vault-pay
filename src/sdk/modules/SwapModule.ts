/**
 * Swap Module - Handles token swaps and cross-chain operations
 */

import type { 
  SwapQuoteRequest,
  SwapQuote,
  SwapRequest,
  SwapResult,
  APIResponse 
} from '../types';
import type { APIClient } from '../utils/api-client';

export class SwapModule {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get swap quote
   */
  async getQuote(request: SwapQuoteRequest): Promise<APIResponse<SwapQuote>> {
    return this.apiClient.post('/swap/quote', request);
  }

  /**
   * Execute a swap
   */
  async executeSwap(request: SwapRequest): Promise<APIResponse<SwapResult>> {
    return this.apiClient.post('/swap/execute', request);
  }

  /**
   * Get swap status
   */
  async getSwapStatus(swapId: string): Promise<APIResponse<SwapResult>> {
    return this.apiClient.get(`/swap/${swapId}/status`);
  }

  /**
   * Get supported tokens for swapping
   */
  async getSupportedTokens(chainId?: number): Promise<APIResponse<any[]>> {
    const params = chainId ? `?chainId=${chainId}` : '';
    return this.apiClient.get(`/swap/tokens${params}`);
  }

  /**
   * Get swap history
   */
  async getSwapHistory(options?: {
    limit?: number;
    offset?: number;
    fromDate?: number;
    toDate?: number;
  }): Promise<APIResponse<SwapResult[]>> {
    const params = new URLSearchParams();
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.fromDate) params.append('fromDate', options.fromDate.toString());
    if (options?.toDate) params.append('toDate', options.toDate.toString());

    return this.apiClient.get(`/swap/history?${params.toString()}`);
  }

  /**
   * Get swap limits for a token
   */
  async getSwapLimits(tokenSymbol: string): Promise<APIResponse<any>> {
    return this.apiClient.get(`/swap/limits/${tokenSymbol}`);
  }

  /**
   * Quick swap and pay - combines swap with payment
   */
  async swapAndPay(
    fromToken: string,
    toToken: string,
    amount: string,
    merchantAddress: string,
    orderId?: string
  ): Promise<APIResponse<SwapResult>> {
    return this.apiClient.post('/swap/and-pay', {
      fromToken,
      toToken,
      amount,
      merchantAddress,
      orderId,
      timestamp: Date.now()
    });
  }
}