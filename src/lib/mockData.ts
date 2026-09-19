import { ChainData, VenueData, MetricType, MetricDefinition } from './types';

export const CHAINS: ChainData[] = [
  {
    name: "Solana",
    key: "sol",
    hue: "#7b45d8",
    src: "GeckoTerminal, DefiLlama",
    conf: "high",
    n: 9800,
    isCovered: true,
    cats: { agent: 62, defi: 74, game: 58, meme: 92, rwa: 31 },
    meta: { agent: 78, defi: 66, game: 49, meme: 96, rwa: 22 }
  },
  {
    name: "Base",
    key: "base",
    hue: "#0091b0",
    src: "GeckoTerminal, DexScreener",
    conf: "med",
    n: 1720,
    isCovered: true,
    cats: { agent: 88, defi: 71, game: 54, meme: 64, rwa: 44 },
    meta: { agent: 71, defi: 52, game: 38, meme: 70, rwa: 33 }
  },
  {
    name: "BNB Chain",
    key: "bnb",
    hue: "#c08a00",
    src: "DefiLlama, DexScreener",
    conf: "med",
    n: 2100,
    isCovered: true,
    cats: { agent: 41, defi: 69, game: 77, meme: 73, rwa: 38 },
    meta: { agent: 44, defi: 58, game: 64, meme: 81, rwa: 29 }
  },
  {
    name: "Robinhood",
    key: "rh",
    hue: "#12b981",
    src: "self indexed from RPC",
    conf: "low",
    n: 340,
    isCovered: true,
    cats: { agent: 34, defi: 42, game: 26, meme: 69, rwa: 81 },
    meta: { agent: 21, defi: 30, game: 18, meme: 74, rwa: 46 }
  },
  {
    name: "Arc",
    key: "arc",
    hue: "#e07b28",
    src: "DexScreener, GeckoTerminal",
    conf: "med",
    n: 310,
    isCovered: true,
    cats: { agent: 55, defi: 68, game: 42, meme: 78, rwa: 35 },
    meta: { agent: 62, defi: 54, game: 40, meme: 80, rwa: 28 }
  }
];

export const VENUES: VenueData[] = [
  { name: "Pump.fun", chain: "sol", perday: 10400, liq: 4100, extract: 71, surv: 1.9 },
  { name: "Bonk.fun", chain: "sol", perday: 2200, liq: 5600, extract: 64, surv: 2.6 },
  { name: "Bags", chain: "sol", perday: 640, liq: 7300, extract: 58, surv: 3.4 },
  { name: "Clanker", chain: "base", perday: 880, liq: 9100, extract: 47, surv: 5.1 },
  { name: "Zora", chain: "base", perday: 410, liq: 6800, extract: 39, surv: 4.2 },
  { name: "Four.meme", chain: "bnb", perday: 1600, liq: 3900, extract: 69, surv: 2.4 },
  { name: "PAIR", chain: "rh", perday: 310, liq: 12400, extract: 62, surv: 3.1 },
  { name: "ArcSwap", chain: "arc", perday: 310, liq: 8400, extract: 42, surv: 3.8 }
];

export const METRICS: Record<MetricType, MetricDefinition> = {
  survival: { dir: "high", fmt: (v: number) => v.toFixed(1) + "%", label: "still trading after 7 days" },
  launches: { dir: "none", fmt: (v: number) => Math.round(v).toString(), label: "launches started in this hour" },
  extraction: { dir: "low", fmt: (v: number) => v.toFixed(0) + "%", label: "first minute extraction" }
};

export const WEIGHTS = {
  chain: 35,
  venue: 30,
  meta: 20,
  hour: 15
};

export const EXAMPLES: Record<string, string> = {
  agent: "An autonomous trading agent that rebalances onchain positions for DeFi users. No audience yet, small treasury.",
  game: "A browser game with an in game currency, aimed at casual players who do not hold crypto.",
  defi: "A lending protocol with a governance token, audited, launching with a liquidity partner.",
  meme: "A community memecoin built around a running joke from a Discord of about four thousand people.",
  rwa: "A token representing fractional ownership of rental property, with a licensed custodian."
};

function seeded(a: number, b: number, c: number): number {
  const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return x - Math.floor(x);
}

// Matrix values pregenerator
export const MATRIX_DATA: Record<string, Record<MetricType, (number | null)[]>> = {};

CHAINS.forEach((c, ci) => {
  MATRIX_DATA[c.key] = {
    survival: [],
    launches: [],
    extraction: []
  };
  
  (Object.keys(METRICS) as MetricType[]).forEach((m, mi) => {
    MATRIX_DATA[c.key][m] = Array.from({ length: 24 }, (_, h) => {
      const ev = Math.exp(-Math.pow(h - 20, 2) / 16);
      const as = Math.exp(-Math.pow(h - 7, 2) / 22);
      const nz = seeded(ci, mi, h);
      if (m === "survival") return 1.2 + ev * 4.2 + as * 1.4 + nz * 1.3;
      if (m === "launches") return 40 + ev * 260 + as * 150 + nz * 70;
      return 74 - ev * 26 - as * 9 + nz * 16;
    });
  });
});

export const METRICS_VERSION = "v1.0.4";
export const WEIGHTS_VERSION = "v1.0.0";
export const CLASSIFIER_VERSION = "v1.2.0";
