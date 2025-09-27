/**
 * Contract Module - Handles smart contract interactions
 */

import type { 
  MerchantRegistration,
  ContractCallRequest,
  ContractCallResult,
  APIResponse 
} from '../types';
import type { APIClient } from '../utils/api-client';

export class ContractModule {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  /**
   * Register merchant in smart contract
   */
  async registerMerchant(registration: MerchantRegistration): Promise<APIResponse<ContractCallResult>> {
    return this.apiClient.post('/contracts/merchant/register', registration);
  }

  /**
   * Get merchant registration status
   */
  async getMerchantStatus(merchantAddress: string): Promise<APIResponse<any>> {
    return this.apiClient.get(`/contracts/merchant/${merchantAddress}/status`);
  }

  /**
   * Update merchant information
   */
  async updateMerchantInfo(
    merchantAddress: string, 
    updates: Partial<MerchantRegistration>
  ): Promise<APIResponse<ContractCallResult>> {
    return this.apiClient.put(`/contracts/merchant/${merchantAddress}`, updates);
  }

  /**
   * Verify merchant registration
   */
  async verifyMerchant(merchantAddress: string): Promise<APIResponse<boolean>> {
    return this.apiClient.post(`/contracts/merchant/${merchantAddress}/verify`);
  }

  /**
   * Get contract information
   */
  async getContractInfo(contractAddress: string): Promise<APIResponse<any>> {
    return this.apiClient.get(`/contracts/${contractAddress}/info`);
  }

  /**
   * Call smart contract method
   */
  async callContract(request: ContractCallRequest): Promise<APIResponse<ContractCallResult>> {
    return this.apiClient.post('/contracts/call', request);
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionHash: string): Promise<APIResponse<any>> {
    return this.apiClient.get(`/contracts/transaction/${transactionHash}/status`);
  }

  /**
   * Get contract events
   */
  async getContractEvents(
    contractAddress: string,
    fromBlock?: number,
    toBlock?: number
  ): Promise<APIResponse<any[]>> {
    const params = new URLSearchParams();
    if (fromBlock) params.append('fromBlock', fromBlock.toString());
    if (toBlock) params.append('toBlock', toBlock.toString());

    return this.apiClient.get(`/contracts/${contractAddress}/events?${params.toString()}`);
  }

  /**
   * Deploy new contract (admin only)
   */
  async deployContract(
    contractCode: string,
    constructorArgs: any[],
    contractName: string
  ): Promise<APIResponse<ContractCallResult>> {
    return this.apiClient.post('/contracts/deploy', {
      contractCode,
      constructorArgs,
      contractName
    });
  }
}