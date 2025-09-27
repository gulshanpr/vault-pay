"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Loader2, Wallet } from "lucide-react";

enum PayoutMode {
  USDC_ONLY = 0,
  SHARES_ONLY = 1,
  SPLIT = 2,
}

interface MerchantOnboardingFormProps {
  onSubmit?: (data: MerchantFormData) => void;
}

export interface MerchantFormData {
  merchantPayout: string;
  payoutMode: PayoutMode;
  splitBps?: number;
}

export function MerchantOnboardingForm({ onSubmit }: MerchantOnboardingFormProps) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  // Get connected wallet address
  const walletAddress = wallets[0]?.address || "";

  const [formData, setFormData] = useState<MerchantFormData>({
    merchantPayout: "",
    payoutMode: PayoutMode.USDC_ONLY,
    splitBps: 5000, // 50% default
  });

  // Initialize merchantPayout with connected wallet address
  useEffect(() => {
    if (walletAddress && ready && authenticated) {
      setFormData(prev => ({
        ...prev,
        merchantPayout: walletAddress
      }));
    }
  }, [walletAddress, ready, authenticated]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof MerchantFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MerchantFormData, string>> = {};

    if (!formData.merchantPayout) {
      newErrors.merchantPayout = "Merchant payout address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.merchantPayout)) {
      newErrors.merchantPayout = "Invalid Ethereum address";
    }

    if (formData.payoutMode === PayoutMode.SPLIT) {
      if (!formData.splitBps || formData.splitBps < 0 || formData.splitBps > 10000) {
        newErrors.splitBps = "Split percentage must be between 0 and 10000 (basis points)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit?.(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof MerchantFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Merchant Payout Address */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="merchantPayout">Merchant Payout Address</Label>
                {walletAddress && (
                  <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    <Wallet className="w-3 h-3" />
                    Connected Wallet
                  </div>
                )}
              </div>
              <div className="relative">
                <Input
                  id="merchantPayout"
                  type="text"
                  placeholder={walletAddress ? "Using connected wallet address" : "0x..."}
                  value={formData.merchantPayout}
                  onChange={(e) => handleInputChange("merchantPayout", e.target.value)}
                  className={`${errors.merchantPayout ? "border-red-500" : ""} ${walletAddress ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800" : ""}`}
                  readOnly={!!walletAddress}
                />
              </div>
              {errors.merchantPayout && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.merchantPayout}
                </div>
              )}
              {!walletAddress && (
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Connect your wallet to auto-populate this field
                </div>
              )}
            </div>

            {/* Payout Mode */}
            <div className="space-y-2">
              <Label htmlFor="payoutMode">Payout Mode</Label>
              <Select
                value={formData.payoutMode.toString()}
                onValueChange={(value) => handleInputChange("payoutMode", parseInt(value))}
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
                <Label htmlFor="splitBps">Split Percentage (Shares %)</Label>
                <Input
                  id="splitBps"
                  type="number"
                  min="0"
                  max="10000"
                  value={formData.splitBps}
                  onChange={(e) => handleInputChange("splitBps", parseInt(e.target.value))}
                  className={errors.splitBps ? "border-red-500" : ""}
                />
                {errors.splitBps && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    {errors.splitBps}
                  </div>
                )}
                <div className="text-sm text-slate-600">
                  {formData.splitBps}/10000 basis points = {((formData.splitBps || 0) / 100)}% shares, {((10000 - (formData.splitBps || 0)) / 100)}% cash
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering Merchant...
                </>
              ) : (
                "Register Merchant"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
