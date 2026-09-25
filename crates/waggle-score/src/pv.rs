use alloy_sol_types::sol;

sol! {
    struct FitPublicValues {
        bytes32 reportId;
        uint8   mode;               // 0 public, 1 private
        uint64  snapshotId;
        bytes32 merkleRoot;
        uint32  metricsVersion;
        uint32  weightsVersion;
        uint32  scorerVersion;
        bytes32 weightsHash;
        bytes32 featuresCommitment;
        bytes32 resultCommitment;   // private mode only, else 0
        uint64  chainId;            // result fields: 0 in private mode
        uint32  venueId;
        uint8   hourStartUtc;
        uint8   hourLen;
        uint32  chainScoreBps;
        uint32  venueScoreBps;
        uint32  metaScoreBps;
        uint32  hourScoreBps;
        uint32  compositeBps;
        uint32  confidenceFlags;
    }

    struct BatchPublicValues {
        bytes32 fitVkeyDigest;
        uint64  snapshotId;
        bytes32 merkleRoot;
        uint32  weightsVersion;
        bytes32 weightsHash;
        uint32  scorerVersion;
        uint32  count;
        bytes32 reportsRoot;
    }

    struct DisclosurePublicValues {
        bytes32 fitVkeyDigest;
        bytes32 reportId;
        bytes32 fitPublicValuesHash;
        uint32  minCompositeBps;    // 0 = not claimed
        bool    claimsChain;
        uint64  chainId;
        uint64  minSnapshotId;      // 0 = not claimed
    }
}
