// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {MerchantRegistry} from "../src/MerchantRegistry.sol";
import {VaultAdapter} from "../src/VaultAdapter.sol";
import {EulerVaultAdapter} from "../src/EulerVaultAdapter.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        MerchantRegistry registry = new MerchantRegistry();

        VaultAdapter merchant = new VaultAdapter(address(registry));

        EulerVaultAdapter eulerAdapter = new EulerVaultAdapter(address(registry));

        vm.stopBroadcast();

        console.log("Registry deployed at:", address(registry));
        console.log("MerchantContract deployed at:", address(merchant));
        console.log("EulerVaultAdapter deployed at:", address(eulerAdapter));
    }
}
