"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, Loader2, Wallet } from "lucide-react";
import { SUPPORTED_CHAINS } from "@/utils/vaultConfig";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
  useSwitchChain,
  useChainId,
} from "wagmi";
import {
  merchantRegistry,
  protocolFeeAddress,
  getContractAddress,
} from "@/config/abi";

enum PayoutMode {
  USDC_ONLY = 0,
  SHARES_ONLY = 1,
  SPLIT = 2,
}

export interface MerchantFormData {
  merchantWallet: string;
  merchantPayout: string;
  payoutToken: string;
  payoutChainId: number;
  payoutMode: PayoutMode;
  splitBps: number;
  protocolFeeBps: number;
  feeRecipient: string;
}

export interface MerchantOnboardingFormProps {
  onSubmit?: (data: MerchantFormData) => void;
}

// Chain options for the dropdown
const CHAIN_OPTIONS = [
  { id: SUPPORTED_CHAINS.BASE, name: "Base", symbol: "BASE" },
  { id: SUPPORTED_CHAINS.ARBITRUM, name: "Arbitrum", symbol: "ARB" },
  { id: SUPPORTED_CHAINS.UNICHAIN, name: "Unichain", symbol: "UNI" },
];

// Common payout tokens (you should update these with actual addresses)
const PAYOUT_TOKENS = {
  [SUPPORTED_CHAINS.BASE]: [
    { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
    { symbol: "EURC", address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42" },
  ],
  [SUPPORTED_CHAINS.ARBITRUM]: [
    { symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
  ],
  [SUPPORTED_CHAINS.UNICHAIN]: [
    { symbol: "USDC", address: "0x078D782b760474a361dDA0AF3839290b0EF57AD6" },
    { symbol: "USDT", address: "0x9151434b16b9763660705744891fA906F660EcC5" },
  ],
};


export function MerchantOnboardingForm({
  onSubmit,
}: MerchantOnboardingFormProps) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { address: connectedAddress } = useAccount();
  const currentChainId = useChainId();
  const { switchChain } = useSwitchChain();

  // Get connected wallet address - prioritize Wagmi's connected address
  const walletAddress = connectedAddress || wallets[0]?.address || "";

  const [formData, setFormData] = useState<MerchantFormData>({
    merchantWallet: "",
    merchantPayout: "",
    payoutToken: "",
    payoutChainId: SUPPORTED_CHAINS.BASE,
    payoutMode: PayoutMode.USDC_ONLY,
    splitBps: 5000,
    protocolFeeBps: 0,
    feeRecipient: "0x0000000000000000000000000000000000000000",
  });

  // User-friendly percentage input (1-99 with decimal)
  const [splitPercentage, setSplitPercentage] = useState<string>("50.0");
  const [protocolFeePercentage, setProtocolFeePercentage] =
    useState<string>("0");

  // Wagmi hooks
  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending,
  } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Initialize form with connected wallet address
  useEffect(() => {
    if (walletAddress && ready && authenticated) {
      setFormData((prev) => ({
        ...prev,
        merchantWallet: walletAddress,
        merchantPayout: prev.merchantPayout || walletAddress,
        feeRecipient:
          prev.feeRecipient === "0x0000000000000000000000000000000000000000"
            ? walletAddress
            : prev.feeRecipient,
      }));
    }
  }, [walletAddress, ready, authenticated]);

  // Convert percentage to basis points whenever splitPercentage changes
  useEffect(() => {
    const percentage = parseFloat(splitPercentage);
    if (!isNaN(percentage) && percentage >= 1 && percentage <= 99) {
      const bps = Math.round(percentage * 100); // Convert to basis points
      setFormData((prev) => ({ ...prev, splitBps: bps }));
    }
  }, [splitPercentage]);

  // Convert protocol fee percentage to basis points
  useEffect(() => {
    const percentage = parseFloat(protocolFeePercentage);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 10) {
      const bps = Math.round(percentage * 100); // Convert to basis points
      setFormData((prev) => ({ ...prev, protocolFeeBps: bps }));
    }
  }, [protocolFeePercentage]);

  // Set default payout token when chain changes
  useEffect(() => {
    const availableTokens =
      PAYOUT_TOKENS[formData.payoutChainId as keyof typeof PAYOUT_TOKENS] || [];
    if (availableTokens.length > 0 && !formData.payoutToken) {
      setFormData((prev) => ({
        ...prev,
        payoutToken: availableTokens[0].address,
      }));
    }
  }, [formData.payoutChainId, formData.payoutToken]);

  // Auto-switch chain when payout chain changes
  useEffect(() => {
    if (formData.payoutChainId && currentChainId !== formData.payoutChainId) {
      switchChain({ chainId: formData.payoutChainId }).catch((error) => {
        console.error("Failed to switch chain:", error);
      });
    }
  }, [formData.payoutChainId, currentChainId, switchChain]);

  const [errors, setErrors] = useState<
    Partial<
      Record<
        keyof MerchantFormData | "splitPercentage" | "protocolFeePercentage",
        string
      >
    >
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<
      Record<
        keyof MerchantFormData | "splitPercentage" | "protocolFeePercentage",
        string
      >
    > = {};

    if (!formData.merchantWallet) {
      newErrors.merchantWallet = "Merchant wallet address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.merchantWallet)) {
      newErrors.merchantWallet = "Invalid Ethereum address";
    }

    if (!formData.merchantPayout) {
      newErrors.merchantPayout = "Merchant payout address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.merchantPayout)) {
      newErrors.merchantPayout = "Invalid Ethereum address";
    }

    if (!formData.payoutToken) {
      newErrors.payoutToken = "Please select a payout token";
    }

    if (!formData.payoutChainId) {
      newErrors.payoutChainId = "Please select a payout chain";
    }

    if (formData.payoutMode === PayoutMode.SPLIT) {
      const percentage = parseFloat(splitPercentage);
      if (isNaN(percentage) || percentage < 1 || percentage > 99) {
        newErrors.splitPercentage =
          "Split percentage must be between 1.0 and 99.0";
      }
      if (
        splitPercentage.includes(".") &&
        splitPercentage.split(".")[1].length > 1
      ) {
        newErrors.splitPercentage = "Only one decimal place allowed";
      }
    }

    const protocolFee = parseFloat(protocolFeePercentage);
    if (isNaN(protocolFee) || protocolFee < 0 || protocolFee > 10) {
      newErrors.protocolFeePercentage =
        "Protocol fee must be between 0 and 10%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) {
      return;
    }

    // Check if we're on the correct network
    if (currentChainId !== formData.payoutChainId) {
      setSubmitError(
        `Please wait for network switch to complete. Current: ${currentChainId}, Required: ${formData.payoutChainId}`
      );
      return;
    }

    try {
      // Call the onSubmit prop if provided
      await onSubmit?.(formData);

      // Get the correct contract address for the selected chain
      const merchantRegistryAddress = getContractAddress(
        formData.payoutChainId,
        "MERCHANT_REGISTRY"
      );

      // Execute the smart contract call
      writeContract({
        address: merchantRegistryAddress as `0x${string}`,
        abi: merchantRegistry,
        functionName: "registerMerchant",
        args: [
          formData.merchantWallet as `0x${string}`,
          formData.payoutToken as `0x${string}`,
          formData.payoutMode,
          formData.splitBps,
          formData.protocolFeeBps,
          formData.feeRecipient as `0x${string}`,
        ],
        chainId: formData.payoutChainId,
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      const message =
        error instanceof Error ? error.message : "Failed to register merchant.";
      setSubmitError(message);
    }
  };

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setSubmitSuccess("Merchant registered successfully on blockchain!");
    }
  }, [isSuccess]);

  // Handle transaction error
  useEffect(() => {
    if (writeError) {
      setSubmitError(writeError.message || "Transaction failed");
    }
  }, [writeError]);

  const handleInputChange = (
    field: keyof MerchantFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError) setSubmitError(null);
    if (submitSuccess) setSubmitSuccess(null);
  };

  const handleSplitPercentageChange = (value: string) => {
    const regex = /^\d{1,2}(\.\d?)?$/;
    if (value === "" || regex.test(value)) {
      setSplitPercentage(value);
      if (errors.splitPercentage) {
        setErrors((prev) => ({ ...prev, splitPercentage: undefined }));
      }
      if (submitError) setSubmitError(null);
      if (submitSuccess) setSubmitSuccess(null);
    }
  };

  const handleProtocolFeePercentageChange = (value: string) => {
    const regex = /^\d{1,2}(\.\d?)?$/;
    if (value === "" || regex.test(value)) {
      setProtocolFeePercentage(value);
      if (errors.protocolFeePercentage) {
        setErrors((prev) => ({ ...prev, protocolFeePercentage: undefined }));
      }
      if (submitError) setSubmitError(null);
      if (submitSuccess) setSubmitSuccess(null);
    }
  };

  // Get selected chain name for display
  const selectedChain = CHAIN_OPTIONS.find(
    (chain) => chain.id === formData.payoutChainId
  );

  // Get available tokens for selected chain
  const availableTokens =
    PAYOUT_TOKENS[formData.payoutChainId as keyof typeof PAYOUT_TOKENS] || [];

  // Calculate the cash percentage for display
  const cashPercentage = splitPercentage
    ? 100 - parseFloat(splitPercentage)
    : 50;

  const isLoading = isPending || isConfirming;
  const isWrongChain = currentChainId !== formData.payoutChainId;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Merchant Onboarding
          </CardTitle>
          <CardDescription>
            Configure your merchant settings for yield-bearing payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Network Status */}
          {isWrongChain && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Switching Network
                </span>
              </div>
              <p className="text-sm text-blue-700">
                Switching to {selectedChain?.name} network for registration...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Merchant Wallet Address */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="merchantWallet">Merchant Wallet Address</Label>
                {walletAddress && (
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    <Wallet className="w-3 h-3" />
                    Connected Wallet
                  </div>
                )}
              </div>
              <Input
                id="merchantWallet"
                type="text"
                placeholder={
                  walletAddress ? "Using connected wallet address" : "0x..."
                }
                value={formData.merchantWallet}
                onChange={(e) =>
                  handleInputChange("merchantWallet", e.target.value)
                }
                className={`${errors.merchantWallet ? "border-red-500" : ""} ${
                  walletAddress
                    ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                    : ""
                }`}
                readOnly={!!walletAddress}
              />
              {errors.merchantWallet && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.merchantWallet}
                </div>
              )}
            </div>

            {/* Merchant Payout Address */}
            <div className="space-y-2">
              <Label htmlFor="merchantPayout">Merchant Payout Address</Label>
              <Input
                id="merchantPayout"
                type="text"
                placeholder="0x..."
                value={formData.merchantPayout}
                onChange={(e) =>
                  handleInputChange("merchantPayout", e.target.value)
                }
                className={errors.merchantPayout ? "border-red-500" : ""}
              />
              {errors.merchantPayout && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.merchantPayout}
                </div>
              )}
            </div>

            {/* Payout Chain Selection */}
            <div className="space-y-2">
              <Label htmlFor="payoutChain">Payout Chain</Label>
              <Select
                value={formData.payoutChainId.toString()}
                onValueChange={(value) => {
                  handleInputChange("payoutChainId", parseInt(value));
                  // Reset payout token when chain changes
                  setFormData((prev) => ({ ...prev, payoutToken: "" }));
                }}
              >
                <SelectTrigger
                  className={errors.payoutChainId ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select payout chain" />
                </SelectTrigger>
                <SelectContent>
                  {CHAIN_OPTIONS.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{chain.name}</span>
                        <span className="text-xs text-gray-500">
                          ({chain.symbol})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payoutChainId && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.payoutChainId}
                </div>
              )}
            </div>

            {/* Payout Token Selection */}
            <div className="space-y-2">
              <Label htmlFor="payoutToken">Payout Token</Label>
              <Select
                value={formData.payoutToken}
                onValueChange={(value) =>
                  handleInputChange("payoutToken", value)
                }
              >
                <SelectTrigger
                  className={errors.payoutToken ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select payout token" />
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-xs text-gray-500">
                          {token.address.slice(0, 6)}...
                          {token.address.slice(-4)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payoutToken && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.payoutToken}
                </div>
              )}
            </div>

            {/* Payout Mode */}
            <div className="space-y-2">
              <Label htmlFor="payoutMode">Payout Mode</Label>
              <Select
                value={formData.payoutMode.toString()}
                onValueChange={(value) =>
                  handleInputChange("payoutMode", parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PayoutMode.USDC_ONLY.toString()}>
                    USDC Only - Immediate stablecoin settlement
                  </SelectItem>
                  <SelectItem value={PayoutMode.SHARES_ONLY.toString()}>
                    Shares Only - Yield-bearing vault shares
                  </SelectItem>
                  <SelectItem value={PayoutMode.SPLIT.toString()}>
                    Split - Combination of both
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Split Percentage (only show for SPLIT mode) */}
            {formData.payoutMode === PayoutMode.SPLIT && (
              <div className="space-y-2">
                <Label htmlFor="splitPercentage">
                  Split Percentage (Shares %)
                </Label>
                <div className="relative">
                  <Input
                    id="splitPercentage"
                    type="text"
                    value={splitPercentage}
                    onChange={(e) =>
                      handleSplitPercentageChange(e.target.value)
                    }
                    className={errors.splitPercentage ? "border-red-500" : ""}
                    placeholder="50.0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">%</span>
                  </div>
                </div>
                {errors.splitPercentage && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.splitPercentage}
                  </div>
                )}
                <div className="text-sm text-slate-600">
                  {splitPercentage}% vault shares, {cashPercentage}% cash on{" "}
                  {selectedChain?.name}
                </div>
              </div>
            )}

            {/* Registration Summary */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Registration Summary</h4>
              <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <p>
                  <strong>Merchant Wallet:</strong>{" "}
                  {formData.merchantWallet
                    ? `${formData.merchantWallet.slice(
                        0,
                        6
                      )}...${formData.merchantWallet.slice(-4)}`
                    : "Not set"}
                </p>
                <p>
                  <strong>Payout Address:</strong>{" "}
                  {formData.merchantPayout
                    ? `${formData.merchantPayout.slice(
                        0,
                        6
                      )}...${formData.merchantPayout.slice(-4)}`
                    : "Not set"}
                </p>
                <p>
                  <strong>Chain:</strong> {selectedChain?.name} (
                  {selectedChain?.symbol})
                </p>
                <p>
                  <strong>Token:</strong>{" "}
                  {availableTokens.find(
                    (t) => t.address === formData.payoutToken
                  )?.symbol || "Not selected"}
                </p>
                <p>
                  <strong>Mode:</strong>{" "}
                  {formData.payoutMode === PayoutMode.USDC_ONLY
                    ? "USDC Only"
                    : formData.payoutMode === PayoutMode.SHARES_ONLY
                    ? "Vault Shares Only"
                    : `Split (${splitPercentage}% shares, ${cashPercentage}% USDC)`}
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || isWrongChain}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Transaction...
                </>
              ) : isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming Transaction...
                </>
              ) : isWrongChain ? (
                `Switching to ${selectedChain?.name}...`
              ) : (
                "Register Merchant"
              )}
            </Button>

            {/* Transaction Hash */}
            {hash && (
              <div className="text-sm text-blue-600">
                <p>
                  Transaction submitted: {hash.slice(0, 10)}...{hash.slice(-8)}
                </p>
              </div>
            )}

            {submitError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {submitError}
              </div>
            )}

            {submitSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                {submitSuccess}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

