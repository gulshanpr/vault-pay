import { NextRequest } from 'next/server';
import { getVaultByAddress } from '@/lib/morpho';
import { getMorphoVaultsByChain, type ChainKey } from '@/lib/vaultsConfig';

export const runtime = 'nodejs';

function chainKeyToId(key: ChainKey): number | null {
  if (key === 'base') return 8453;
  if (key === 'arb') return 42161;
  if (key === 'unichain') return process.env.UNICHAIN_CHAIN_ID ? Number(process.env.UNICHAIN_CHAIN_ID) : null;
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chainParam = searchParams.get('chain'); // optional; base|arb|unichain

  const byChain = getMorphoVaultsByChain();
  const chains: ChainKey[] = chainParam ? [chainParam.toLowerCase() as ChainKey] : (Object.keys(byChain) as ChainKey[]);

  const results: any[] = [];
  try {
    for (const chain of chains) {
      const chainId = chainKeyToId(chain);
      if (!chainId) continue;
      const vaults = byChain[chain];
      for (const v of vaults) {
        const data = await getVaultByAddress(chainId, v.vaultAddress);
        results.push({ chain, chainId, ...data });
      }
    }
    return new Response(JSON.stringify({ items: results }), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Morpho fetch failed' }), { status: 502 });
  }
}


