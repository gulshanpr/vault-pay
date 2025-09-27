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

        // Register merchant config (you can tweak these to test all modes)
        // - payoutToken = USDC
        // - mode = SHARES_ONLY (try USDC_ONLY or SPLIT in other tests)
        // - splitBps = 5000 (only read if SPLIT)
        // - protocolFeeBps = 100 = 1%
        vm.prank(merchant); // merchantPayout becomes msg.sender per your registerMerchant()
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

        console.log("=== BEFORE ===");
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

        console.log("=== AFTER ===");
        console.log("Payer USDC:", afterPayerUSDC);
        console.log("Fee Recipient USDC:", afterFeeRecipUSDC);
        console.log("Merchant USDC:", afterMerchantUSDC);
        console.log("Merchant Shares:", afterMerchantShares);

        console.log("=== DELTAS ===");
        console.log("Payer USDC spent:", beforePayerUSDC - afterPayerUSDC);
        console.log("Fee received:", afterFeeRecipUSDC - beforeFeeRecipUSDC);
        console.log(
            "Shares minted:",
            afterMerchantShares - beforeMerchantShares
        );

        // Assertions:
        // 1) Payer spent ~amount USDC (minus nothing; adapter pulls full amount)
        // 2) Fee recipient received protocol fee = 1% of amount
        // 3) Merchant received vault shares

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
}
