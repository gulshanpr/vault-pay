"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { ENSCard } from "@/components/ENSCard";
import { ConnectedWalletDisplay } from "@/components/ConnectedWalletDisplay";
import MorphoVaultsPanel from "@/components/MorphoVaultsPanel";
import MorphoUserPositions from "@/components/MorphoUserPositions";
import EulerVaultsPanel from "@/components/EulerVaultsPanel";
import EulerUserPositions from "@/components/EulerUserPositions";

export default function DashboardHomePage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {/* Connected Wallet Display */}
          <div className="mb-8">
            <ConnectedWalletDisplay />
          </div>

          {/* ENS Domain Setup */}
          <div className="mb-8">
            <ENSCard onENSUpdate={(ensData) => {
              console.log('ENS updated:', ensData);
              // You can handle ENS updates here - save to merchant registry, etc.
            }} />
          </div>

          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Welcome to Vault-Pay Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-300">
              Manage your merchant settings and access yield-bearing payment tools
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">0</div>
              <div className="text-slate-600 dark:text-slate-300">Active Merchants</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">$0</div>
              <div className="text-slate-600 dark:text-slate-300">Total Volume</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-2">0%</div>
              <div className="text-slate-600 dark:text-slate-300">Yield Earned</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                🚀 Get Started
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Set up your merchant configuration to start receiving yield-bearing payments
              </p>
              <a
                href="/merchant-setup"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Setup Merchant
              </a>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                🔄 Swap Tokens
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mb-4">
                Use the 1inch integration to swap tokens across chains
              </p>
              <a
                href="/swap"
                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Open Swap
              </a>
            </div>
          </div>

          {/* Morpho Vaults Status */}
          <div className="mt-8">
            <MorphoVaultsPanel />
          </div>

          {/* Your Positions */}
          <div className="mt-8">
            <MorphoUserPositions />
          </div>

          {/* Euler Panels */}
          <div className="mt-8">
            <EulerVaultsPanel />
          </div>
          <div className="mt-8">
            <EulerUserPositions />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
