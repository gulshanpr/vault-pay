/**
 * Validation utilities for the VaultPay SDK
 */

/**
 * Validate Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate amount format
 */
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

/**
 * Validate token symbol
 */
export function isValidTokenSymbol(symbol: string): boolean {
  return /^[A-Z]{2,10}$/.test(symbol);
}

/**
 * Validate chain ID
 */
export function isValidChainId(chainId: number): boolean {
  const supportedChains = [1, 137, 42161, 10, 8453];
  return supportedChains.includes(chainId);
}

/**
 * Validate order ID format
 */
export function isValidOrderId(orderId: string): boolean {
  return orderId.length > 0 && orderId.length <= 100;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}