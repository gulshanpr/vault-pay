/**
 * Payment Module - Handles all payment processing operations
 */

import type { 
  PaymentRequest, 
  PaymentResult, 
  PaymentStatus,
  RefundRequest,
  RefundResult,
  APIResponse 
} from '../types';
import type { APIClient } from '../utils/api-client';

export class PaymentModule {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Create a new payment request
   */
  async createPayment(request: PaymentRequest): Promise<APIResponse<PaymentResult>> {
    return this.apiClient.post('/payments', {
      ...request,
      timestamp: Date.now()
    });
  }

  /**
   * Quick payment method for simple integration
   */
  async quickPay(
    amount: string, 
    currency: string, 
    orderId: string,
    options?: Partial<PaymentRequest>
  ): Promise<APIResponse<PaymentResult>> {
    const paymentRequest: PaymentRequest = {
      orderId,
      amount,
      currency,
      description: `Payment for order ${orderId}`,
      ...options
    };

    return this.createPayment(paymentRequest);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<APIResponse<PaymentStatus>> {
    return this.apiClient.get(`/payments/${paymentId}/status`);
  }

  /**
   * Get payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<APIResponse<PaymentResult>> {
    return this.apiClient.get(`/payments/order/${orderId}`);
  }

  /**
   * List all payments for merchant
   */
  async listPayments(options?: {
    limit?: number;
    offset?: number;
    status?: string;
    fromDate?: number;
    toDate?: number;
  }): Promise<APIResponse<PaymentResult[]>> {
    const params = new URLSearchParams();
    
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());
    if (options?.status) params.append('status', options.status);
    if (options?.fromDate) params.append('fromDate', options.fromDate.toString());
    if (options?.toDate) params.append('toDate', options.toDate.toString());

    return this.apiClient.get(`/payments?${params.toString()}`);
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(paymentId: string, reason?: string): Promise<APIResponse<boolean>> {
    return this.apiClient.post(`/payments/${paymentId}/cancel`, { reason });
  }

  /**
   * Request a refund
   */
  async requestRefund(request: RefundRequest): Promise<APIResponse<RefundResult>> {
    return this.apiClient.post('/payments/refund', request);
  }

  /**
   * Verify payment completion
   */
  async verifyPayment(paymentId: string): Promise<APIResponse<PaymentStatus>> {
    return this.apiClient.post(`/payments/${paymentId}/verify`);
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(period: {
    start: number;
    end: number;
  }): Promise<APIResponse<{
    totalPayments: number;
    totalAmount: string;
    successRate: number;
    averageAmount: string;
    topCurrencies: Array<{ currency: string; count: number; amount: string }>;
  }>> {
    return this.apiClient.post('/payments/analytics', period);
  }

  /**
   * Set payment webhook
   */
  async setWebhook(webhookUrl: string, events: string[]): Promise<APIResponse<boolean>> {
    return this.apiClient.post('/payments/webhook', {
      url: webhookUrl,
      events
    });
  }
}