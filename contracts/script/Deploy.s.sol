// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MerchantRegistry.sol";
import "../src/VaultAdapter.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        MerchantRegistry registry = new MerchantRegistry();

        VaultAdapter merchant = new VaultAdapter(address(registry));

        vm.stopBroadcast();

        console.log("Registry deployed at:", address(registry));
        console.log("MerchantContract deployed at:", address(merchant));
    }
}
