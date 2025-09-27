/**
 * Payment-specific types and interfaces
 */

export interface PaymentMethodConfig {
  acceptCreditCards: boolean;
  acceptCrypto: boolean;
  acceptBankTransfer: boolean;
  minimumAmount?: string;
  maximumAmount?: string;
}

export interface PaymentVerification {
  paymentId: string;
  verified: boolean;
  verificationMethod: string;
  verificationData?: any;
}

export interface RefundRequest {
  paymentId: string;
  amount?: string; // Partial refund if specified
  reason: string;
  metadata?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  originalPaymentId: string;
  amount: string;
  status: 'processing' | 'completed' | 'failed';
  transactionHash?: string;
  error?: string;
}