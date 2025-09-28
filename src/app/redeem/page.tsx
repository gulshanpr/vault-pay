"use client";

import { VaultRedeemInterface } from "@/components/VaultRedeemInterface";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function RedeemPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Redeem Vault Shares
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Withdraw your vault positions or transfer shares to another address
          </p>
        </div>
        <VaultRedeemInterface />
      </div>
    </DashboardLayout>
  );
}
