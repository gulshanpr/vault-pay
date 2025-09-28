import { createPublicClient, http, formatUnits } from 'viem';

// Minimal ABIs
const AccountLensABI = [
  {
    type: 'function',
    name: 'getAccountInfo',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'vault', type: 'address' }
    ],
    outputs: [
      {
        type: 'tuple',
        name: 'info',
        components: [
          { name: 'evcAccountInfo', type: 'tuple', components: [
            { name: 'owner', type: 'address' },
            { name: 'evc', type: 'address' }
          ]},
          { name: 'vaultAccountInfo', type: 'tuple', components: [
            { name: 'shares', type: 'uint256' },
            { name: 'borrowed', type: 'uint256' },
            { name: 'isController', type: 'bool' },
            { name: 'liquidityInfo', type: 'tuple', components: [
              { name: 'collateralValueLiquidation', type: 'int256' },
              { name: 'liabilityValue', type: 'int256' },
              { name: 'timeToLiquidation', type: 'int256' }
            ]}
          ]},
          { name: 'accountRewardInfo', type: 'tuple', components: [
            { name: 'enabledRewardsInfo', type: 'bytes' }
          ]}
        ]
      }
    ]
  }
] as const;

const VaultLensABI = [
  {
    type: 'function', name: 'getVaultInfoFull', stateMutability: 'view',
    inputs: [{ name: 'vault', type: 'address' }],
    outputs: [{
      name: 'info', type: 'tuple', components: [
        { name: 'vaultName', type: 'string' },
        { name: 'asset', type: 'address' },
        { name: 'totalAssets', type: 'uint256' },
        { name: 'totalSupply', type: 'uint256' },
        { name: 'supplyCap', type: 'uint256' },
        { name: 'collateralLTVInfo', type: 'tuple[]', components: [
          { name: 'collateral', type: 'address' },
          { name: 'borrowLTV', type: 'uint256' },
          { name: 'liquidationLTV', type: 'uint256' }
        ] }
      ]
    }]
  }
] as const;

const UtilsLensABI = [
  { type: 'function', name: 'getAPYs', stateMutability: 'view', inputs: [{ name: 'vault', type: 'address' }], outputs: [
    { name: 'borrowAPY', type: 'int256' }, { name: 'supplyAPY', type: 'int256' }
  ] }
] as const;

const ERC20_ABI = [
  { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  { name: 'symbol', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'name', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ type: 'address' }], outputs: [{ type: 'uint256' }] }
] as const;

const ERC4626_ABI = [
  { name: 'asset', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'convertToAssets', type: 'function', stateMutability: 'view', inputs: [{ type: 'uint256' }], outputs: [{ type: 'uint256' }] },
  { name: 'totalAssets', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] }
] as const;

export type ChainKey = 'base' | 'arb' | 'unichain';

function rpcUrl(chain: ChainKey) {
  if (chain === 'base') return process.env.RPC_BASE as string;
  if (chain === 'arb') return process.env.RPC_ARB as string;
  return process.env.RPC_UNICHAIN as string;
}

function client(chain: ChainKey) {
  const url = rpcUrl(chain);
  if (!url) throw new Error(`Missing RPC url for ${chain}`);
  return createPublicClient({ transport: http(url) });
}

function lensAddr(kind: 'account'|'vault'|'utils', chain: ChainKey) {
  const key = chain.toUpperCase();
  const env = kind === 'account' ? process.env[`EULER_ACCOUNT_LENS_${key}` as any]
            : kind === 'vault'   ? process.env[`EULER_VAULT_LENS_${key}` as any]
                                 : process.env[`EULER_UTILS_LENS_${key}` as any];
  if (!env) throw new Error(`Missing ${kind} lens for ${chain}`);
  return env as `0x${string}`;
}

export async function getEulerVaultStatus(chain: ChainKey, vault: `0x${string}`) {
  const c = client(chain);
  // Base state from ERC-4626 and ERC20
  const [asset, totalAssets, totalSupply, sharePer1e18, vaultName, assetDecimals, assetSymbol] = await Promise.all([
    c.readContract({ address: vault, abi: ERC4626_ABI, functionName: 'asset' }) as Promise<`0x${string}`>,
    c.readContract({ address: vault, abi: ERC4626_ABI, functionName: 'totalAssets' }) as Promise<bigint>,
    c.readContract({ address: vault, abi: ERC4626_ABI, functionName: 'totalSupply' }) as Promise<bigint>,
    c.readContract({ address: vault, abi: ERC4626_ABI, functionName: 'convertToAssets', args: [10n ** 18n] }) as Promise<bigint>,
    c.readContract({ address: vault, abi: ERC20_ABI, functionName: 'name' }) as Promise<string>,
    // asset token metadata
    (async () => c.readContract({ address: await c.readContract({ address: vault, abi: ERC4626_ABI, functionName: 'asset' }) as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' }) as Promise<number>)(),
    (async () => c.readContract({ address: await c.readContract({ address: vault, abi: ERC4626_ABI, functionName: 'asset' }) as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' }) as Promise<string>)()
  ]);

  // Attempt APYs via UtilsLens; ignore if unavailable
  let borrowAPY: number | null = null;
  let supplyAPY: number | null = null;
  try {
    const [b, s] = await c.readContract({ address: lensAddr('utils', chain), abi: UtilsLensABI, functionName: 'getAPYs', args: [vault] }) as readonly [bigint, bigint];
    borrowAPY = Number(b) / 1e18;
    supplyAPY = Number(s) / 1e18;
  } catch {}

  return {
    chain, vault,
    vaultName,
    asset,
    assetSymbol,
    assetDecimals,
    totalAssets: totalAssets.toString(),
    totalSupply: totalSupply.toString(),
    sharePrice: formatUnits(sharePer1e18, assetDecimals),
    borrowAPY,
    supplyAPY
  };
}

export async function getEulerUserPosition(chain: ChainKey, vault: `0x${string}`, user: `0x${string}`) {
  const c = client(chain);
  let shares: bigint = 0n;
  let borrowed: bigint = 0n;
  let healthScore: number | null = null;
  try {
    const acc = await c.readContract({
      address: lensAddr('account', chain),
      abi: AccountLensABI,
      functionName: 'getAccountInfo',
      args: [user, vault]
    }) as any;
    shares = acc.vaultAccountInfo?.shares as bigint | undefined ?? 0n;
    borrowed = acc.vaultAccountInfo?.borrowed as bigint | undefined ?? 0n;
    const liq = acc.vaultAccountInfo?.liquidityInfo || {};
    const coll = BigInt(liq.collateralValueLiquidation || 0);
    const liability = BigInt(liq.liabilityValue || 0);
    healthScore = liability === 0n ? null : Number(coll) / Number(liability);
  } catch {
    // fallback to direct shares
    try {
      shares = await c.readContract({ address: vault, abi: ERC20_ABI, functionName: 'balanceOf', args: [user] }) as bigint;
    } catch {}
  }

  const assetAddr = await c.readContract({ address: vault, abi: ERC4626_ABI, functionName: 'asset' }) as `0x${string}`;
  const decimals = await c.readContract({ address: assetAddr, abi: ERC20_ABI, functionName: 'decimals' }) as number;
  const assets = shares && shares > 0n
    ? await c.readContract({ address: vault, abi: ERC4626_ABI, functionName: 'convertToAssets', args: [shares] }) as bigint
    : 0n;

  return {
    chain, vault, user,
    shares: shares.toString(),
    borrowed: borrowed.toString(),
    assets: assets.toString(),
    assetsFormatted: formatUnits(assets, decimals),
    healthScore
  };
}


