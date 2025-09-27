// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";
import {IEVault} from "../lib/euler-interfaces/interfaces/IEVault.sol";
import {MerchantRegistry} from "./MerchantRegistry.sol";

contract EulerVaultAdapter is ReentrancyGuard, Ownable {
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

    event Redeemed(
        address indexed merchant,
        address indexed vault,
        uint256 sharesRedeemed,
        uint256 assetsReceived,
        address recipient
    );

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
            sharesMinted = IEVault(vault).deposit(toShares, cfg.merchantPayout);
            require(sharesMinted >= minSharesOut, "slippage shares");
        } else if (cfg.mode == MerchantRegistry.PayoutMode.SPLIT) {
            toShares = (net * cfg.splitBps) / 10_000;
            toCash = net - toShares;

            if (toShares > 0) {
                token.approve(vault, 0);
                token.approve(vault, toShares);
                sharesMinted = IEVault(vault).deposit(toShares, cfg.merchantPayout);
                require(sharesMinted >= minSharesOut, "slippage shares");
            }
            if (toCash > 0) {
                token.safeTransfer(cfg.merchantPayout, toCash);
            }
        }

        emit Paid(merchant, cfg.mode, toCash, toShares, vault, sharesMinted);
    }

    // === Redeem Functions ===
    function redeemShares(address vault, uint256 shares, address recipient, uint256 minAssetsOut)
        external
        nonReentrant
        returns (uint256 assetsReceived)
    {
        require(allowedVaults[vault], "vault not allowed");
        require(recipient != address(0), "zero recipient");
        require(shares > 0, "zero shares");

        // Transfer shares from caller to this contract
        IEVault vaultContract = IEVault(vault);
        IERC20(vault).safeTransferFrom(msg.sender, address(this), shares);

        // Redeem shares for underlying assets using Euler's interface
        assetsReceived = vaultContract.redeem(shares, recipient, address(this));
        require(assetsReceived >= minAssetsOut, "slippage assets");

        emit Redeemed(msg.sender, vault, shares, assetsReceived, recipient);
    }

    // === Withdraw Functions ===
    function withdrawAssets(address vault, uint256 assets, address recipient, uint256 maxSharesIn)
        external
        nonReentrant
        returns (uint256 sharesBurned)
    {
        require(allowedVaults[vault], "vault not allowed");
        require(recipient != address(0), "zero recipient");
        require(assets > 0, "zero assets");

        IEVault vaultContract = IEVault(vault);

        // Preview how many shares will be needed
        uint256 sharesToBurn = vaultContract.previewWithdraw(assets);
        require(sharesToBurn <= maxSharesIn, "slippage shares");

        // Transfer shares from caller to this contract
        IERC20(vault).safeTransferFrom(msg.sender, address(this), sharesToBurn);

        // Withdraw assets by burning shares using Euler's interface
        sharesBurned = vaultContract.withdraw(assets, recipient, address(this));

        emit Redeemed(msg.sender, vault, sharesBurned, assets, recipient);
    }

    function redeemAllShares(address vault, address user, address recipient, uint256 minAssetsOut)
        external
        nonReentrant
        returns (uint256 assetsReceived)
    {
        require(allowedVaults[vault], "vault not allowed");
        require(recipient != address(0), "zero recipient");

        IEVault vaultContract = IEVault(vault);
        uint256 userShares = vaultContract.balanceOf(user);
        require(userShares > 0, "no shares to redeem");

        // Transfer all shares from user to this contract
        IERC20(vault).safeTransferFrom(user, address(this), userShares);

        // Redeem all shares for underlying assets using Euler's interface
        assetsReceived = vaultContract.redeem(userShares, recipient, address(this));
        require(assetsReceived >= minAssetsOut, "slippage assets");

        emit Redeemed(user, vault, userShares, assetsReceived, recipient);
    }

    // === View Functions for Redeem ===
    function previewRedeem(address vault, uint256 shares) external view returns (uint256 assets) {
        require(allowedVaults[vault], "vault not allowed");
        return IEVault(vault).previewRedeem(shares);
    }

    function previewWithdraw(address vault, uint256 assets) external view returns (uint256 shares) {
        require(allowedVaults[vault], "vault not allowed");
        return IEVault(vault).previewWithdraw(assets);
    }

    function previewDeposit(address vault, uint256 assets) external view returns (uint256 shares) {
        require(allowedVaults[vault], "vault not allowed");
        return IEVault(vault).previewDeposit(assets);
    }

    function getVaultAsset(address vault) external view returns (address asset) {
        require(allowedVaults[vault], "vault not allowed");
        return IEVault(vault).asset();
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
