import { SDK, HashLock, NetworkEnum } from "@1inch/cross-chain-sdk";
import { randomBytes } from "crypto";
import { solidityPackedKeccak256 } from "ethers";
import {
  SupportedCombination,
  getBestTargetCombination,
  SUPPORTED_CHAINS,
} from "@/config/supportedCombinations";
import { Token } from "@/lib/tokenService";

// Utility function to generate random bytes32
export function getRandomBytes32(): string {
  return "0x" + Buffer.from(randomBytes(32)).toString("hex");
}

// ERC20 approve ABI
export const approveABI = [
  {
    constant: false,
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// 1inch Aggregation Router v6 address
export const AGGREGATION_ROUTER_V6 =
  "0x111111125421ca6dc452d289314280a0f8842a65";

// Chain mappings for 1inch
export const CHAIN_TO_NETWORK_ENUM: Record<number, NetworkEnum> = {
  [SUPPORTED_CHAINS.ARBITRUM]: NetworkEnum.ARBITRUM,
  [SUPPORTED_CHAINS.BASE]: NetworkEnum.COINBASE,
  // Add more chains as 1inch supports them
} as const;

export interface SwapParams {
  srcChainId: number;
  dstChainId: number;
  srcTokenAddress: string;
  dstTokenAddress: string;
  amount: string;
  walletAddress: string;
}

export interface SwapCallbacks {
  onQuoteReceived?: (quote: any) => void;
  onOrderPlaced?: (orderHash: string) => void;
  onFillFound?: (fill: any) => void;
  onOrderComplete?: () => void;
  onError?: (error: any) => void;
}

export interface VaultSwapParams {
  fromChainId: number;
  fromToken: Token;
  toChainId: number;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
}

export class VaultSwapService {
  private devPortalApiKey: string;

  constructor(devPortalApiKey: string) {
    this.devPortalApiKey = devPortalApiKey;
  }

  /**
   * Creates SDK instance compatible with Wagmi/Privy
   */
  private createSDK(walletClient: any, publicClient: any): SDK {
    // Create a Web3 provider wrapper for the SDK
    const web3Provider = {
      send: async (method: string, params: any[]) => {
        try {
          switch (method) {
            case "eth_sendTransaction":
              const hash = await walletClient.sendTransaction(params[0]);
              return hash;
            case "eth_call":
              return await publicClient.call({
                to: params[0].to,
                data: params[0].data,
              });
            case "eth_getBalance":
              return await publicClient.getBalance({ address: params[0] });
            case "eth_getTransactionCount":
              return await publicClient.getTransactionCount({
                address: params[0],
              });
            case "eth_estimateGas":
              return await publicClient.estimateGas(params[0]);
            case "eth_gasPrice":
              return await publicClient.getGasPrice();
            case "eth_chainId":
              return `0x${publicClient.chain.id.toString(16)}`;
            default:
              throw new Error(`Unsupported method: ${method}`);
          }
        } catch (error) {
          console.error(
            `Error in web3Provider.send for method ${method}:`,
            error
          );
          throw error;
        }
      },
      signTypedData: async (walletAddress: string, typedData: any) => {
        return await walletClient.signTypedData({
          account: walletAddress as `0x${string}`,
          ...typedData,
        });
      },
      ethCall: async (contractAddress: string, callData: string) => {
        return await publicClient.call({
          to: contractAddress as `0x${string}`,
          data: callData as `0x${string}`,
        });
      },
    };

    return new SDK({
      url: "https://api.1inch.dev/fusion-plus",
      authKey: this.devPortalApiKey,
      blockchainProvider: web3Provider,
    });
  }

  /**
   * Execute swap from any token to supported vault token
   */
  async executeVaultSwap(
    params: VaultSwapParams,
    walletClient: any,
    publicClient: any,
    callbacks?: SwapCallbacks
  ): Promise<void> {
    const {
      fromChainId,
      fromToken,
      toChainId,
      toTokenAddress,
      amount,
      walletAddress,
    } = params;

    // Convert chain IDs to 1inch NetworkEnum
    const srcNetworkId = CHAIN_TO_NETWORK_ENUM[fromChainId];
    const dstNetworkId = CHAIN_TO_NETWORK_ENUM[toChainId];

    if (!srcNetworkId || !dstNetworkId) {
      throw new Error(
        `Unsupported chain for swapping: src=${fromChainId}, dst=${toChainId}`
      );
    }

    const sdk = this.createSDK(walletClient, publicClient);

    const swapParams: SwapParams = {
      srcChainId: srcNetworkId,
      dstChainId: dstNetworkId,
      srcTokenAddress: fromToken.address,
      dstTokenAddress: toTokenAddress,
      amount,
      walletAddress,
    };

    console.log("Executing vault swap with params:", swapParams);

    try {
      // Get quote
      const quote = await sdk.getQuote({
        srcChainId: swapParams.srcChainId,
        dstChainId: swapParams.dstChainId,
        srcTokenAddress: swapParams.srcTokenAddress,
        dstTokenAddress: swapParams.dstTokenAddress,
        amount: swapParams.amount,
        enableEstimate: true,
        walletAddress: swapParams.walletAddress,
      });

      console.log("Received Fusion+ quote from 1inch API");
      callbacks?.onQuoteReceived?.(quote);

      // Generate secrets and hash locks
      const secretsCount = quote.getPreset().secretsCount;
      const secrets = Array.from({ length: secretsCount }).map(() =>
        getRandomBytes32()
      );
      const secretHashes = secrets.map((x) => HashLock.hashSecret(x));

      const hashLock =
        secretsCount === 1
          ? HashLock.forSingleFill(secrets[0])
          : HashLock.forMultipleFills(
              HashLock.getMerkleLeavesFromSecretHashes(secretHashes)
            );

      // Place order
      const quoteResponse = await sdk.placeOrder(quote, {
        walletAddress: swapParams.walletAddress,
        hashLock,
        secretHashes,
      });

      const orderHash = quoteResponse.orderHash;
      console.log(`Order successfully placed: ${orderHash}`);
      callbacks?.onOrderPlaced?.(orderHash);

      // Monitor order status
      await this.monitorOrderStatus(
        sdk,
        orderHash,
        secrets,
        secretHashes,
        callbacks
      );
    } catch (error) {
      console.error("Error in executeVaultSwap:", error);
      callbacks?.onError?.(error);
      throw error;
    }
  }

  /**
   * Monitor order status and submit secrets when fills are ready
   */
  private async monitorOrderStatus(
    sdk: SDK,
    orderHash: string,
    secrets: string[],
    secretHashes: any[],
    callbacks?: SwapCallbacks
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        try {
          console.log(
            `Polling for fills until order status is set to "executed"...`
          );

          const order = await sdk.getOrderStatus(orderHash);
          if (order.status === "executed") {
            console.log(`Order is complete. Exiting.`);
            clearInterval(intervalId);
            callbacks?.onOrderComplete?.();
            resolve();
            return;
          }

          const fillsObject = await sdk.getReadyToAcceptSecretFills(orderHash);
          if (fillsObject.fills.length > 0) {
            for (const fill of fillsObject.fills) {
              try {
                await sdk.submitSecret(orderHash, secrets[fill.idx]);
                console.log(
                  `Fill order found! Secret submitted: ${JSON.stringify(
                    secretHashes[fill.idx],
                    null,
                    2
                  )}`
                );
                callbacks?.onFillFound?.(fill);
              } catch (error: any) {
                console.error(
                  `Error submitting secret: ${JSON.stringify(error, null, 2)}`
                );
              }
            }
          }
        } catch (error: any) {
          console.error("Error in polling:", error);
          if (error.response?.status !== 404) {
            // 404 is expected when no fills are ready
            callbacks?.onError?.(error);
          }
        }
      }, 5000);

      // Clean up interval after 10 minutes to prevent infinite polling
      setTimeout(() => {
        clearInterval(intervalId);
        reject(new Error("Polling timeout reached"));
      }, 10 * 60 * 1000);
    });
  }

  /**
   * Approve token for spending by 1inch router
   */
  async approveToken(
    tokenAddress: string,
    chainId: number,
    walletClient: any,
    publicClient: any
  ): Promise<string> {
    console.log(`Approving token ${tokenAddress} on chain ${chainId}`);

    const hash = await walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: approveABI,
      functionName: "approve",
      args: [
        AGGREGATION_ROUTER_V6,
        BigInt(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        ),
      ],
      chainId,
    });

    console.log("Approval transaction hash:", hash);

    // Wait for approval confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("Approval confirmed in block:", receipt.blockNumber);

    return hash;
  }

  /**
   * Get the best route for swapping to a supported vault token
   */
  getSwapRoute(
    fromChainId: number,
    fromTokenAddress: string
  ): {
    needsSwap: boolean;
    target?: SupportedCombination;
    message?: string;
  } {
    // Check if already supported
    const isSupported = this.isCombinationSupported(
      fromChainId,
      fromTokenAddress
    );

    if (isSupported) {
      return { needsSwap: false };
    }

    // Find best target
    const target = getBestTargetCombination(fromChainId);
    const targetChainName = this.getChainName(target.chainId);
    const sourceChainName = this.getChainName(fromChainId);

    let message: string;
    if (target.chainId === fromChainId) {
      message = `Token not supported. Will swap to ${target.symbol} on ${targetChainName}.`;
    } else {
      message = `Token on ${sourceChainName} not supported. Will swap to ${target.symbol} on ${targetChainName}.`;
    }

    return {
      needsSwap: true,
      target,
      message,
    };
  }

  private isCombinationSupported(
    chainId: number,
    tokenAddress: string
  ): boolean {
    // Import this from your supportedCombinations file
    const {
      isCombinationSupported,
    } = require("@/config/supportedCombinations");
    return isCombinationSupported(chainId, tokenAddress);
  }

  private getChainName(chainId: number): string {
    switch (chainId) {
      case SUPPORTED_CHAINS.BASE:
        return "Base";
      case SUPPORTED_CHAINS.ARBITRUM:
        return "Arbitrum";
      case SUPPORTED_CHAINS.UNICHAIN:
        return "Unichain";
      default:
        return `Chain ${chainId}`;
    }
  }
}

// Export a singleton instance
export const vaultSwapService = new VaultSwapService(
  process.env.NEXT_PUBLIC_DEV_PORTAL_KEY || ""
);
