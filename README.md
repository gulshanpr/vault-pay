# VaultPay

VaultPay: Universal DeFi dashboard for ERC-4626 vaults across chains with cross-chain swaps and yield farming.

## What we are doing??
VaultPay is a unified DeFi platform that transforms how users interact with yield-bearing vaults across multiple chains. Built on ERC-4626 standards, it aggregates Morpho and Euler vaults from Base, Arbitrum, and Unichain into one seamless interface. Users can swap tokens, deposit into high-yield vaults, and redeem positions without juggling multiple protocols. The platform features cross-chain swapping via 1inch Fusion+, real-time APY tracking, ENS integration for vault naming, and merchant tools for accepting vault tokens as payments. It's like having a universal remote for DeFi - one dashboard to manage your yield farming across the entire multichain ecosystem.

## How we did it??
VaultPay Tech Stack Summary:
Frontend: Next.js 15 + React 19, TypeScript, Tailwind CSS, Radix UI components, Framer Motion animations
Blockchain: Wagmi + Viem for Web3 interactions, Privy for wallet auth, supporting 6 chains (Ethereum, Base, Arbitrum, Optimism, Polygon, Unichain)
Smart Contracts: Solidity with Foundry, OpenZeppelin libraries, MerchantRegistry contract for payment configs
Key Integrations:
1inch Fusion+ SDK for cross-chain swaps
Morpho GraphQL API for vault data
Euler lens contracts for on-chain vault info
ENS for vault naming
Supabase PostgreSQL for merchant data
Architecture: Full-stack DeFi app with custom SDK, real-time data fetching, React Query caching, and API routes for backend logic
Development: Foundry for contracts, Next.js Turbo for fast builds, TypeScript throughout for type safety
Essentially, it's a modern Web3 stack that combines the best DeFi protocols into one seamless merchant payment platform with yield farming capabilities.


