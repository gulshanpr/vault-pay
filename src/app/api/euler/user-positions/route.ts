import { NextRequest } from 'next/server';
import { getEulerUserPosition } from '@/lib/euler';
import { getEulerVaultsByChain, type ChainKey } from '@/lib/vaultsConfig';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chain = (searchParams.get('chain') || 'arb') as ChainKey;
  const user = searchParams.get('user') as `0x${string}` | null;
  const vault = searchParams.get('vault') as `0x${string}` | null;
  if (!user) return new Response(JSON.stringify({ error: 'Missing user' }), { status: 400 });

  const targets = vault ? [{ vaultAddress: vault }] : getEulerVaultsByChain()[chain];
  const items = await Promise.all(targets.map(t => getEulerUserPosition(chain, t.vaultAddress as `0x${string}`, user)));
  return new Response(JSON.stringify({ items }), { headers: { 'content-type': 'application/json' } });
}


