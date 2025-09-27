"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { SwapInterface } from "@/components/SwapInterface";

export default function SwapPage() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <SwapInterface />
      </div>
    </DashboardLayout>
  );
}
