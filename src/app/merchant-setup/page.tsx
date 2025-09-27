"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { MerchantOnboardingForm } from "@/components/MerchantOnboardingForm";

export default function MerchantSetupPage() {
  const handleMerchantSubmit = (data: any) => {
    console.log("Merchant registration data:", data);
    // Here you would typically call a smart contract or API to register the merchant
    // For now, just log the data
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <MerchantOnboardingForm onSubmit={handleMerchantSubmit} />
      </div>
    </DashboardLayout>
  );
}
