import { useState, useCallback, useEffect } from 'react';
import { useAccount, useWalletClient, usePublicClient, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { arbitrum, base } from 'viem/chains';
import { formatEther } from 'viem';
import { HashLock } from "@1inch/cross-chain-sdk";
import { solidityPackedKeccak256 } from 'ethers';
import {
    getRandomBytes32,
    approveABI,
    AGGREGATION_ROUTER_V6,
    TOKEN_ADDRESSES,
    CHAIN_TO_NETWORK_ENUM,
    createSDKWithWagmi,
    SwapParams,
    SwapCallbacks
} from './swapUtils';

export interface UseSwapReturn {
    isLoading: boolean;
    error: string | null;
    executeSwap: (params: SwapParams, callbacks?: SwapCallbacks) => Promise<void>;
    approveToken: (tokenAddress: string, chainId: number) => Promise<void>;
    isApproving: boolean;
    approvalHash: string | null;
    isApprovalConfirmed: boolean;
}

export function useSwap(): UseSwapReturn {
    const { address, chainId } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const { switchChain } = useSwitchChain();
    
    const [isLoading, setIsLoading] = useState(false);
    const [isApproving, setIsApproving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [approvalHash, setApprovalHash] = useState<string | null>(null);

    const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract();
    const { isLoading: isConfirming, isSuccess: isApprovalConfirmed, error: receiptError } = useWaitForTransactionReceipt({
        hash,
    });

    // Update approval hash when transaction is submitted
    useEffect(() => {
        if (hash) {
            setApprovalHash(hash);
            console.log("Approval transaction hash:", hash);
        }
    }, [hash]);

    // Reset approving state when transaction is confirmed or fails
    useEffect(() => {
        if (isApprovalConfirmed) {
            setIsApproving(false);
            console.log("Approval confirmed!");
        }
    }, [isApprovalConfirmed]);

    // Handle write errors
    useEffect(() => {
        if (writeError) {
            console.error("Write contract error:", writeError);
            setError(writeError.message || "Transaction failed");
            setIsApproving(false);
        }
    }, [writeError]);

    // Handle receipt errors
    useEffect(() => {
        if (receiptError) {
            console.error("Transaction receipt error:", receiptError);
            setError(receiptError.message || "Transaction confirmation failed");
            setIsApproving(false);
        }
    }, [receiptError]);

    const approveToken = useCallback(async (tokenAddress: string, targetChainId: number) => {
        if (!walletClient || !address) {
            const errorMsg = 'Wallet not connected';
            setError(errorMsg);
            throw new Error(errorMsg);
        }

        console.log(`Starting approval process for token ${tokenAddress} on chain ${targetChainId}`);
        console.log(`Current chain: ${chainId}, Target chain: ${targetChainId}`);

        setIsApproving(true);
        setError(null);
        setApprovalHash(null);

        try {
            // Check if we need to switch chains
            if (chainId !== targetChainId) {
                console.log(`Switching from chain ${chainId} to ${targetChainId}`);
                try {
                    await switchChain({ chainId: targetChainId });
                    console.log(`Successfully switched to chain ${targetChainId}`);
                    // Give some time for the chain switch to complete
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (switchError: any) {
                    console.error("Chain switch failed:", switchError);
                    setError(`Failed to switch to chain ${targetChainId}: ${switchError.message}`);
                    setIsApproving(false);
                    throw switchError;
                }
            }

            console.log("Initiating approval transaction...");
            console.log("Token address:", tokenAddress);
            console.log("Spender address:", AGGREGATION_ROUTER_V6);
            console.log("Chain ID:", targetChainId);

            writeContract({
                address: tokenAddress as `0x${string}`,
                abi: approveABI,
                functionName: 'approve',
                args: [
                    AGGREGATION_ROUTER_V6,
                    BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
                ],
                chainId: targetChainId,
            });

            console.log("Approval transaction initiated successfully");
        } catch (err: any) {
            console.error("Error in approveToken:", err);
            setError(err.message || "Approval failed");
            setIsApproving(false);
            throw err;
        }
    }, [walletClient, address, writeContract, chainId, switchChain]);

    const executeSwap = useCallback(async (params: SwapParams, callbacks?: SwapCallbacks) => {
        if (!walletClient || !publicClient || !address) {
            const errorMsg = 'Wallet not connected';
            setError(errorMsg);
            callbacks?.onError?.(new Error(errorMsg));
            return;
        }

        const devPortalApiKey = process.env.NEXT_PUBLIC_DEV_PORTAL_KEY;
        if (!devPortalApiKey) {
            const errorMsg = 'Dev portal API key not configured';
            setError(errorMsg);
            callbacks?.onError?.(new Error(errorMsg));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let { srcChainId, dstChainId, srcTokenAddress, dstTokenAddress, amount, invert = false } = params;

            // Handle invert logic
            if (invert) {
                [srcChainId, dstChainId] = [dstChainId, srcChainId];
                [srcTokenAddress, dstTokenAddress] = [dstTokenAddress, srcTokenAddress];
            }

            // Check ETH balance
            const balance = await publicClient.getBalance({ address });
            const ethBalance = parseFloat(formatEther(balance));
            console.log(`ETH balance on chain ${srcChainId}:`, ethBalance);

            // Convert chain IDs to NetworkEnum
            const srcNetworkId = CHAIN_TO_NETWORK_ENUM[srcChainId as keyof typeof CHAIN_TO_NETWORK_ENUM];
            const dstNetworkId = CHAIN_TO_NETWORK_ENUM[dstChainId as keyof typeof CHAIN_TO_NETWORK_ENUM];

            if (!srcNetworkId || !dstNetworkId) {
                throw new Error(`Unsupported chain ID: src=${srcChainId}, dst=${dstChainId}`);
            }

            // Create SDK instance
            const sdk = createSDKWithWagmi(walletClient, publicClient, devPortalApiKey);

            const quoteParams = {
                srcChainId: srcNetworkId,
                dstChainId: dstNetworkId,
                srcTokenAddress,
                dstTokenAddress,
                amount,
                enableEstimate: true,
                walletAddress: address
            };

            console.log('Getting quote with params:', quoteParams);

            // Get quote
            const quote = await sdk.getQuote(quoteParams);
            console.log("Received Fusion+ quote from 1inch API");
            callbacks?.onQuoteReceived?.(quote);

            const secretsCount = quote.getPreset().secretsCount;
            const secrets = Array.from({ length: secretsCount }).map(() => getRandomBytes32());
            const secretHashes = secrets.map(x => HashLock.hashSecret(x));

            const hashLock = secretsCount === 1
                ? HashLock.forSingleFill(secrets[0])
                : HashLock.forMultipleFills(
                    secretHashes.map((secretHash, i) =>
                        solidityPackedKeccak256(['uint64', 'bytes32'], [i, secretHash.toString()])
                    )
                );

            // Place order
            const quoteResponse = await sdk.placeOrder(quote, {
                walletAddress: address,
                hashLock,
                secretHashes
            });

            const orderHash = quoteResponse.orderHash;
            console.log(`Order successfully placed: ${orderHash}`);
            callbacks?.onOrderPlaced?.(orderHash);

            // Poll for order status
            const intervalId = setInterval(async () => {
                try {
                    console.log(`Polling for fills until order status is set to "executed"...`);
                    
                    const order = await sdk.getOrderStatus(orderHash);
                    if (order.status === 'executed') {
                        console.log(`Order is complete. Exiting.`);
                        clearInterval(intervalId);
                        callbacks?.onOrderComplete?.();
                        setIsLoading(false);
                        return;
                    }

                    const fillsObject = await sdk.getReadyToAcceptSecretFills(orderHash);
                    if (fillsObject.fills.length > 0) {
                        for (const fill of fillsObject.fills) {
                            try {
                                await sdk.submitSecret(orderHash, secrets[fill.idx]);
                                console.log(`Fill order found! Secret submitted: ${JSON.stringify(secretHashes[fill.idx], null, 2)}`);
                                callbacks?.onFillFound?.(fill);
                            } catch (error: any) {
                                console.error(`Error submitting secret: ${JSON.stringify(error, null, 2)}`);
                            }
                        }
                    }
                } catch (error: any) {
                    console.error('Error in polling:', error);
                    if (error.response?.status !== 404) { // 404 is expected when no fills are ready
                        callbacks?.onError?.(error);
                    }
                }
            }, 5000);

            // Clean up interval after 10 minutes to prevent infinite polling
            setTimeout(() => {
                clearInterval(intervalId);
                if (isLoading) {
                    setIsLoading(false);
                    console.log('Polling timeout reached');
                }
            }, 10 * 60 * 1000);

        } catch (err: any) {
            console.error('Error in executeSwap:', err);
            setError(err.message);
            callbacks?.onError?.(err);
            setIsLoading(false);
        }
    }, [walletClient, publicClient, address, isLoading]);

    return {
        isLoading,
        error,
        executeSwap,
        approveToken,
        isApproving: isApproving || isWritePending || isConfirming,
        approvalHash,
        isApprovalConfirmed,
    };
}
