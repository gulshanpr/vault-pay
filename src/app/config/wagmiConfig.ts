import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { mainnet, polygon, arbitrum, optimism, baseSepolia } from 'viem/chains';

export const wagmiConfig = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, baseSepolia],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [baseSepolia.id]: http(),
  },
});
