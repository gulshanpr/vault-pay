import fs from 'fs';
import path from 'path';

export type ChainKey = 'base' | 'arb' | 'unichain';

export type MorphoVaultConfig = {
  protocol: 'morpho';
  chainKey: ChainKey;
  chainId?: number; // resolved via mapping; unichain may be provided via env
  vaultAddress: string; // checksum/hex address
  tokenSymbol?: string | null;
  depositTokenAddress?: string | null;
};

export type EulerVaultConfig = {
  protocol: 'euler';
  chainKey: ChainKey;
  chainId?: number;
  vaultAddress: string;
  tokenSymbol?: string | null;
  depositTokenAddress?: string | null;
};

export type ParsedVaults = {
  morpho: MorphoVaultConfig[];
  euler: EulerVaultConfig[];
};

const CHAIN_KEY_TO_ID: Record<ChainKey, number | undefined> = {
  base: 8453,
  arb: 42161,
  unichain: process.env.UNICHAIN_CHAIN_ID ? Number(process.env.UNICHAIN_CHAIN_ID) : undefined
};

let cached: ParsedVaults | null = null;

export function parseVaultsFile(): ParsedVaults {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), 'vaults.txt');
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/);

  let currentSection: 'morpho' | 'euler' | 'other' | null = null;
  let currentChain: ChainKey | null = null;
  const morpho: MorphoVaultConfig[] = [];
  const euler: EulerVaultConfig[] = [];

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) continue;
    if (line.endsWith(':') && line.toLowerCase() === 'morpho:') {
      currentSection = 'morpho';
      currentChain = null;
      continue;
    }
    if (line.endsWith(':') && line.toLowerCase() === 'euler:') {
      currentSection = 'euler';
      currentChain = null;
      continue;
    }
    if (line.endsWith(':') && line.toLowerCase() !== 'morpho:' && line.toLowerCase() !== 'euler:') {
      currentSection = 'other';
      currentChain = null;
      continue;
    }
    if (currentSection !== 'morpho' && currentSection !== 'euler') continue;

    // chain header lines like: base: or arb: or unichain:
    const chainMatch = line.match(/^(base|arb|unichain):/i);
    if (chainMatch) {
      currentChain = chainMatch[1].toLowerCase() as ChainKey;
      // If the chain header line also contains a vault address, parse the remainder inline
      const remainder = line.slice(chainMatch[0].length).trim();
      if (remainder) {
        const inlineMatch = remainder.match(/^(0x[a-fA-F0-9]{40})\s*-\s*([A-Za-z0-9]+)?\s*\(?(0x[a-fA-F0-9]{40})?\)?/);
        if (inlineMatch) {
          const vaultAddress = inlineMatch[1];
          const tokenSymbol = inlineMatch[2] || null;
          const depositTokenAddress = inlineMatch[3] || null;
          if (currentSection === 'morpho') {
            morpho.push({
              protocol: 'morpho',
              chainKey: currentChain,
              chainId: CHAIN_KEY_TO_ID[currentChain],
              vaultAddress,
              tokenSymbol,
              depositTokenAddress
            });
          } else if (currentSection === 'euler') {
            euler.push({
              protocol: 'euler',
              chainKey: currentChain,
              chainId: CHAIN_KEY_TO_ID[currentChain],
              vaultAddress,
              tokenSymbol,
              depositTokenAddress
            });
          }
        }
      }
      continue;
    }

    // vault lines like: 0x... - SYMBOL (0xTOKEN)
    if (currentChain) {
      const vaultMatch = line.match(/^(0x[a-fA-F0-9]{40})\s*-\s*([A-Za-z0-9]+)?\s*\(?(0x[a-fA-F0-9]{40})?\)?/);
      if (vaultMatch) {
        const vaultAddress = vaultMatch[1];
        const tokenSymbol = vaultMatch[2] || null;
        const depositTokenAddress = vaultMatch[3] || null;
        if (currentSection === 'morpho') {
          morpho.push({
            protocol: 'morpho',
            chainKey: currentChain,
            chainId: CHAIN_KEY_TO_ID[currentChain],
            vaultAddress,
            tokenSymbol,
            depositTokenAddress
          });
        } else if (currentSection === 'euler') {
          euler.push({
            protocol: 'euler',
            chainKey: currentChain,
            chainId: CHAIN_KEY_TO_ID[currentChain],
            vaultAddress,
            tokenSymbol,
            depositTokenAddress
          });
        }
      }
    }
  }

  cached = { morpho, euler };
  return cached;
}

export function getMorphoVaultsByChain(): Record<ChainKey, MorphoVaultConfig[]> {
  const parsed = parseVaultsFile();
  const byChain: Record<ChainKey, MorphoVaultConfig[]> = { base: [], arb: [], unichain: [] };
  for (const v of parsed.morpho) byChain[v.chainKey].push(v);
  return byChain;
}

export function getChainIdForKey(chain: ChainKey): number | undefined {
  return CHAIN_KEY_TO_ID[chain];
}

export function getEulerVaultsByChain(): Record<ChainKey, EulerVaultConfig[]> {
  const parsed = parseVaultsFile();
  const byChain: Record<ChainKey, EulerVaultConfig[]> = { base: [], arb: [], unichain: [] };
  for (const v of parsed.euler) byChain[v.chainKey].push(v);
  return byChain;
}


