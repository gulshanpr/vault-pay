export interface SupportedChain {
  chain_id: number;
  chain_name: string;
  chain_icon: string;
  native_token: {
    chain: number;
    address: string;
    decimals: number;
    symbol: string | null;
    name: string | null;
  };
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

// Fallback data for development/testing
const FALLBACK_CHAINS: SupportedChain[] = [
  {
    chain_id: 1,
    chain_name: "Ethereum",
    chain_icon: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    native_token: {
      chain: 1,
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      symbol: "ETH",
      name: "Ethereum"
    }
  },
  {
    chain_id: 137,
    chain_name: "Polygon",
    chain_icon: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png",
    native_token: {
      chain: 137,
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      symbol: "MATIC",
      name: "Polygon"
    }
  },
  {
    chain_id: 42161,
    chain_name: "Arbitrum One",
    chain_icon: "https://assets.coingecko.com/coins/images/16547/small/arbitrum.png",
    native_token: {
      chain: 42161,
      address: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      symbol: "ETH",
      name: "Ethereum"
    }
  }
];

// Fallback tokens for development/testing
function getFallbackTokens(chainId: number): Record<string, Token> {
  const fallbackTokens: Record<string, Token> = {};

  // Add native token
  const nativeToken: Token = {
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

export class TokenService {
  private readonly BASE_URL = "/api";
  private chainsData: SupportedChain[] | null = null;

  async getSupportedChains(): Promise<SupportedChain[]> {
    try {
      // Try to load from local JSON file first (faster, no API limits)
      if (!this.chainsData) {
        console.log('TokenService: Loading chains from local JSON file');
        try {
          const response = await fetch('/data/chains.json');
          console.log('TokenService: Fetch response status:', response.status);
          console.log('TokenService: Fetch response ok:', response.ok);

          if (response.ok) {
            const text = await response.text();
            console.log('TokenService: Raw response text length:', text?.length || 0);
            if (text) {
              this.chainsData = JSON.parse(text);
              console.log('TokenService: Loaded chains from JSON file:', this.chainsData?.length || 0, 'chains');
              return this.chainsData || FALLBACK_CHAINS;
            } else {
              console.warn('TokenService: Empty response text, using fallback');
              return FALLBACK_CHAINS;
            }
          } else {
            console.warn('TokenService: JSON file not found, falling back to API');
          }
        } catch (error) {
          console.error('TokenService: Error loading JSON file:', error);
        }
      } else {
        console.log('TokenService: Using cached chains data');
        return this.chainsData || FALLBACK_CHAINS;
      }

      // Fallback to API if JSON file fails
      console.log('TokenService: Fetching chains from', `${this.BASE_URL}/chains`);
      const response = await fetch(`${this.BASE_URL}/chains`);

      console.log('TokenService: Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('TokenService: API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('TokenService: Received data:', data);
      console.log('TokenService: Data type:', typeof data);
      console.log('TokenService: Is array:', Array.isArray(data));

      // Ensure we return an array
      if (Array.isArray(data)) {
        this.chainsData = data; // Cache for future use
        return data;
      } else {
        console.warn('TokenService: API returned non-array data, using fallback');
        this.chainsData = FALLBACK_CHAINS;
        return FALLBACK_CHAINS;
      }
    } catch (error) {
      console.error("TokenService: Error fetching supported chains, using fallback:", error);
      this.chainsData = FALLBACK_CHAINS;
      return FALLBACK_CHAINS;
    }
  }

  async getTokensForChain(chainId: number): Promise<Record<string, Token>> {
    try {
      console.log(`TokenService: Fetching swap tokens for chain ${chainId} from`, `/api/swap/tokens/${chainId}`);
      const response = await fetch(`/api/swap/tokens/${chainId}`);

      console.log('TokenService: Swap tokens response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('TokenService: Swap tokens API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('TokenService: Swap tokens received data:', data);
      console.log('TokenService: Tokens count:', Object.keys(data.tokens || {}).length);

      // The 1inch swap API returns { tokens: { address: tokenData } }
      // We need to return just the tokens object
      if (data.tokens && typeof data.tokens === 'object') {
        return data.tokens;
      } else {
        console.warn('TokenService: Unexpected tokens data format, using fallback');
        return getFallbackTokens(chainId);
      }
    } catch (error) {
      console.error(`TokenService: Error fetching swap tokens for chain ${chainId}, using fallback:`, error);
      return getFallbackTokens(chainId);
    }
  }
}

export const tokenService = new TokenService();
