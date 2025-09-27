'use client';
import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { baseSepolia, polygon, arbitrum, optimism, mainnet } from 'viem/chains';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <div key="privy-provider-wrapper">
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID as string}
        config={{
        embeddedWallets: {
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
            walletList: ['metamask', 'coinbase_wallet', 'rainbow', 'wallet_connect'],
          },
        }}
      >
        {children}
      </PrivyProvider>
    </div>
  );
}
