"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LavaLamp } from "@/components/ui/fluid-blob";
import { GooeyMarquee } from "@/components/ui/gooey-marquee";
import ConnectWalletButton from '@/components/ConnectWalletButton';
import {
  FileText,
  Users,
  Zap,
  Shield,
  Download,
  Palette,
  Moon,
  Sun,
  ArrowRight,
  CheckCircle,
  Star,
  MessageSquare,
  BookOpen,
  BarChart3,
  TrendingUp,
  Globe,
  Cpu,
  Lock,
  Database,
  Bot,
  Network,
  DollarSign,
  Target,
  Award,
  Building2,
  Briefcase,
  Code,
  Eye,
  ChevronRight,
  Activity,
  Layers,
  Sparkles,
  CreditCard,
} from "lucide-react";

export default function YieldBackedPaymentsLandingPage() {
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }

    // Simulate API call
    setTimeout(() => {
      setToast({ message: 'Successfully joined the waitlist!', type: 'success' });
      setShowWaitlistModal(false);
      setFormData({ name: '', email: '' });

      // Clear toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Fluid Blob Background */}
        <div className="absolute inset-0 opacity-20">
          <LavaLamp />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-7xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 mb-8">
            <DollarSign className="w-4 h-4" />
            Omnichain Merchant Payments Revolution
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight tracking-tight">
            Payments that
            <br />
            <span className="text-blue-600 dark:text-blue-400">earn yield</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            The first omnichain merchant payment system where settlements come as yield-bearing vault shares, not idle stablecoins. Cross-chain friction solved.
          </p>

          {/* Value Proposition */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Any</div>
              <div className="text-slate-600 dark:text-slate-300">Chain Payment</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Auto</div>
              <div className="text-slate-600 dark:text-slate-300">Yield Earning</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Zero</div>
              <div className="text-slate-600 dark:text-slate-300">Idle Capital</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <ConnectWalletButton />
            <Button
              onClick={() => setShowWaitlistModal(true)}
              variant="outline"
              className="px-8 py-3 text-base font-medium rounded-md border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-300"
            >
              Join Waitlist
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-blue-950/20 dark:via-slate-900 dark:to-blue-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Yield-bearing settlement features
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Merchants receive ERC-4626 vault shares that auto-earn yield, with flexible redemption options and composable transferability.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Core Features Grid */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Flexible Settlement</h3>
                    <p className="text-slate-600 dark:text-slate-300">Choose between immediate USDC liquidity or yield-bearing vault shares that auto-earn returns</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Yield Offsets Fees</h3>
                    <p className="text-slate-600 dark:text-slate-300">Protocol, bridge, and gas fees are covered by vault yield, making payments cheaper than traditional rails</p>
                  </div>
            </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Transferable Vault Shares</h3>
                    <p className="text-slate-600 dark:text-slate-300">Directly transfer yield-earning vault shares to suppliers, employees, or partners as ERC-20 receipts</p>
                  </div>
            </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Credit-like Functionality</h3>
                    <p className="text-slate-600 dark:text-slate-300">Vault share holdings enable credit lines for borrowing or early payments against future earnings</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Split Payments</h3>
                    <p className="text-slate-600 dark:text-slate-300">Receive part in immediate USDC liquidity and part in yield-earning vault shares for optimal cash flow</p>
                  </div>
            </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-100 via-white to-blue-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-950/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Built on battle-tested tech
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Omnichain payments powered by leading DeFi protocols and cross-chain infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Smart Contracts</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Settlement + routing contracts with ERC-4626 vault integrations (Aave/Morpho/Euler)</p>
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">View contracts →</div>
            </div>

                        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Cross-Chain + Swaps</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">1inch API for swaps, Circle CCTP / LayerZero for bridging across any chain</p>
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">View integrations →</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Frontend / Dashboard</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Next.js + Wagmi + Ethers.js/Viem with Coinbase Embedded Wallets</p>
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">View dashboard →</div>
          </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Yield Vaults</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">ERC-4626 compliant vaults from Aave, Morpho, or Euler for auto-yield generation</p>
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">View vaults →</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Optional Infra</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Chainlink price feeds and The Graph subgraphs for enhanced UX and analytics</p>
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">View infra →</div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-blue-200 dark:border-blue-800 hover:shadow-blue-200/50 transition-all duration-300">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Merchant Dashboard</h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">Real-time vault share balance, yield tracking, and flexible redemption options</p>
              <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">View demo →</div>
            </div>
          </div>
        </div>
      </section>

                  {/* Ready to get started */}
      <section className="py-24 px-4 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to earn yield on payments?
          </h2>
          <p className="text-xl text-blue-100 mb-12">
            Be among the first merchants to receive payments as yield-bearing vault shares. Join our exclusive waitlist.
          </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <ConnectWalletButton />
              <Button
                onClick={() => setShowWaitlistModal(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-base font-medium rounded-md transition-all duration-300"
              >
                Join Waitlist
              </Button>
          </div>

          <div className="text-sm text-blue-200">
            Get early access and exclusive updates as we build the future of omnichain merchant payments.
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white">Yield Vaults</a></li>
                <li><a href="#" className="hover:text-white">Cross-Chain Payments</a></li>
                <li><a href="#" className="hover:text-white">Merchant Dashboard</a></li>
                <li><a href="#" className="hover:text-white">Split Settlements</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Protocols</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white">ERC-4626 Vaults</a></li>
                <li><a href="#" className="hover:text-white">Aave Integration</a></li>
                <li><a href="#" className="hover:text-white">Morpho Protocol</a></li>
                <li><a href="#" className="hover:text-white">Euler Finance</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Developers</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white">Smart Contracts</a></li>
                <li><a href="#" className="hover:text-white">API Reference</a></li>
                <li><a href="#" className="hover:text-white">SDK</a></li>
                <li><a href="#" className="hover:text-white">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-300">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-4xl font-bold mb-4 md:mb-0">YieldBacked</div>
              <div className="text-slate-400 text-sm">
                © 2025 YieldBacked. Payments that earn yield, not idle capital.
              </div>
            </div>
          </div>
        </div>

        {/* Massive Brand Name */}
        <div className="relative flex items-center justify-center min-h-[30vh] px-4">
          <h2 className="text-[clamp(8rem,17vw,25rem)] font-black bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent leading-none tracking-tighter select-none">
            YieldBacked
          </h2>
        </div>
      </footer>

      {/* Waitlist Modal */}
      {showWaitlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Join the Waitlist
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Be among the first merchants to receive yield-bearing payments
              </p>
            </div>

            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="Enter your company email"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowWaitlistModal(false)}
                  className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Join Waitlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <div className="w-5 h-5">⚠️</div>
              )}
            </div>
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
