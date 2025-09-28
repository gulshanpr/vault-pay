import { FusionSDK, NetworkEnum, PresetEnum } from "@1inch/fusion-sdk";
import { WalletClient, PublicClient } from "viem";

export interface FusionSwapParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
  network: NetworkEnum;
  permit?: string;
  takingFeeBps?: number;
  preset?: PresetEnum;
}

export interface FusionQuoteParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  permit?: string;
  takingFeeBps?: number;
}

export interface SwapCallbacks {
  onQuoteReceived?: (quote: any) => void;
  onOrderPlaced?: (orderHash: string) => void;
  onOrderComplete?: () => void;
  onError?: (error: any) => void;
}

// Custom HTTP provider for better error handling
class CustomHttpProvider {
  async get<T>(url: string): Promise<T> {
    try {
      console.log("Making GET request to:", url);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("GET response:", data);
      return data;
    } catch (error) {
      console.error("HTTP GET error:", error);
      throw error;
    }
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    try {
      console.log("Making POST request to:", url, "with data:", data);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("POST error response:", errorText);
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`
        );
      }

      const responseData = await response.json();
      console.log("POST response:", responseData);
      return responseData;
    } catch (error) {
      console.error("HTTP POST error:", error);
      throw error;
    }
  }
}

// Custom blockchain provider connector for Wagmi/Privy integration
class WagmiBlockchainProvider {
  constructor(
    private walletClient: WalletClient,
    private publicClient: PublicClient
  ) {}

  async signTypedData(walletAddress: string, typedData: any): Promise<string> {
    try {
      console.log("Signing typed data for address:", walletAddress);
      console.log("Typed data:", typedData);

      const signature = await this.walletClient.signTypedData({
        account: walletAddress as `0x${string}`,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });

      console.log("Signature created:", signature);
      return signature;
    } catch (error) {
      console.error("Error signing typed data:", error);
      throw new Error(
        `Failed to sign typed data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async ethCall(contractAddress: string, callData: string): Promise<string> {
    try {
      console.log(
        "Making eth call to:",
        contractAddress,
        "with data:",
        callData
      );

      const result = await this.publicClient.call({
        to: contractAddress as `0x${string}`,
        data: callData as `0x${string}`,
      });

      console.log("Eth call result:", result);
      return result.data || "0x";
    } catch (error) {
      console.error("Error in eth call:", error);
      throw new Error(
        `Eth call failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

export class FusionSwapService {
  private devPortalApiKey: string;
  private httpProvider: CustomHttpProvider;

  constructor(devPortalApiKey: string) {
    this.devPortalApiKey = devPortalApiKey;
    this.httpProvider = new CustomHttpProvider();

    if (!devPortalApiKey) {
      console.warn("No API key provided for Fusion SDK");
    }
  }

  /**
   * Validates if the network is supported by Fusion SDK
   */
  private validateNetwork(network: NetworkEnum): void {
    const supportedNetworks = [
      NetworkEnum.ETHEREUM,
      NetworkEnum.POLYGON,
      NetworkEnum.ARBITRUM,
      NetworkEnum.OPTIMISM,
      NetworkEnum.COINBASE, // Base
      NetworkEnum.BINANCE,
      NetworkEnum.AVALANCHE,
    ];

    if (!supportedNetworks.includes(network)) {
      throw new Error(`Network ${network} is not supported by Fusion SDK`);
    }
  }

  /**
   * Creates Fusion SDK instance with Wagmi/Privy integration
   */
  private createFusionSDK(
    network: NetworkEnum,
    walletClient?: WalletClient,
    publicClient?: PublicClient
  ): FusionSDK {
    try {
      this.validateNetwork(network);

      const config: any = {
        url: "https://api.1inch.dev/fusion",
        network,
        authKey: this.devPortalApiKey,
        httpProvider: this.httpProvider,
      };

      // Add blockchain provider if wallet clients are available
      if (walletClient && publicClient) {
        config.blockchainProvider = new WagmiBlockchainProvider(
          walletClient,
          publicClient
        );
      }

      console.log("Creating Fusion SDK with config:", {
        ...config,
        authKey: config.authKey ? "***PROVIDED***" : "***MISSING***",
      });

      return new FusionSDK(config);
    } catch (error) {
      console.error("Error creating Fusion SDK:", error);
      throw error;
    }
  }

  /**
   * Get quote for same-chain swap
   */
  async getQuote(
    params: FusionQuoteParams,
    network: NetworkEnum
  ): Promise<any> {
    try {
      console.log(
        "Getting Fusion quote with params:",
        params,
        "on network:",
        network
      );

      const sdk = this.createFusionSDK(network);

      // Validate token addresses
      if (!params.fromTokenAddress || !params.toTokenAddress) {
        throw new Error("Token addresses are required");
      }

      if (!params.amount || params.amount === "0") {
        throw new Error("Valid amount is required");
      }

      const quote = await sdk.getQuote({
        fromTokenAddress: params.fromTokenAddress,
        toTokenAddress: params.toTokenAddress,
        amount: params.amount,
        permit: params.permit,
        takingFeeBps: params.takingFeeBps,
      });

      console.log("Fusion quote received:", quote);
      return quote;
    } catch (error) {
      console.error("Error getting Fusion quote:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("Network Error") ||
          error.message.includes("fetch")
        ) {
          throw new Error(
            "Network connection failed. Please check your internet connection and try again."
          );
        }
        if (error.message.includes("401") || error.message.includes("403")) {
          throw new Error(
            "API authentication failed. Please check your API key."
          );
        }
        if (error.message.includes("404")) {
          throw new Error(
            "Fusion API endpoint not found. The service may be temporarily unavailable."
          );
        }
        if (error.message.includes("500")) {
          throw new Error("Fusion API server error. Please try again later.");
        }
      }

      throw error;
    }
  }

  /**
   * Execute same-chain swap using Fusion
   */
  async executeSwap(
    params: FusionSwapParams,
    walletClient: WalletClient,
    publicClient: PublicClient,
    callbacks?: SwapCallbacks
  ): Promise<void> {
    try {
      console.log("Executing Fusion swap with params:", params);

      const sdk = this.createFusionSDK(
        params.network,
        walletClient,
        publicClient
      );

      // Get quote first
      const quote = await this.getQuote(
        {
          fromTokenAddress: params.fromTokenAddress,
          toTokenAddress: params.toTokenAddress,
          amount: params.amount,
          permit: params.permit,
          takingFeeBps: params.takingFeeBps,
        },
        params.network
      );

      callbacks?.onQuoteReceived?.(quote);

      // Validate wallet address
      if (!params.walletAddress) {
        throw new Error("Wallet address is required");
      }

      console.log("Placing Fusion order...");

      // Place order
      const orderResult = await sdk.placeOrder({
        fromTokenAddress: params.fromTokenAddress,
        toTokenAddress: params.toTokenAddress,
        amount: params.amount,
        walletAddress: params.walletAddress,
        permit: params.permit,
        preset: params.preset || PresetEnum.medium,
        fee: params.takingFeeBps
          ? {
              takingFeeBps: params.takingFeeBps,
              takingFeeReceiver: params.walletAddress, // Use wallet as fee receiver
            }
          : undefined,
      });

      const orderHash =
        orderResult.orderHash || orderResult.hash || orderResult;
      console.log("Fusion order placed successfully:", orderHash);
      callbacks?.onOrderPlaced?.(orderHash);

      // For Fusion orders, they are typically filled automatically
      // We can monitor the order status if needed
      setTimeout(() => {
        callbacks?.onOrderComplete?.();
      }, 2000); // Give some time for the order to be processed
    } catch (error) {
      console.error("Error in Fusion swap:", error);

      let errorMessage = "Fusion swap failed";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      const enhancedError = new Error(errorMessage);
      callbacks?.onError?.(enhancedError);
      throw enhancedError;
    }
  }

  /**
   * Get active orders for a maker address
   */
  async getActiveOrders(
    network: NetworkEnum,
    address: string,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    try {
      console.log(
        "Getting active orders for address:",
        address,
        "on network:",
        network
      );

      const sdk = this.createFusionSDK(network);

      const orders = await sdk.getOrdersByMaker({
        address,
        page,
        limit,
      });

      console.log("Active orders retrieved:", orders);
      return orders;
    } catch (error) {
      console.error("Error getting active orders:", error);
      throw error;
    }
  }

  /**
   * Get all active orders
   */
  async getAllActiveOrders(
    network: NetworkEnum,
    page: number = 1,
    limit: number = 10
  ): Promise<any> {
    try {
      console.log("Getting all active orders on network:", network);

      const sdk = this.createFusionSDK(network);

      const orders = await sdk.getActiveOrders({ page, limit });

      console.log("All active orders retrieved:", orders);
      return orders;
    } catch (error) {
      console.error("Error getting all active orders:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const fusionSwapService = new FusionSwapService(
  process.env.NEXT_PUBLIC_DEV_PORTAL_KEY || ""
);
