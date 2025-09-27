// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MerchantRegistry} from "../src/MerchantRegistry.sol";
import {VaultAdapter} from "../src/VaultAdapter.sol";
import {EulerVaultAdapter} from "../src/EulerVaultAdapter.sol";

contract ConfigBase is Script {
    // Base contract addresses
    address constant MERCHANT_REGISTRY =
        0x3B284DDcf13fbac389646C888C3dc669c00914Be;
    address constant VAULT_ADAPTER = 0x92d7074d3ae478f91d136a018fe8Fa8Ea53f0D17;
    address constant EULER_VAULT_ADAPTER =
        0xCFE7F11016055a00a3fD0dCA0D642E9538cDC490;

    // Base tokens
    address constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address constant EURC = 0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42;
    address constant USDS = 0x820C137fa70C8691f0e44Dc420a5e53c168921Dc;

    // Base Morpho vaults
    address constant MORPHO_USDC_VAULT =
        0x236919F11ff9eA9550A4287696C2FC9e18E6e890;
    address constant MORPHO_EURC_VAULT =
        0xf24608E0CCb972b0b0f4A6446a0BBf58c701a026;

    // Base Euler vaults
    address constant EULER_USDC_VAULT =
        0x0A1a3b5f2041F33522C4efc754a7D096f880eE16;
    address constant EULER_EURC_VAULT =
        0x9ECD9fbbdA32b81dee51AdAed28c5C5039c87117;
    address constant EULER_USDS_VAULT =
        0x556d518FDFDCC4027A3A1388699c5E11AC201D8b;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Configure MerchantRegistry - allow tokens
        MerchantRegistry registry = MerchantRegistry(MERCHANT_REGISTRY);
        console.log("Setting allowed tokens on MerchantRegistry...");

        registry.setAllowedToken(USDC, true);
        registry.setAllowedToken(EURC, true);
        registry.setAllowedToken(USDS, true);

        // Configure VaultAdapter (Morpho) - allow vaults
        VaultAdapter vaultAdapter = VaultAdapter(VAULT_ADAPTER);
        console.log("Setting allowed vaults on VaultAdapter (Morpho)...");

        address[] memory morphoVaults = new address[](2);
        bool[] memory morphoAllowed = new bool[](2);

        morphoVaults[0] = MORPHO_USDC_VAULT;
        morphoVaults[1] = MORPHO_EURC_VAULT;
        morphoAllowed[0] = true;
        morphoAllowed[1] = true;

        vaultAdapter.setMultipleVaults(morphoVaults, morphoAllowed);

        // Configure EulerVaultAdapter - allow vaults
        EulerVaultAdapter eulerAdapter = EulerVaultAdapter(EULER_VAULT_ADAPTER);
        console.log("Setting allowed vaults on EulerVaultAdapter...");

        address[] memory eulerVaults = new address[](3);
        bool[] memory eulerAllowed = new bool[](3);

        eulerVaults[0] = EULER_USDC_VAULT;
        eulerVaults[1] = EULER_EURC_VAULT;
        eulerVaults[2] = EULER_USDS_VAULT;
        eulerAllowed[0] = true;
        eulerAllowed[1] = true;
        eulerAllowed[2] = true;

        eulerAdapter.setMultipleVaults(eulerVaults, eulerAllowed);

        vm.stopBroadcast();

        console.log("Base configuration completed!");
        console.log("Allowed tokens: USDC, EURC, USDS");
        console.log("Morpho vaults configured: 2");
        console.log("Euler vaults configured: 3");
    }
}
