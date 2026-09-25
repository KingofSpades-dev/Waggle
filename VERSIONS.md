# Waggle v3 Stack & Version Pinning Manifest (`VERSIONS.md`)

**Date:** September 2026  
**Status:** Frozen Baseline (Phase 0)  
**Target Chain:** Robinhood Chain (Chain ID: 4663, Arbitrum Nitro Stack)  
**Attestation Contract:** `0x7fc7f477b12045cfefbde9e692812f64391b969b`

---

## 1. Zero-Knowledge Framework & Precompiles (Succinct SP1)

| Dependency | Pinned Version / Tag | Purpose / Notes |
|---|---|---|
| **SP1 SDK** | `v4.0.0` | Proof generation host orchestrator |
| **`sp1-zkvm` Crate** | `v4.0.0` | Guest environment execution & I/O |
| **`sp1-contracts` Repository** | `v4.0.0` (`succinctlabs/sp1-contracts`) | `SP1VerifierGroth16.sol` contract source |
| **`sp1-patches/tiny-keccak`** | `patch-v4.0.0` | RISC-V accelerated Keccak256 precompile |
| **`sp1-patches/sha2`** | `patch-v4.0.0` | RISC-V accelerated Sha256 precompile |

---

## 2. Smart Contract & Toolchain Pinning

| Component | Pinned Standard | Target / Context |
|---|---|---|
| **Solidity Compiler** | `0.8.24` | EVM target `shanghai` |
| **OpenZeppelin Contracts** | `v5.0.2` (`@openzeppelin/contracts`) | `MerkleProof.sol` sorted-pair keccak |
| **OpenZeppelin MerkleTree** | `v1.0.0` (`@openzeppelin/merkle-tree`) | Offchain `SimpleMerkleTree` builder |
| **Arbitrum Precompile** | `ArbSys` (`0x0000000000000000000000000000000000000064`) | Robinhood Chain L2 block number resolution |

---

## 3. Rust Toolchain & Crate Pinning

| Toolchain / Crate | Pinned Version | Notes |
|---|---|---|
| **Rust Toolchain** | `1.81.0-nightly` | Used for `cargo prove build --docker` |
| **`alloy-primitives`** | `0.8.0` (`default-features = false`) | EVM types (`B256`, `Address`, `keccak256`) |
| **`alloy-sol-types`** | `0.8.0` (`default-features = false`) | Solidity ABI encoding / decoding in guest |
| **`serde`** | `1.0.204` (`default-features = false`, `alloc`) | Witness serialization / deserialization |

---

## 4. Protocol Invariants & Schema Versions

| Metric / Invariant | Pinned Value | Scope |
|---|---|---|
| **Scorer Engine Version** | `SCORER_VERSION = 3` | `waggle-score::SCORER_VERSION` |
| **Metrics Schema Version** | `METRICS_VERSION = 3` | Leaf Format v3 snapshot leaves |
| **Target Chain ID** | `4663` | Robinhood Chain Mainnet |
| **Basis Points Scale** | `BPS = 10_000` | Fixed-point integer denominator |
| **Timelock Delay** | `TIMELOCK = 48 hours` | `WaggleFitVerifier` governance delay |

---

## 5. Deployment Record Verification

- **`WaggleAttestor.sol` Mainnet Address**: `0x7fc7f477b12045cfefbde9e692812f64391b969b`
- **Deployer Address**: `0xcdc52c6c98ee5775d1d6faee5f7f8329d1e1ac8a`
- **Deployment Transaction**: `0xd3de1cf33fbf31c76f32aceba71b6ab35f8e53997a39070185a8d1b5466c4b1d`
- **Deployment Block**: `72088517`
- **Block Explorer**: https://robinhoodchain.blockscout.com/address/0x7fc7f477b12045cfefbde9e692812f64391b969b
