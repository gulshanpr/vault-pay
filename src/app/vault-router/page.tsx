"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { VaultTokenRouter } from "@/components/VaultTokenRouter";
import { Token } from "@/lib/tokenService";

export default function VaultRouterPage() {
  const handleRoute = (chainId: number, fromToken: Token, toToken: Token, amount: string) => {
    console.log("Routing tokens:", {
      chainId,
      fromToken,
      toToken,
      amount,
    });

    // Here you would typically:
    // 1. Check if there are vault positions for these tokens
    // 2. Calculate the best route through vaults
    // 3. Execute the transaction
    // 4. Show results to user

    alert(`Routing ${amount} ${fromToken.symbol} to ${toToken.symbol} on chain ${chainId}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <VaultTokenRouter onRoute={handleRoute} />
      </div>
    </DashboardLayout>
  );
}
