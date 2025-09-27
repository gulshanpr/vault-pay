export const merchantRegistryAddress =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const merchantRegistry = [
  { type: "constructor", inputs: [], stateMutability: "nonpayable" },
  {
    type: "function",
    name: "allowedTokens",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getConfig",
    inputs: [{ name: "merchant", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct MerchantRegistry.MerchantConfig",
        components: [
          {
            name: "merchantPayout",
            type: "address",
            internalType: "address",
          },
          {
            name: "payoutToken",
            type: "address",
            internalType: "address",
          },
          {
            name: "mode",
            type: "uint8",
            internalType: "enum MerchantRegistry.PayoutMode",
          },
          { name: "splitBps", type: "uint16", internalType: "uint16" },
          {
            name: "protocolFeeBps",
            type: "uint16",
            internalType: "uint16",
          },
          {
            name: "feeRecipient",
            type: "address",
            internalType: "address",
          },
          { name: "exists", type: "bool", internalType: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAllowedToken",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registerMerchant",
    inputs: [
      { name: "merchant", type: "address", internalType: "address" },
      { name: "payoutToken", type: "address", internalType: "address" },
      {
        name: "mode",
        type: "uint8",
        internalType: "enum MerchantRegistry.PayoutMode",
      },
      { name: "splitBps", type: "uint16", internalType: "uint16" },
      {
        name: "protocolFeeBps",
        type: "uint16",
        internalType: "uint16",
      },
      { name: "feeRecipient", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setAllowedToken",
    inputs: [
      { name: "token", type: "address", internalType: "address" },
      { name: "allowed", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateConfig",
    inputs: [
      { name: "merchant", type: "address", internalType: "address" },
      { name: "payoutToken", type: "address", internalType: "address" },
      {
        name: "mode",
        type: "uint8",
        internalType: "enum MerchantRegistry.PayoutMode",
      },
      { name: "splitBps", type: "uint16", internalType: "uint16" },
      {
        name: "protocolFeeBps",
        type: "uint16",
        internalType: "uint16",
      },
      { name: "feeRecipient", type: "address", internalType: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "AllowedTokenSet",
    inputs: [
      {
        name: "token",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "allowed",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MerchantRegistered",
    inputs: [
      {
        name: "merchantId",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "merchant",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MerchantUpdated",
    inputs: [
      {
        name: "merchantId",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
] as const;

export const vaultAdapterAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const vaultAdapter = [
  {
    type: "constructor",
    inputs: [{ name: "_registry", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "REGISTRY",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract MerchantRegistry",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowedVaults",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVaultAsset",
    inputs: [{ name: "vault", type: "address", internalType: "address" }],
    outputs: [{ name: "asset", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAllowedVault",
    inputs: [{ name: "vault", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewRedeem",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "shares", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "assets", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewWithdraw",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "assets", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "shares", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "redeemAllShares",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "user", type: "address", internalType: "address" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "minAssetsOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "assetsReceived",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "redeemShares",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "shares", type: "uint256", internalType: "uint256" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "minAssetsOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "assetsReceived",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setAllowedVault",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "allowed", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setMultipleVaults",
    inputs: [
      { name: "vaults", type: "address[]", internalType: "address[]" },
      { name: "allowed", type: "bool[]", internalType: "bool[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "settle",
    inputs: [
      { name: "merchant", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "vault", type: "address", internalType: "address" },
      { name: "minSharesOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawAssets",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "assets", type: "uint256", internalType: "uint256" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "maxSharesIn", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "sharesBurned", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Paid",
    inputs: [
      {
        name: "merchant",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "mode",
        type: "uint8",
        indexed: false,
        internalType: "enum MerchantRegistry.PayoutMode",
      },
      {
        name: "cashAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "shareAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "vault",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "sharesMinted",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Redeemed",
    inputs: [
      {
        name: "merchant",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "vault",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "sharesRedeemed",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "assetsReceived",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "recipient",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "VaultAllowed",
    inputs: [
      {
        name: "vault",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "allowed",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
  },
] as const;

export const eulerVaultAdapterAddress =
  "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

export const eulerVaultAdapter = [
  {
    type: "constructor",
    inputs: [{ name: "_registry", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "REGISTRY",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract MerchantRegistry",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "allowedVaults",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getVaultAsset",
    inputs: [{ name: "vault", type: "address", internalType: "address" }],
    outputs: [{ name: "asset", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAllowedVault",
    inputs: [{ name: "vault", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewDeposit",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "assets", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "shares", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewRedeem",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "shares", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "assets", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "previewWithdraw",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "assets", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "shares", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "redeemAllShares",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "user", type: "address", internalType: "address" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "minAssetsOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "assetsReceived",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "redeemShares",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "shares", type: "uint256", internalType: "uint256" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "minAssetsOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "assetsReceived",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setAllowedVault",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "allowed", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setMultipleVaults",
    inputs: [
      { name: "vaults", type: "address[]", internalType: "address[]" },
      { name: "allowed", type: "bool[]", internalType: "bool[]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "settle",
    inputs: [
      { name: "merchant", type: "address", internalType: "address" },
      { name: "amount", type: "uint256", internalType: "uint256" },
      { name: "vault", type: "address", internalType: "address" },
      { name: "minSharesOut", type: "uint256", internalType: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [{ name: "newOwner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawAssets",
    inputs: [
      { name: "vault", type: "address", internalType: "address" },
      { name: "assets", type: "uint256", internalType: "uint256" },
      { name: "recipient", type: "address", internalType: "address" },
      { name: "maxSharesIn", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      { name: "sharesBurned", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Paid",
    inputs: [
      {
        name: "merchant",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "mode",
        type: "uint8",
        indexed: false,
        internalType: "enum MerchantRegistry.PayoutMode",
      },
      {
        name: "cashAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "shareAmount",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "vault",
        type: "address",
        indexed: false,
        internalType: "address",
      },
      {
        name: "sharesMinted",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Redeemed",
    inputs: [
      {
        name: "merchant",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "vault",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "sharesRedeemed",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "assetsReceived",
        type: "uint256",
        indexed: false,
        internalType: "uint256",
      },
      {
        name: "recipient",
        type: "address",
        indexed: false,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "VaultAllowed",
    inputs: [
      {
        name: "vault",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "allowed",
        type: "bool",
        indexed: false,
        internalType: "bool",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [{ name: "owner", type: "address", internalType: "address" }],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [{ name: "account", type: "address", internalType: "address" }],
  },
  { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
  {
    type: "error",
    name: "SafeERC20FailedOperation",
    inputs: [{ name: "token", type: "address", internalType: "address" }],
  },
] as const;

export const protocolFeeAddress = "0xe1A0281D8Ac7c2B934F33aCb9424F6b97d5B8c7B";
