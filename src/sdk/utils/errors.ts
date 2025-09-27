/**
 * Error handling utilities for the VaultPay SDK
 */

/**
 * Base SDK Error class
 */
export class VaultPayError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'VaultPayError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * API Error - for backend communication issues
 */
export class APIError extends VaultPayError {
  constructor(message: string, statusCode: number, details?: any) {
    super(message, 'API_ERROR', statusCode, details);
    this.name = 'APIError';
  }
}

/**
 * Validation Error - for input validation failures
 */
export class ValidationError extends VaultPayError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400, { field });
    this.name = 'ValidationError';
  }
}

/**
 * Payment Error - for payment processing issues
 */
export class PaymentError extends VaultPayError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, 400, details);
    this.name = 'PaymentError';
  }
}

/**
 * Swap Error - for token swap issues
 */
export class SwapError extends VaultPayError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, 400, details);
    this.name = 'SwapError';
  }
}

/**
 * Vault Error - for vault operation issues
 */
export class VaultError extends VaultPayError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, 400, details);
    this.name = 'VaultError';
  }
}

/**
 * Contract Error - for smart contract interaction issues
 */
export class ContractError extends VaultPayError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, 400, details);
    this.name = 'ContractError';
  }
}

/**
 * Error codes enum for consistent error handling
 */
export enum ErrorCodes {
  // Validation errors
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INVALID_CHAIN = 'INVALID_CHAIN',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // API errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',

  // Payment errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_EXPIRED = 'PAYMENT_EXPIRED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  PAYMENT_NOT_FOUND = 'PAYMENT_NOT_FOUND',

  // Swap errors
  SWAP_FAILED = 'SWAP_FAILED',
  INSUFFICIENT_LIQUIDITY = 'INSUFFICIENT_LIQUIDITY',
  SLIPPAGE_TOO_HIGH = 'SLIPPAGE_TOO_HIGH',
  SWAP_TIMEOUT = 'SWAP_TIMEOUT',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',

  // Vault errors
  VAULT_NOT_FOUND = 'VAULT_NOT_FOUND',
  INSUFFICIENT_VAULT_BALANCE = 'INSUFFICIENT_VAULT_BALANCE',
  VAULT_DEPOSIT_FAILED = 'VAULT_DEPOSIT_FAILED',
  VAULT_WITHDRAWAL_FAILED = 'VAULT_WITHDRAWAL_FAILED',
  AUTO_YIELD_FAILED = 'AUTO_YIELD_FAILED',

  // Contract errors
  CONTRACT_CALL_FAILED = 'CONTRACT_CALL_FAILED',
  MERCHANT_NOT_REGISTERED = 'MERCHANT_NOT_REGISTERED',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  CONTRACT_NOT_FOUND = 'CONTRACT_NOT_FOUND'
}

/**
 * Helper function to create appropriate error based on HTTP status code
 */
export function createErrorFromResponse(message: string, statusCode: number, data?: any): VaultPayError {
  switch (statusCode) {
    case 400:
      return new ValidationError(message, data?.field);
    case 401:
      return new APIError('Unauthorized', statusCode, data);
    case 403:
      return new APIError('Forbidden', statusCode, data);
    case 404:
      return new APIError('Not Found', statusCode, data);
    case 429:
      return new APIError('Rate Limited', statusCode, data);
    case 500:
    case 502:
    case 503:
    case 504:
      return new APIError('Server Error', statusCode, data);
    default:
      return new APIError(message, statusCode, data);
  }
}

/**
 * Helper function to handle async operations with proper error handling
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof VaultPayError) {
      throw error;
    }
    
    if (error instanceof Error) {
      throw new VaultPayError(
        `${errorMessage}: ${error.message}`,
        'OPERATION_FAILED',
        500,
        { originalError: error.message }
      );
    }
    
    throw new VaultPayError(errorMessage, 'UNKNOWN_ERROR', 500);
  }
}

/**
 * Helper function to validate required parameters
 */
export function validateRequiredParams(params: Record<string, any>, required: string[]): void {
  for (const param of required) {
    if (params[param] === undefined || params[param] === null || params[param] === '') {
      throw new ValidationError(`Missing required parameter: ${param}`, param);
    }
  }
}