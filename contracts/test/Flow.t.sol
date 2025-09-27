// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {VaultAdapter} from "../src/VaultAdapter.sol";
import {MerchantRegistry} from "../src/MerchantRegistry.sol";
import {IMetaMorpho} from "../lib/metamorpho/src/interfaces/IMetaMorpho.sol";

contract VaultAdapterForkTest is Test {
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant METAMORPHO_VAULT =
        address(0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB);

    address owner = address(0xA11CE);
    address merchant = address(0xB0B);
    address payer = address(0xCAFE);
    address feeRecip = address(0xFEE);

    MerchantRegistry registry;
    VaultAdapter adapter;

    function setUp() public {
        vm.startPrank(owner);
        registry = new MerchantRegistry();
        adapter = new VaultAdapter(address(registry));
        vm.stopPrank();

        vm.prank(owner);
        registry.setAllowedToken(USDC, true);

        // Register merchant config for SHARES_ONLY mode
        vm.prank(merchant);
        registry.registerMerchant({
            merchant: merchant,
            payoutToken: USDC,
            mode: MerchantRegistry.PayoutMode.SHARES_ONLY,
            splitBps: 5000,
            protocolFeeBps: 100,
            feeRecipient: feeRecip
        });

        // Allow vault in adapter
        vm.prank(owner);
        adapter.setAllowedVault(METAMORPHO_VAULT, true);
        deal(USDC, payer, 1_000_000e6); // 1,000,000 USDC (6 decimals)
    }

    function test_SettleSharesOnly_DepositsToMetaMorpho() public {
        uint256 amount = 10_000e6;

        uint256 expectedShares = IMetaMorpho(METAMORPHO_VAULT).previewDeposit(
            amount
        );
        assertGt(
            expectedShares,
            0,
            "vault preview is zero (paused or not accepting)"
        );

        uint256 beforePayerUSDC = IERC20(USDC).balanceOf(payer);
        uint256 beforeFeeRecipUSDC = IERC20(USDC).balanceOf(feeRecip);
        uint256 beforeMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 beforeMerchantShares = IMetaMorpho(METAMORPHO_VAULT).balanceOf(
            merchant
        );

        console.log("=== BEFORE DEPOSIT ===");
        console.log("Payer USDC:", beforePayerUSDC);
        console.log("Fee Recipient USDC:", beforeFeeRecipUSDC);
        console.log("Merchant USDC:", beforeMerchantUSDC);
        console.log("Merchant Shares:", beforeMerchantShares);

        vm.startPrank(payer);
        IERC20(USDC).approve(address(adapter), amount);
        adapter.settle({
            merchant: merchant,
            amount: amount,
            vault: METAMORPHO_VAULT,
            minSharesOut: (expectedShares * 99) / 100 // 1% slippage tolerance
        });
        vm.stopPrank();

        uint256 afterPayerUSDC = IERC20(USDC).balanceOf(payer);
        uint256 afterFeeRecipUSDC = IERC20(USDC).balanceOf(feeRecip);
        uint256 afterMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 afterMerchantShares = IMetaMorpho(METAMORPHO_VAULT).balanceOf(
            merchant
        );

        console.log("=== AFTER DEPOSIT ===");
        console.log("Payer USDC:", afterPayerUSDC);
        console.log("Fee Recipient USDC:", afterFeeRecipUSDC);
        console.log("Merchant USDC:", afterMerchantUSDC);
        console.log("Merchant Shares:", afterMerchantShares);

        console.log("=== DEPOSIT DELTAS ===");
        console.log("Payer USDC spent:", beforePayerUSDC - afterPayerUSDC);
        console.log("Fee received:", afterFeeRecipUSDC - beforeFeeRecipUSDC);
        console.log(
            "Shares minted:",
            afterMerchantShares - beforeMerchantShares
        );

        // Assertions for deposit
        uint256 fee = (amount * 100) / 10_000; // 1% = 100 bps
        assertEq(IERC20(USDC).balanceOf(feeRecip), fee, "fee mismatch");

        uint256 merchantShares = IMetaMorpho(METAMORPHO_VAULT).balanceOf(
            merchant
        );
        assertGe(
            merchantShares,
            (expectedShares * 99) / 100,
            "insufficient shares minted"
        );
    }

    function test_CompleteDepositAndRedeemFlow() public {
        uint256 depositAmount = 10_000e6;

        console.log("=== STARTING COMPLETE DEPOSIT & REDEEM FLOW ===");

        uint256 expectedShares = IMetaMorpho(METAMORPHO_VAULT).previewDeposit(
            depositAmount
        );
        assertGt(expectedShares, 0, "vault preview is zero");

        // --- BEFORE DEPOSIT ---
        uint256 beforeDepositPayerUSDC = IERC20(USDC).balanceOf(payer);
        uint256 beforeDepositFeeRecipUSDC = IERC20(USDC).balanceOf(feeRecip);
        uint256 beforeDepositMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 beforeDepositMerchantShares = IMetaMorpho(METAMORPHO_VAULT)
            .balanceOf(merchant);

        console.log("=== BEFORE DEPOSIT ===");
        console.log("Payer USDC:", beforeDepositPayerUSDC);
        console.log("Fee Recipient USDC:", beforeDepositFeeRecipUSDC);
        console.log("Merchant USDC:", beforeDepositMerchantUSDC);
        console.log("Merchant Shares:", beforeDepositMerchantShares);

        // --- DEPOSIT ---
        vm.startPrank(payer);
        IERC20(USDC).approve(address(adapter), depositAmount);
        adapter.settle({
            merchant: merchant,
            amount: depositAmount,
            vault: METAMORPHO_VAULT,
            minSharesOut: (expectedShares * 99) / 100
        });
        vm.stopPrank();

        // --- AFTER DEPOSIT ---
        uint256 afterDepositPayerUSDC = IERC20(USDC).balanceOf(payer);
        uint256 afterDepositFeeRecipUSDC = IERC20(USDC).balanceOf(feeRecip);
        uint256 afterDepositMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 afterDepositMerchantShares = IMetaMorpho(METAMORPHO_VAULT)
            .balanceOf(merchant);

        console.log("=== AFTER DEPOSIT ===");
        console.log("Payer USDC:", afterDepositPayerUSDC);
        console.log("Fee Recipient USDC:", afterDepositFeeRecipUSDC);
        console.log("Merchant USDC:", afterDepositMerchantUSDC);
        console.log("Merchant Shares:", afterDepositMerchantShares);

        console.log("=== DEPOSIT DELTAS ===");
        console.log(
            "Payer USDC spent:",
            beforeDepositPayerUSDC - afterDepositPayerUSDC
        );
        console.log(
            "Fee received:",
            afterDepositFeeRecipUSDC - beforeDepositFeeRecipUSDC
        );
        console.log(
            "Shares minted:",
            afterDepositMerchantShares - beforeDepositMerchantShares
        );

        // Validate deposit
        uint256 sharesMinted = afterDepositMerchantShares -
            beforeDepositMerchantShares;
        assertGt(sharesMinted, 0, "no shares minted");

        // --- REDEEM HALF ---
        console.log("\n=== STARTING REDEEM PROCESS ===");
        uint256 sharesToRedeem = sharesMinted / 2;
        uint256 expectedAssets = IMetaMorpho(METAMORPHO_VAULT).previewRedeem(
            sharesToRedeem
        );

        console.log("Shares to redeem:", sharesToRedeem);
        console.log("Expected assets from redeem:", expectedAssets);

        uint256 beforeRedeemMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 beforeRedeemMerchantShares = IMetaMorpho(METAMORPHO_VAULT)
            .balanceOf(merchant);

        console.log("=== BEFORE REDEEM ===");
        console.log("Merchant USDC:", beforeRedeemMerchantUSDC);
        console.log("Merchant Shares:", beforeRedeemMerchantShares);

        vm.startPrank(merchant);
        IERC20(METAMORPHO_VAULT).approve(address(adapter), sharesToRedeem);
        uint256 assetsReceived = adapter.redeemShares({
            vault: METAMORPHO_VAULT,
            shares: sharesToRedeem,
            recipient: merchant,
            minAssetsOut: (expectedAssets * 99) / 100
        });
        vm.stopPrank();

        uint256 afterRedeemMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 afterRedeemMerchantShares = IMetaMorpho(METAMORPHO_VAULT)
            .balanceOf(merchant);

        console.log("=== AFTER REDEEM ===");
        console.log("Merchant USDC:", afterRedeemMerchantUSDC);
        console.log("Merchant Shares:", afterRedeemMerchantShares);
        console.log("Assets received from redeem:", assetsReceived);

        console.log("=== REDEEM DELTAS ===");
        console.log(
            "USDC gained:",
            afterRedeemMerchantUSDC - beforeRedeemMerchantUSDC
        );
        console.log(
            "Shares burned:",
            beforeRedeemMerchantShares - afterRedeemMerchantShares
        );

        assertEq(
            assetsReceived,
            afterRedeemMerchantUSDC - beforeRedeemMerchantUSDC,
            "assets received mismatch"
        );
        assertEq(
            beforeRedeemMerchantShares - afterRedeemMerchantShares,
            sharesToRedeem,
            "shares burned mismatch"
        );
        assertGt(assetsReceived, 0, "no assets received");

        // --- REDEEM REMAINING ---
        console.log("\n=== REDEEMING ALL REMAINING SHARES ===");
        uint256 finalAssetsReceived = 0;
        {
            uint256 remainingShares = afterRedeemMerchantShares;
            if (remainingShares > 0) {
                uint256 expectedRemainingAssets = IMetaMorpho(METAMORPHO_VAULT)
                    .previewRedeem(remainingShares);

                console.log("Remaining shares to redeem:", remainingShares);
                console.log(
                    "Expected assets from remaining redeem:",
                    expectedRemainingAssets
                );

                uint256 beforeFinalUSDC = IERC20(USDC).balanceOf(merchant);
                uint256 beforeFinalShares = IMetaMorpho(METAMORPHO_VAULT)
                    .balanceOf(merchant);

                console.log("=== BEFORE FINAL REDEEM ===");
                console.log("Merchant USDC:", beforeFinalUSDC);
                console.log("Merchant Shares:", beforeFinalShares);

                vm.startPrank(merchant);
                IERC20(METAMORPHO_VAULT).approve(
                    address(adapter),
                    remainingShares
                );
                finalAssetsReceived = adapter.redeemAllShares({
                    vault: METAMORPHO_VAULT,
                    user: merchant,
                    recipient: merchant,
                    minAssetsOut: (expectedRemainingAssets * 99) / 100
                });
                vm.stopPrank();

                uint256 afterFinalUSDC = IERC20(USDC).balanceOf(merchant);
                uint256 afterFinalShares = IMetaMorpho(METAMORPHO_VAULT)
                    .balanceOf(merchant);

                console.log("=== AFTER FINAL REDEEM ===");
                console.log("Merchant USDC:", afterFinalUSDC);
                console.log("Merchant Shares:", afterFinalShares);
                console.log("Final assets received:", finalAssetsReceived);

                console.log("=== FINAL REDEEM DELTAS ===");
                console.log(
                    "Final USDC gained:",
                    afterFinalUSDC - beforeFinalUSDC
                );
                console.log(
                    "Final shares burned:",
                    beforeFinalShares - afterFinalShares
                );

                assertEq(afterFinalShares, 0, "should have no shares left");
                assertEq(
                    finalAssetsReceived,
                    afterFinalUSDC - beforeFinalUSDC,
                    "final assets mismatch"
                );
            }
        }

        // --- FINAL SUMMARY / ASSERTIONS ---
        uint256 endMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 endMerchantShares = IMetaMorpho(METAMORPHO_VAULT).balanceOf(
            merchant
        );

        uint256 feePaid = afterDepositFeeRecipUSDC - beforeDepositFeeRecipUSDC; // delta, not absolute
        uint256 netDeposited = depositAmount - feePaid;
        uint256 totalRecovered = endMerchantUSDC - beforeDepositMerchantUSDC; // captures both redeems

        console.log("\n=== COMPLETE FLOW SUMMARY ===");
        console.log("Original deposit amount:", depositAmount);
        console.log("Total fee paid:", feePaid);
        console.log("Net amount deposited to vault:", netDeposited);
        console.log("Total USDC recovered by merchant:", totalRecovered);
        console.log("Final merchant shares:", endMerchantShares);
        console.log(
            "Recovery ratio (%):",
            (totalRecovered * 100) / netDeposited
        );

        // Allow small rounding; target at least 98% of net deposit
        assertGe(
            totalRecovered,
            (netDeposited * 98) / 100,
            "poor recovery ratio"
        );
    }

    function test_USDCOnly_SendsCash_NoVaultNeeded() public {
        // Update config to USDC_ONLY
        vm.prank(merchant);
        registry.updateConfig({
            merchant: merchant,
            payoutToken: USDC,
            mode: MerchantRegistry.PayoutMode.USDC_ONLY,
            splitBps: 0,
            protocolFeeBps: 100,
            feeRecipient: feeRecip
        });

        uint256 amount = 5_000e6;

        vm.startPrank(payer);
        IERC20(USDC).approve(address(adapter), amount);
        // vault = address(0) is fine in USDC_ONLY mode
        adapter.settle(merchant, amount, address(0), 0);
        vm.stopPrank();

        // Merchant received net (amount - fee)
        uint256 fee = (amount * 100) / 10_000; // 1%
        uint256 net = amount - fee;
        assertEq(IERC20(USDC).balanceOf(merchant), net, "cash payout mismatch");
    }

    function test_WithdrawAssets_SpecificAmount() public {
        // First deposit to get shares
        uint256 depositAmount = 20_000e6;

        vm.startPrank(payer);
        IERC20(USDC).approve(address(adapter), depositAmount);
        adapter.settle({
            merchant: merchant,
            amount: depositAmount,
            vault: METAMORPHO_VAULT,
            minSharesOut: 0
        });
        vm.stopPrank();

        // Now test withdrawing specific asset amount
        uint256 assetsToWithdraw = 5_000e6; // Withdraw 5k USDC
        uint256 expectedShares = IMetaMorpho(METAMORPHO_VAULT).previewWithdraw(
            assetsToWithdraw
        );

        console.log("=== WITHDRAW SPECIFIC ASSETS TEST ===");
        console.log("Assets to withdraw:", assetsToWithdraw);
        console.log("Expected shares to burn:", expectedShares);

        uint256 beforeUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 beforeShares = IMetaMorpho(METAMORPHO_VAULT).balanceOf(
            merchant
        );

        console.log("Before withdraw - USDC:", beforeUSDC);
        console.log("Before withdraw - Shares:", beforeShares);

        vm.startPrank(merchant);
        IERC20(METAMORPHO_VAULT).approve(
            address(adapter),
            expectedShares + 100
        ); // Add buffer for slippage
        uint256 sharesBurned = adapter.withdrawAssets({
            vault: METAMORPHO_VAULT,
            assets: assetsToWithdraw,
            recipient: merchant,
            maxSharesIn: expectedShares + 100 // 1% slippage buffer
        });
        vm.stopPrank();

        uint256 afterUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 afterShares = IMetaMorpho(METAMORPHO_VAULT).balanceOf(merchant);

        console.log("After withdraw - USDC:", afterUSDC);
        console.log("After withdraw - Shares:", afterShares);
        console.log("Actual shares burned:", sharesBurned);

        console.log("=== WITHDRAW DELTAS ===");
        console.log("USDC gained:", afterUSDC - beforeUSDC);
        console.log("Shares burned:", beforeShares - afterShares);

        // Validate withdrawal
        assertEq(
            afterUSDC - beforeUSDC,
            assetsToWithdraw,
            "incorrect asset amount received"
        );
        assertEq(
            beforeShares - afterShares,
            sharesBurned,
            "shares burned mismatch"
        );
    }
}
