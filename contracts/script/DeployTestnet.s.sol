// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/WaggleAttestor.sol";

interface ScriptVm {
    function startBroadcast() external;
    function stopBroadcast() external;
    function envAddress(string calldata) external returns (address);
}

contract DeployTestnet {
    ScriptVm private constant vm = ScriptVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function run() external returns (WaggleAttestor attestor) {
        address safeMultisig = vm.envAddress("SAFE_MULTISIG_ADDRESS");
        address publisher = vm.envAddress("PUBLISHER_ADDRESS");

        vm.startBroadcast();

        // Robinhood Chain requires isArbitrumChain = true
        attestor = new WaggleAttestor(
            safeMultisig,
            publisher,
            true // isArbitrumChain
        );

        vm.stopBroadcast();
    }
}
