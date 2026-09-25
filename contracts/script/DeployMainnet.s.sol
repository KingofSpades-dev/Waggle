// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Script } from "forge-std/Script.sol";
import { WaggleAttestor } from "../src/WaggleAttestor.sol";
import { console2 } from "forge-std/console2.sol";

contract DeployMainnet is Script {
    // Official Safe Multisig / Owner on Robinhood Chain
    address public constant SAFE_MULTISIG = 0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a;
    
    // Official Publisher Key Address (ECC_SECG_P256K1)
    address public constant KMS_PUBLISHER_SIGNER = 0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a;

    function run() external returns (WaggleAttestor attestor) {
        // Enforce Robinhood Chain ID
        if (block.chainid != 4663) {
            console2.log("Warning: Not running on Robinhood Chain (ID: 4663). Current Chain ID:", block.chainid);
        }

        vm.startBroadcast();

        // Deploy with isArbitrumChain = true (enables ArbSys address(100) precompile)
        attestor = new WaggleAttestor(
            true, // _isArbitrumChain: required for Chain 4663
            SAFE_MULTISIG,
            KMS_PUBLISHER_SIGNER
        );

        vm.stopBroadcast();

        console2.log("==================================================");
        console2.log("WaggleAttestor Mainnet Contract Deployed!");
        console2.log("Address:", address(attestor));
        console2.log("Owner (Safe 3-of-5):", attestor.owner());
        console2.log("Publisher (Cloud KMS):", attestor.publisher());
        console2.log("Chain ID:", block.chainid);
        console2.log("==================================================");
    }
}
