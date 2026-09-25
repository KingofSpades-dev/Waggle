import { describe, it, expect } from "vitest";
import { WAGGLE_ATTESTOR_ADDRESS, ROBINHOOD_CHAIN_ID } from "@/lib/viemClient";
import {
  ROBINHOOD_FACTORY_REGISTRY,
  attributeFactoryLaunch
} from "@/indexer/factoryHandlers";
import { PONDER_CONFIG } from "../../../ponder.config";
import fs from "fs";
import path from "path";

describe("FASE 6: UI Integration, Disclosures & Compliance Test Suite", () => {
  const readAppFile = (relPath: string) => {
    const fullPath = path.resolve(process.cwd(), relPath);
    return fs.readFileSync(fullPath, "utf-8");
  };

  describe("Epic 16: Pemenuhan Penuh Brief Section 6", () => {
    it("TASK-6.1.1: Navbar includes Robinhood, Verify, and Wallet Connect integration", () => {
      const navbarSrc = readAppFile("src/components/Navbar.tsx");
      expect(navbarSrc).toContain('href="/robinhood"');
      expect(navbarSrc).toContain('href="/verify"');
      expect(navbarSrc).toContain('href="/coverage"');
      expect(navbarSrc).toContain("WalletConnectModal");

      const walletModalSrc = readAppFile("src/components/WalletConnectModal.tsx");
      expect(walletModalSrc).toContain("ROBINHOOD_CHAIN_ID");
      expect(walletModalSrc).toContain("x402");
      expect(walletModalSrc).toContain("EIP-3009");
    });

    it("TASK-6.1.2: Footer includes WaggleAttestor address and Robinhood Chain Blockscout explorer links", () => {
      const homeSrc = readAppFile("src/app/page.tsx");
      expect(homeSrc).toContain(WAGGLE_ATTESTOR_ADDRESS);
      expect(homeSrc).toContain("robinhoodchain.blockscout.com/address/");
      expect(homeSrc).toContain('href="/terms"');
      expect(homeSrc).toContain('href="/privacy"');

      const rhSrc = readAppFile("src/app/robinhood/page.tsx");
      expect(rhSrc).toContain(WAGGLE_ATTESTOR_ADDRESS);
      expect(rhSrc).toContain("robinhoodchain.blockscout.com/address/");
      expect(rhSrc).toContain('href="/terms"');
      expect(rhSrc).toContain('href="/privacy"');
    });

    it("TASK-6.1.3: Method page contains 'How to Check Our Numbers Yourself' Merkle guide", () => {
      const methodSrc = readAppFile("src/app/method/page.tsx");
      expect(methodSrc).toContain("How to Check Our Numbers Yourself");
      expect(methodSrc).toContain("StandardMerkleTree.verify");
      expect(methodSrc).toContain("WaggleAttestor");
      expect(methodSrc).toContain("/v1/proof");
      expect(methodSrc).toContain('href="/verify"');
    });

    it("TASK-6.1.4: Coverage page displays Registry Completeness Gauges and unknown_venue bucket", () => {
      const covSrc = readAppFile("src/app/coverage/page.tsx");
      expect(covSrc).toContain("Registry Completeness & Unknown Venue Attribution");
      expect(covSrc).toContain("97.6% Overall Coverage");
      expect(covSrc).toContain("2.4% unknown_venue");
      expect(covSrc).toContain("Robinhood Chain");
      expect(covSrc).toContain("100.0%");
    });

    it("TASK-6.1.5: Header livebar displays LAST ATTESTED BLOCK #[N] with explorer link", () => {
      const homeSrc = readAppFile("src/app/page.tsx");
      expect(homeSrc).toContain("LAST ATTESTED BLOCK");
      expect(homeSrc).toContain("robinhoodchain.blockscout.com/block/");
      expect(homeSrc).toContain("#72,088,517");
    });
  });

  describe("Epic 17: Legal, Terms & Privacy Policy", () => {
    it("TASK-6.2.1a: Terms of Service page contains non-financial advice, x402 rules, and conflict policy", () => {
      const termsSrc = readAppFile("src/app/terms/page.tsx");
      expect(termsSrc).toContain("Research Reports & Non-Financial Advice");
      expect(termsSrc).toContain("transferWithAuthorization");
      expect(termsSrc).toContain("Deterministic Nonce");
      expect(termsSrc).toContain("Zero-Leakage Invariant");
      expect(termsSrc).toContain("Refund, Retry & Cancellation Policy");
      expect(termsSrc).toContain("Startup Crash Recovery Job");
      expect(termsSrc).toContain("Pons");
    });

    it("TASK-6.2.1b: Privacy Policy page contains unlaunched project confidentiality, AES-256 encryption, and 7-day TTL", () => {
      const privSrc = readAppFile("src/app/privacy/page.tsx");
      expect(privSrc).toContain("The Confidentiality Guarantee: Zero Disclosure of Unlaunched Projects");
      expect(privSrc).toContain("Private Report Receipts & Client Salts");
      expect(privSrc).toContain("keccak256(abi.encode(projectText, clientSalt))");
      expect(privSrc).toContain("AES-256-GCM");
      expect(privSrc).toContain("7-day Time-To-Live (TTL)");
    });
  });

  describe("Robinhood Mainnet Artemis Ingestion & Attribution Integration", () => {
    it("Artemis Launcher is officially registered in ROBINHOOD_FACTORY_REGISTRY", () => {
      const artemisAddr = "0xeea9d0f7ee0958c6d59f25162be4e69ba60a0f71";
      const uniswapV2Addr = "0x8bceaa40b9acdfaedf85adf4ff01f5ad6517937f";

      expect(ROBINHOOD_FACTORY_REGISTRY[artemisAddr]).toBeDefined();
      expect(ROBINHOOD_FACTORY_REGISTRY[artemisAddr].name).toBe("Artemis Launcher");
      expect(ROBINHOOD_FACTORY_REGISTRY[artemisAddr].curveType).toBe("atomic_launch");

      // Verify attribution returns Artemis
      const attr = attributeFactoryLaunch(artemisAddr);
      expect(attr.venueKey).toBe("artemis");
      expect(attr.venueName).toBe("Artemis Launcher");
      expect(attr.isKnownVenue).toBe(true);

      // Verify Uniswap V2 canonical factory
      expect(ROBINHOOD_FACTORY_REGISTRY[uniswapV2Addr]).toBeDefined();
    });

    it("Ponder indexer tracks ArtemisLauncher with deploy block 66,953,870", () => {
      const artemisConfig = (PONDER_CONFIG.contracts as any).ArtemisLauncher;
      expect(artemisConfig).toBeDefined();
      expect(artemisConfig.address).toBe("0xeea9d0f7ee0958c6d59f25162be4e69ba60a0f71");
      expect(artemisConfig.startBlock).toBe(66_953_870);
    });
  });
});
