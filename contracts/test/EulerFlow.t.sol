// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "../lib/forge-std/src/Test.sol";
import {console} from "../lib/forge-std/src/console.sol";
import {IERC20} from "../lib/openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {EulerVaultAdapter} from "../src/EulerVaultAdapter.sol";
import {MerchantRegistry} from "../src/MerchantRegistry.sol";
import {IEVault} from "../lib/euler-interfaces/interfaces/IEVault.sol";

contract EulerVaultAdapterForkTest is Test {
    address constant USDC = 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3;
    address constant EULER_VAULT =
        address(0x2daCa71Cb58285212Dc05D65Cfd4f59A82BC4cF6);

    address owner = address(0xA11CE);
    address merchant = address(0xB0B);
    address payer = address(0xCAFE);
    address feeRecip = address(0xFEE);

    MerchantRegistry registry;
    EulerVaultAdapter adapter;

    function setUp() public {
        vm.startPrank(owner);
        registry = new MerchantRegistry();
        adapter = new EulerVaultAdapter(address(registry));
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
        adapter.setAllowedVault(EULER_VAULT, true);
        deal(USDC, payer, 1_000_000e6); // 1,000,000 USDC (6 decimals)
    }

    function test_SettleSharesOnly_DepositsToEulerVault() public {
        uint256 amount = 10_000e6;

        uint256 expectedShares = IEVault(EULER_VAULT).previewDeposit(amount);
        assertGt(
            expectedShares,
            0,
            "vault preview is zero (paused or not accepting)"
        );

        uint256 beforePayerUSDC = IERC20(USDC).balanceOf(payer);
        uint256 beforeFeeRecipUSDC = IERC20(USDC).balanceOf(feeRecip);
        uint256 beforeMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 beforeMerchantShares = IEVault(EULER_VAULT).balanceOf(merchant);

        console.log("=== BEFORE DEPOSIT (EULER) ===");
        console.log("Payer USDC:", beforePayerUSDC);
        console.log("Fee Recipient USDC:", beforeFeeRecipUSDC);
        console.log("Merchant USDC:", beforeMerchantUSDC);
        console.log("Merchant Shares:", beforeMerchantShares);

        vm.startPrank(payer);
        IERC20(USDC).approve(address(adapter), amount);
        adapter.settle({
            merchant: merchant,
            amount: amount,
            vault: EULER_VAULT,
            minSharesOut: (expectedShares * 99) / 100 // 1% slippage tolerance
        });
        vm.stopPrank();

        uint256 afterPayerUSDC = IERC20(USDC).balanceOf(payer);
        uint256 afterFeeRecipUSDC = IERC20(USDC).balanceOf(feeRecip);
        uint256 afterMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 afterMerchantShares = IEVault(EULER_VAULT).balanceOf(merchant);

        console.log("=== AFTER DEPOSIT (EULER) ===");
        console.log("Payer USDC:", afterPayerUSDC);
        console.log("Fee Recipient USDC:", afterFeeRecipUSDC);
        console.log("Merchant USDC:", afterMerchantUSDC);
        console.log("Merchant Shares:", afterMerchantShares);

        console.log("=== DEPOSIT DELTAS (EULER) ===");
        console.log("Payer USDC spent:", beforePayerUSDC - afterPayerUSDC);
        console.log("Fee received:", afterFeeRecipUSDC - beforeFeeRecipUSDC);
        console.log(
            "Shares minted:",
            afterMerchantShares - beforeMerchantShares
        );

        // Assertions for deposit
        uint256 fee = (amount * 100) / 10_000; // 1% = 100 bps
        assertEq(IERC20(USDC).balanceOf(feeRecip), fee, "fee mismatch");

        uint256 merchantShares = IEVault(EULER_VAULT).balanceOf(merchant);
        assertGe(
            merchantShares,
            (expectedShares * 99) / 100,
            "insufficient shares minted"
        );
    }

    function test_CompleteDepositAndRedeemFlow_EulerVault() public {
        uint256 depositAmount = 10_000e6;

        console.log("=== STARTING COMPLETE EULER DEPOSIT & REDEEM FLOW ===");

        uint256 expectedShares = IEVault(EULER_VAULT).previewDeposit(
            depositAmount
        );
        assertGt(expectedShares, 0, "vault preview is zero");

        uint256 beforeDepositPayerUSDC = IERC20(USDC).balanceOf(payer);
        uint256 beforeDepositFeeRecipUSDC = IERC20(USDC).balanceOf(feeRecip);
        uint256 beforeDepositMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 beforeDepositMerchantShares = IEVault(EULER_VAULT).balanceOf(
            merchant
        );

        console.log("=== BEFORE DEPOSIT (EULER) ===");
        console.log("Payer USDC:", beforeDepositPayerUSDC);
        console.log("Fee Recipient USDC:", beforeDepositFeeRecipUSDC);
        console.log("Merchant USDC:", beforeDepositMerchantUSDC);
        console.log("Merchant Shares:", beforeDepositMerchantShares);

        vm.startPrank(payer);
        IERC20(USDC).approve(address(adapter), depositAmount);
        adapter.settle({
            merchant: merchant,
            amount: depositAmount,
            vault: EULER_VAULT,
            minSharesOut: (expectedShares * 99) / 100
        });
        vm.stopPrank();

        uint256 afterDepositPayerUSDC = IERC20(USDC).balanceOf(payer);
        uint256 afterDepositFeeRecipUSDC = IERC20(USDC).balanceOf(feeRecip);
        uint256 afterDepositMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 afterDepositMerchantShares = IEVault(EULER_VAULT).balanceOf(
            merchant
        );

        console.log("=== AFTER DEPOSIT (EULER) ===");
        console.log("Payer USDC:", afterDepositPayerUSDC);
        console.log("Fee Recipient USDC:", afterDepositFeeRecipUSDC);
        console.log("Merchant USDC:", afterDepositMerchantUSDC);
        console.log("Merchant Shares:", afterDepositMerchantShares);

        console.log("=== DEPOSIT DELTAS (EULER) ===");
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

        console.log("\n=== STARTING EULER REDEEM PROCESS ===");
        uint256 sharesToRedeem = sharesMinted / 2;
        uint256 expectedAssets = IEVault(EULER_VAULT).previewRedeem(
            sharesToRedeem
        );

        console.log("Shares to redeem:", sharesToRedeem);
        console.log("Expected assets from redeem:", expectedAssets);

        uint256 beforeRedeemMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 beforeRedeemMerchantShares = IEVault(EULER_VAULT).balanceOf(
            merchant
        );

        console.log("=== BEFORE REDEEM (EULER) ===");
        console.log("Merchant USDC:", beforeRedeemMerchantUSDC);
        console.log("Merchant Shares:", beforeRedeemMerchantShares);

        vm.startPrank(merchant);
        IERC20(EULER_VAULT).approve(address(adapter), sharesToRedeem);
        uint256 assetsReceived = adapter.redeemShares({
            vault: EULER_VAULT,
            shares: sharesToRedeem,
            recipient: merchant,
            minAssetsOut: (expectedAssets * 99) / 100
        });
        vm.stopPrank();

        uint256 afterRedeemMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 afterRedeemMerchantShares = IEVault(EULER_VAULT).balanceOf(
            merchant
        );

        console.log("=== AFTER REDEEM (EULER) ===");
        console.log("Merchant USDC:", afterRedeemMerchantUSDC);
        console.log("Merchant Shares:", afterRedeemMerchantShares);
        console.log("Assets received from redeem:", assetsReceived);

        console.log("=== REDEEM DELTAS (EULER) ===");
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
        console.log("\n=== REDEEMING ALL REMAINING EULER SHARES ===");
        uint256 finalAssetsReceived = 0;
        {
            uint256 remainingShares = afterRedeemMerchantShares;
            if (remainingShares > 0) {
                uint256 expectedRemainingAssets = IEVault(EULER_VAULT)
                    .previewRedeem(remainingShares);

                console.log("Remaining shares to redeem:", remainingShares);
                console.log(
                    "Expected assets from remaining redeem:",
                    expectedRemainingAssets
                );

                uint256 beforeFinalUSDC = IERC20(USDC).balanceOf(merchant);
                uint256 beforeFinalShares = IEVault(EULER_VAULT).balanceOf(
                    merchant
                );

                console.log("=== BEFORE FINAL REDEEM (EULER) ===");
                console.log("Merchant USDC:", beforeFinalUSDC);
                console.log("Merchant Shares:", beforeFinalShares);

                vm.startPrank(merchant);
                IERC20(EULER_VAULT).approve(address(adapter), remainingShares);
                finalAssetsReceived = adapter.redeemAllShares({
                    vault: EULER_VAULT,
                    user: merchant,
                    recipient: merchant,
                    minAssetsOut: (expectedRemainingAssets * 99) / 100
                });
                vm.stopPrank();

                uint256 afterFinalUSDC = IERC20(USDC).balanceOf(merchant);
                uint256 afterFinalShares = IEVault(EULER_VAULT).balanceOf(
                    merchant
                );

                console.log("=== AFTER FINAL REDEEM (EULER) ===");
                console.log("Merchant USDC:", afterFinalUSDC);
                console.log("Merchant Shares:", afterFinalShares);
                console.log("Final assets received:", finalAssetsReceived);

                console.log("=== FINAL REDEEM DELTAS (EULER) ===");
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
        uint256 endMerchantShares = IEVault(EULER_VAULT).balanceOf(merchant);

        uint256 feePaid = afterDepositFeeRecipUSDC - beforeDepositFeeRecipUSDC; // delta, not absolute
        uint256 netDeposited = depositAmount - feePaid;
        uint256 totalRecovered = endMerchantUSDC - beforeDepositMerchantUSDC; // captures both redeems

        console.log("\n=== COMPLETE EULER FLOW SUMMARY ===");
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

    function test_USDCOnly_SendsCash_NoEulerVaultNeeded() public {
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

    function test_WithdrawAssets_SpecificAmount_EulerVault() public {
        // First deposit to get shares
        uint256 depositAmount = 20_000e6;

        vm.startPrank(payer);
        IERC20(USDC).approve(address(adapter), depositAmount);
        adapter.settle({
            merchant: merchant,
            amount: depositAmount,
            vault: EULER_VAULT,
            minSharesOut: 0
        });
        vm.stopPrank();

        // Now test withdrawing specific asset amount
        uint256 assetsToWithdraw = 5_000e6; // Withdraw 5k USDC
        uint256 expectedShares = IEVault(EULER_VAULT).previewWithdraw(
            assetsToWithdraw
        );

        console.log("=== WITHDRAW SPECIFIC ASSETS TEST (EULER) ===");
        console.log("Assets to withdraw:", assetsToWithdraw);
        console.log("Expected shares to burn:", expectedShares);

        uint256 beforeUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 beforeShares = IEVault(EULER_VAULT).balanceOf(merchant);

        console.log("Before withdraw - USDC:", beforeUSDC);
        console.log("Before withdraw - Shares:", beforeShares);

        vm.startPrank(merchant);
        IERC20(EULER_VAULT).approve(address(adapter), expectedShares + 100); // Add buffer for slippage
        uint256 sharesBurned = adapter.withdrawAssets({
            vault: EULER_VAULT,
            assets: assetsToWithdraw,
            recipient: merchant,
            maxSharesIn: expectedShares + 100 // 1% slippage buffer
        });
        vm.stopPrank();

        uint256 afterUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 afterShares = IEVault(EULER_VAULT).balanceOf(merchant);

        console.log("After withdraw - USDC:", afterUSDC);
        console.log("After withdraw - Shares:", afterShares);
        console.log("Actual shares burned:", sharesBurned);

        console.log("=== WITHDRAW DELTAS (EULER) ===");
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

    function test_SplitMode_EulerVault() public {
        // Update config to SPLIT mode (70% shares, 30% cash)
        vm.prank(merchant);
        registry.updateConfig({
            merchant: merchant,
            payoutToken: USDC,
            mode: MerchantRegistry.PayoutMode.SPLIT,
            splitBps: 7000, // 70% to shares
            protocolFeeBps: 100,
            feeRecipient: feeRecip
        });

        uint256 amount = 10_000e6;

        // Before state
        uint256 beforeMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 beforeMerchantShares = IEVault(EULER_VAULT).balanceOf(merchant);
        uint256 beforeFeeRecipUSDC = IERC20(USDC).balanceOf(feeRecip);

        console.log("=== BEFORE SPLIT SETTLEMENT (EULER) ===");
        console.log("Merchant USDC:", beforeMerchantUSDC);
        console.log("Merchant Shares:", beforeMerchantShares);
        console.log("Fee Recipient USDC:", beforeFeeRecipUSDC);

        vm.startPrank(payer);
        IERC20(USDC).approve(address(adapter), amount);
        adapter.settle({
            merchant: merchant,
            amount: amount,
            vault: EULER_VAULT,
            minSharesOut: 0
        });
        vm.stopPrank();

        // After state
        uint256 afterMerchantUSDC = IERC20(USDC).balanceOf(merchant);
        uint256 afterMerchantShares = IEVault(EULER_VAULT).balanceOf(merchant);
        uint256 afterFeeRecipUSDC = IERC20(USDC).balanceOf(feeRecip);

        console.log("=== AFTER SPLIT SETTLEMENT (EULER) ===");
        console.log("Merchant USDC:", afterMerchantUSDC);
        console.log("Merchant Shares:", afterMerchantShares);
        console.log("Fee Recipient USDC:", afterFeeRecipUSDC);

        // Calculate expected amounts
        uint256 fee = (amount * 100) / 10_000; // 1%
        uint256 net = amount - fee;
        uint256 expectedToShares = (net * 7000) / 10_000; // 70%
        uint256 expectedToCash = net - expectedToShares; // 30%

        console.log("=== SPLIT DELTAS (EULER) ===");
        console.log("Expected fee:", fee);
        console.log("Expected to shares:", expectedToShares);
        console.log("Expected to cash:", expectedToCash);
        console.log(
            "Actual USDC gained:",
            afterMerchantUSDC - beforeMerchantUSDC
        );
        console.log(
            "Actual shares gained:",
            afterMerchantShares - beforeMerchantShares
        );
        console.log(
            "Actual fee received:",
            afterFeeRecipUSDC - beforeFeeRecipUSDC
        );

        // Validate split
        assertEq(afterFeeRecipUSDC - beforeFeeRecipUSDC, fee, "fee mismatch");
        assertEq(
            afterMerchantUSDC - beforeMerchantUSDC,
            expectedToCash,
            "cash amount mismatch"
        );
        assertGt(
            afterMerchantShares - beforeMerchantShares,
            0,
            "no shares minted"
        );
    }

    function test_PreviewFunctions_EulerVault() public {
        uint256 depositAmount = 10_000e6;
        uint256 shareAmount = 5_000e18;

        // Test preview functions
        uint256 previewShares = adapter.previewDeposit(
            EULER_VAULT,
            depositAmount
        );
        uint256 previewAssets = adapter.previewRedeem(EULER_VAULT, shareAmount);
        uint256 previewWithdrawShares = adapter.previewWithdraw(
            EULER_VAULT,
            depositAmount
        );
        address vaultAsset = adapter.getVaultAsset(EULER_VAULT);

        console.log("=== EULER VAULT PREVIEW FUNCTIONS ===");
        console.log(
            "Preview deposit shares for",
            depositAmount,
            "assets:",
            previewShares
        );
        console.log(
            "Preview redeem assets for",
            shareAmount,
            "shares:",
            previewAssets
        );
        console.log(
            "Preview withdraw shares for",
            depositAmount,
            "assets:",
            previewWithdrawShares
        );
        console.log("Vault asset address:", vaultAsset);

        // Basic validations
        assertGt(previewShares, 0, "preview deposit should return shares");
        assertGt(previewAssets, 0, "preview redeem should return assets");
        assertGt(
            previewWithdrawShares,
            0,
            "preview withdraw should return shares"
        );
        assertEq(vaultAsset, USDC, "vault asset should be USDC");
    }
}
