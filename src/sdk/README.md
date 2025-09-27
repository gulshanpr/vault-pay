# VaultPay SDK

A simple and powerful SDK for merchants to accept crypto payments with cross-chain swaps and yield earning capabilities.

## Features

✅ **Cross-chain payments** - Accept payments across different blockchains  
✅ **Token swapping** - Automatic token conversion using 1inch  
✅ **Yield earning** - Earn yield on received payments through Euler vaults  
✅ **Merchant-focused** - Simple integration for e-commerce platforms  
✅ **Order tracking** - Built-in payment and order management  
🔒 **Type Safety** - Full TypeScript support  
⚙️ **Modular Design** - Use individual managers or the complete SDK  

## Installation

```bash
npm install @vaultpay/sdk
# or
yarn add @vaultpay/sdk
```

## Quick Start

```typescript
import { VaultPaySDK } from '@vaultpay/sdk';

// Initialize the SDK
const sdk = new VaultPaySDK({
  network: 'mainnet',
  devPortalApiKey: 'your-1inch-api-key', // Optional for swaps
  walletClient: yourWalletClient, // From wagmi/viem
  debug: true
});

// Simple payment
const result = await sdk.quickPay({
  to: 'merchant.eth',
  amount: '100',
  token: 'USDC',
  enableYield: true // Automatically deposit into yield-bearing vault
});

console.log('Payment successful:', result);
```

## Core Concepts

### 1. Simple Payments

```typescript
// Pay with automatic ENS resolution
await sdk.quickPay({
  to: 'vitalik.eth',
  amount: '50',
  token: 'DAI'
});

// Pay with different token (automatic swap)
await sdk.quickPay({
  to: '0x742d35Cc6624C0532c26c5B75Fd53b3fCBb4E25b',
  amount: '100',
  token: 'USDC',
  payWith: 'ETH' // Will swap ETH to USDC automatically
});
```

### 2. Cross-Chain Operations

```typescript
// Swap tokens across chains and pay
await sdk.swapAndPay({
  to: 'store.eth',
  amount: '0.1',
  fromToken: 'ETH',
  toToken: 'USDC',
  fromChain: 1, // Ethereum
  toChain: 137, // Polygon
  slippage: 0.5
});
```

### 3. Yield Generation

```typescript
// Automatically find and use best yielding vault
await sdk.earnYield({
  amount: '1000',
  token: 'USDC'
});

// Or specify a particular vault
await sdk.earnYield({
  amount: '500',
  token: 'DAI',
  vault: '0x...' // Specific vault address
});
```

### 4. Merchant Payments

```typescript
// Specialized merchant payment with metadata
await sdk.merchantPay({
  merchantAddress: 'shop.eth',
  amount: '99.99',
  token: 'USDC',
  orderId: 'ORDER-123',
  description: 'Premium subscription',
  enableYield: true
});
```

## Manager Access

For advanced usage, access individual managers directly:

### Swap Manager

```typescript
// Get swap quote
const quote = await sdk.swap.getQuote({
  fromToken: 'ETH',
  toToken: 'USDC',
  amount: '1',
  slippage: 1
});

// Execute swap
const swapResult = await sdk.swap.executeSwap({
  fromToken: 'ETH',
  toToken: 'USDC',
  amount: '1',
  slippage: 1
});

// Cross-chain swap
const crossChainResult = await sdk.swap.crossChainSwap({
  fromToken: 'ETH',
  fromAmount: '0.5',
  toToken: 'USDC',
  srcChainId: 1,
  dstChainId: 137,
  slippage: 0.5
});
```

### Vault Manager

```typescript
// Search for vaults
const vaults = await sdk.vault.searchVaults({
  asset: 'USDC',
  sortBy: 'apy',
  sortOrder: 'desc',
  minApy: 5,
  limit: 10
});

// Deposit into vault
const depositResult = await sdk.vault.deposit({
  vault: '0x...',
  asset: 'USDC',
  amount: '1000'
});

// Withdraw from vault
const withdrawResult = await sdk.vault.withdraw({
  vault: '0x...',
  shares: '500' // or specify amount in underlying asset
});

// Get position info
const position = await sdk.vault.getPosition({
  vault: '0x...',
  user: '0x...'
});
```

### ENS Manager

```typescript
// Resolve ENS name
const address = await sdk.ens.resolve('vitalik.eth');

// Reverse resolution
const name = await sdk.ens.reverse('0x...');

// Get full profile
const profile = await sdk.ens.getProfile('vitalik.eth');
console.log(profile.avatar, profile.description, profile.twitter);

// Check availability
const available = await sdk.ens.checkAvailability('newname.eth');
```

### Payment Manager

```typescript
// Send payment with full control
const paymentResult = await sdk.payment.send({
  to: 'recipient.eth',
  amount: '100',
  asset: 'USDC',
  enableYield: true,
  slippage: 1,
  deadline: Date.now() + 20 * 60 * 1000 // 20 minutes
});

// Process merchant payment
const merchantResult = await sdk.payment.processMerchantPayment({
  to: 'merchant.eth',
  amount: '50',
  asset: 'DAI',
  orderId: 'ORDER-456',
  description: 'Digital product'
});

// Get payment history
const history = await sdk.payment.getHistory({
  user: '0x...',
  limit: 50
});
```

## Configuration

### Basic Configuration

```typescript
const sdk = new VaultPaySDK({
  network: 'mainnet', // 'mainnet' | 'sepolia' | 'polygon' | 'arbitrum' | 'optimism' | 'base'
  debug: false,
  timeout: 30000,
  retries: 3
});
```

### Advanced Configuration

```typescript
const sdk = new VaultPaySDK({
  network: 'mainnet',
  devPortalApiKey: 'your-1inch-dev-portal-key',
  walletClient: yourWalletClient, // From wagmi/viem
  publicClient: yourPublicClient, // From viem
  rpcUrl: 'https://your-custom-rpc.com',
  debug: true,
  timeout: 60000,
  retries: 5
});
```

## Convenience Functions

```typescript
import { createVaultPaySDK, createMainnetSDK, createTestnetSDK } from '@vaultpay/sdk';

// Standard creation
const sdk = createVaultPaySDK({
  network: 'mainnet',
  devPortalApiKey: 'your-key'
});

// Mainnet with defaults
const mainnetSDK = createMainnetSDK('your-api-key');

// Testnet with development defaults
const testnetSDK = createTestnetSDK({
  debug: true
});
```

## Health Monitoring

```typescript
// Check SDK health
const health = await sdk.healthCheck();
console.log('SDK Status:', health.status); // 'healthy' | 'degraded' | 'unhealthy'
console.log('Component Status:', health.checks);

// Get SDK info
console.log('Version:', sdk.version);
console.log('Network:', sdk.getCurrentNetwork());
console.log('Supported Networks:', sdk.getSupportedNetworks());
```

## Error Handling

```typescript
import { VaultPaySDKError, ERROR_CODES } from '@vaultpay/sdk';

try {
  await sdk.quickPay({ ... });
} catch (error) {
  if (error instanceof VaultPaySDKError) {
    console.log('Error Code:', error.code);
    console.log('Manager:', error.manager);
    console.log('Details:', error.details);
    
    // Handle specific errors
    switch (error.code) {
      case ERROR_CODES.INSUFFICIENT_BALANCE:
        // Handle insufficient balance
        break;
      case ERROR_CODES.SLIPPAGE_TOO_HIGH:
        // Handle slippage issues
        break;
      case ERROR_CODES.ENS_NOT_FOUND:
        // Handle ENS resolution failure
        break;
    }
  }
}
```

## Supported Networks

- **Ethereum Mainnet** (`mainnet`)
- **Sepolia Testnet** (`sepolia`)
- **Polygon** (`polygon`)
- **Arbitrum** (`arbitrum`)
- **Optimism** (`optimism`)
- **Base** (`base`)

## Supported Tokens

The SDK automatically detects and supports all major tokens on each network:

- **ETH/WETH** - Native tokens
- **USDC, USDT, DAI** - Stablecoins
- **WBTC** - Wrapped Bitcoin
- **Network-specific tokens** (MATIC, ARB, OP, etc.)

## Requirements

- Node.js 16+
- TypeScript 4.5+
- Wallet connection (wagmi/viem recommended)
- 1inch API key (optional, for enhanced swap features)

## Integration Examples

### Next.js Integration

```typescript
'use client';

import { VaultPaySDK } from '@vaultpay/sdk';
import { useWalletClient } from 'wagmi';

export function PaymentComponent() {
  const { data: walletClient } = useWalletClient();
  
  const sdk = new VaultPaySDK({
    network: 'mainnet',
    walletClient,
    debug: process.env.NODE_ENV === 'development'
  });

  const handlePayment = async () => {
    try {
      const result = await sdk.quickPay({
        to: 'merchant.eth',
        amount: '100',
        token: 'USDC'
      });
      
      console.log('Payment successful!', result);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return (
    <button onClick={handlePayment}>
      Pay with VaultPay
    </button>
  );
}
```

### React Hook

```typescript
import { useCallback } from 'react';
import { VaultPaySDK } from '@vaultpay/sdk';
import { useWalletClient } from 'wagmi';

export function useVaultPay() {
  const { data: walletClient } = useWalletClient();
  
  const sdk = new VaultPaySDK({
    network: 'mainnet',
    walletClient
  });

  const pay = useCallback(async (params: any) => {
    return await sdk.quickPay(params);
  }, [sdk]);

  const swap = useCallback(async (params: any) => {
    return await sdk.swap.executeSwap(params);
  }, [sdk]);

  return { pay, swap, sdk };
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📖 [Documentation](https://docs.vaultpay.dev)
- 🐛 [Issue Tracker](https://github.com/vaultpay/sdk/issues)
- 💬 [Discord Community](https://discord.gg/vaultpay)
- 📧 [Email Support](mailto:support@vaultpay.dev)