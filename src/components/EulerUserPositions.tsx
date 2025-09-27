"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

type ChainKey = 'base'|'arb'|'unichain';

export default function EulerUserPositions() {
  const { user } = usePrivy();
  const ethAddress = user?.wallet?.address;

  const [chain, setChain] = useState<ChainKey>('base');
  const [vaultFilter, setVaultFilter] = useState<string>('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userAddress = useMemo(() => ethAddress || '', [ethAddress]);

  useEffect(() => {
    if (!userAddress) return;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const url = new URL('/api/euler/user-positions', window.location.origin);
        url.searchParams.set('chain', chain);
        url.searchParams.set('user', userAddress);
        if (vaultFilter) url.searchParams.set('vault', vaultFilter);
        const res = await fetch(url.toString());
        const json = await res.json();
        setItems(json.items || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load Euler positions');
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [chain, userAddress, vaultFilter]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your Euler Positions</h3>
        <div className="flex items-center gap-3">
          <select value={chain} onChange={(e) => setChain(e.target.value as ChainKey)} className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-transparent text-sm">
            <option value="base">base</option>
            {/* hide arb for now */}
            {/* <option value="arb">arb</option> */}
            <option value="unichain">unichain</option>
          </select>
          <input
            placeholder="Filter by vault address (optional)"
            value={vaultFilter}
            onChange={(e) => setVaultFilter(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-transparent text-sm w-80"
          />
        </div>
      </div>

      {!userAddress && <div className="text-slate-600 dark:text-slate-300">Connect your wallet to view positions.</div>}
      {userAddress && (
        <div>
          {loading && <div className="text-slate-600 dark:text-slate-300">Loading positions…</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && (
            <div className="space-y-3">
              {items.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <div className="font-medium">{p.vault}</div>
                    <div className="text-xs text-slate-500">{chain}</div>
                  </div>
                  <div className="text-right text-sm text-slate-700 dark:text-slate-300">
                    <div>Assets: {p.assetsFormatted}</div>
                    <div>Shares: {p.shares}</div>
                    {p.healthScore != null && <div>Health Score: {p.healthScore.toFixed(2)}</div>}
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="text-slate-500">No positions found.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


