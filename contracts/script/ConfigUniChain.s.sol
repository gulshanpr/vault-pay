// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MerchantRegistry} from "../src/MerchantRegistry.sol";
import {VaultAdapter} from "../src/VaultAdapter.sol";
import {EulerVaultAdapter} from "../src/EulerVaultAdapter.sol";

contract ConfigUnichain is Script {
    // Unichain contract addresses
    address constant MERCHANT_REGISTRY =
        0x3B284DDcf13fbac389646C888C3dc669c00914Be;
    address constant VAULT_ADAPTER = 0x92d7074d3ae478f91d136a018fe8Fa8Ea53f0D17;
    address constant EULER_VAULT_ADAPTER =
        0xCFE7F11016055a00a3fD0dCA0D642E9538cDC490;

    // Unichain tokens
    address constant USDC = 0x078D782b760474a361dDA0AF3839290b0EF57AD6;
    address constant USDT = 0x9151434b16b9763660705744891fA906F660EcC5;

    // Unichain Morpho vaults
    address constant MORPHO_USDC_VAULT =
        0x38f4f3B6533de0023b9DCd04b02F93d36ad1F9f9;
    address constant MORPHO_USDT_VAULT =
        0x89849B6e57e1c61e447257242bDa97c70FA99b6b;

    // Unichain Euler vaults
    address constant EULER_USDC_VAULT =
        0x6eAe95ee783e4D862867C4e0E4c3f4B95AA682Ba;
    address constant EULER_USDT_VAULT =
        0xD49181c522eCDB265f0D9C175Cf26FFACE64eAD3;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Configure MerchantRegistry - allow tokens
        MerchantRegistry registry = MerchantRegistry(MERCHANT_REGISTRY);
        console.log("Setting allowed tokens on MerchantRegistry...");

        registry.setAllowedToken(USDC, true);
        registry.setAllowedToken(USDT, true);

        // Configure VaultAdapter (Morpho) - allow vaults
        VaultAdapter vaultAdapter = VaultAdapter(VAULT_ADAPTER);
        console.log("Setting allowed vaults on VaultAdapter (Morpho)...");

        address[] memory morphoVaults = new address[](2);
        bool[] memory morphoAllowed = new bool[](2);

        morphoVaults[0] = MORPHO_USDC_VAULT;
        morphoVaults[1] = MORPHO_USDT_VAULT;
        morphoAllowed[0] = true;
        morphoAllowed[1] = true;

        vaultAdapter.setMultipleVaults(morphoVaults, morphoAllowed);

        // Configure EulerVaultAdapter - allow vaults
        EulerVaultAdapter eulerAdapter = EulerVaultAdapter(EULER_VAULT_ADAPTER);
        console.log("Setting allowed vaults on EulerVaultAdapter...");

        address[] memory eulerVaults = new address[](2);
        bool[] memory eulerAllowed = new bool[](2);

        eulerVaults[0] = EULER_USDC_VAULT;
        eulerVaults[1] = EULER_USDT_VAULT;
        eulerAllowed[0] = true;
        eulerAllowed[1] = true;

        eulerAdapter.setMultipleVaults(eulerVaults, eulerAllowed);

        vm.stopBroadcast();

        console.log("Unichain configuration completed!");
        console.log("Allowed tokens: USDC, USDT");
        console.log("Morpho vaults configured: 2");
        console.log("Euler vaults configured: 2");
    }
}
