"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { MerchantOnboardingForm, type MerchantFormData } from "@/components/MerchantOnboardingForm";
import { upsertMerchantProfile } from "@/lib/merchantRepository";

export default function MerchantSetupPage() {
  const handleMerchantSubmit = async (data: MerchantFormData) => {
    if (!data.merchantPayout) return;

    await upsertMerchantProfile({
      merchantWallet: (data as any).merchantWallet || data.merchantPayout,
      payoutAddress: data.merchantPayout,
      payoutMode: data.payoutMode,
      splitBps: data.payoutMode === 2 ? data.splitBps ?? null : null,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <MerchantOnboardingForm onSubmit={handleMerchantSubmit} />
      </div>
    </DashboardLayout>
  );
}
