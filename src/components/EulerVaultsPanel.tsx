"use client";

import { useEffect, useState } from "react";

export default function EulerVaultsPanel() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/euler/vaults-status');
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

  if (loading) return <div className="text-slate-600 dark:text-slate-300">Loading Euler vaults…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Euler Vaults (Base / Arbitrum / Unichain)</h3>
      <div className="space-y-3">
        {data.filter((i) => i.chain !== 'arb').map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <div className="font-medium">{item.vaultName || item.vault}</div>
              <div className="text-xs text-slate-500">{item.chain} · {item.vault}</div>
            </div>
            <div className="text-right text-sm text-slate-700 dark:text-slate-300">
              {item.error ? (
                <div className="text-xs text-red-500 max-w-md">{String(item.error)}</div>
              ) : (
                <>
                  <div>Share: {item.sharePrice ?? 'n/a'} {item.assetSymbol}</div>
                  <div>Supply APY: {item.supplyAPY != null ? (Number(item.supplyAPY) * 100).toFixed(2) + '%' : 'n/a'}</div>
                  <div>Borrow APY: {item.borrowAPY != null ? (Number(item.borrowAPY) * 100).toFixed(2) + '%' : 'n/a'}</div>
                </>
              )}
            </div>
          </div>
        ))}
        {data.length === 0 && <div className="text-slate-500">No Euler vaults configured.</div>}
      </div>
    </div>
  );
}


