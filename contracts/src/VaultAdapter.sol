// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {IMetaMorpho} from "../lib/metamorpho/src/interfaces/IMetaMorpho.sol";

import {MerchantRegistry} from "./MerchantRegistry.sol";

contract VaultAdapter is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    MerchantRegistry public immutable REGISTRY;

    // === Storage ===
    mapping(address => bool) public allowedVaults;

    // === Events ===
    event Paid(
        address indexed merchant,
        MerchantRegistry.PayoutMode mode,
        uint256 cashAmount,
        uint256 shareAmount,
        address vault,
        uint256 sharesMinted
    );

    event VaultAllowed(address indexed vault, bool allowed);

    constructor(address _registry) Ownable(msg.sender) {
        REGISTRY = MerchantRegistry(_registry);
    }

    function settle(address merchant, uint256 amount, address vault, uint256 minSharesOut) external nonReentrant {
        MerchantRegistry.MerchantConfig memory cfg = REGISTRY.getConfig(merchant);
        require(cfg.exists, "merchant not registered");

        // Only validate vault if shares mode is used
        if (cfg.mode == MerchantRegistry.PayoutMode.SHARES_ONLY || cfg.mode == MerchantRegistry.PayoutMode.SPLIT) {
            require(vault != address(0), "vault address required");
            require(allowedVaults[vault], "vault not allowed");
        }

        // Pull tokens from payer
        IERC20 token = IERC20(cfg.payoutToken);
        token.safeTransferFrom(msg.sender, address(this), amount);

        // Take protocol fee
        uint256 fee = (amount * cfg.protocolFeeBps) / 10_000;
        uint256 net = amount - fee;
        if (fee > 0 && cfg.feeRecipient != address(0)) {
            token.safeTransfer(cfg.feeRecipient, fee);
        }

        uint256 sharesMinted = 0;
        uint256 toCash = 0;
        uint256 toShares = 0;

        if (cfg.mode == MerchantRegistry.PayoutMode.USDC_ONLY) {
            toCash = net;
            token.safeTransfer(cfg.merchantPayout, toCash);
        } else if (cfg.mode == MerchantRegistry.PayoutMode.SHARES_ONLY) {
            toShares = net;
            token.approve(vault, 0);
            token.approve(vault, toShares);
            sharesMinted = IMetaMorpho(vault).deposit(toShares, cfg.merchantPayout);
            require(sharesMinted >= minSharesOut, "slippage shares");
        } else if (cfg.mode == MerchantRegistry.PayoutMode.SPLIT) {
            toShares = (net * cfg.splitBps) / 10_000;
            toCash = net - toShares;

            if (toShares > 0) {
                token.approve(vault, 0);
                token.approve(vault, toShares);
                sharesMinted = IMetaMorpho(vault).deposit(toShares, cfg.merchantPayout);
                require(sharesMinted >= minSharesOut, "slippage shares");
            }
            if (toCash > 0) {
                token.safeTransfer(cfg.merchantPayout, toCash);
            }
        }

        emit Paid(merchant, cfg.mode, toCash, toShares, vault, sharesMinted);
    }

    // === Owner functions ===
    function setAllowedVault(address vault, bool allowed) external onlyOwner {
        require(vault != address(0), "zero vault address");
        allowedVaults[vault] = allowed;
        emit VaultAllowed(vault, allowed);
    }

    function setMultipleVaults(address[] calldata vaults, bool[] calldata allowed) external onlyOwner {
        require(vaults.length == allowed.length, "arrays length mismatch");

        for (uint256 i = 0; i < vaults.length; i++) {
            require(vaults[i] != address(0), "zero vault address");
            allowedVaults[vaults[i]] = allowed[i];
            emit VaultAllowed(vaults[i], allowed[i]);
        }
    }

    // === Getters ===
    function isAllowedVault(address vault) external view returns (bool) {
        return allowedVaults[vault];
    }
}
