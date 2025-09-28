const MORPHO_ENDPOINT = 'https://api.morpho.org/graphql';

type GraphQLError = { message: string };
type GraphQLResponse<T> = { data?: T; errors?: GraphQLError[] };

export async function morphoQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(MORPHO_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  const json = (await res.json()) as GraphQLResponse<T>;
  if (!res.ok || json.errors) {
    throw new Error(`Morpho API error: ${res.status} ${res.statusText} ${JSON.stringify(json.errors || {})}`);
  }
  if (!json.data) throw new Error('Morpho API returned no data');
  return json.data;
}

// User positions on a chain
const QUERY_USER_VAULT_POSITIONS = `
  query GetUserVaultPositions($chainId: Int!, $userAddress: String!) {
    userByAddress(chainId: $chainId, address: $userAddress) {
      address
      vaultPositions {
        vault { address name }
        assets
        assetsUsd
        shares
      }
    }
  }
`;

export type UserVaultPositions = {
  userByAddress: {
    address: string;
    vaultPositions: {
      vault: { address: string; name: string | null };
      assets: string;
      assetsUsd: string;
      shares: string;
    }[];
  } | null;
};

export async function getUserVaultPositions(chainId: number, userAddress: string) {
  return morphoQuery<UserVaultPositions>(QUERY_USER_VAULT_POSITIONS, { chainId, userAddress });
}

// Single vault current situation
const QUERY_VAULT_BY_ADDRESS = `
  query VaultByAddress($address: String!, $chainId: Int!) {
    vaultByAddress(address: $address, chainId: $chainId) {
      address
      symbol
      name
      whitelisted
      asset {
        id
        address
        decimals
        yield { apr }
      }
      chain { id network }
      state {
        totalAssets
        totalAssetsUsd
        totalSupply
        apy
        netApy
        sharePrice
        sharePriceUsd
        rewards {
          asset { address chain { id } }
          supplyApr
          yearlySupplyTokens
        }
        allocation {
          supplyCap
          supplyAssets
          supplyAssetsUsd
          market {
            uniqueKey
            loanAsset { name }
            collateralAsset { name }
            oracleAddress
            irmAddress
            lltv
          }
        }
      }
    }
  }
`;

export type VaultByAddress = {
  vaultByAddress: {
    address: string;
    symbol: string | null;
    name: string | null;
    whitelisted: boolean;
    asset: { id: string; address: string; decimals: number; yield: { apr: string | null } };
    chain: { id: number; network: string };
    state: {
      totalAssets: string;
      totalAssetsUsd: string;
      totalSupply: string;
      apy: string | null;
      netApy: string | null;
      sharePrice: string | null;
      sharePriceUsd: string | null;
      rewards: { asset: { address: string; chain: { id: number } }; supplyApr: string | null; yearlySupplyTokens: string | null }[] | null;
      allocation: {
        supplyCap: string | null;
        supplyAssets: string | null;
        supplyAssetsUsd: string | null;
        market: {
          uniqueKey: string;
          loanAsset: { name: string | null };
          collateralAsset: { name: string | null };
          oracleAddress: string | null;
          irmAddress: string | null;
          lltv: string | null;
        };
      }[] | null;
    };
  } | null;
};

export async function getVaultByAddress(chainId: number, address: string) {
  return morphoQuery<VaultByAddress>(QUERY_VAULT_BY_ADDRESS, { chainId, address });
}


