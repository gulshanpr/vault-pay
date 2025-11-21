// Supported chain and token combinations for vault deposits
export const SUPPORTED_CHAINS = {
  BASE: 8453,
  ARBITRUM: 42161,
  UNICHAIN: 1301,
} as const;

export const SUPPORTED_COMBINATIONS = [
  // Base combinations
  {
    chainId: SUPPORTED_CHAINS.BASE,
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  {
    chainId: SUPPORTED_CHAINS.BASE,
    symbol: "EURC",
    address: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42",
  },
  {
    chainId: SUPPORTED_CHAINS.BASE,
    symbol: "USDS",
    address: "0x820C137fa70C8691f0e44Dc420a5e53c168921Dc",
  },

  // Arbitrum combinations
  {
    chainId: SUPPORTED_CHAINS.ARBITRUM,
    symbol: "USDC",
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
  {
    chainId: SUPPORTED_CHAINS.ARBITRUM,
    symbol: "WETH",
    address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
  },

  // Unichain combinations
  {
    chainId: SUPPORTED_CHAINS.UNICHAIN,
    symbol: "USDC",
    address: "0x078D782b760474a361dDA0AF3839290b0EF57AD6",
  },
  {
    chainId: SUPPORTED_CHAINS.UNICHAIN,
    symbol: "USDT",
    address: "0x9151434b16b9763660705744891fA906F660EcC5",
  },
] as const;

export interface SupportedCombination {
  chainId: number;
  symbol: string;
  address: string;
}

// Helper function to check if a combination is supported
export const isCombinationSupported = (
  chainId: number,
  tokenAddress: string
): boolean => {
  return SUPPORTED_COMBINATIONS.some(
    (combo) =>
      combo.chainId === chainId &&
      combo.address.toLowerCase() === tokenAddress.toLowerCase()
  );
};

// Helper function to get a random supported combination for swapping
export const getRandomSupportedCombination = (): SupportedCombination => {
  const randomIndex = Math.floor(Math.random() * SUPPORTED_COMBINATIONS.length);
  return SUPPORTED_COMBINATIONS[randomIndex];
};

// Helper function to get supported combinations for a specific chain
export const getSupportedCombinationsForChain = (
  chainId: number
): SupportedCombination[] => {
  return SUPPORTED_COMBINATIONS.filter((combo) => combo.chainId === chainId);
};

// Helper function to get the best target combination (prefer USDC, then others)
export const getBestTargetCombination = (
  preferredChainId?: number
): SupportedCombination => {
  // If preferred chain is specified, try to find USDC on that chain first
  if (preferredChainId) {
    const usdcOnPreferredChain = SUPPORTED_COMBINATIONS.find(
      (combo) => combo.chainId === preferredChainId && combo.symbol === "USDC"
    );
    if (usdcOnPreferredChain) {
      return usdcOnPreferredChain;
    }

    // If no USDC, get any supported token on preferred chain
    const anyOnPreferredChain = SUPPORTED_COMBINATIONS.find(
      (combo) => combo.chainId === preferredChainId
    );
    if (anyOnPreferredChain) {
      return anyOnPreferredChain;
    }
  }

  // Default: prefer USDC on Base
  const usdcOnBase = SUPPORTED_COMBINATIONS.find(
    (combo) =>
      combo.chainId === SUPPORTED_CHAINS.BASE && combo.symbol === "USDC"
  );
  if (usdcOnBase) {
    return usdcOnBase;
  }

  // Fallback to any supported combination
  return SUPPORTED_COMBINATIONS[0];
};
