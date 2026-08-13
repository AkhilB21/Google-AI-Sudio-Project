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

export type TabId = 'screener' | 'watchlist' | 'scanner' | 'analytics' | 'guidance' | 'alerts' | 'system';

export type QualityLevel = 'STRONG' | 'GOOD' | 'MODERATE' | 'WEAK' | 'N/A';
export type RiskLevel = 'LOW RISK' | 'MEDIUM' | 'HIGH RISK' | 'IN TRADE' | 'N/A';

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
