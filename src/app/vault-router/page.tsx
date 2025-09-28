"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { VaultTokenRouter } from "@/components/VaultTokenRouter";
import { Token } from "@/lib/tokenService";
import {
  getContractAddress,
  vaultAdapter,
  eulerVaultAdapter,
  merchantRegistry,
} from "@/config/abi";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
  usePublicClient,
} from "wagmi";
import { useState, useEffect } from "react";
import { parseUnits, erc20Abi } from "viem";

export default function VaultRouterPage() {
  const { address } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();
  const publicClient = usePublicClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("");

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleRoute = async (
    chainId: number,
    fromToken: Token,
    toTokenAddress: string,
    amount: string,
    needsSwap: boolean,
    toChainId?: number
  ) => {
    console.log("Routing tokens:", {
      chainId,
      fromToken,
      toTokenAddress,
      amount,
      needsSwap,
      toChainId: toChainId || chainId,
    });

    if (needsSwap) {
      setError("Swap functionality not implemented yet");
    } else {
      await depositToVault(chainId, fromToken, toTokenAddress, amount);
    }
  };

  const depositToVault = async (
    chainId: number,
    fromToken: Token,
    tokenAddress: string,
    amount: string
  ) => {
    if (!address || !publicClient) {
      setError("Please connect your wallet");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Switch to the correct chain if needed
      if (currentChainId !== chainId) {
        setCurrentStep("Switching chains...");
        await switchChain({ chainId });
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Get contract addresses
      const vaultAdapterAddress = getContractAddress(chainId, "VAULT_ADAPTER");
      const merchantRegistryAddress = getContractAddress(
        chainId,
        "MERCHANT_REGISTRY"
      );

      console.log("Contract addresses:", {
        vaultAdapter: vaultAdapterAddress,
        merchantRegistry: merchantRegistryAddress,
      });

      // Convert amount to proper units
      const amountInUnits = parseUnits(amount, fromToken.decimals || 6);

      // Step 1: Check if merchant is registered
      setCurrentStep("Checking merchant registration...");

      try {
        const merchantConfig = await publicClient.readContract({
          address: merchantRegistryAddress as `0x${string}`,
          abi: merchantRegistry,
          functionName: "getConfig",
          args: [address],
        });

        console.log("Merchant config:", merchantConfig);

        // If merchant doesn't exist, we need to register first
        if (!merchantConfig || !merchantConfig.exists) {
          setError(
            "You need to register as a merchant first. Please go to the merchant setup page."
          );
          setIsProcessing(false);
          return;
        }
      } catch (configError) {
        console.error("Error checking merchant config:", configError);
        setError(
          "You need to register as a merchant first. Please go to the merchant setup page."
        );
        setIsProcessing(false);
        return;
      }

      // Step 2: Check token allowance
      setCurrentStep("Checking token allowance...");

      const allowance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, vaultAdapterAddress as `0x${string}`],
      });

      console.log("Current allowance:", allowance.toString());
      console.log("Required amount:", amountInUnits.toString());

      // Step 3: Approve token if needed
      if (allowance < amountInUnits) {
        setCurrentStep("Approving token...");

        writeContract({
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [
            vaultAdapterAddress as `0x${string}`,
            amountInUnits, // Approve exact amount needed
          ],
          chainId,
          gas: BigInt(200000), // Increased gas for approval
        });

        // Wait for approval to complete before proceeding
        return; // The useEffect will handle the next step after approval
      }

      // Step 4: Call settle function
      await callSettleFunction(address, amountInUnits, chainId, tokenAddress);
    } catch (error: any) {
      console.error("Error depositing to vault:", error);
      setError(error.message || "Failed to deposit to vault");
      setIsProcessing(false);
      setCurrentStep("");
    }
  };

  // Update the callSettleFunction to use the correct adapter based on the vault type

  const callSettleFunction = async (
    merchantAddress: string,
    amountInUnits: bigint,
    chainId: number,
    tokenAddress: string
  ) => {
    setCurrentStep("Depositing to vault...");

    // Determine which vault and adapter to use based on token and chain
    let vaultAddress = "0x0000000000000000000000000000000000000000";
    let adapterAddress = "";
    let adapterAbi = vaultAdapter; // Default to Morpho adapter
    let vaultType = "morpho";

    if (
      chainId === 42161 &&
      tokenAddress.toLowerCase() ===
        "0xaf88d065e77c8cc2239327c5edb3a432268e5831"
    ) {
      // For USDC on Arbitrum, we have both Morpho and Euler options
      // Let's use Morpho vault for now since VaultAdapter is designed for Morpho
      vaultAddress = "0xa60643c90A542A95026C0F1dbdB0615fF42019Cf"; // Morpho USDC vault on Arbitrum
      adapterAddress = getContractAddress(chainId, "VAULT_ADAPTER");
      adapterAbi = vaultAdapter;
      vaultType = "morpho";

      // Alternative: Use Euler vault with EulerVaultAdapter
      // vaultAddress = "0x6aFB8d3F6D4A34e9cB2f217317f4dc8e05Aa673b"; // Euler USDC vault on Arbitrum
      // adapterAddress = getContractAddress(chainId, "EULER_VAULT_ADAPTER");
      // adapterAbi = eulerVaultAdapter;
      // vaultType = "euler";
    } else {
      // For other tokens, use the appropriate adapter
      adapterAddress = getContractAddress(chainId, "VAULT_ADAPTER");
      adapterAbi = vaultAdapter;
      vaultType = "morpho";
    }

    console.log("Using vault configuration:", {
      vaultType,
      adapterAddress,
      vaultAddress,
      merchant: merchantAddress,
      amount: amountInUnits.toString(),
    });

    try {
      // Estimate gas first
      if (publicClient) {
        try {
          const gasEstimate = await publicClient.estimateContractGas({
            address: adapterAddress as `0x${string}`,
            abi: adapterAbi,
            functionName: "settle",
            args: [
              merchantAddress as `0x${string}`,
              amountInUnits,
              vaultAddress as `0x${string}`,
              BigInt(0),
            ],
            account: merchantAddress as `0x${string}`,
          });

          console.log("Estimated gas:", gasEstimate.toString());

          // Use the estimated gas + 50% buffer for safety
          const gasLimit = (gasEstimate * BigInt(150)) / BigInt(100);

          // Call the settle function with estimated gas
          writeContract({
            address: adapterAddress as `0x${string}`,
            abi: adapterAbi,
            functionName: "settle",
            args: [
              merchantAddress as `0x${string}`,
              amountInUnits,
              vaultAddress as `0x${string}`,
              BigInt(0),
            ],
            chainId,
            gas: gasLimit,
          });
        } catch (estimateError) {
          console.error("Gas estimation failed:", estimateError);
          console.error("This might indicate a contract execution error");

          // Let's check what the actual error is
          setError(
            `Transaction would fail: ${estimateError.message || estimateError}`
          );
          setIsProcessing(false);
          setCurrentStep("");
          return;
        }
      }
    } catch (error) {
      console.error("Error in callSettleFunction:", error);
      throw error;
    }
  };

  // Handle transaction success/error
  useEffect(() => {
    if (isSuccess && hash) {
      if (currentStep === "Approving token...") {
        // Approval completed, now call settle
        setCurrentStep("Approval completed, now depositing...");
        // Re-trigger the deposit process
        setTimeout(async () => {
          if (address && publicClient) {
            // Get the last transaction details to continue with settle
            // For now, we'll need the user to click the button again
            setSuccess(
              "Token approved! Please click the deposit button again to complete the transaction."
            );
            setIsProcessing(false);
            setCurrentStep("");
          }
        }, 2000);
      } else {
        setSuccess(`Successfully deposited to vault! Transaction: ${hash}`);
        setIsProcessing(false);
        setCurrentStep("");
      }
    }
  }, [isSuccess, hash, currentStep, address, publicClient]);

  useEffect(() => {
    if (writeError) {
      setError(writeError.message || "Transaction failed");
      setIsProcessing(false);
      setCurrentStep("");
    }
  }, [writeError]);

  return (
    <DashboardLayout>
      <div className="p-6">
        <VaultTokenRouter onRoute={handleRoute} />

        {/* Chain Status */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-700">
            <strong>Current Chain:</strong> {currentChainId}
            {currentChainId === 8453 && " (Base)"}
            {currentChainId === 42161 && " (Arbitrum)"}
            {currentChainId === 1301 && " (Unichain)"}
          </div>
        </div>

        {/* Transaction Status */}
        {(isProcessing ||
          isPending ||
          isConfirming ||
          error ||
          success ||
          currentStep) && (
          <div className="mt-6 p-4 rounded-lg border">
            {currentStep && (
              <div className="text-blue-600 mb-2">
                <div className="font-medium">Current Step:</div>
                <div className="text-sm">{currentStep}</div>
              </div>
            )}

            {isProcessing && (
              <div className="text-blue-600">
                <div className="font-medium">Processing...</div>
                <div className="text-sm">Preparing transaction</div>
              </div>
            )}

            {isPending && (
              <div className="text-yellow-600">
                <div className="font-medium">Transaction Pending</div>
                <div className="text-sm">Please confirm in your wallet</div>
              </div>
            )}

            {isConfirming && hash && (
              <div className="text-blue-600">
                <div className="font-medium">Confirming Transaction</div>
                <div className="text-sm">
                  Hash: {hash.slice(0, 10)}...{hash.slice(-8)}
                </div>
              </div>
            )}

            {error && (
              <div className="text-red-600 bg-red-50 p-3 rounded">
                <div className="font-medium">Error</div>
                <div className="text-sm">{error}</div>
              </div>
            )}

            {success && (
              <div className="text-green-600 bg-green-50 p-3 rounded">
                <div className="font-medium">Success!</div>
                <div className="text-sm">{success}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
