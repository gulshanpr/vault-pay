import { NextRequest } from 'next/server';
import { getEulerVaultStatus } from '@/lib/euler';
import { getEulerVaultsByChain, type ChainKey } from '@/lib/vaultsConfig';

export const runtime = 'nodejs';

export async function GET(_: NextRequest) {
  const byChain = getEulerVaultsByChain();
  const chains = Object.keys(byChain) as ChainKey[];
  const items: any[] = [];
  for (const chain of chains) {
    const vaults = byChain[chain];
    await Promise.all(vaults.map(async v => {
      try {
        const s = await getEulerVaultStatus(chain, v.vaultAddress as `0x${string}`);
        items.push({ chain, ...s });
      } catch (e: any) {
        items.push({ chain, vault: v.vaultAddress, error: e?.message || 'failed' });
      }
    }));
  }
  return new Response(JSON.stringify({ items }), { headers: { 'content-type': 'application/json' } });
}


