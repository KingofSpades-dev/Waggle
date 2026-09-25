// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ISP1Verifier} from "@sp1-contracts/ISP1Verifier.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

interface IWaggleAttestor {
    function rootOf(uint64 snapshotId) external view returns (bytes32);
}

/// @title WaggleFitVerifier — Robinhood Chain (4663)
/// @notice Verifies Waggle Proof of Fit. Holds no funds. Anyone may submit proofs.
/// @dev Status: Draft, Pre-Audit
contract WaggleFitVerifier {
    struct FitPublicValues {
        bytes32 reportId;
        uint8 mode;
        uint64 snapshotId;
        bytes32 merkleRoot;
        uint32 metricsVersion;
        uint32 weightsVersion;
        uint32 scorerVersion;
        bytes32 weightsHash;
        bytes32 featuresCommitment;
        bytes32 resultCommitment;
        uint64 chainId;
        uint32 venueId;
        uint8 hourStartUtc;
        uint8 hourLen;
        uint32 chainScoreBps;
        uint32 venueScoreBps;
        uint32 metaScoreBps;
        uint32 hourScoreBps;
        uint32 compositeBps;
        uint32 confidenceFlags;
    }

    struct BatchPublicValues {
        bytes32 fitVkeyDigest;
        uint64 snapshotId;
        bytes32 merkleRoot;
        uint32 weightsVersion;
        bytes32 weightsHash;
        uint32 scorerVersion;
        uint32 count;
        bytes32 reportsRoot;
    }

    struct DisclosurePublicValues {
        bytes32 fitVkeyDigest;
        bytes32 reportId;
        bytes32 fitPublicValuesHash;
        uint32 minCompositeBps;
        bool claimsChain;
        uint64 chainId;
        uint64 minSnapshotId;
    }

    struct ProgramConfig {
        ISP1Verifier verifier;  // SP1VerifierGroth16 from pinned sp1-contracts
        bytes32 fitVkey;        // fit program, vk.bytes32() (Groth16)
        bytes32 fitVkeyDigest;  // fit program, pack(vk.hash_u32()) (recursion)
        bytes32 batchVkey;      // aggregate program, vk.bytes32()
        bytes32 disclosureVkey; // disclose program, vk.bytes32() (can be 0 at initial launch)
        uint32 scorerVersion;   // must equal SCORER_VERSION compiled into fitVkey
    }

    struct WeightsEntry {
        bytes32 hash;
        uint64 activeAt;
    }

    struct Batch {
        bytes32 reportsRoot;
        uint64 snapshotId;
        uint32 scorerVersion;
        uint32 count;
    }

    struct FitRecord {
        bytes32 publicValuesHash;
        uint64 snapshotId;
        uint64 provenAt;
        bytes32 batchId; // 0 if proven individually
    }

    uint8 internal constant MODE_PRIVATE = 1;
    uint64 public constant TIMELOCK = 48 hours;

    IWaggleAttestor public immutable attestor;

    address public owner;
    address public pendingOwner;
    bool public paused;

    ProgramConfig public config;
    ProgramConfig public pendingConfig;
    uint64 public pendingConfigReadyAt;

    mapping(bytes32 => bool) public acceptedFitDigest;
    mapping(uint32 => WeightsEntry) public weights;
    mapping(bytes32 => Batch) public batches;
    mapping(bytes32 => FitRecord) public reports;

    event FitProven(
        bytes32 indexed reportId,
        uint64 indexed snapshotId,
        bytes32 featuresCommitment,
        uint32 scorerVersion,
        uint32 weightsVersion,
        bytes publicValues
    );
    event BatchProven(bytes32 indexed batchId, uint64 indexed snapshotId, bytes32 reportsRoot, uint32 count);
    event WeightsRegistered(uint32 indexed weightsVersion, bytes32 weightsHash, uint64 activeAt);
    event ConfigProposed(bytes32 fitVkey, uint32 scorerVersion, address verifier, uint64 readyAt);
    event ConfigUpdated(bytes32 fitVkey, uint32 scorerVersion, address verifier);
    event ConfigCancelled();
    event Paused();
    event Unpaused();
    event OwnershipTransferStarted(address indexed from, address indexed to);
    event OwnershipTransferred(address indexed from, address indexed to);

    error NotOwner();
    error IsPaused();
    error ZeroValue();
    error ReportIdMismatch();
    error BadMode();
    error AlreadyProven();
    error AlreadyRegistered();
    error ScorerVersionMismatch();
    error VkeyMismatch();
    error RootMismatch();
    error UnregisteredWeights();
    error WeightsNotActive();
    error NotInBatch();
    error SnapshotMismatch();
    error ReportNotProven();
    error TimelockActive();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert IsPaused();
        _;
    }

    constructor(address owner_, IWaggleAttestor attestor_, ProgramConfig memory initial) {
        if (owner_ == address(0) || address(attestor_) == address(0)) revert ZeroValue();
        _validateConfig(initial);
        owner = owner_;
        attestor = attestor_;
        config = initial;
        acceptedFitDigest[initial.fitVkeyDigest] = true;
        emit ConfigUpdated(initial.fitVkey, initial.scorerVersion, address(initial.verifier));
    }

    function submitProof(bytes32 reportId, bytes calldata publicValues, bytes calldata proofBytes)
        external
        whenNotPaused
    {
        ProgramConfig memory c = config;
        c.verifier.verifyProof(c.fitVkey, publicValues, proofBytes);

        FitPublicValues memory pv = abi.decode(publicValues, (FitPublicValues));
        if (pv.scorerVersion != c.scorerVersion) revert ScorerVersionMismatch();
        _checkAnchors(pv.snapshotId, pv.merkleRoot, pv.weightsVersion, pv.weightsHash);
        _record(reportId, pv, publicValues, bytes32(0));
    }

    function submitBatch(bytes calldata publicValues, bytes calldata proofBytes)
        external
        whenNotPaused
        returns (bytes32 batchId)
    {
        ProgramConfig memory c = config;
        c.verifier.verifyProof(c.batchVkey, publicValues, proofBytes);

        BatchPublicValues memory b = abi.decode(publicValues, (BatchPublicValues));
        if (b.fitVkeyDigest != c.fitVkeyDigest) revert VkeyMismatch();
        if (b.scorerVersion != c.scorerVersion) revert ScorerVersionMismatch();
        _checkAnchors(b.snapshotId, b.merkleRoot, b.weightsVersion, b.weightsHash);

        batchId = keccak256(publicValues);
        if (batches[batchId].reportsRoot != bytes32(0)) revert AlreadyProven();
        batches[batchId] = Batch(b.reportsRoot, b.snapshotId, b.scorerVersion, b.count);
        emit BatchProven(batchId, b.snapshotId, b.reportsRoot, b.count);
    }

    function inBatch(bytes32 batchId, bytes calldata publicValues, bytes32[] calldata proof)
        public
        view
        returns (bool)
    {
        bytes32 root = batches[batchId].reportsRoot;
        if (root == bytes32(0)) return false;
        bytes32 leaf = keccak256(bytes.concat(keccak256(publicValues)));
        return MerkleProof.verifyCalldata(proof, root, leaf);
    }

    function claimFromBatch(
        bytes32 batchId,
        bytes32 reportId,
        bytes calldata publicValues,
        bytes32[] calldata proof
    ) external whenNotPaused {
        if (!inBatch(batchId, publicValues, proof)) revert NotInBatch();
        FitPublicValues memory pv = abi.decode(publicValues, (FitPublicValues));
        if (pv.snapshotId != batches[batchId].snapshotId) revert SnapshotMismatch();
        _record(reportId, pv, publicValues, batchId);
    }

    function checkDisclosure(bytes calldata publicValues, bytes calldata proofBytes)
        external
        view
        returns (DisclosurePublicValues memory d)
    {
        ProgramConfig memory c = config;
        if (c.disclosureVkey == bytes32(0)) revert VkeyMismatch();
        c.verifier.verifyProof(c.disclosureVkey, publicValues, proofBytes);
        d = abi.decode(publicValues, (DisclosurePublicValues));
        if (!acceptedFitDigest[d.fitVkeyDigest]) revert VkeyMismatch();
        FitRecord memory r = reports[d.reportId];
        if (r.provenAt == 0 || r.publicValuesHash != d.fitPublicValuesHash) revert ReportNotProven();
    }

    function _checkAnchors(uint64 snapshotId, bytes32 merkleRoot, uint32 weightsVersion, bytes32 weightsHash)
        internal
        view
    {
        bytes32 attested = attestor.rootOf(snapshotId);
        if (attested == bytes32(0) || attested != merkleRoot) revert RootMismatch();

        WeightsEntry memory w = weights[weightsVersion];
        if (w.hash == bytes32(0) || w.hash != weightsHash) revert UnregisteredWeights();
        if (block.timestamp < w.activeAt) revert WeightsNotActive();
    }

    function _record(bytes32 reportId, FitPublicValues memory pv, bytes calldata publicValues, bytes32 batchId)
        internal
    {
        if (pv.reportId != reportId) revert ReportIdMismatch();
        if (pv.mode > MODE_PRIVATE) revert BadMode();
        if (reports[reportId].provenAt != 0) revert AlreadyProven();

        reports[reportId] = FitRecord(keccak256(publicValues), pv.snapshotId, uint64(block.timestamp), batchId);
        emit FitProven(reportId, pv.snapshotId, pv.featuresCommitment, pv.scorerVersion, pv.weightsVersion, publicValues);
    }

    function _validateConfig(ProgramConfig memory c) internal view {
        // Fix D.1: disclosureVkey can be bytes32(0) at initial deploy before Phase 2
        if (
            address(c.verifier).code.length == 0 || c.fitVkey == bytes32(0) || c.fitVkeyDigest == bytes32(0)
                || c.batchVkey == bytes32(0) || c.scorerVersion == 0
        ) revert ZeroValue();
    }

    function registerWeights(uint32 version, bytes32 hash) external onlyOwner {
        if (hash == bytes32(0)) revert ZeroValue();
        if (weights[version].hash != bytes32(0)) revert AlreadyRegistered();
        uint64 activeAt = uint64(block.timestamp) + TIMELOCK;
        weights[version] = WeightsEntry(hash, activeAt);
        emit WeightsRegistered(version, hash, activeAt);
    }

    function proposeConfig(ProgramConfig calldata next) external onlyOwner {
        _validateConfig(next);
        pendingConfig = next;
        pendingConfigReadyAt = uint64(block.timestamp) + TIMELOCK;
        emit ConfigProposed(next.fitVkey, next.scorerVersion, address(next.verifier), pendingConfigReadyAt);
    }

    function executeConfig() external onlyOwner {
        if (pendingConfigReadyAt == 0 || block.timestamp < pendingConfigReadyAt) revert TimelockActive();
        config = pendingConfig;
        acceptedFitDigest[pendingConfig.fitVkeyDigest] = true;
        delete pendingConfig;
        pendingConfigReadyAt = 0;
        emit ConfigUpdated(config.fitVkey, config.scorerVersion, address(config.verifier));
    }

    function cancelConfig() external onlyOwner {
        delete pendingConfig;
        pendingConfigReadyAt = 0;
        emit ConfigCancelled();
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }

    function transferOwnership(address to) external onlyOwner {
        pendingOwner = to;
        emit OwnershipTransferStarted(owner, to);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotOwner();
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }
}
