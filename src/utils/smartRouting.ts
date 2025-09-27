import { AVAILABLE_VAULTS, SUPPORTED_CHAINS, VaultInfo, TokenInfo, CHAIN_TO_1INCH_NETWORK } from './vaultConfig';
import { NetworkEnum } from "@1inch/cross-chain-sdk";

export interface UserTokenInput {
  chainId: number;
  tokenAddress: string;
  tokenSymbol?: string;
  amount: string;
  preferredProtocol?: 'morpho' | 'euler';
}

export interface SwapRoute {
  needsSwap: boolean;
  sourceChain: number;
  sourceToken: string;
  targetChain: number;
  targetToken: string;
  targetVault: VaultInfo;
  swapParams?: {
    srcChainId: NetworkEnum;
    dstChainId: NetworkEnum;
    srcTokenAddress: string;
    dstTokenAddress: string;
    amount: string;
  };
}

export interface RouteAnalysis {
  isDirectlySupported: boolean;
  availableRoutes: SwapRoute[];
  recommendedRoute: SwapRoute | null;
  supportedAlternatives: VaultInfo[];
}

// Check if user's token/chain is directly supported
export function isDirectlySupported(chainId: number, tokenAddress: string): VaultInfo | null {
  return AVAILABLE_VAULTS.find(vault => 
    vault.chainId === chainId && 
    vault.token.address.toLowerCase() === tokenAddress.toLowerCase()
  ) || null;
}

// Find all vaults for a specific token symbol
export function findVaultsByTokenSymbol(tokenSymbol: string, protocol?: 'morpho' | 'euler'): VaultInfo[] {
  return AVAILABLE_VAULTS.filter(vault => 
    vault.token.symbol === tokenSymbol &&
    (protocol ? vault.protocol === protocol : true)
  );
}

// Find the best route for a user's input
export function analyzeRoute(userInput: UserTokenInput): RouteAnalysis {
  const { chainId, tokenAddress, tokenSymbol, amount, preferredProtocol } = userInput;

  // Check if directly supported
  const directVault = isDirectlySupported(chainId, tokenAddress);
  
  if (directVault && (!preferredProtocol || directVault.protocol === preferredProtocol)) {
    return {
      isDirectlySupported: true,
      availableRoutes: [{
        needsSwap: false,
        sourceChain: chainId,
        sourceToken: tokenAddress,
        targetChain: chainId,
        targetToken: tokenAddress,
        targetVault: directVault,
      }],
      recommendedRoute: {
        needsSwap: false,
        sourceChain: chainId,
        sourceToken: tokenAddress,
        targetChain: chainId,
        targetToken: tokenAddress,
        targetVault: directVault,
      },
      supportedAlternatives: [],
    };
  }

  // Find alternative routes
  const availableRoutes: SwapRoute[] = [];
  const supportedAlternatives: VaultInfo[] = [];

  // If we have token symbol, find vaults with same token on different chains
  if (tokenSymbol) {
    const sameTokenVaults = findVaultsByTokenSymbol(tokenSymbol, preferredProtocol);
    
    for (const vault of sameTokenVaults) {
      if (vault.chainId === chainId && vault.token.address.toLowerCase() === tokenAddress.toLowerCase()) {
        continue; // Skip if it's the same as input (already checked above)
      }

      // Check if 1inch supports both chains
      const sourceNetwork = CHAIN_TO_1INCH_NETWORK[chainId as keyof typeof CHAIN_TO_1INCH_NETWORK];
      const targetNetwork = CHAIN_TO_1INCH_NETWORK[vault.chainId as keyof typeof CHAIN_TO_1INCH_NETWORK];

      if (sourceNetwork && targetNetwork) {
        availableRoutes.push({
          needsSwap: true,
          sourceChain: chainId,
          sourceToken: tokenAddress,
          targetChain: vault.chainId,
          targetToken: vault.token.address,
          targetVault: vault,
          swapParams: {
            srcChainId: NetworkEnum[sourceNetwork],
            dstChainId: NetworkEnum[targetNetwork],
            srcTokenAddress: tokenAddress,
            dstTokenAddress: vault.token.address,
            amount,
          },
        });
      }

      supportedAlternatives.push(vault);
    }
  }

  // If no same-token routes, find routes to similar stable tokens
  if (availableRoutes.length === 0) {
    const stableTokenRoutes = findStableTokenRoutes(userInput);
    availableRoutes.push(...stableTokenRoutes);
  }

  // Recommend the best route
  const recommendedRoute = selectBestRoute(availableRoutes, preferredProtocol);

  return {
    isDirectlySupported: false,
    availableRoutes,
    recommendedRoute,
    supportedAlternatives,
  };
}

// Find routes to stable tokens (USDC, USDT, etc.)
function findStableTokenRoutes(userInput: UserTokenInput): SwapRoute[] {
  const { chainId, tokenAddress, amount, preferredProtocol } = userInput;
  const routes: SwapRoute[] = [];

  // Priority order for stable tokens
  const stablePriority = ['USDC', 'USDT', 'EURC', 'USDS'];

  for (const stableSymbol of stablePriority) {
    const stableVaults = findVaultsByTokenSymbol(stableSymbol, preferredProtocol);
    
    for (const vault of stableVaults) {
      const sourceNetwork = CHAIN_TO_1INCH_NETWORK[chainId as keyof typeof CHAIN_TO_1INCH_NETWORK];
      const targetNetwork = CHAIN_TO_1INCH_NETWORK[vault.chainId as keyof typeof CHAIN_TO_1INCH_NETWORK];

      if (sourceNetwork && targetNetwork) {
        routes.push({
          needsSwap: true,
          sourceChain: chainId,
          sourceToken: tokenAddress,
          targetChain: vault.chainId,
          targetToken: vault.token.address,
          targetVault: vault,
          swapParams: {
            srcChainId: NetworkEnum[sourceNetwork],
            dstChainId: NetworkEnum[targetNetwork],
            srcTokenAddress: tokenAddress,
            dstTokenAddress: vault.token.address,
            amount,
          },
        });
      }
    }
  }

  return routes;
}

// Select the best route based on preferences
function selectBestRoute(routes: SwapRoute[], preferredProtocol?: 'morpho' | 'euler'): SwapRoute | null {
  if (routes.length === 0) return null;

  // Sort routes by preference
  const sortedRoutes = routes.sort((a, b) => {
    // Prefer same chain (no cross-chain needed)
    if (!a.needsSwap && b.needsSwap) return -1;
    if (a.needsSwap && !b.needsSwap) return 1;

    // Prefer preferred protocol
    if (preferredProtocol) {
      if (a.targetVault.protocol === preferredProtocol && b.targetVault.protocol !== preferredProtocol) return -1;
      if (a.targetVault.protocol !== preferredProtocol && b.targetVault.protocol === preferredProtocol) return 1;
    }

    // Prefer Base chain (lower fees)
    if (a.targetVault.chainId === SUPPORTED_CHAINS.BASE && b.targetVault.chainId !== SUPPORTED_CHAINS.BASE) return -1;
    if (a.targetVault.chainId !== SUPPORTED_CHAINS.BASE && b.targetVault.chainId === SUPPORTED_CHAINS.BASE) return 1;

    // Prefer USDC
    if (a.targetVault.token.symbol === 'USDC' && b.targetVault.token.symbol !== 'USDC') return -1;
    if (a.targetVault.token.symbol !== 'USDC' && b.targetVault.token.symbol === 'USDC') return 1;

    return 0;
  });

  return sortedRoutes[0];
}

// Get user-friendly route description
export function getRouteDescription(route: SwapRoute): string {
  if (!route.needsSwap) {
    return `Direct deposit to ${route.targetVault.protocol} ${route.targetVault.token.symbol} vault on ${route.targetVault.chainName}`;
  }

  const sourceChainName = getChainName(route.sourceChain);
  return `Swap from ${sourceChainName} to ${route.targetVault.chainName} ${route.targetVault.token.symbol}, then deposit to ${route.targetVault.protocol} vault`;
}

// Helper to get chain name
function getChainName(chainId: number): string {
  switch (chainId) {
    case SUPPORTED_CHAINS.BASE: return 'Base';
    case SUPPORTED_CHAINS.ARBITRUM: return 'Arbitrum';
    case SUPPORTED_CHAINS.UNICHAIN: return 'Unichain';
    default: return `Chain ${chainId}`;
  }
}

// Check if a chain is supported by 1inch
export function isChainSupportedBy1inch(chainId: number): boolean {
  return chainId in CHAIN_TO_1INCH_NETWORK;
}

// Get all supported combinations
export function getSupportedCombinations(): Array<{chainName: string, chainId: number, tokens: TokenInfo[], vaults: VaultInfo[]}> {
  const combinations: Record<number, {chainName: string, chainId: number, tokens: Set<string>, vaults: VaultInfo[]}> = {};

  for (const vault of AVAILABLE_VAULTS) {
    if (!combinations[vault.chainId]) {
      combinations[vault.chainId] = {
        chainName: vault.chainName,
        chainId: vault.chainId,
        tokens: new Set(),
        vaults: [],
      };
    }
    combinations[vault.chainId].tokens.add(JSON.stringify(vault.token));
    combinations[vault.chainId].vaults.push(vault);
  }

  return Object.values(combinations).map(combo => ({
    chainName: combo.chainName,
    chainId: combo.chainId,
    tokens: Array.from(combo.tokens).map(tokenStr => JSON.parse(tokenStr)),
    vaults: combo.vaults,
  }));
}
