"use client";

import { useEffect, useState } from "react";

type VaultStatusItem = {
  chain: string;
  chainId: number;
  vaultByAddress: {
    address: string;
    name?: string | null;
    symbol?: string | null;
    state?: {
      totalAssetsUsd?: string | null;
      apy?: string | null;
      sharePrice?: string | null;
      sharePriceUsd?: string | null;
    } | null;
  } | null;
};

export default function MorphoVaultsPanel() {
  const [data, setData] = useState<VaultStatusItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/morpho/vaults-status');
        const json = await res.json();
        setData(json.items || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    run();
  }, []);

  if (loading) return <div className="text-slate-600 dark:text-slate-300">Loading vaults…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Morpho Vaults (Base / Arbitrum / Unichain)</h3>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <div className="font-medium">{item.vaultByAddress?.name || item.vaultByAddress?.symbol || item.vaultByAddress?.address}</div>
              <div className="text-xs text-slate-500">{item.chain} (chainId {item.chainId}) · {item.vaultByAddress?.address}</div>
            </div>
            <div className="text-right text-sm text-slate-700 dark:text-slate-300">
              <div>
                {(() => {
                  const tvl = item.vaultByAddress?.state?.totalAssetsUsd;
                  const num = tvl ? Number(tvl) : null;
                  return `TVL: ${num !== null && !Number.isNaN(num) ? num.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'n/a'}`;
                })()}
              </div>
              <div>
                {(() => {
                  const apy = item.vaultByAddress?.state?.apy;
                  const num = apy ? Number(apy) * 100 : null;
                  return `APY: ${num !== null && Number.isFinite(num) ? num.toFixed(2) + '%' : 'n/a'}`;
                })()}
              </div>
              <div>
                {(() => {
                  const spUsd = item.vaultByAddress?.state?.sharePriceUsd;
                  const num = spUsd ? Number(spUsd) : null;
                  return `Share (USD): ${num !== null && !Number.isNaN(num) ? num.toLocaleString(undefined, { maximumFractionDigits: 6 }) : 'n/a'}`;
                })()}
              </div>
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="text-slate-500">No vaults configured.</div>}
      </div>
    </div>
  );
}


