export interface ChainData {
  name: string;
  key: string;
  hue: string;
  src: string;
  conf: 'high' | 'med' | 'low';
  n: number;
  cats: Record<string, number> | null;
  meta: Record<string, number> | null;
  isCovered: boolean;
}

export interface VenueData {
  name: string;
  chain: string;
  perday: number;
  liq: number;
  extract: number;
  surv: number;
}

export type MetricType = 'survival' | 'launches' | 'extraction';

export interface MetricDefinition {
  dir: 'high' | 'low' | 'none';
  fmt: (v: number) => string;
  label: string;
}

export interface ScoredResult {
  c: ChainData;
  chainFit: number;
  venue: VenueData;
  venueFit: number;
  metaHeat: number;
  hourFit: number;
  best: number;
  composite: number;
}

export interface AnalyseRequestBody {
  description: string;
  url?: string | null;
  constraints?: {
    audience?: 'none' | 'small' | 'established';
    treasury_usd?: number | null;
  };
}

export interface LaunchpadFitDetail {
  name: string;
  key: string;
  chain_name: string;
  chain_key: string;
  curve_type: string;
  curve_display: string;
  survival_rate_pct: number;
  avg_initial_liquidity_usd: number;
  extraction_pct: number;
  launches_count: number;
  mechanics_summary: string;
  fit_reason: string;
  recommendation_badge: string;
}

export interface AlternativeLaunchpad {
  name: string;
  key: string;
  chain_name: string;
  chain_key: string;
  curve_type: string;
  survival_rate_pct: number;
  extraction_pct: number;
  launches_count: number;
}

export interface AnalyseResponseBody {
  verdict: {
    chain_name: string;
    chain_key: string;
    venue_name: string;
    hour_utc: number;
    composite_score: number;
  };
  recommended_launchpad?: LaunchpadFitDetail;
  alternative_launchpads?: AlternativeLaunchpad[];
  dimensions: {
    chain_fit: number;
    venue_fit: number;
    meta_heat: number;
    hour_window: number;
  };
  sample_size: number;
  confidence: 'high' | 'med' | 'low';
  confidence_caveat: string;
  meta_reading: string;
  read_as?: string;
  alternatives: Array<{ chain_name: string; composite_score: number }>;
  classified_category: string;
  is_weak_signal: boolean;
  version_metadata: {
    snapshot_id: string;
    metrics_version: string;
    weights_version: string;
    classifier_version: string;
  };
  disclaimer: string;
}
