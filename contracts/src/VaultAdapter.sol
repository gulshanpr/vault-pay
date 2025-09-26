// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "../lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {IMetaMorpho} from "../lib/metamorpho/src/interfaces/IMetaMorpho.sol";

import {MerchantRegistry} from "./MerchantRegistry.sol";

contract VaultAdapter is ReentrancyGuard {
    using SafeERC20 for IERC20;

    MerchantRegistry public immutable REGISTRY;

    event Paid(
        address indexed merchant,
        MerchantRegistry.PayoutMode mode,
        uint256 cashAmount,
        uint256 shareAmount,
        address vault,
        uint256 sharesMinted
    );

    constructor(address _registry) {
        REGISTRY = MerchantRegistry(_registry);
    }

    function settle(
        address merchant,
        uint256 amount,
        uint256 minSharesOut
    ) external nonReentrant {
        MerchantRegistry.MerchantConfig memory cfg = REGISTRY.getConfig(merchant);
        require(cfg.exists, "merchant not registered");

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
            token.approve(cfg.vault, 0);
            token.approve(cfg.vault, toShares);
            sharesMinted = IMetaMorpho(cfg.vault).deposit(toShares, cfg.merchantPayout);
            require(sharesMinted >= minSharesOut, "slippage shares");

        } else if (cfg.mode == MerchantRegistry.PayoutMode.SPLIT) {
            toShares = (net * cfg.splitBps) / 10_000;
            toCash = net - toShares;

            if (toShares > 0) {
                token.approve(cfg.vault, 0);
                token.approve(cfg.vault, toShares);
                sharesMinted = IMetaMorpho(cfg.vault).deposit(toShares, cfg.merchantPayout);
                require(sharesMinted >= minSharesOut, "slippage shares");
            }
            if (toCash > 0) {
                token.safeTransfer(cfg.merchantPayout, toCash);
            }
        }

        emit Paid(
            merchant,
            cfg.mode,
            toCash,
            toShares,
            cfg.vault,
            sharesMinted
        );
    }
}
