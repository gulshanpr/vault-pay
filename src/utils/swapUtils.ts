import { SDK, HashLock, NetworkEnum } from "@1inch/cross-chain-sdk";
import { randomBytes } from 'crypto';
import { solidityPackedKeccak256 } from 'ethers';
import Web3 from "web3";
import { getENSName, resolveENSName } from '@/lib/ens';

// Utility function to generate random bytes32
export function getRandomBytes32(): string {
    return '0x' + Buffer.from(randomBytes(32)).toString('hex');
}

// ERC20 approve ABI
export const approveABI = [{
    "constant": false,
    "inputs": [
        { "name": "spender", "type": "address" },
        { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
}] as const;

// 1inch Aggregation Router v6 address
export const AGGREGATION_ROUTER_V6 = '0x111111125421ca6dc452d289314280a0f8842a65';

// Token addresses
export const TOKEN_ADDRESSES = {
    ARBITRUM_USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    BASE_USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;

// Chain mappings
export const CHAIN_TO_NETWORK_ENUM = {
    [42161]: NetworkEnum.ARBITRUM, // Arbitrum
    [8453]: NetworkEnum.COINBASE,  // Base
} as const;

export interface SwapParams {
    srcChainId: number;
    dstChainId: number;
    srcTokenAddress: string;
    dstTokenAddress: string;
    amount: string;
    walletAddress: string;
    invert?: boolean;
}

export interface SwapCallbacks {
    onQuoteReceived?: (quote: any) => void;
    onOrderPlaced?: (orderHash: string) => void;
    onFillFound?: (fillInfo: any) => void;
    onOrderComplete?: () => void;
    onError?: (error: any) => void;
}

// Create a custom Web3Provider that works with wagmi
export class WagmiWeb3Provider {
    private walletClient: any;
    private publicClient: any;

    constructor(walletClient: any, publicClient: any) {
        this.walletClient = walletClient;
        this.publicClient = publicClient;
    }

    async getAccounts(): Promise<string[]> {
        if (!this.walletClient.account) return [];
        return [this.walletClient.account.address];
    }

    async sendTransaction(transaction: any): Promise<string> {
        return await this.walletClient.sendTransaction(transaction);
    }

    async signMessage(message: string): Promise<string> {
        return await this.walletClient.signMessage({
            message: message,
            account: this.walletClient.account
        });
    }

    // Add other methods as needed by the 1inch SDK
}

// Create SDK instance with wagmi clients
export function createSDKWithWagmi(
    walletClient: any,
    publicClient: any,
    devPortalApiKey: string
) {
    // For now, we'll use a dummy private key for the SDK initialization
    // The actual signing will be handled by wagmi
    const web3Instance = new Web3('https://rpc.ankr.com/arbitrum'); // dummy RPC
    
    // We need to create a custom provider connector for wagmi
    // This is a simplified version - you might need to extend this based on SDK requirements
    const blockchainProvider = {
        connector: {
            getAccounts: async () => {
                if (!walletClient.account) return [];
                return [walletClient.account.address];
            },
            sendTransaction: async (transaction: any) => {
                return await walletClient.sendTransaction(transaction);
            },
            signMessage: async (message: string) => {
                return await walletClient.signMessage({
                    message: message,
                    account: walletClient.account
                });
            }
        },
        web3: web3Instance
    };

    return new SDK({
        url: 'https://api.1inch.dev/fusion-plus',
        authKey: devPortalApiKey,
        blockchainProvider: blockchainProvider as any
    });
}

// ENS utility functions for swap operations
export async function resolveRecipientAddress(recipientInput: string): Promise<string> {
    /**
     * Resolve recipient address - handles both ENS names and regular addresses
     * @param recipientInput - Either an ENS name (e.g., "vitalik.eth") or wallet address
     * @returns resolved wallet address
     */
    
    // Check if input looks like an ENS name
    if (recipientInput.endsWith('.eth')) {
        try {
            const resolvedAddress = await resolveENSName(recipientInput);
            if (resolvedAddress) {
                console.log(`✅ Resolved ${recipientInput} → ${resolvedAddress}`);
                return resolvedAddress;
            } else {
                throw new Error(`ENS name ${recipientInput} could not be resolved`);
            }
        } catch (error) {
            console.error('ENS resolution failed:', error);
            throw new Error(`Failed to resolve ENS name: ${recipientInput}`);
        }
    }
    
    // Return as-is if it's already an address
    return recipientInput;
}

export async function getDisplayNameForAddress(address: string): Promise<string> {
    /**
     * Get display name for an address - returns ENS name if available, otherwise formatted address
     * @param address - Wallet address
     * @returns ENS name or formatted address
     */
    
    try {
        const ensName = await getENSName(address);
        if (ensName) {
            console.log(`✅ Found ENS name for ${address}: ${ensName}`);
            return ensName;
        }
    } catch (error) {
        console.error('ENS lookup failed:', error);
    }
    
    // Return formatted address if no ENS
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
