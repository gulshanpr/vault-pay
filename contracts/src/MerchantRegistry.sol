// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract MerchantRegistry is Ownable {
    enum PayoutMode {
        USDC_ONLY,
        SHARES_ONLY,
        SPLIT
    }

    struct MerchantConfig {
        address merchantPayout;
        address payoutToken;      // stablecoin (must be allowed)
        PayoutMode mode;          // payout mode
        uint16 splitBps;          // for SPLIT: 0..10000
        uint16 protocolFeeBps;    // optional protocol fee
        address feeRecipient;     // where fees go
        address vault;            // ERC-4626 vault for shares
        bool exists;              // marker
    }

    constructor() Ownable(msg.sender) {}

    // === Storage ===
    mapping(address => MerchantConfig) private merchantConfigs;
    mapping(address => bool) public allowedTokens;

    // === Events ===
    event MerchantRegistered(address indexed merchantId, address indexed merchant);
    event MerchantUpdated(address indexed merchantId);
    event AllowedTokenSet(address token, bool allowed);

    // === Merchant functions ===
    function registerMerchant(
        address merchant,
        address payoutToken,
        PayoutMode mode,
        uint16 splitBps,
        uint16 protocolFeeBps,
        address feeRecipient,
        address vault
    ) external {
        require(!merchantConfigs[merchant].exists, "already registered");
        require(splitBps <= 10_000, "bad split");
        require(protocolFeeBps <= 1000, "fee too high"); // cap 10%
        require(allowedTokens[payoutToken], "payout token not allowed");

        merchantConfigs[merchant] = MerchantConfig({
            merchantPayout: msg.sender,
            payoutToken: payoutToken,
            mode: mode,
            splitBps: splitBps,
            protocolFeeBps: protocolFeeBps,
            feeRecipient: feeRecipient,
            vault: vault,
            exists: true
        });

        emit MerchantRegistered(merchant, msg.sender);
    }

    function updateConfig(
        address merchant,
        address payoutToken,
        PayoutMode mode,
        uint16 splitBps,
        uint16 protocolFeeBps,
        address feeRecipient,
        address vault
    ) external {
        MerchantConfig storage cfg = merchantConfigs[merchant];
        require(cfg.exists, "not registered");
        require(msg.sender == cfg.merchantPayout, "not merchant");
        require(splitBps <= 10_000, "bad split");
        require(protocolFeeBps <= 1000, "fee too high");
        require(allowedTokens[payoutToken], "payout token not allowed");

        cfg.payoutToken = payoutToken;
        cfg.mode = mode;
        cfg.splitBps = splitBps;
        cfg.protocolFeeBps = protocolFeeBps;
        cfg.feeRecipient = feeRecipient;
        cfg.vault = vault;

        emit MerchantUpdated(merchant);
    }

    // === Owner functions ===
    function setAllowedToken(address token, bool allowed) external onlyOwner {
        allowedTokens[token] = allowed;
        emit AllowedTokenSet(token, allowed);
    }

    // === Getters ===
    function getConfig(address merchant) external view returns (MerchantConfig memory) {
        return merchantConfigs[merchant];
    }

    function isAllowedToken(address token) external view returns (bool) {
        return allowedTokens[token];
    }
}
