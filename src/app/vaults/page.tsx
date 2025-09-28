"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import MorphoVaultsPanel from "@/components/MorphoVaultsPanel";
import EulerVaultsPanel from "@/components/EulerVaultsPanel";

export default function VaultsPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Vaults Overview
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Monitor vault performance, APYs, and total value locked across protocols
            </p>
          </div>

          {/* Vaults Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Morpho Vaults */}
            <div>
              <MorphoVaultsPanel />
            </div>

            {/* Euler Vaults */}
            <div>
              <EulerVaultsPanel />
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
              About Vaults
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              These vaults represent yield-bearing opportunities across different protocols. 
              APY rates are updated in real-time and TVL shows the total value locked in each vault. 
              Use this information to make informed decisions about where to deploy your assets.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
