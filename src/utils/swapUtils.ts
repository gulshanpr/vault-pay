import { SDK, HashLock, NetworkEnum } from "@1inch/cross-chain-sdk";
import { randomBytes } from 'crypto';
import { solidityPackedKeccak256 } from 'ethers';
import Web3 from "web3";

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
