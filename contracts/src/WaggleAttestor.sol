// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Interface to the official Arbitrum Nitro / ArbOS system precompile at address(100)
interface ArbSys {
    function arbBlockNumber() external view returns (uint256);
}

/// @title WaggleAttestor
/// @notice Immutable onchain Merkle root attestation for Waggle research metrics snapshots.
/// @dev Target Network: Robinhood Chain (Chain ID: 4663). Non-upgradable, holds no funds.
contract WaggleAttestor {
    address public immutable owner;
    address public publisher;
    bool public immutable isArbitrumChain;

    ArbSys private constant ARB_SYS = ArbSys(address(100));

    struct SnapshotRecord {
        bytes32 merkleRoot;
        uint32 metricsVersion;
        uint32 weightsVersion;
        uint64 windowEnd;
        uint64 attestedAtBlock;     // L2 block number (from ArbSys on Arbitrum stacks)
        uint64 attestedAtTimestamp; // L2 block timestamp
        string uri;
    }

    mapping(uint64 => SnapshotRecord) public snapshots;

    event SnapshotAttested(
        uint64 indexed snapshotId,
        bytes32 merkleRoot,
        uint32 metricsVersion,
        uint32 weightsVersion,
        uint64 windowEnd,
        uint64 attestedAtBlock,
        uint64 attestedAtTimestamp,
        string uri
    );

    event PublisherRotated(address indexed oldPublisher, address indexed newPublisher);

    modifier onlyPublisher() {
        require(msg.sender == publisher, "Waggle: caller is not publisher");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Waggle: caller is not owner");
        _;
    }

    constructor(address _ownerMultisig, address _publisher, bool _isArbitrumChain) {
        require(_ownerMultisig != address(0), "Owner cannot be zero");
        require(_publisher != address(0), "Publisher cannot be zero");

        // Enforce safety: Chain 4663 MUST use ArbSys L2 block number
        // Prevents silent fallback to L1 block numbers if deployment flag is misconfigured
        if (block.chainid == 4663) {
            require(_isArbitrumChain, "Chain 4663 must use ArbSys");
        }

        owner = _ownerMultisig;
        publisher = _publisher;
        isArbitrumChain = _isArbitrumChain;
    }

    function _getL2BlockNumber() internal view returns (uint64) {
        if (isArbitrumChain) {
            try ARB_SYS.arbBlockNumber() returns (uint256 l2Block) {
                return uint64(l2Block);
            } catch {
                revert("ArbSys L2 block call failed");
            }
        }
        return uint64(block.number);
    }

    function attest(
        uint64 snapshotId,
        bytes32 merkleRoot,
        uint32 metricsVersion,
        uint32 weightsVersion,
        uint64 windowEnd,
        string calldata uri
    ) external onlyPublisher {
        require(snapshots[snapshotId].merkleRoot == bytes32(0), "Snapshot already attested");
        require(merkleRoot != bytes32(0), "Invalid Merkle root");
        require(windowEnd <= block.timestamp, "Window not closed");

        uint64 l2Block = _getL2BlockNumber();

        snapshots[snapshotId] = SnapshotRecord({
            merkleRoot: merkleRoot,
            metricsVersion: metricsVersion,
            weightsVersion: weightsVersion,
            windowEnd: windowEnd,
            attestedAtBlock: l2Block,
            attestedAtTimestamp: uint64(block.timestamp),
            uri: uri
        });

        emit SnapshotAttested(
            snapshotId,
            merkleRoot,
            metricsVersion,
            weightsVersion,
            windowEnd,
            l2Block,
            uint64(block.timestamp),
            uri
        );
    }

    function setPublisher(address _newPublisher) external onlyOwner {
        require(_newPublisher != address(0), "New publisher cannot be zero");
        emit PublisherRotated(publisher, _newPublisher);
        publisher = _newPublisher;
    }

    function rootOf(uint64 snapshotId) external view returns (bytes32) {
        return snapshots[snapshotId].merkleRoot;
    }
}
