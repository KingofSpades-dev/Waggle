// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface Vm {
    function chainId(uint256) external;
    function warp(uint256) external;
    function prank(address) external;
    function expectRevert(bytes calldata) external;
    function etch(address, bytes calldata) external;
}

contract MockArbSys {
    uint256 public blockNumber = 555555;
    bool public shouldRevert = false;

    function setBlockNumber(uint256 _b) external {
        blockNumber = _b;
    }

    function setShouldRevert(bool _r) external {
        shouldRevert = _r;
    }

    function arbBlockNumber() external view returns (uint256) {
        if (shouldRevert) {
            revert("Mock ArbSys failure");
        }
        return blockNumber;
    }
}

import "../src/WaggleAttestor.sol";

contract WaggleAttestorTest {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    address public owner = address(0x1111);
    address public publisher = address(0x2222);
    WaggleAttestor public attestor;
    MockArbSys public mockArbSys;

    function setUp() public {
        mockArbSys = new MockArbSys();
        // Etch mock ArbSys at address(100)
        vm.etch(address(100), address(mockArbSys).code);

        attestor = new WaggleAttestor(owner, publisher, true);
    }

    function test_ArbSysL2BlockNumberRecorded() public {
        vm.prank(publisher);
        bytes32 root = keccak256("merkle_root_1");
        uint64 windowEnd = 1000;
        vm.warp(2000); // block.timestamp >= windowEnd

        attestor.attest(101, root, 1, 1, windowEnd, "ipfs://snapshot101");

        (
            bytes32 storedRoot,
            uint32 mVer,
            uint32 wVer,
            uint64 wEnd,
            uint64 l2Block,
            uint64 attestedTime,
            string memory uri
        ) = attestor.snapshots(101);

        require(storedRoot == root, "Root mismatch");
        require(l2Block == 555555, "Should record ArbSys L2 block number");
        require(attestor.rootOf(101) == root, "rootOf mismatch");
    }

    function test_ConstructorRevertIfChain4663AndNotArbitrum() public {
        vm.chainId(4663);
        vm.expectRevert("Chain 4663 must use ArbSys");
        new WaggleAttestor(owner, publisher, false);
    }

    function test_ArbSysFailureLoudRevert() public {
        MockArbSys(address(100)).setShouldRevert(true);

        vm.prank(publisher);
        vm.warp(2000);
        bytes32 root = keccak256("merkle_root_err");

        vm.expectRevert("ArbSys L2 block call failed");
        attestor.attest(102, root, 1, 1, 1000, "ipfs://snap");
    }

    function test_WriteOnceImmutableAndOutOfOrder() public {
        vm.prank(publisher);
        vm.warp(3000);

        bytes32 root101 = keccak256("root101");
        bytes32 root100 = keccak256("root100");

        // Attest snapshot 101 first
        attestor.attest(101, root101, 1, 1, 2500, "ipfs://snap101");

        // Out-of-order retry: attest snapshot 100 next
        attestor.attest(100, root100, 1, 1, 2400, "ipfs://snap100");

        // Re-attesting snapshot 100 must revert
        vm.expectRevert("Snapshot already attested");
        attestor.attest(100, root100, 1, 1, 2400, "ipfs://snap100_dupe");
    }

    function test_WindowEndFutureRevert() public {
        vm.prank(publisher);
        vm.warp(1000);

        bytes32 root = keccak256("root_future");
        uint64 futureWindow = 1100; // > block.timestamp

        vm.expectRevert("Window not closed");
        attestor.attest(105, root, 1, 1, futureWindow, "ipfs://snap_future");
    }
}
