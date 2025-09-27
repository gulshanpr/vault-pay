"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

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
  payoutToken: string;
  payoutMode: PayoutMode;
  splitBps?: number;
  protocolFeeBps: number;
  feeRecipient: string;
}

export function MerchantOnboardingForm({ onSubmit }: MerchantOnboardingFormProps) {
  const [formData, setFormData] = useState<MerchantFormData>({
    merchantPayout: "",
    payoutToken: "",
    payoutMode: PayoutMode.USDC_ONLY,
    splitBps: 5000, // 50% default
    protocolFeeBps: 100, // 1% default
    feeRecipient: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof MerchantFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof MerchantFormData, string>> = {};

    if (!formData.merchantPayout) {
      newErrors.merchantPayout = "Merchant payout address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.merchantPayout)) {
      newErrors.merchantPayout = "Invalid Ethereum address";
    }

    if (!formData.payoutToken) {
      newErrors.payoutToken = "Payout token address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.payoutToken)) {
      newErrors.payoutToken = "Invalid Ethereum address";
    }

    if (formData.payoutMode === PayoutMode.SPLIT) {
      if (!formData.splitBps || formData.splitBps < 0 || formData.splitBps > 10000) {
        newErrors.splitBps = "Split percentage must be between 0 and 10000 (basis points)";
      }
    }

    if (!formData.feeRecipient) {
      newErrors.feeRecipient = "Fee recipient address is required";
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.feeRecipient)) {
      newErrors.feeRecipient = "Invalid Ethereum address";
    }

    if (formData.protocolFeeBps < 0 || formData.protocolFeeBps > 1000) {
      newErrors.protocolFeeBps = "Protocol fee must be between 0 and 1000 (basis points)";
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
              <Label htmlFor="merchantPayout">Merchant Payout Address</Label>
              <Input
                id="merchantPayout"
                type="text"
                placeholder="0x..."
                value={formData.merchantPayout}
                onChange={(e) => handleInputChange("merchantPayout", e.target.value)}
                className={errors.merchantPayout ? "border-red-500" : ""}
              />
              {errors.merchantPayout && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.merchantPayout}
                </div>
              )}
            </div>

            {/* Payout Token Address */}
            <div className="space-y-2">
              <Label htmlFor="payoutToken">Payout Token Address</Label>
              <Input
                id="payoutToken"
                type="text"
                placeholder="0x..."
                value={formData.payoutToken}
                onChange={(e) => handleInputChange("payoutToken", e.target.value)}
                className={errors.payoutToken ? "border-red-500" : ""}
              />
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

            {/* Protocol Fee */}
            <div className="space-y-2">
              <Label htmlFor="protocolFeeBps">Protocol Fee (BPS)</Label>
              <Input
                id="protocolFeeBps"
                type="number"
                min="0"
                max="1000"
                value={formData.protocolFeeBps}
                onChange={(e) => handleInputChange("protocolFeeBps", parseInt(e.target.value))}
                className={errors.protocolFeeBps ? "border-red-500" : ""}
              />
              {errors.protocolFeeBps && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.protocolFeeBps}
                </div>
              )}
              <div className="text-sm text-slate-600">
                {formData.protocolFeeBps}/10000 = {((formData.protocolFeeBps || 0) / 100)}% protocol fee
              </div>
            </div>

            {/* Fee Recipient */}
            <div className="space-y-2">
              <Label htmlFor="feeRecipient">Fee Recipient Address</Label>
              <Input
                id="feeRecipient"
                type="text"
                placeholder="0x..."
                value={formData.feeRecipient}
                onChange={(e) => handleInputChange("feeRecipient", e.target.value)}
                className={errors.feeRecipient ? "border-red-500" : ""}
              />
              {errors.feeRecipient && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.feeRecipient}
                </div>
              )}
            </div>

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
