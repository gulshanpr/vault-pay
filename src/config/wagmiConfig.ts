import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, baseSepolia, base, unichain } from 'viem/chains';

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base, baseSepolia, unichain],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [unichain.id]: http(),
  },
});
