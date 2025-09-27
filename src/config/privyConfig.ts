import type { PrivyClientConfig } from '@privy-io/react-auth';
import { mainnet, polygon, arbitrum, optimism, baseSepolia, base } from 'viem/chains';

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    createOnLogin: 'all-users',
    showWalletUIs: true,
  },
  supportedChains: [mainnet, polygon, arbitrum, optimism, base, baseSepolia],
  loginMethods: ['email', 'wallet'],
  externalWallets: {
    disableAllExternalWallets: false,
  },
  appearance: {
    theme: 'light',
    accentColor: '#2563eb',
    walletList: ['metamask', 'coinbase-wallet', 'rainbow', 'walletconnect'],
  },
};
