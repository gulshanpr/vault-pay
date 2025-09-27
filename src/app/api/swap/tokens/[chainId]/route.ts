import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ chainId: string }> }
) {
  try {
    const params = await context.params;
    const chainId = params.chainId;

    console.log(`API Route: Fetching swap tokens for chain ${chainId}`);

    if (!chainId) {
      return NextResponse.json(
        { error: 'Chain ID is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`https://api.1inch.dev/swap/v6.1/${chainId}/tokens`, {
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_DEV_PORTAL_KEY}`,
      },
    });

    console.log(`API Route: Swap tokens response status for chain ${chainId}:`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Route: Swap tokens error response for chain ${chainId}:`, errorText);

      // If 1inch API fails, return fallback tokens
      const fallbackTokens = getFallbackTokensForSwap(chainId);
      return NextResponse.json(fallbackTokens);
    }

    const data = await response.json();
    console.log(`API Route: Received swap tokens data for chain ${chainId}, tokens count:`, Object.keys(data.tokens || {}).length);

    return NextResponse.json(data);
  } catch (error) {
    const params = await context.params;
    console.error(`Error fetching swap tokens for chain ${params.chainId}:`, error);

    // Return fallback tokens on error
    const fallbackTokens = getFallbackTokensForSwap(params.chainId);
    return NextResponse.json({
      error: 'Failed to fetch swap tokens',
      details: error instanceof Error ? error.message : String(error),
      fallback: true,
      tokens: fallbackTokens.tokens
    });
  }
}

// Fallback tokens for swap API
function getFallbackTokensForSwap(chainId: string): any {
  const fallbackTokens: any = {
    tokens: {}
  };

  // Add native token
  const nativeToken = {
    symbol: chainId === "1" ? "ETH" : chainId === "137" ? "MATIC" : "ETH",
    name: chainId === "1" ? "Ethereum" : chainId === "137" ? "Polygon" : "Ethereum",
    address: "0x0000000000000000000000000000000000000000",
    decimals: 18,
    logoURI: chainId === "1"
      ? "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
      : chainId === "137"
      ? "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png"
      : "https://assets.coingecko.com/coins/images/279/small/ethereum.png"
  };
  fallbackTokens.tokens[nativeToken.address] = nativeToken;

  // Add some common tokens
  const commonTokens = [
    {
      symbol: "USDC",
      name: "USD Coin",
      address: "0xA0b86a33E644C8d4A8E7d94C4C4c8A7B9A8E8C8",
      decimals: 6,
      logoURI: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png"
    },
    {
      symbol: "DAI",
      name: "Dai Stablecoin",
      address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      decimals: 18,
      logoURI: "https://assets.coingecko.com/coins/images/9956/small/4943.png"
    }
  ];

  commonTokens.forEach(token => {
    fallbackTokens.tokens[token.address] = token;
  });

  return fallbackTokens;
}
