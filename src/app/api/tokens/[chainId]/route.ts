import { NextRequest, NextResponse } from 'next/server';

// Fallback tokens for development/testing
function getFallbackTokensForChain(chainId: number): Record<string, any> {
  const fallbackTokens: Record<string, any> = {};

  // Add native token
  const nativeToken = {
    address: "0x0000000000000000000000000000000000000000",
    symbol: chainId === 1 ? "ETH" : chainId === 137 ? "MATIC" : "ETH",
    name: chainId === 1 ? "Ethereum" : chainId === 137 ? "Polygon" : "Ethereum",
    decimals: 18,
    logoURI: chainId === 1
      ? "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
      : chainId === 137
      ? "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png"
      : "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
  };
  fallbackTokens[nativeToken.address] = nativeToken;

  // Add some common tokens
  const commonTokens = [
    {
      address: "0xA0b86a33E644C8d4A8E7d94C4C4c8A7B9A8E8C8",
      symbol: "USDC",
      name: "USD Coin",
      decimals: 6,
      logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
    },
    {
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      symbol: "DAI",
      name: "Dai Stablecoin",
      decimals: 18,
      logoURI: "https://assets.coingecko.com/coins/images/9956/small/4943.png"
    }
  ];

  commonTokens.forEach(token => {
    fallbackTokens[token.address] = token;
  });

  return fallbackTokens;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ chainId: string }> }
) {
  try {
    const params = await context.params;
    const chainId = params.chainId;

    console.log(`API Route: Fetching tokens for chain ${chainId}`);

    if (!chainId) {
      return NextResponse.json(
        { error: 'Chain ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.1inch.dev/portfolio/portfolio/v5.0/general/tokens/${chainId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEV_PORTAL_KEY}`,
      },
    });

    console.log(`API Route: Response status for chain ${chainId}:`, response.status);

    // If we get a 404, the tokens endpoint doesn't exist for this chain
    if (response.status === 404) {
      console.warn(`API Route: Tokens endpoint not found for chain ${chainId}, returning fallback data`);
      // Return fallback tokens data
      const fallbackTokens = getFallbackTokensForChain(parseInt(chainId));
      return NextResponse.json(fallbackTokens);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Route: Error response for chain ${chainId}:`, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log(`API Route: Received tokens data for chain ${chainId}:`, data);
    console.log(`API Route: Data type:`, typeof data);

    return NextResponse.json(data);
  } catch (error) {
    const params = await context.params;
    console.error(`Error fetching tokens for chain ${params.chainId}:`, error);
    return NextResponse.json(
      { error: `Failed to fetch tokens for chain ${params.chainId}`, details: error instanceof Error ? error.message : String(error)  },
      { status: 500 }
    );
  }
}
