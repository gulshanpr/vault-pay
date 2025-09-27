import { NextRequest } from 'next/server';
import { getUserVaultPositions } from '@/lib/morpho';

export const runtime = 'nodejs';

function resolveChainId(chain: string): number | null {
  const key = chain.toLowerCase();
  if (key === 'base') return 8453;
  if (key === 'arb' || key === 'arbitrum') return 42161;
  if (key === 'unichain') return process.env.UNICHAIN_CHAIN_ID ? Number(process.env.UNICHAIN_CHAIN_ID) : null;
  const n = Number(chain);
  return Number.isFinite(n) ? n : null;
}

function isMorphoSupported(chainId: number): boolean {
  // Known supported chains for Morpho Vaults API in this app
  // Extend if/when Morpho supports more chains for vaults
  return chainId === 8453 || chainId === 42161 || chainId === 1;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const chain = searchParams.get('chain');
  const user = searchParams.get('user');
  const vault = searchParams.get('vault'); // optional: filter by vault address
  if (!chain || !user) {
    return new Response(JSON.stringify({ error: 'Missing chain or user' }), { status: 400 });
  }
  const chainId = resolveChainId(chain);
  if (!chainId) return new Response(JSON.stringify({ error: 'Unsupported or missing chainId' }), { status: 400 });
  if (!isMorphoSupported(chainId)) {
    return new Response(JSON.stringify({ error: `Chain ${chainId} not supported by Morpho Vaults API in this app` }), { status: 400 });
  }
  try {
    const data = await getUserVaultPositions(chainId, user);
    if (vault && data?.userByAddress?.vaultPositions) {
      const target = vault.toLowerCase();
      data.userByAddress.vaultPositions = data.userByAddress.vaultPositions.filter(
        (p: any) => p?.vault?.address?.toLowerCase() === target
      );
    }
    return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Morpho fetch failed' }), { status: 502 });
  }
}


