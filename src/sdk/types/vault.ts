/**
 * Vault-specific types and interfaces
 */

export interface VaultStrategy {
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  expectedApy: string;
  protocols: string[];
}

export interface VaultTransaction {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: string;
  token: string;
  vaultAddress: string;
  timestamp: number;
  transactionHash: string;
  status: string;
}

export interface EarningsReport {
  vaultAddress: string;
  token: string;
  totalDeposited: string;
  totalEarned: string;
  currentApy: string;
  period: {
    start: number;
    end: number;
  };
  transactions: VaultTransaction[];
}