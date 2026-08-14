export interface SignalStock {
  Symbol: string;
  Date: string;
  Apollo_Action: 'HOLD' | 'ENTRY' | 'EXIT' | 'FLAT' | string;
  Apollo_Score: number;
  Pct_Change: number;
  LayerSignal_Action: 'HOLD' | 'ENTRY' | 'EXIT' | 'FLAT' | string;
  LayerSignal_Score: number;
  Exit_Pressure: number;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  High52W: number;
  Low52W: number;
  RSI21: number;
  RSI36: number;
  RSI56: number;
  ADX: number;
  ATR_Pct: number;
  PE: number;
  Stochastic: number;
  '52W_Prox': number;
  CMP: number;
  Traded_Value: number;
  Bucket: 'L1' | 'L2' | 'L3' | 'L4';
  LStage: string;
  ELStatus: 'EL1' | 'EL2' | 'EL3' | 'EL4' | 'NONE';
  Conviction: number; // 0.0 - 1.0
  Gates: [boolean, boolean, boolean, boolean, boolean]; // Regime, Trend, Momentum, Volatility, Quality
  Renko: 'GREEN' | 'RED' | 'NEUTRAL';
  MCap: 'Large' | 'Mid' | 'Small';
  FQS: 'A' | 'B' | 'C' | 'D';
  Sparkline: number[];
  ThrowbackAlert?: boolean;
  SubScores?: {
    trend: number;
    momentum: number;
    volatility: number;
    volume: number;
    marketFilter: number;
  };
  GatesExplanations?: [string, string, string, string, string];
  HistoricalL3Events?: Array<{ date: string; event: string; price: number; outcomePct: number }>;
  // IPO Metadata if tracked
  isIPO?: boolean;
  ipoData?: IPOStock;
}

export interface SignalsSummary {
  total: number;
  liquid: number;
  scored: number;
  signalBearing: number;
  ENTRY: number;
  HOLD: number;
  EXIT: number;
  FLAT: number;
  OTHER: number;
  avgScore: number;
  avgExitPressure: number;
  buckets: {
    L1: number;
    L2: number;
    L3: number;
    L4: number;
  };
  quality: {
    STRONG: number;
    GOOD: number;
    MODERATE: number;
    WEAK: number;
  };
  generatedAt: string;
}

export type TabId = 'screener' | 'watchlist' | 'scanner' | 'analytics' | 'guidance' | 'alerts' | 'system' | 'ipo';

export type QualityLevel = 'STRONG' | 'GOOD' | 'MODERATE' | 'WEAK' | 'N/A';
export type RiskLevel = 'LOW RISK' | 'MEDIUM' | 'HIGH RISK' | 'IN TRADE' | 'N/A';

export type IPOZone = 'NEW_HIGH' | 'RECOVERY' | 'UNDER_PRESSURE' | 'BROKEN_IPO';
export type IPOStage = 'FRESH' | 'MATURE';

export interface IPOStock {
  id: string;
  symbol: string;
  company_name: string;
  issue_price: number;
  listing_date: string;
  listing_price: number;
  all_time_high: number;
  all_time_low: number;
  ipo_size: string;
  sector: string;
  exchange: string;
  promoter_stake: number | null;
  current_pe: number | null;
  cmp: number;
  // Computed metrics
  ipo_baseline: number;
  zone: IPOZone;
  listing_stage: IPOStage;
  days_since_listing: number;
  distance_to_baseline_pct: number;
  distance_to_ath_pct: number;
  return_from_issue_pct: number;
  baseline_ratio: number;
  ath_recovery_pct: number;
  // Cross-system scores (if in main pipeline)
  Apollo_Score?: number;
  LayerSignal_Score?: number;
  Apollo_Action?: string;
  LayerSignal_Action?: string;
  Quality?: string;
  Bucket?: string;
  Gates?: [boolean, boolean, boolean, boolean, boolean];
  RSI21?: number;
  RSI36?: number;
  ADX?: number;
  ATR_Pct?: number;
}

export interface IPOSummary {
  total: number;
  zones: {
    new_high: number;
    recovery: number;
    under_pressure: number;
    broken_ipo: number;
  };
  stages: { fresh: number; mature: number };
  avg_return_from_issue: number;
  best_performer: { symbol: string; return_pct: number } | null;
  worst_performer: { symbol: string; return_pct: number } | null;
  last_updated: string;
}

export interface ZoneTransition {
  id: string;
  symbol: string;
  old_zone: IPOZone;
  new_zone: IPOZone;
  transition_type: 'UPGRADE' | 'DOWNGRADE';
  cmp_at_transition: number;
  baseline_at_transition: number;
  transition_timestamp: string;
}

export interface IPOArchive {
  id: string;
  symbol: string;
  company_name: string;
  issue_price: number;
  listing_date: string;
  listing_price: number;
  all_time_high: number;
  all_time_low: number;
  ipo_size: string;
  sector: string;
  exchange: string;
  promoter_stake: number | null;
  current_pe: number | null;
  zone: string;
  ipo_baseline: number;
  days_since_listing: number;
  listing_stage: string;
  last_zone_update: string;
  fetched_at: string;
  graduated_at: string;
}

export interface AlertItem {
  id: string;
  source: 'Apollo' | 'LayerSignal' | 'System';
  type: 'Entry' | 'Exit' | 'Regime' | 'Scoring' | 'System';
  timestamp: string;
  symbol?: string;
  title: string;
  message: string;
  read: boolean;
}

export interface MarketIndex {
  symbol: string;
  value: number;
  changePct: number;
}

export interface TradeRecord {
  id: string;
  symbol: string;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  pnlPct: number;
  holdingDays: number;
  exitMode: 'Target Hit' | 'Stop Loss' | 'Time Exit' | 'Signal Exit';
}

export interface SystemHealthData {
  apolloScanTime: string;
  apolloDuration: string;
  apolloProcessed: number;
  apolloStatus: 'HEALTHY' | 'WARM' | 'ERROR';
  layerScanTime: string;
  layerDuration: string;
  layerPatterns: number;
  layerStatus: 'HEALTHY' | 'WARM' | 'ERROR';
  dbSizeMB: number;
  dbTables: number;
  lastDbUpdate: string;
  staleTables: number;
  apiEndpoints: Array<{
    path: string;
    status: number;
    latencyMs: number;
  }>;
}
