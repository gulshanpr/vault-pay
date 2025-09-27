# Vault-Pay Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# 1inch API Configuration
NEXT_PUBLIC_DEV_PORTAL_KEY=your_1inch_dev_portal_api_key_here

# Wallet Configuration
NEXT_PUBLIC_WALLET_KEY=your_private_key_here
NEXT_PUBLIC_WALLET_ADDRESS=your_wallet_address_here

# RPC Configuration
NEXT_PUBLIC_RPC_URL=https://mainnet.infura.io/v3/your_infura_project_id

# Privy Configuration (for wallet connection)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

### Getting API Keys

1. **1inch Dev Portal API Key**: Sign up at [1inch Dev Portal](https://portal.1inch.dev/) and create an API key
2. **Infura Project ID**: Get one from [Infura](https://infura.io/)
3. **Privy App ID**: Get one from [Privy Dashboard](https://dashboard.privy.io/)

## Features Implemented

### ✅ Dashboard Layout
- Collapsible sidebar navigation
- Responsive design
- Dark/light mode support

### ✅ Merchant Onboarding Form
- Address validation
- Payout mode selection (USDC_ONLY, SHARES_ONLY, SPLIT)
- Fee configuration
- Form validation

### ✅ 1inch Swap Integration
- Token selection modal
- Real-time price quotes
- Order placement and monitoring
- Error handling

### ✅ Smart Contract Integration
- MerchantRegistry contract for merchant management
- VaultAdapter contracts for yield-bearing settlements
- EulerVaultAdapter for Euler vault integration

## Usage

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (see above)

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Deploy smart contracts**:
   ```bash
   cd contracts
   forge build
   forge deploy
   ```

## Pages

- `/` - Dashboard home with overview
- `/merchant-setup` - Merchant registration form
- `/swap` - 1inch swap interface

## Architecture

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Web3**: Viem, Wagmi, Privy for wallet management
- **Swap Integration**: 1inch Cross-chain SDK
- **Smart Contracts**: Solidity with Foundry
