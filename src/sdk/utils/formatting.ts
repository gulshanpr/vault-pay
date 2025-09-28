/**
 * Response formatting utilities
 */

import type { APIResponse } from '../types';

/**
 * Format API response for consistent structure
 */
export function formatResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
): APIResponse<T> {
  return {
    success,
    data,
    error,
    message,
    timestamp: Date.now()
  };
}

/**
 * Format success response
 */
export function successResponse<T>(data: T, message?: string): APIResponse<T> {
  return formatResponse(true, data, undefined, message);
}

/**
 * Format error response
 */
export function errorResponse(error: string): APIResponse<never> {
  return formatResponse(false, undefined, error);
}

/**
 * Format amount with decimals
 */
export function formatAmount(amount: string, decimals: number = 18): string {
  const num = parseFloat(amount);
  return num.toFixed(decimals);
}

/**
 * Format currency display
 */
export function formatCurrency(amount: string, currency: string): string {
  const num = parseFloat(amount);
  return `${num.toLocaleString()} ${currency}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: string): string {
  const num = parseFloat(value);
  return `${num.toFixed(2)}%`;
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Convert wei to ether
 */
export function weiToEther(wei: string): string {
  const weiBN = BigInt(wei);
  const etherBN = weiBN / BigInt(10 ** 18);
  return etherBN.toString();
}

/**
 * Convert ether to wei
 */
export function etherToWei(ether: string): string {
  const etherNum = parseFloat(ether);
  const wei = etherNum * (10 ** 18);
  return Math.floor(wei).toString();
}