'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { baseSepolia, polygon, arbitrum, optimism, mainnet } from 'viem/chains';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
      config={{
        embeddedWallets: {
          createOnLogin: "all-users", // Create embedded wallets for merchants
          showWalletUIs: true,
        },
        supportedChains: [mainnet, polygon, arbitrum, optimism, baseSepolia],
        loginMethods: ["email", "wallet"],
        externalWallets: {
          disableAllExternalWallets: false, // Enable external wallets for flexibility
        },
        appearance: {
          theme: 'light',
          accentColor: '#2563eb',
          walletList: ['metamask', 'coinbase-wallet', 'rainbow', 'walletconnect'],
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
