import { SDK, HashLock, PrivateKeyProviderConnector, NetworkEnum } from "@1inch/cross-chain-sdk";
import Web3 from "web3";
import { randomBytes } from "crypto";
import { solidityPackedKeccak256 } from "ethers";

// TODO write formal bug for this function being inaccessible
function getRandomBytes32() {
  // for some reason the cross-chain-sdk expects a leading 0x and can't handle a 32 byte long hex string
  return '0x' + Buffer.from(randomBytes(32)).toString('hex');
}

export interface SwapParams {
  srcChainId: NetworkEnum;
  dstChainId: NetworkEnum;
  srcTokenAddress: string;
  dstTokenAddress: string;
  amount: string;
  walletAddress: string;
}

export interface SwapQuote {
  quote: any;
  orderHash?: string;
  status?: string;
}

export class SwapService {
  private sdk: SDK | null = null;
  private web3Instance: Web3 | null = null;

  constructor() {
    this.initializeSDK();
  }

  private async initializeSDK() {
    try {
      const nodeUrl = process.env.NEXT_PUBLIC_RPC_URL;
      const devPortalApiKey = process.env.NEXT_PUBLIC_DEV_PORTAL_KEY;
      const makerPrivateKey = process.env.NEXT_PUBLIC_WALLET_KEY;

      if (!nodeUrl || !devPortalApiKey || !makerPrivateKey) {
        console.warn("Missing required environment variables for swap service");
        return;
      }

      this.web3Instance = new Web3(nodeUrl);
      // Fix: Pass only the provider, not the full Web3 instance, to PrivateKeyProviderConnector
      const blockchainProvider = new PrivateKeyProviderConnector(makerPrivateKey, this.web3Instance.currentProvider as any);

      this.sdk = new SDK({
        url: 'https://api.1inch.dev/fusion-plus',
        authKey: devPortalApiKey,
        blockchainProvider
      });
    } catch (error) {
      console.error("Failed to initialize swap SDK:", error);
    }
  }

  async getQuote(params: SwapParams): Promise<any> {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    try {
      const quote = await this.sdk.getQuote({
        srcChainId: Number(params.srcChainId),
        dstChainId: Number(params.dstChainId),
        srcTokenAddress: params.srcTokenAddress,
        dstTokenAddress: params.dstTokenAddress,
        amount: params.amount,
        enableEstimate: true,
        walletAddress: params.walletAddress
      });

      return quote;
    } catch (error) {
      console.error("Error getting quote:", error);
      throw error;
    }
  }

  async placeOrder(quote: any, walletAddress: string): Promise<string> {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    try {
      const secretsCount = quote.getPreset().secretsCount;
      const secrets = Array.from({ length: secretsCount }).map(() => getRandomBytes32());
      const secretHashes = secrets.map(x => HashLock.hashSecret(x));

      const hashLock = secretsCount === 1
        ? HashLock.forSingleFill(secrets[0])
        : HashLock.forMultipleFills(
            secretHashes.map((secretHash, i) =>
              solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()])
            ) as any
          );

      const quoteResponse = await this.sdk.placeOrder(quote, {
        walletAddress,
        hashLock,
        secretHashes
      });

      return quoteResponse.orderHash;
    } catch (error) {
      console.error("Error placing order:", error);
      throw error;
    }
  }

  async getOrderStatus(orderHash: string): Promise<any> {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    try {
      return await this.sdk.getOrderStatus(orderHash);
    } catch (error) {
      console.error("Error getting order status:", error);
      throw error;
    }
  }

  async getReadyToAcceptSecretFills(orderHash: string): Promise<any> {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    try {
      return await this.sdk.getReadyToAcceptSecretFills(orderHash);
    } catch (error) {
      console.error("Error getting ready to accept secret fills:", error);
      throw error;
    }
  }

  async submitSecret(orderHash: string, secret: string): Promise<void> {
    if (!this.sdk) {
      throw new Error("SDK not initialized");
    }

    try {
      await this.sdk.submitSecret(orderHash, secret);
    } catch (error) {
      console.error("Error submitting secret:", error);
      throw error;
    }
  }
}

// Singleton instance
export const swapService = new SwapService();
