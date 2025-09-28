"use client";

// import { FusionSwapInterface } from "@/components/FusionSwapInterface";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function FusionSwapPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Fusion Swap
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Fast same-chain token swaps using 1inch Fusion
          </p>
        </div>
        {/* <FusionSwapInterface /> */}
      </div>
    </DashboardLayout>
  );
}
