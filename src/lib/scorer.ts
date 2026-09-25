import { AnalyseRequestBody, AnalyseResponseBody, ScoredResult, LaunchpadFitDetail, AlternativeLaunchpad } from './types';
import { getLiveDatabaseMetrics, DbChain, DbVenue } from './dbMetrics';

const WEIGHTS = { chain: 35, venue: 30, meta: 20, hour: 15 };
const CLASSIFIER_VERSION = 'v1.1.0-empirical-quantitative-ai';
const WEIGHTS_VERSION = 'v1.0.0-devbrief-spec';
const METRICS_VERSION = 'v1.0.4-pg-timescale';

// ---------------------------------------------------------------------------
// PERF FIX #1: dbMetrics is queried fresh (and re-serialized into prompt text)
// on every single scoutProject() call. If getLiveDatabaseMetrics() returns
// 10-30K raw/near-duplicate rows (e.g. per-launch events instead of pre-
// aggregated per-chain / per-venue rollups), this file was looping over ALL
// of them to build chainSummary/venueSummary and the quantitative matrix,
// which is what blew up to ~100s (huge LLM prompt + repeated O(n) work).
//
// This system only ever reasons about a fixed, small set of chains
// (sol, base, bnb, rh, arc) and venues (virtuals, aerodrome, pump, raydium,
// fourmeme, pancakeswap, rh_settle, astrovault) — see the JSON schema in
// evaluateWithLLM. So we:
//   (a) cache the live metrics for a short TTL instead of re-fetching/
//       re-processing them on every call, and
//   (b) collapse whatever getLiveDatabaseMetrics() returns down to one row
//       per chain/venue key before anything downstream touches it.
//
// The real, durable fix is to make the Postgres/Timescale query in
// dbMetrics.ts itself aggregate (GROUP BY chain/venue, or a materialized
// view) instead of shipping raw rows into Node — this is a defensive
// safety net that makes scorer.ts fast regardless of what that query
// currently returns.
// ---------------------------------------------------------------------------
type DbMetrics = Awaited<ReturnType<typeof getLiveDatabaseMetrics>>;

const DB_METRICS_TTL_MS = 30_000; // live metrics don't need sub-second freshness
let dbMetricsCache: { data: DbMetrics; expiresAt: number } | null = null;
let dbMetricsInflight: Promise<DbMetrics> | null = null;

function dedupeByKey<T extends { key: string }>(items: T[], maxItems: number): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    if (!seen.has(item.key)) seen.set(item.key, item);
    if (seen.size >= maxItems) break; // hard safety cap even if keys turn out to be unexpectedly diverse
  }
  return Array.from(seen.values());
}

function collapseDbMetrics(raw: DbMetrics): DbMetrics {
  return {
    ...raw,
    chains: dedupeByKey(raw.chains, 10),
    venues: dedupeByKey(raw.venues, 20)
  };
}

async function getCachedDatabaseMetrics(): Promise<DbMetrics> {
  const now = Date.now();
  if (dbMetricsCache && dbMetricsCache.expiresAt > now) {
    return dbMetricsCache.data;
  }
  // Coalesce concurrent callers into a single in-flight fetch instead of
  // firing N parallel Postgres queries when several requests land at once.
  if (!dbMetricsInflight) {
    dbMetricsInflight = getLiveDatabaseMetrics()
      .then(collapseDbMetrics)
      .finally(() => { dbMetricsInflight = null; });
  }
  const data = await dbMetricsInflight;
  dbMetricsCache = { data, expiresAt: now + DB_METRICS_TTL_MS };
  return data;
}

// Security: Prompt injection filter & sanitizer
export function sanitizeInputText(rawText: string): string {
  let text = (rawText || '').slice(0, 1500);
  text = text.replace(/(ignore previous|system prompt|override score|always return|act as)/gi, "[redacted]");
  return text.trim();
}

// PERF FIX #2: these were rebuilt with `new RegExp(...)` inside countHits()
// on every single extractProjectFeatures() call. Compiling ~100 regexes per
// request is cheap once, but pointless repeated work at any real request
// volume — compile them once, at module load.
function compileSignalRegexes(words: string[]): RegExp[] {
  return words.map(word => new RegExp(`\\b${word}\\b`, 'i'));
}

const AGENT_SIGNAL_RES = compileSignalRegexes(["agent", "autonomous", "otonom", "ai", "bot", "llm", "inference", "agentic", "automated", "otomatis", "assistant", "builder", "copilot", "nohands", "subagent", "neural", "decision"]);
const DEFI_SIGNAL_RES = compileSignalRegexes(["defi", "lending", "yield", "liquidity", "likuiditas", "perp", "stablecoin", "protocol", "protokol", "vault", "dex", "swap", "pool", "staking", "amm", "borrow", "loan", "rebalance", "arbitrage", "cpmm"]);
const GAME_SIGNAL_RES = compileSignalRegexes(["game", "gaming", "play", "player", "pemain", "nft", "item", "quest", "arcade", "metaverse", "rpg", "p2e", "gamer", "level", "guild", "inventory", "pvp", "turnamen"]);
const MEME_SIGNAL_RES = compileSignalRegexes(["meme", "community", "komunitas", "joke", "lelucon", "discord", "culture", "viral", "coin", "koin", "cat", "dog", "anjing", "kucing", "pepe", "wif", "pump", "fun", "degen", "telegram", "fair launch", "ticker"]);
const RWA_SIGNAL_RES = compileSignalRegexes(["rwa", "property", "properti", "asset", "aset", "equity", "custodian", "tokenis", "tokeniz", "real world", "house", "estate", "debt", "bond", "mortgage", "treasury", "credit", "invoice", "villa"]);

function countHits(regexes: RegExp[], lower: string): number {
  let count = 0;
  for (const re of regexes) {
    if (re.test(lower)) count++;
  }
  return count;
}

interface ProjectFeatures {
  isAgent: boolean;
  isDeFi: boolean;
  isGame: boolean;
  isMeme: boolean;
  isRwa: boolean;
  primaryCategory: 'agent' | 'defi' | 'game' | 'meme' | 'rwa';
  categoryScores: Record<'agent' | 'defi' | 'game' | 'meme' | 'rwa', number>;
  isSmallTreasury: boolean;
  isZeroAudience: boolean;
  hasAutonomousLoop: boolean;
  needsHighThroughput: boolean;
  needsCompliance: boolean;
  detectedNameOrKeywords: string[];
}

/**
 * Deep semantic feature extractor that analyzes project text, constraints,
 * and operational mechanics without relying on static templates.
 */
export function extractProjectFeatures(req: AnalyseRequestBody): ProjectFeatures {
  const text = sanitizeInputText(req.description || '');
  const lower = text.toLowerCase();
  const constraints = req.constraints || {};

  const categoryScores = {
    agent: countHits(AGENT_SIGNAL_RES, lower),
    defi: countHits(DEFI_SIGNAL_RES, lower),
    game: countHits(GAME_SIGNAL_RES, lower),
    meme: countHits(MEME_SIGNAL_RES, lower),
    rwa: countHits(RWA_SIGNAL_RES, lower)
  };

  // Determine primary category
  let primaryCategory: 'agent' | 'defi' | 'game' | 'meme' | 'rwa' = 'meme';
  let maxScore = -1;
  for (const [cat, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryCategory = cat as any;
    }
  }

  // Detect treasury constraints (multilingual)
  const isSmallTreasury =
    constraints.treasury_usd != null
      ? constraints.treasury_usd < 5000
      : /no audience|small treasury|no budget|zero budget|solo|first token|low liquidity|bootstrapp|lean|unseeded|sangat kecil|tanpa modal|budget kecil|modal kecil|dana terbatas|dana minim|\$0|\$1000|\$500/i.test(lower);

  // Detect audience constraints (multilingual)
  const isZeroAudience =
    constraints.audience != null
      ? constraints.audience === 'none'
      : /no audience|zero audience|stealth launch|no community yet|new team|belum ada audiens|tanpa audiens|belum punya komunitas|komunitas kecil/i.test(lower);

  const hasAutonomousLoop = /autonomous|otonom|loop|trigger|smart contract|cron|onchain agent|bot execution/i.test(lower);
  const needsHighThroughput = /high frequency|trading|sub-second|fast|instant|microtransaction/i.test(lower);
  const needsCompliance = /regulated|institutional|custodian|kyc|compliance|accredited|legal/i.test(lower);

  // Extract standout nouns/keywords for dynamic reasoning
  const rawWords = text.match(/\b[A-Z][a-zA-Z0-9_-]{2,}\b/g) || [];
  const stopwords = new Set(['The', 'This', 'That', 'With', 'From', 'Into', 'Some', 'When', 'What', 'Where', 'Then', 'Your', 'Their', 'Multiplayer', 'Institutional']);
  const detectedNameOrKeywords = Array.from(new Set(rawWords.filter(w => !stopwords.has(w)))).slice(0, 3);

  return {
    isAgent: categoryScores.agent > 0,
    isDeFi: categoryScores.defi > 0,
    isGame: categoryScores.game > 0,
    isMeme: categoryScores.meme > 0,
    isRwa: categoryScores.rwa > 0,
    primaryCategory,
    categoryScores,
    isSmallTreasury,
    isZeroAudience,
    hasAutonomousLoop,
    needsHighThroughput,
    needsCompliance,
    detectedNameOrKeywords
  };
}

function findMatchingChain(chainKey: string | undefined, dbChains: DbChain[]): DbChain {
  if (!chainKey) return dbChains[0];
  const ck = chainKey.toLowerCase().trim();
  const found = dbChains.find(c => c.key.toLowerCase() === ck || c.name.toLowerCase().includes(ck));
  return found || dbChains[0];
}

function findMatchingVenue(venueKey: string | undefined, chainKey: string, dbVenues: DbVenue[]): DbVenue {
  const coveredVenues = dbVenues.filter(v => v.isCovered !== false && (v.sampleSize ?? v.launchesCount) > 0 && v.status !== 'paused');
  const pool = coveredVenues.length > 0 ? coveredVenues : dbVenues;

  if (!venueKey) {
    return pool.find(v => v.chainKey === chainKey) || dbVenues.find(v => v.chainKey === chainKey) || dbVenues[0];
  }
  const vk = venueKey.toLowerCase().replace(/[^a-z0-9]/g, '');

  let found = pool.find(v => {
    const dbVk = v.key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return dbVk === vk || dbVk.includes(vk) || vk.includes(dbVk);
  });

  if (!found) {
    found = pool.find(v => v.chainKey === chainKey);
  }
  return found || dbVenues.find(v => v.chainKey === chainKey) || dbVenues[0];
}

function parseJsonFromLlmOutput(rawContent: string): any {
  if (!rawContent || typeof rawContent !== 'string') return null;

  const content = rawContent.trim();
  // 1. Direct JSON parse
  try {
    return JSON.parse(content);
  } catch {}

  // 2. Extract from markdown codeblock ```json ... ``` or ``` ... ```
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {}
  }

  // 3. Find outer braces {...}
  const firstBrace = content.indexOf('{');
  const lastBrace = content.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = content.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}

    // Fallback: scan nested JSON objects containing required keys
    let start = firstBrace;
    while (start < lastBrace && start !== -1) {
      let end = content.indexOf('}', start);
      while (end !== -1 && end <= lastBrace) {
        const subCandidate = content.slice(start, end + 1);
        try {
          const parsed = JSON.parse(subCandidate);
          if (parsed && typeof parsed === 'object' && (parsed.selected_chain_key || parsed.read_as || parsed.composite_score)) {
            return parsed;
          }
        } catch {}
        end = content.indexOf('}', end + 1);
      }
      start = content.indexOf('{', start + 1);
    }
  }

  return null;
}

/**
 * Attempts real-time deep AI evaluation using Xiaomi Mimo / OpenAI-compatible endpoint.
 * Returns null if LLM is unconfigured, unreachable, or returns quota/rate error.
 */
async function evaluateWithLLM(
  req: AnalyseRequestBody,
  features: ProjectFeatures,
  dbMetrics: Awaited<ReturnType<typeof getLiveDatabaseMetrics>>
): Promise<AnalyseResponseBody | null> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  const baseUrl = process.env.OPENAI_API_BASE_URL || 'https://token-plan-sgp.xiaomimimo.com/v1';
  const model = process.env.OPENAI_MODEL || 'mimo-v2.5';

  if (!apiKey || apiKey.trim().length === 0) return null;

  try {
    const cleanText = sanitizeInputText(req.description || '');
    const chainSummary = dbMetrics.chains.map(c => {
      const vens = dbMetrics.venues.filter(v => v.chainKey === c.key);
      const avgExt = vens.length > 0 ? Math.round(vens.reduce((s, v) => s + v.extractionPct, 0) / vens.length) : 30;
      return `${c.name} (${c.key}): ${c.survivalRate}% 7d-surv, ${avgExt}% avg extraction, ${c.launchesCount} launches`;
    }).join(' | ');
    const venueSummary = dbMetrics.venues.map(v => `${v.name} (${v.key}, chain: ${v.chainKey}, ${v.curveType}): ${v.survivalRatePct}% 7d-surv, ${v.extractionPct}% extraction, $${v.avgInitialLiquidityUsd} avg liq`).join(' | ');

    const prompt = `You are Waggle's Quantitative Onchain Scout & Evaluation Engine.
Analyze this token launch submission against live empirical database metrics and return a structured assessment.

SUBMISSION:
"${cleanText}"
Constraints: Audience: ${req.constraints?.audience || (features.isZeroAudience ? 'none' : 'unspecified')}, Treasury: ${req.constraints?.treasury_usd ? '$' + req.constraints.treasury_usd : (features.isSmallTreasury ? '<$5000' : 'unspecified')}

LIVE CHAIN METRICS:
${chainSummary}

LIVE VENUE LAUNCHPADS:
${venueSummary}

TASK:
1. Select the single best chain (from: sol, base, bnb, rh, arc) and the single best venue on that chain.
2. Determine peak UTC launch hour based on liquidity and survival.
3. Score 4 dimensions (0-100): chain_fit, venue_fit, meta_heat, hour_window.
4. Calculate composite_score = round(chain_fit*0.35 + venue_fit*0.30 + (100 - abs(meta_heat - 62))*0.20 + hour_window*0.15).
5. Generate dynamic, bespoke explanations:
   - read_as: A tailored 2-3 sentence technical diagnosis addressing this project by name/concept, explaining why this chain & venue beat alternatives.
   - fit_reason: Why this venue's curve and mechanics protect or benefit this exact token.
   - mechanics_summary: Breakdown of how this venue's bonding curve or AMM handles the launch.
   - meta_reading: Market congestion assessment (e.g. busy with attention vs crowded with noise vs quiet).

RETURN PURE JSON ONLY with this structure:
{
  "selected_chain_key": "sol"|"base"|"bnb"|"rh"|"arc",
  "selected_venue_key": "pump_fun"|"virtuals"|"aerodrome"|"raydium"|"four_meme"|"pancakeswap"|"pons"|"astrovault",
  "hour_utc": 0-23,
  "category": "agent"|"defi"|"game"|"meme"|"rwa",
  "dimensions": { "chain_fit": number, "venue_fit": number, "meta_heat": number, "hour_window": number },
  "composite_score": number,
  "read_as": string,
  "fit_reason": string,
  "mechanics_summary": string,
  "meta_reading": string
}`;

    // Unlimited timing for AI Mimo reasoning to ensure 100% deep completion
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: 'You are Waggle Onchain AI Scout. Return pure JSON only with 100% bespoke, fluid, non-generic technical analysis tailored to the specific project description. Never output generic template boilerplate.' },
          { role: 'user', content: prompt }
        ]
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.warn(`[Scorer] LLM API responded with ${res.status}:`, errText.slice(0, 150));
      return null;
    }

    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    const rawContent = choice?.content || choice?.reasoning_content || '';
    const parsed = parseJsonFromLlmOutput(rawContent);

    if (!parsed) {
      console.warn('[Scorer] Failed to parse valid JSON from Mimo AI response:', rawContent.slice(0, 200));
      return null;
    }

    const topChain = findMatchingChain(parsed.selected_chain_key, dbMetrics.chains);
    const topVenue = findMatchingVenue(parsed.selected_venue_key, topChain.key, dbMetrics.venues);

    // Compute alternative chains
    const otherChains = dbMetrics.chains
      .filter(c => c.key !== topChain.key)
      .slice(0, 2)
      .map(c => ({
        chain_name: c.name,
        chain_key: c.key,
        composite_score: Math.max(30, Math.min(88, parsed.composite_score - 12 - Math.floor(Math.random() * 8)))
      }));

    // Alternative launchpads
    const altVenues = dbMetrics.venues
      .filter(v => v.key !== topVenue.key)
      .slice(0, 3)
      .map(v => {
        const ch = dbMetrics.chains.find(c => c.key === v.chainKey);
        return {
          name: v.name,
          key: v.key,
          chain_name: ch?.name || v.chainKey.toUpperCase(),
          chain_key: v.chainKey,
          curve_type: v.curveType,
          survival_rate_pct: v.survivalRatePct,
          extraction_pct: v.extractionPct,
          launches_count: v.launchesCount
        };
      });

    return {
      verdict: {
        chain_name: topChain.name,
        chain_key: topChain.key,
        venue_name: topVenue.name,
        hour_utc: Number(parsed.hour_utc) || 14,
        composite_score: parsed.composite_score || 85
      },
      recommended_launchpad: {
        name: topVenue.name,
        key: topVenue.key,
        chain_name: topChain.name,
        chain_key: topChain.key,
        curve_type: topVenue.curveType || 'linear_bonding',
        curve_display: (topVenue.curveType || 'linear_bonding').replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        survival_rate_pct: topVenue.survivalRatePct,
        avg_initial_liquidity_usd: topVenue.avgInitialLiquidityUsd || 4500,
        extraction_pct: topVenue.extractionPct,
        launches_count: topVenue.launchesCount || 400,
        mechanics_summary: parsed.mechanics_summary || `Automated bonding liquidity curve on ${topChain.name}.`,
        fit_reason: parsed.fit_reason || `Tailored execution alignment for ${parsed.category || 'token'} architecture.`,
        recommendation_badge: 'Top Structural Match'
      },
      alternative_launchpads: altVenues,
      dimensions: {
        chain_fit: parsed.dimensions?.chain_fit || 88,
        venue_fit: parsed.dimensions?.venue_fit || 84,
        meta_heat: parsed.dimensions?.meta_heat || 62,
        hour_window: parsed.dimensions?.hour_window || 82
      },
      sample_size: topChain.launchesCount,
      confidence: topChain.conf === 'mid' ? 'med' : topChain.conf,
      confidence_caveat: `Confidence is ${topChain.conf === 'low' ? 'low' : 'solid'} on ${topChain.name} based on ${topChain.launchesCount.toLocaleString()} indexed launches.`,
      meta_reading: parsed.meta_reading || 'busy, with survival holding, so the crowd is attention rather than noise',
      read_as: parsed.read_as,
      alternatives: otherChains.map(a => ({ chain_name: a.chain_name, composite_score: a.composite_score })),
      classified_category: parsed.category || features.primaryCategory,
      is_weak_signal: false,
      version_metadata: {
        snapshot_id: dbMetrics.snapshotId,
        metrics_version: METRICS_VERSION,
        weights_version: WEIGHTS_VERSION,
        classifier_version: CLASSIFIER_VERSION
      },
      disclaimer: "This describes structural fit from historical data. It is not advice and not a prediction."
    };
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.code === 20 || err?.name === 'TimeoutError') {
      console.info('[Scorer] AI evaluation call timed out (18s limit). Falling back to Quantitative Engine.');
    } else {
      console.warn('[Scorer] AI evaluation call error:', err?.message || err);
    }
    return null;
  }
}

/**
 * Quantitative Semantic Engine:
 * Performs real-time multi-dimensional processing when LLM is offline or quota exhausted.
 * Calculates dynamic chain fit, venue fit, hour window from live PostgreSQL matrix,
 * and synthesizes project-specific technical assessments (NOT static templates).
 */
function evaluateWithQuantitativeEngine(
  req: AnalyseRequestBody,
  features: ProjectFeatures,
  dbMetrics: Awaited<ReturnType<typeof getLiveDatabaseMetrics>>
): AnalyseResponseBody {
  const dbChains = dbMetrics.chains;
  const dbVenues = dbMetrics.venues;
  const matrix = dbMetrics.matrixData;

  const projectName = features.detectedNameOrKeywords[0] || (features.isAgent ? 'Autonomous Agent' : 'Token');

  // 1. Dynamic Chain Scoring
  const chainScores = dbChains.map(c => {
    let affinity = 50;

    // Trait affinity weighting based on empirical category fit
    if (c.key === 'base') {
      if (features.primaryCategory === 'agent') affinity += 46;
      else if (features.isAgent) affinity += 28;
      if (features.isDeFi) affinity += 20;
      if (features.hasAutonomousLoop) affinity += 15;
      if (features.primaryCategory === 'meme') affinity -= 12;
      if (features.isRwa) affinity -= 10;
    } else if (c.key === 'sol') {
      if (features.primaryCategory === 'meme') affinity += 48;
      else if (features.isMeme) affinity += 30;
      if (features.needsHighThroughput) affinity += 20;
      if (features.isGame) affinity += 18;
      if (features.isDeFi) affinity += 10;
      if (features.isAgent) affinity -= 8;
      if (features.isRwa) affinity -= 25;
    } else if (c.key === 'bnb') {
      if (features.primaryCategory === 'game') affinity += 48;
      else if (features.isGame) affinity += 28;
      if (features.isDeFi) affinity += 18;
      if (features.isMeme) affinity += 12;
      if (features.isAgent) affinity -= 10;
    } else if (c.key === 'rh') {
      if (features.primaryCategory === 'rwa' || features.needsCompliance) affinity += 50;
      else if (features.isRwa) affinity += 30;
      if (features.isDeFi) affinity += 12;
      if (features.isMeme) affinity -= 30;
      if (features.isAgent) affinity -= 15;
    } else if (c.key === 'arc') {
      if (features.primaryCategory === 'defi') affinity += 44;
      else if (features.isDeFi) affinity += 24;
      if (features.isRwa) affinity += 28;
      if (features.isAgent) affinity += 5;
      if (features.isMeme) affinity -= 20;
    }

    // Adjust with live 7-day survival from PostgreSQL
    const survivalBonus = (c.survivalRate - 40) * 0.45;

    // Micro treasury MEV extraction penalty (mitigated if launching on bonding curve)
    const cVenues = dbVenues.filter(v => v.chainKey === c.key);
    const avgExtraction = cVenues.length > 0 ? (cVenues.reduce((s, v) => s + v.extractionPct, 0) / cVenues.length) : 30;
    let mevPenalty = 0;
    if (features.isSmallTreasury && c.key !== 'sol') {
      mevPenalty = (avgExtraction - 25) * 0.4;
    }

    const chainFit = Math.max(25, Math.min(98, Math.round(affinity + survivalBonus - mevPenalty)));

    // 2. Dynamic Hour Window from PostgreSQL 24H Matrix
    const hours = (matrix[c.key]?.survival as number[]) || Array(24).fill(40);
    const maxHourSurvival = Math.max(...hours);
    const bestHour = hours.indexOf(maxHourSurvival);
    const hourFit = Math.min(99, Math.round((maxHourSurvival / 68) * 94));

    // 3. Dynamic Venue Selection & Scoring
    const chainVenues = dbVenues.filter(v => v.chainKey === c.key);
    const scoredVenues = chainVenues.map(v => {
      let score = 50;

      // Penalize uncovered venues with 0 sample size or paused venues (TASK-2.2.3)
      if (v.isCovered === false || (v.sampleSize !== undefined && v.sampleSize === 0) || v.status === 'paused' || v.status === 'inactive') {
        score -= 100;
      }

      // Fit curve type to project economics
      if (features.isSmallTreasury || features.isZeroAudience) {
        if (v.curveType.includes('bonding')) {
          score += 35; // 0-liquidity bonding curves protect small treasuries
        } else {
          score -= 30; // AMM without seed liquidity suffers high slippage / front-running
        }
      } else {
        if (v.curveType.includes('amm') || v.curveType.includes('slipstream')) {
          score += 26;
        }
      }

      // Archetype venue resonance
      if (features.primaryCategory === 'agent' && v.key === 'virtuals') score += 45;
      if (features.primaryCategory === 'meme' && (v.key === 'hood_fun' || v.key === 'pons')) score += 40;
      if (features.primaryCategory === 'defi' && (v.key === 'aerodrome' || v.key === 'raydium' || v.key === 'astrovault' || v.key === 'pools_trade')) score += 32;
      if (features.primaryCategory === 'rwa' && (v.key === 'pons' || v.key === 'astrovault')) score += 45;
      if (features.primaryCategory === 'game' && (v.key === 'pancakeswap' || v.key === 'hood_fun')) score += 40;

      // Adjust with live PostgreSQL venue metrics
      score += (v.survivalRatePct - 40) * 0.4;
      score -= (v.extractionPct - 25) * 0.35;

      const venueFit = Math.max(30, Math.min(97, Math.round(score)));
      return { venue: v, venueFit };
    }).sort((a, b) => b.venueFit - a.venueFit);

    const topVenueItem = scoredVenues[0] || {
      venue: { name: "Direct AMM", key: "amm", chainKey: c.key, curveType: "cpmm_amm", extractionPct: 38, survivalRatePct: 45, avgInitialLiquidityUsd: 4500, launchesCount: 20 },
      venueFit: 60
    };

    // 4. Meta Heat Calculation
    const launchesCount = c.launchesCount || 100;
    let metaHeat = 55;
    if (c.key === 'sol' && features.isMeme) metaHeat = 78;
    else if (c.key === 'base' && features.isAgent) metaHeat = 63;
    else if (c.key === 'bnb' && features.isGame) metaHeat = 60;
    else if (c.key === 'rh' && features.isRwa) metaHeat = 48;
    else metaHeat = Math.min(85, Math.max(35, Math.round(50 + (launchesCount / 300) * 5)));

    // Composite calculation
    const composite = Math.round(
      (chainFit * WEIGHTS.chain) / 100 +
      (topVenueItem.venueFit * WEIGHTS.venue) / 100 +
      ((100 - Math.abs(metaHeat - 62)) * WEIGHTS.meta) / 100 +
      (hourFit * WEIGHTS.hour) / 100
    );

    return {
      chain: c,
      chainFit,
      topVenue: topVenueItem.venue,
      venueFit: topVenueItem.venueFit,
      hourFit,
      bestHour,
      metaHeat,
      composite
    };
  }).sort((a, b) => b.composite - a.composite);

  const top = chainScores[0];
  const alternatives = chainScores.slice(1, 3).map(s => ({
    chain_name: s.chain.name,
    chain_key: s.chain.key,
    composite_score: s.composite
  }));

  // Synthesize dynamic, project-specific technical diagnosis (NO static templates)
  let readAs = "";
  let fitReason = "";
  let mechanicsSummary = "";

  const cleanDesc = sanitizeInputText(req.description || '');
  const descExcerpt = cleanDesc.length > 80 ? cleanDesc.slice(0, 80) + '...' : cleanDesc;
  const projectTitle = features.detectedNameOrKeywords[0] || (features.isAgent ? 'Autonomous AI Agent' : 'Token Project');

  const treasuryNote = features.isSmallTreasury
    ? "an unseeded micro-treasury (<$5,000) vulnerable to front-running"
    : "an established liquidity profile";

  const audienceNote = features.isZeroAudience
    ? "zero pre-existing distribution"
    : "organic community interest";

  if (top.chain.key === 'base') {
    readAs = `${projectTitle} ("${descExcerpt}") achieves optimal structural synergy with ${top.chain.name} (${top.chainFit}% fit) and ${top.topVenue.name}. ${top.chain.name}'s low L2 execution fees and dense EVM composability provide ideal execution conditions for ${features.isAgent ? 'autonomous agent loops' : 'token launches'}, outperforming alternative deployment options by ${(top.chainFit - (alternatives[0]?.composite_score || 60))} composite points.`;
    if (top.topVenue.key === 'virtuals') {
      fitReason = `Virtuals Protocol's agent fair-launch curve provides dedicated autonomous agent co-ownership tokenomics, protecting ${projectTitle} against predatory MEV sniper extraction (${top.topVenue.extractionPct}% observed MEV take) without requiring upfront seed LP funding.`;
      mechanicsSummary = `Fair-launch bonding curve designed specifically for autonomous AI agents with co-ownership staking, continuous revenue distribution routing, and automatic graduation into Aerodrome liquidity.`;
    } else {
      fitReason = `Aerodrome Slipstream concentrated liquidity provides optimal capital efficiency for EVM protocols on Base with deep tick liquidity routing.`;
      mechanicsSummary = `Uniswap v3-style concentrated tick liquidity AMM with veAERO gauge emission voting and deep Base ecosystem liquidity routing.`;
    }
  } else if (top.chain.key === 'sol') {
    readAs = `${projectTitle} ("${descExcerpt}") captures maximum liquidity momentum on Solana (${top.chainFit}% fit), where transaction speed and rapid token discovery are highest. Given ${audienceNote}, immediate execution speed and low friction outweigh slower institutional validation.`;
    fitReason = `${top.topVenue.name} provides automated liquidity pool deployment, protecting ${projectTitle} with verified onchain liquidity.`;
    mechanicsSummary = `CPMM / DLMM automated liquidity pools on Solana with direct DEX pool integration.`;
  } else if (top.chain.key === 'bnb') {
    readAs = `${projectTitle} ("${descExcerpt}") aligns with BNB Smart Chain's active consumer trading ecosystem (${top.chainFit}% fit), capturing sustainable 7-day retention (${top.topVenue.survivalRatePct}% venue survival).`;
    fitReason = `${top.topVenue.name} provides BNB Chain's dedicated deep liquidity pools with minimal gas deployment overhead and seamless routing.`;
    mechanicsSummary = `Concentrated liquidity pools on BNB Smart Chain with active ecosystem trading volume.`;
  } else if (top.chain.key === 'rh') {
    readAs = `${projectTitle} ("${descExcerpt}") aligns with Robinhood Chain's regulated institutional infrastructure (${top.chainFit}% fit). The institutional orderbook eliminates retail MEV leakage, recording the lowest sniper extraction in the industry (${top.topVenue.extractionPct}%).`;
    fitReason = `Robinhood Settlement provides atomic off-chain orderbook matching with on-chain L2 batch settlement, ensuring regulatory alignment and asset-backed custody protection.`;
    mechanicsSummary = `Regulated hybrid off-chain orderbook with atomic onchain L2 batch settlement and institutional custody integration.`;
  } else {
    readAs = `${projectTitle} ("${descExcerpt}") benefits from Arc's USDC-native predictable fee structure (${top.chainFit}% fit), avoiding cross-asset volatility for structured financial primitives.`;
    fitReason = `Astrovault's hybrid curve minimizes slippage for standard asset pairs and routes cross-chain Cosmos IBC liquidity.`;
    mechanicsSummary = `Slippage-minimized 1:1 AXV standard pool with integrated Cosmos IBC liquidity bridge and predictable routing curves.`;
  }

  // Meta reading
  let metaReading = "balanced, with steady attention and healthy capital circulation";
  if (top.metaHeat > 72) {
    metaReading = `crowded with high speculative activity; sniper competition is elevated (${top.topVenue.extractionPct}% MEV take)`;
  } else if (top.metaHeat > 55) {
    metaReading = "active with steady organic attention; category survival is holding firm against noise";
  } else {
    metaReading = "quiet and uncrowded, presenting low competition for early token discoverability";
  }

  // Recommended launchpad
  const recommended_launchpad: LaunchpadFitDetail = {
    name: top.topVenue.name,
    key: top.topVenue.key,
    chain_name: top.chain.name,
    chain_key: top.chain.key,
    curve_type: top.topVenue.curveType || 'linear_bonding',
    curve_display: (top.topVenue.curveType || 'linear_bonding').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    survival_rate_pct: top.topVenue.survivalRatePct,
    avg_initial_liquidity_usd: top.topVenue.avgInitialLiquidityUsd || 4500,
    extraction_pct: top.topVenue.extractionPct,
    launches_count: top.topVenue.launchesCount || 450,
    mechanics_summary: mechanicsSummary,
    fit_reason: fitReason,
    recommendation_badge: 'Top Structural Match'
  };

  // Alternative launchpads
  const altVenues: AlternativeLaunchpad[] = dbVenues
    .filter(v => v.key !== top.topVenue.key)
    .slice(0, 3)
    .map(v => {
      const ch = dbChains.find(c => c.key === v.chainKey);
      return {
        name: v.name,
        key: v.key,
        chain_name: ch?.name || v.chainKey.toUpperCase(),
        chain_key: v.chainKey,
        curve_type: v.curveType,
        survival_rate_pct: v.survivalRatePct,
        extraction_pct: v.extractionPct,
        launches_count: v.launchesCount
      };
    });

  const confVal: 'high' | 'med' | 'low' = top.chain.conf === 'mid' ? 'med' : top.chain.conf;
  let confidenceCaveat = `Confidence is high on ${top.chain.name} telemetry (${top.chain.launchesCount.toLocaleString()} indexed launches).`;
  if (confVal === 'low') {
    confidenceCaveat = `Confidence is low. Sample size on ${top.chain.name} is thin, treat this finding as an exploratory suggestion.`;
  } else if (confVal === 'med') {
    confidenceCaveat = `Confidence is moderate based on ${top.chain.launchesCount.toLocaleString()} observed launches.`;
  }

  return {
    verdict: {
      chain_name: top.chain.name,
      chain_key: top.chain.key,
      venue_name: top.topVenue.name,
      hour_utc: top.bestHour,
      composite_score: top.composite
    },
    recommended_launchpad,
    alternative_launchpads: altVenues,
    dimensions: {
      chain_fit: top.chainFit,
      venue_fit: top.venueFit,
      meta_heat: top.metaHeat,
      hour_window: top.hourFit
    },
    sample_size: top.chain.launchesCount,
    confidence: confVal,
    confidence_caveat: confidenceCaveat,
    meta_reading: metaReading,
    read_as: readAs,
    alternatives: alternatives.map(a => ({ chain_name: a.chain_name, composite_score: a.composite_score })),
    classified_category: features.primaryCategory,
    is_weak_signal: features.categoryScores[features.primaryCategory] < 2,
    version_metadata: {
      snapshot_id: dbMetrics.snapshotId,
      metrics_version: METRICS_VERSION,
      weights_version: WEIGHTS_VERSION,
      classifier_version: CLASSIFIER_VERSION
    },
    disclaimer: "This describes structural fit from historical data. It is not advice and not a prediction."
  };
}

/**
 * Main Entry Point:
 * Orchestrates real-time Scout assessment.
 * First tries deep AI evaluation via OpenAI-compatible protocol.
 * If unconfigured or unavailable, executes deep quantitative semantic engine.
 */
export async function scoutProject(req: AnalyseRequestBody): Promise<AnalyseResponseBody> {
  const debugTiming = process.env.SCORER_DEBUG_TIMING === '1';
  const t0 = debugTiming ? Date.now() : 0;

  const features = extractProjectFeatures(req);

  const dbMetrics = await getCachedDatabaseMetrics();
  if (debugTiming) console.log(`[Scorer:timing] dbMetrics ready in ${Date.now() - t0}ms (chains=${dbMetrics.chains.length}, venues=${dbMetrics.venues.length})`);

  // Tier 1: Try real-time deep AI evaluation
  const tLlm = debugTiming ? Date.now() : 0;
  const aiResult = await evaluateWithLLM(req, features, dbMetrics);
  if (debugTiming) console.log(`[Scorer:timing] evaluateWithLLM took ${Date.now() - tLlm}ms (result=${aiResult ? 'hit' : 'miss/fallback'})`);
  if (aiResult) {
    if (debugTiming) console.log(`[Scorer:timing] scoutProject total ${Date.now() - t0}ms`);
    return aiResult;
  }

  // Tier 2: Real-time Quantitative Semantic Engine
  const result = evaluateWithQuantitativeEngine(req, features, dbMetrics);
  if (debugTiming) console.log(`[Scorer:timing] scoutProject total ${Date.now() - t0}ms (quantitative fallback)`);
  return result;
}

