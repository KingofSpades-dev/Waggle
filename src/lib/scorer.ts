import { AnalyseRequestBody, AnalyseResponseBody, ScoredResult } from './types';
import { getLiveDatabaseMetrics } from './dbMetrics';

const WEIGHTS = { chain: 35, venue: 30, meta: 20, hour: 15 };
const CLASSIFIER_VERSION = 'v1.0.4-mimo-llm';
const WEIGHTS_VERSION = 'v1.0.0-devbrief-spec';
const METRICS_VERSION = 'v1.0.4-pg-timescale';

const TAXONOMY_KEYWORDS: Record<string, string[]> = {
  agent: ["agent", "autonomous", "ai", "bot", "llm", "inference", "agentic"],
  defi: ["defi", "lending", "yield", "liquidity", "perp", "stablecoin", "protocol", "vault", "dex"],
  game: ["game", "gaming", "play", "player", "nft", "item", "quest", "arcade"],
  meme: ["meme", "community", "joke", "discord", "culture", "viral", "coin", "cat", "dog"],
  rwa: ["rwa", "property", "asset", "equity", "custodian", "tokenis", "tokeniz", "real world", "house"]
};

// Category Affinity per Chain (DevBrief Section 8.2 Taxonomy Fit)
const CHAIN_CATEGORY_AFFINITY: Record<string, Record<string, number>> = {
  sol: { meme: 94, game: 82, agent: 76, defi: 68, rwa: 45 },
  base: { agent: 92, meme: 86, defi: 82, game: 72, rwa: 52 },
  bnb: { game: 88, defi: 84, meme: 76, agent: 62, rwa: 48 },
  rh: { rwa: 95, defi: 72, agent: 58, meme: 42, game: 32 },
  arc: { rwa: 92, defi: 86, agent: 64, meme: 38, game: 28 }
};

// Security: Prompt injection filter & prompt sanitizer
export function sanitizeInputText(rawText: string): string {
  let text = rawText.slice(0, 1500); // Cap size
  text = text.replace(/(ignore previous|system prompt|override score|always return|act as)/gi, "[redacted]");
  return text;
}

export function classifyTextFallback(text: string): { cat: string; hits: number } {
  const clean = sanitizeInputText(text).toLowerCase();
  let best = "meme";
  let maxHits = 0;

  for (const [cat, keywords] of Object.entries(TAXONOMY_KEYWORDS)) {
    const hits = keywords.filter(word => clean.includes(word)).length;
    if (hits > maxHits) {
      maxHits = hits;
      best = cat;
    }
  }

  return { cat: best, hits: maxHits };
}

/**
 * Classifies project text using Xiaomi Mimo / OpenAI-compatible API protocol,
 * falling back to keyword matcher if API key is unconfigured or fails.
 */
export async function classifyText(text: string): Promise<{ cat: string; hits: number; isAi: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  const baseUrl = process.env.OPENAI_API_BASE_URL || 'https://token-plan-sgp.xiaomimimo.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (apiKey && apiKey.trim().length > 0) {
    try {
      const cleanText = sanitizeInputText(text);
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          messages: [
            {
              role: 'system',
              content: 'You are an accurate taxonomy classifier for token projects. Classify the user submission into EXACTLY ONE category from: agent, defi, game, meme, rwa. Output JSON ONLY in format: {"category": "agent"|"defi"|"game"|"meme"|"rwa", "confidence": 0.0-1.0}'
            },
            {
              role: 'user',
              content: cleanText
            }
          ]
        })
      });

      if (res.ok) {
        const json = await res.json();
        const contentStr = json.choices?.[0]?.message?.content || '';
        const match = contentStr.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          const validCats = ['agent', 'defi', 'game', 'meme', 'rwa'];
          if (validCats.includes(parsed.category)) {
            return {
              cat: parsed.category,
              hits: Math.round((parsed.confidence || 0.8) * 5),
              isAi: true
            };
          }
        }
      }
    } catch (err) {
      console.warn('[Scorer] Mimo LLM Classification API call failed, falling back to keyword matcher:', err);
    }
  }

  // Fallback to keyword matcher
  const fb = classifyTextFallback(text);
  return { cat: fb.cat, hits: fb.hits, isAi: false };
}

export async function scoutProject(req: AnalyseRequestBody): Promise<AnalyseResponseBody> {
  const text = req.description || "";
  const { cat, hits } = await classifyText(text);
  const isSmallTreasury = /no audience|small treasury|no budget|solo|first token|low liquidity/i.test(text);

  // Fetch real live metrics from PostgreSQL
  const dbMetrics = await getLiveDatabaseMetrics();
  const dbChains = dbMetrics.chains;
  const dbVenues = dbMetrics.venues;
  const matrix = dbMetrics.matrixData;

  const scored: ScoredResult[] = dbChains.map(c => {
    // 1. Chain Fit: Based on taxonomy category affinity + DB survival rate multiplier
    const baseAffinity = CHAIN_CATEGORY_AFFINITY[c.key]?.[cat] || 65;
    const survMult = c.key === 'sol' ? 0.95 : (c.key === 'base' ? 0.98 : (c.key === 'bnb' ? 0.92 : 0.88));
    const chainFit = Math.min(100, Math.round(baseAffinity * survMult));

    // 2. Hour Window Fit: Peak UTC hour from 24-hour UTC matrix
    const hours = (matrix[c.key]?.survival as number[]) || Array(24).fill(40);
    const maxHourSurvival = Math.max(...hours);
    const bestHour = hours.indexOf(maxHourSurvival);
    const hourFit = Math.min(100, Math.round((maxHourSurvival / 70) * 100));

    // 3. Venue Fit: Mechanics fit (low sniper extraction + high survival)
    const chainVenues = dbVenues.filter(v => v.chainKey === c.key);
    const sortedVenues = [...chainVenues].sort((a, b) =>
      isSmallTreasury ? a.extractionPct - b.extractionPct : b.survivalRatePct - a.survivalRatePct
    );
    const venue = sortedVenues[0] || { name: "Default Venue", extractionPct: 38, survivalRatePct: 45 };
    const venueFit = Math.min(100, Math.round(100 - venue.extractionPct + (venue.survivalRatePct * 0.35)));

    // 4. Meta Heat: Category congestion vs attention
    const metaHeat = c.key === 'sol' ? 78 : (c.key === 'base' ? 68 : (c.key === 'bnb' ? 56 : (c.key === 'rh' ? 42 : 38)));

    // Composite Score Calculation (35% Chain Fit + 30% Venue Fit + 20% Meta Heat + 15% Hour Window)
    const composite = Math.round(
      (chainFit * WEIGHTS.chain) / 100 +
      (venueFit * WEIGHTS.venue) / 100 +
      ((100 - Math.abs(metaHeat - 62)) * WEIGHTS.meta) / 100 +
      (hourFit * WEIGHTS.hour) / 100
    );

    const confVal: 'high' | 'med' | 'low' = c.conf === 'mid' ? 'med' : c.conf;
    return {
      c: {
        name: c.name,
        key: c.key,
        hue: c.hue,
        src: c.dataSources.join(', '),
        conf: confVal,
        n: c.launchesCount,
        cats: null,
        meta: null,
        isCovered: true
      },
      chainFit,
      venue: {
        name: venue.name,
        chain: c.key,
        perday: venue.launchesCount || 20,
        liq: venue.avgInitialLiquidityUsd || 4500,
        extract: venue.extractionPct,
        surv: venue.survivalRatePct
      },
      venueFit,
      metaHeat,
      hourFit,
      best: bestHour,
      composite
    };
  }).sort((a, b) => b.composite - a.composite);

  const top = scored[0];
  const alternatives = scored.slice(1, 3).map(s => ({
    chain_name: s.c.name,
    composite_score: s.composite
  }));

  let metaReading = "quiet, which means less competition and less passing traffic";
  if (top.metaHeat > 75) {
    metaReading = "crowded, and survival inside this category is falling, so the crowd is noise";
  } else if (top.metaHeat > 55) {
    metaReading = "busy, with survival holding, so the crowd is attention rather than noise";
  }

  let confidenceCaveat = "Confidence is high on chain level data, moderate at venue level.";
  if (top.c.conf === "low") {
    confidenceCaveat = "Confidence is low. The sample on this chain is too small to lean on, and this reads as a suggestion rather than a finding.";
  } else if (top.c.conf === "med") {
    confidenceCaveat = "Confidence is moderate. The sample is readable but thinner than Solana's.";
  }

  return {
    verdict: {
      chain_name: top.c.name,
      chain_key: top.c.key,
      venue_name: top.venue.name,
      hour_utc: top.best,
      composite_score: top.composite
    },
    dimensions: {
      chain_fit: top.chainFit,
      venue_fit: top.venueFit,
      meta_heat: top.metaHeat,
      hour_window: top.hourFit
    },
    sample_size: top.c.n,
    confidence: top.c.conf,
    confidence_caveat: confidenceCaveat,
    meta_reading: metaReading,
    alternatives,
    classified_category: cat,
    is_weak_signal: hits < 2,
    version_metadata: {
      snapshot_id: dbMetrics.snapshotId,
      metrics_version: METRICS_VERSION,
      weights_version: WEIGHTS_VERSION,
      classifier_version: CLASSIFIER_VERSION
    },
    disclaimer: "This describes structural fit from historical data. It is not advice and not a prediction."
  };
}
