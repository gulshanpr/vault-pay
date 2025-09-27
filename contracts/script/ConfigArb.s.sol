// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MerchantRegistry} from "../src/MerchantRegistry.sol";
import {VaultAdapter} from "../src/VaultAdapter.sol";
import {EulerVaultAdapter} from "../src/EulerVaultAdapter.sol";

contract ConfigArbitrum is Script {
    // Arbitrum contract addresses
    address constant MERCHANT_REGISTRY =
        0x08aC0DE71fb42A9119E7e4c7105d0740901af369;
    address constant VAULT_ADAPTER = 0x18080a79BdF5F9eCf48E107A349bC889e10EB467;
    address constant EULER_VAULT_ADAPTER =
        0xb087bC0E1bFd5E97747Cb8B4CD2079FdEDf05537;

    // Arbitrum tokens
    address constant USDC = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
    address constant WETH = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;

    // Arbitrum Morpho vaults
    address constant MORPHO_USDC_VAULT =
        0xa60643c90A542A95026C0F1dbdB0615fF42019Cf;

    // Arbitrum Euler vaults
    address constant EULER_USDC_VAULT =
        0x6aFB8d3F6D4A34e9cB2f217317f4dc8e05Aa673b;
    address constant EULER_WETH_VAULT =
        0x78E3E051D32157AACD550fBB78458762d8f7edFF;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Configure MerchantRegistry - allow tokens
        MerchantRegistry registry = MerchantRegistry(MERCHANT_REGISTRY);
        console.log("Setting allowed tokens on MerchantRegistry...");

        registry.setAllowedToken(USDC, true);
        registry.setAllowedToken(WETH, true);

        // Configure VaultAdapter (Morpho) - allow vaults
        VaultAdapter vaultAdapter = VaultAdapter(VAULT_ADAPTER);
        console.log("Setting allowed vaults on VaultAdapter (Morpho)...");

        vaultAdapter.setAllowedVault(MORPHO_USDC_VAULT, true);

        // Configure EulerVaultAdapter - allow vaults
        EulerVaultAdapter eulerAdapter = EulerVaultAdapter(EULER_VAULT_ADAPTER);
        console.log("Setting allowed vaults on EulerVaultAdapter...");

        address[] memory eulerVaults = new address[](2);
        bool[] memory eulerAllowed = new bool[](2);

        eulerVaults[0] = EULER_USDC_VAULT;
        eulerVaults[1] = EULER_WETH_VAULT;
        eulerAllowed[0] = true;
        eulerAllowed[1] = true;

        eulerAdapter.setMultipleVaults(eulerVaults, eulerAllowed);

        vm.stopBroadcast();

        console.log("Arbitrum configuration completed!");
        console.log("Allowed tokens: USDC, WETH");
        console.log("Morpho vaults configured: 1");
        console.log("Euler vaults configured: 2");
    }
}
