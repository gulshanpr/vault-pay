// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "../lib/forge-std/src/Test.sol";
import {MerchantRegistry} from "../src/MerchantRegistry.sol";

contract MerchantRegistryTest is Test {
    MerchantRegistry public registry;

    // Test addresses
    address public owner;
    address public merchant1;
    address public merchant2;
    address public nonMerchant;
    address public usdcToken;
    address public usdtToken;
    address public daiToken;
    address public invalidToken;
    address public feeRecipient;

    // Events to test
    event MerchantRegistered(address indexed merchantId, address indexed merchant);
    event MerchantUpdated(address indexed merchantId);
    event AllowedTokenSet(address token, bool allowed);

    function setUp() public {
        // Set up test addresses
        owner = address(this);
        merchant1 = makeAddr("merchant1");
        merchant2 = makeAddr("merchant2");
        nonMerchant = makeAddr("nonMerchant");
        usdcToken = makeAddr("usdcToken");
        usdtToken = makeAddr("usdtToken");
        daiToken = makeAddr("daiToken");
        invalidToken = makeAddr("invalidToken");
        feeRecipient = makeAddr("feeRecipient");

        // Deploy contract
        registry = new MerchantRegistry();

        // Set up allowed tokens
        registry.setAllowedToken(usdcToken, true);
        registry.setAllowedToken(usdtToken, true);
        registry.setAllowedToken(daiToken, true);
    }

    // === Constructor Tests ===
    function test_Constructor() public {
        assertEq(registry.owner(), owner);
    }

    // === Owner Functions Tests ===
    function test_SetAllowedToken_Success() public {
        address newToken = makeAddr("newToken");

        // Test setting token to allowed
        vm.expectEmit(true, false, false, true);
        emit AllowedTokenSet(newToken, true);
        registry.setAllowedToken(newToken, true);

        assertTrue(registry.allowedTokens(newToken));
        assertTrue(registry.isAllowedToken(newToken));

        // Test setting token to not allowed
        vm.expectEmit(true, false, false, true);
        emit AllowedTokenSet(newToken, false);
        registry.setAllowedToken(newToken, false);

        assertFalse(registry.allowedTokens(newToken));
        assertFalse(registry.isAllowedToken(newToken));
    }

    function test_SetAllowedToken_OnlyOwner() public {
        vm.prank(nonMerchant);
        vm.expectRevert("Ownable: caller is not the owner"); // Keep this if that's the error
        registry.setAllowedToken(usdcToken, false);
    }

    // === Register Merchant Tests ===
    function test_RegisterMerchant_Success_USDC_ONLY() public {
        vm.prank(merchant1);

        vm.expectEmit(true, true, false, true);
        emit MerchantRegistered(merchant1, merchant1);

        registry.registerMerchant(
            merchant1,
            usdcToken,
            MerchantRegistry.PayoutMode.USDC_ONLY,
            0, // splitBps not used for USDC_ONLY
            500, // 5% protocol fee
            feeRecipient
        );

        MerchantRegistry.MerchantConfig memory config = registry.getConfig(merchant1);
        assertEq(config.merchantPayout, merchant1);
        assertEq(config.payoutToken, usdcToken);
        assertEq(uint8(config.mode), uint8(MerchantRegistry.PayoutMode.USDC_ONLY));
        assertEq(config.splitBps, 0);
        assertEq(config.protocolFeeBps, 500);
        assertEq(config.feeRecipient, feeRecipient);
        assertTrue(config.exists);
    }

    function test_RegisterMerchant_Success_SHARES_ONLY() public {
        vm.prank(merchant1);

        registry.registerMerchant(
            merchant1,
            usdcToken,
            MerchantRegistry.PayoutMode.SHARES_ONLY,
            0, // splitBps not used for SHARES_ONLY
            300, // 3% protocol fee
            feeRecipient
        );

        MerchantRegistry.MerchantConfig memory config = registry.getConfig(merchant1);
        assertEq(uint8(config.mode), uint8(MerchantRegistry.PayoutMode.SHARES_ONLY));
        assertEq(config.protocolFeeBps, 300);
    }

    function test_RegisterMerchant_Success_SPLIT() public {
        vm.prank(merchant1);

        registry.registerMerchant(
            merchant1,
            usdcToken,
            MerchantRegistry.PayoutMode.SPLIT,
            7000, // 70% to shares, 30% to cash
            200, // 2% protocol fee
            feeRecipient
        );

        MerchantRegistry.MerchantConfig memory config = registry.getConfig(merchant1);
        assertEq(uint8(config.mode), uint8(MerchantRegistry.PayoutMode.SPLIT));
        assertEq(config.splitBps, 7000);
        assertEq(config.protocolFeeBps, 200);
    }

    function test_RegisterMerchant_AlreadyRegistered() public {
        vm.startPrank(merchant1);

        // Register first time
        registry.registerMerchant(merchant1, usdcToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, 500, feeRecipient);

        // Try to register again
        vm.expectRevert("already registered");
        registry.registerMerchant(merchant1, usdtToken, MerchantRegistry.PayoutMode.SHARES_ONLY, 0, 300, feeRecipient);

        vm.stopPrank();
    }

    function test_RegisterMerchant_InvalidSplitBps() public {
        vm.prank(merchant1);

        vm.expectRevert("bad split");
        registry.registerMerchant(
            merchant1,
            usdcToken,
            MerchantRegistry.PayoutMode.SPLIT,
            10001, // Invalid: > 10000
            500,
            feeRecipient
        );
    }

    function test_RegisterMerchant_ProtocolFeeTooHigh() public {
        vm.prank(merchant1);

        vm.expectRevert("fee too high");
        registry.registerMerchant(
            merchant1,
            usdcToken,
            MerchantRegistry.PayoutMode.USDC_ONLY,
            0,
            1001, // Invalid: > 1000 (10%)
            feeRecipient
        );
    }

    function test_RegisterMerchant_TokenNotAllowed() public {
        vm.prank(merchant1);

        vm.expectRevert("payout token not allowed");
        registry.registerMerchant(merchant1, invalidToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, 500, feeRecipient);
    }

    function test_RegisterMerchant_EdgeCases() public {
        vm.prank(merchant1);

        // Test with 0 protocol fee
        registry.registerMerchant(
            merchant1,
            usdcToken,
            MerchantRegistry.PayoutMode.USDC_ONLY,
            0,
            0, // 0% protocol fee
            address(0) // No fee recipient
        );

        MerchantRegistry.MerchantConfig memory config = registry.getConfig(merchant1);
        assertEq(config.protocolFeeBps, 0);
        assertEq(config.feeRecipient, address(0));
    }

    function test_RegisterMerchant_MaxValues() public {
        vm.prank(merchant1);

        // Test with maximum allowed values
        registry.registerMerchant(
            merchant1,
            usdcToken,
            MerchantRegistry.PayoutMode.SPLIT,
            10000, // 100% to shares
            1000, // 10% protocol fee (max)
            feeRecipient
        );

        MerchantRegistry.MerchantConfig memory config = registry.getConfig(merchant1);
        assertEq(config.splitBps, 10000);
        assertEq(config.protocolFeeBps, 1000);
    }

    // === Update Config Tests ===
    function test_UpdateConfig_Success() public {
        // First register merchant
        vm.prank(merchant1);
        registry.registerMerchant(merchant1, usdcToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, 500, feeRecipient);

        // Update config
        vm.prank(merchant1);
        vm.expectEmit(true, false, false, true);
        emit MerchantUpdated(merchant1);

        registry.updateConfig(
            merchant1,
            usdtToken, // Change token
            MerchantRegistry.PayoutMode.SPLIT, // Change mode
            6000, // Add split
            300, // Change fee
            address(0) // Change fee recipient
        );

        MerchantRegistry.MerchantConfig memory config = registry.getConfig(merchant1);
        assertEq(config.payoutToken, usdtToken);
        assertEq(uint8(config.mode), uint8(MerchantRegistry.PayoutMode.SPLIT));
        assertEq(config.splitBps, 6000);
        assertEq(config.protocolFeeBps, 300);
        assertEq(config.feeRecipient, address(0));
        assertTrue(config.exists);
    }

    function test_UpdateConfig_NotRegistered() public {
        vm.prank(merchant1);
        vm.expectRevert("not registered");
        registry.updateConfig(merchant1, usdcToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, 500, feeRecipient);
    }

    function test_UpdateConfig_NotMerchant() public {
        // Register merchant1
        vm.prank(merchant1);
        registry.registerMerchant(merchant1, usdcToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, 500, feeRecipient);

        // Try to update as different address
        vm.prank(merchant2);
        vm.expectRevert("not merchant");
        registry.updateConfig(merchant1, usdtToken, MerchantRegistry.PayoutMode.SHARES_ONLY, 0, 300, feeRecipient);
    }

    function test_UpdateConfig_InvalidSplitBps() public {
        // Register merchant
        vm.prank(merchant1);
        registry.registerMerchant(merchant1, usdcToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, 500, feeRecipient);

        // Try to update with invalid split
        vm.prank(merchant1);
        vm.expectRevert("bad split");
        registry.updateConfig(
            merchant1,
            usdcToken,
            MerchantRegistry.PayoutMode.SPLIT,
            10001, // Invalid
            500,
            feeRecipient
        );
    }

    function test_UpdateConfig_ProtocolFeeTooHigh() public {
        // Register merchant
        vm.prank(merchant1);
        registry.registerMerchant(merchant1, usdcToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, 500, feeRecipient);

        // Try to update with invalid fee
        vm.prank(merchant1);
        vm.expectRevert("fee too high");
        registry.updateConfig(
            merchant1,
            usdcToken,
            MerchantRegistry.PayoutMode.USDC_ONLY,
            0,
            1001, // Invalid
            feeRecipient
        );
    }

    function test_UpdateConfig_TokenNotAllowed() public {
        // Register merchant
        vm.prank(merchant1);
        registry.registerMerchant(merchant1, usdcToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, 500, feeRecipient);

        // Try to update with invalid token
        vm.prank(merchant1);
        vm.expectRevert("payout token not allowed");
        registry.updateConfig(merchant1, invalidToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, 500, feeRecipient);
    }

    // === Getter Tests ===
    function test_GetConfig_NonExistentMerchant() public {
        MerchantRegistry.MerchantConfig memory config = registry.getConfig(merchant1);
        assertFalse(config.exists);
        assertEq(config.merchantPayout, address(0));
        assertEq(config.payoutToken, address(0));
        assertEq(config.splitBps, 0);
        assertEq(config.protocolFeeBps, 0);
        assertEq(config.feeRecipient, address(0));
    }

    function test_IsAllowedToken() public {
        assertTrue(registry.isAllowedToken(usdcToken));
        assertTrue(registry.isAllowedToken(usdtToken));
        assertTrue(registry.isAllowedToken(daiToken));
        assertFalse(registry.isAllowedToken(invalidToken));
    }

    // === Integration Tests ===
    function test_CompleteWorkflow() public {
        // 1. Register merchant1 with USDC_ONLY
        vm.prank(merchant1);
        registry.registerMerchant(merchant1, usdcToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, 500, feeRecipient);

        // 2. Register merchant2 with SPLIT
        vm.prank(merchant2);
        registry.registerMerchant(merchant2, usdtToken, MerchantRegistry.PayoutMode.SPLIT, 7500, 300, feeRecipient);

        // 3. Update merchant1 to SHARES_ONLY
        vm.prank(merchant1);
        registry.updateConfig(
            merchant1,
            daiToken,
            MerchantRegistry.PayoutMode.SHARES_ONLY,
            0,
            200,
            merchant1 // Self as fee recipient
        );

        // 4. Verify final states
        MerchantRegistry.MerchantConfig memory config1 = registry.getConfig(merchant1);
        assertEq(config1.payoutToken, daiToken);
        assertEq(uint8(config1.mode), uint8(MerchantRegistry.PayoutMode.SHARES_ONLY));
        assertEq(config1.protocolFeeBps, 200);
        assertEq(config1.feeRecipient, merchant1);

        MerchantRegistry.MerchantConfig memory config2 = registry.getConfig(merchant2);
        assertEq(config2.payoutToken, usdtToken);
        assertEq(uint8(config2.mode), uint8(MerchantRegistry.PayoutMode.SPLIT));
        assertEq(config2.splitBps, 7500);
        assertEq(config2.protocolFeeBps, 300);
    }

    function test_MultipleTokenManagement() public {
        address[] memory tokens = new address[](3);
        tokens[0] = makeAddr("token1");
        tokens[1] = makeAddr("token2");
        tokens[2] = makeAddr("token3");

        // Add tokens
        for (uint256 i = 0; i < tokens.length; i++) {
            registry.setAllowedToken(tokens[i], true);
            assertTrue(registry.isAllowedToken(tokens[i]));
        }

        // Remove some tokens
        registry.setAllowedToken(tokens[1], false);
        assertFalse(registry.isAllowedToken(tokens[1]));
        assertTrue(registry.isAllowedToken(tokens[0]));
        assertTrue(registry.isAllowedToken(tokens[2]));
    }

    // === Edge Case Tests ===
    function test_ZeroAddresses() public {
        // Test with zero address as merchant (should work as it's just an identifier)
        vm.prank(merchant1);
        registry.registerMerchant(
            address(0), // Zero address merchant ID
            usdcToken,
            MerchantRegistry.PayoutMode.USDC_ONLY,
            0,
            500,
            feeRecipient
        );

        MerchantRegistry.MerchantConfig memory config = registry.getConfig(address(0));
        assertTrue(config.exists);
        assertEq(config.merchantPayout, merchant1);
    }

    function test_SameAddressDifferentRoles() public {
        // Merchant can be their own fee recipient
        vm.prank(merchant1);
        registry.registerMerchant(
            merchant1,
            usdcToken,
            MerchantRegistry.PayoutMode.USDC_ONLY,
            0,
            500,
            merchant1 // Self as fee recipient
        );

        MerchantRegistry.MerchantConfig memory config = registry.getConfig(merchant1);
        assertEq(config.merchantPayout, merchant1);
        assertEq(config.feeRecipient, merchant1);
    }

    // === Fuzz Tests ===
    function testFuzz_RegisterMerchant_ValidSplitBps(uint16 splitBps) public {
        vm.assume(splitBps <= 10000);

        vm.prank(merchant1);
        registry.registerMerchant(merchant1, usdcToken, MerchantRegistry.PayoutMode.SPLIT, splitBps, 500, feeRecipient);

        MerchantRegistry.MerchantConfig memory config = registry.getConfig(merchant1);
        assertEq(config.splitBps, splitBps);
    }

    function testFuzz_RegisterMerchant_ValidProtocolFee(uint16 protocolFeeBps) public {
        vm.assume(protocolFeeBps <= 1000);

        vm.prank(merchant1);
        registry.registerMerchant(
            merchant1, usdcToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, protocolFeeBps, feeRecipient
        );

        MerchantRegistry.MerchantConfig memory config = registry.getConfig(merchant1);
        assertEq(config.protocolFeeBps, protocolFeeBps);
    }

    function testFuzz_RegisterMerchant_InvalidSplitBps(uint16 splitBps) public {
        vm.assume(splitBps > 10000);

        vm.prank(merchant1);
        vm.expectRevert("bad split");
        registry.registerMerchant(merchant1, usdcToken, MerchantRegistry.PayoutMode.SPLIT, splitBps, 500, feeRecipient);
    }

    function testFuzz_RegisterMerchant_InvalidProtocolFee(uint16 protocolFeeBps) public {
        vm.assume(protocolFeeBps > 1000);

        vm.prank(merchant1);
        vm.expectRevert("fee too high");
        registry.registerMerchant(
            merchant1, usdcToken, MerchantRegistry.PayoutMode.USDC_ONLY, 0, protocolFeeBps, feeRecipient
        );
    }
}
