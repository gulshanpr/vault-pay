/**
 * VaultPay SDK Utilities - Complete Infrastructure Package
 * 
 * This module provides comprehensive utilities for the VaultPay SDK including:
 * - Error handling and custom error types
 * - Input validation and sanitization
 * - Response formatting and data transformation
 * - Logging and performance monitoring
 * - Helper functions for common operations
 */

// Error handling utilities
export {
  VaultPayError,
  APIError,
  ValidationError,
  PaymentError,
  SwapError,
  VaultError,
  ContractError,
  ErrorCodes,
  createErrorFromResponse,
  handleAsyncOperation,
  validateRequiredParams
} from './errors';

// Validation utilities
export {
  isValidAddress,
  isValidAmount,
  isValidTokenSymbol,
  isValidChainId,
  isValidOrderId,
  isValidEmail,
  isValidUrl,
  sanitizeString
} from './validation';

// Response formatting utilities
export {
  formatResponse,
  successResponse,
  errorResponse,
  formatAmount,
  formatCurrency,
  formatPercentage,
  formatDate,
  truncateAddress,
  weiToEther,
  etherToWei
} from './formatting';

// Logging utilities
export {
  Logger,
  LogLevel,
  logger,
  createModuleLogger,
  PerformanceLogger,
  performanceLogger
} from './logger';

// Type exports
export type {
  LoggerConfig,
  LogEntry
} from './logger';