// Supported chains
export const SUPPORTED_CHAINS = {
  BASE: 8453,
  ARBITRUM: 42161,
  UNICHAIN: 1301, // Update this with actual Unichain ID when available
} as const;

// Vault protocols
export type VaultProtocol = 'morpho' | 'euler';

// Token info interface
export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

// Vault info interface
export interface VaultInfo {
  protocol: VaultProtocol;
  chainId: number;
  chainName: string;
  vaultAddress: string;
  token: TokenInfo;
}

// All supported tokens across chains
export const SUPPORTED_TOKENS: Record<string, TokenInfo> = {
  // Base tokens
  'BASE_USDC': { symbol: 'USDC', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  'BASE_EURC': { symbol: 'EURC', address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42', decimals: 6 },
  'BASE_USDS': { symbol: 'USDS', address: '0x820C137fa70C8691f0e44Dc420a5e53c168921Dc', decimals: 18 },
  
  // Arbitrum tokens
  'ARB_USDC': { symbol: 'USDC', address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', decimals: 6 },
  'ARB_WETH': { symbol: 'WETH', address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', decimals: 18 },
  
  // Unichain tokens
  'UNICHAIN_USDC': { symbol: 'USDC', address: '0x078D782b760474a361dDA0AF3839290b0EF57AD6', decimals: 6 },
  'UNICHAIN_USDT': { symbol: 'USDT', address: '0x9151434b16b9763660705744891fA906F660EcC5', decimals: 6 },
} as const;

// All available vaults
export const AVAILABLE_VAULTS: VaultInfo[] = [
  // Morpho vaults
  {
    protocol: 'morpho',
    chainId: SUPPORTED_CHAINS.BASE,
    chainName: 'Base',
    vaultAddress: '0x236919F11ff9eA9550A4287696C2FC9e18E6e890',
    token: SUPPORTED_TOKENS.BASE_USDC,
  },
  {
    protocol: 'morpho',
    chainId: SUPPORTED_CHAINS.BASE,
    chainName: 'Base',
    vaultAddress: '0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026',
    token: SUPPORTED_TOKENS.BASE_EURC,
  },
  {
    protocol: 'morpho',
    chainId: SUPPORTED_CHAINS.ARBITRUM,
    chainName: 'Arbitrum',
    vaultAddress: '0xa60643c90A542A95026C0F1dbdDB0615fF42019Cf',
    token: SUPPORTED_TOKENS.ARB_USDC,
  },
  {
    protocol: 'morpho',
    chainId: SUPPORTED_CHAINS.UNICHAIN,
    chainName: 'Unichain',
    vaultAddress: '0x38f4f3B6533de0023b9DCd04b02F93d36ad1F9f9',
    token: SUPPORTED_TOKENS.UNICHAIN_USDC,
  },
  {
    protocol: 'morpho',
    chainId: SUPPORTED_CHAINS.UNICHAIN,
    chainName: 'Unichain',
    vaultAddress: '0x89849B6e57e1c61e447257242bDa97c70FA99b6b',
    token: SUPPORTED_TOKENS.UNICHAIN_USDT,
  },
  
  // Euler vaults
  {
    protocol: 'euler',
    chainId: SUPPORTED_CHAINS.BASE,
    chainName: 'Base',
    vaultAddress: '0x0A1a3b5f2041F33522C4efc754a7D096f880eE16',
    token: SUPPORTED_TOKENS.BASE_USDC,
  },
  {
    protocol: 'euler',
    chainId: SUPPORTED_CHAINS.BASE,
    chainName: 'Base',
    vaultAddress: '0x9ECD9fbbdA32b81dee51AdAed28c5C5039c87117',
    token: SUPPORTED_TOKENS.BASE_EURC,
  },
  {
    protocol: 'euler',
    chainId: SUPPORTED_CHAINS.BASE,
    chainName: 'Base',
    vaultAddress: '0x556d518FDFDCC4027A3A1388699c5E11AC201D8b',
    token: SUPPORTED_TOKENS.BASE_USDS,
  },
  {
    protocol: 'euler',
    chainId: SUPPORTED_CHAINS.ARBITRUM,
    chainName: 'Arbitrum',
    vaultAddress: '0x6aFB8d3F6D4A34e9cB2f217317f4dc8e05Aa673b',
    token: SUPPORTED_TOKENS.ARB_USDC,
  },
  {
    protocol: 'euler',
    chainId: SUPPORTED_CHAINS.ARBITRUM,
    chainName: 'Arbitrum',
    vaultAddress: '0x78E3E051D32157AACD550fBB78458762d8f7edFF',
    token: SUPPORTED_TOKENS.ARB_WETH,
  },
  {
    protocol: 'euler',
    chainId: SUPPORTED_CHAINS.UNICHAIN,
    chainName: 'Unichain',
    vaultAddress: '0x6eAe95ee783e4D862867C4e0E4c3f4B95AA682Ba',
    token: SUPPORTED_TOKENS.UNICHAIN_USDC,
  },
  {
    protocol: 'euler',
    chainId: SUPPORTED_CHAINS.UNICHAIN,
    chainName: 'Unichain',
    vaultAddress: '0xD49181c522eCDB265f0D9C175Cf26FFACE64eAD3',
    token: SUPPORTED_TOKENS.UNICHAIN_USDT,
  },
];

// Chain to 1inch NetworkEnum mapping
export const CHAIN_TO_1INCH_NETWORK = {
  [SUPPORTED_CHAINS.BASE]: 'COINBASE' as const,
  [SUPPORTED_CHAINS.ARBITRUM]: 'ARBITRUM' as const,
  // Add Unichain when 1inch supports it
} as const;