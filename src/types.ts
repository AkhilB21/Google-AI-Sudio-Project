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
  RSI: number;
  '20D_SMA': number;
  '50D_SMA': number;
  '200D_SMA': number;
  PE: number;
  Stochastic: number;
  '52W_Prox': number;
  CMP: number;
  Traded_Value: number;
}

export interface SignalsSummary {
  total: number;
  ENTRY: number;
  HOLD: number;
  EXIT: number;
  FLAT: number;
  OTHER: number;
  avgScore: number;
  avgExitPressure: number;
  quality: {
    STRONG: number;
    GOOD: number;
    MODERATE: number;
    WEAK: number;
  };
  generatedAt: string;
}

export interface SignalsApiResponse {
  data: SignalStock[];
  summary: SignalsSummary;
}

export type QualityLevel = 'STRONG' | 'GOOD' | 'MODERATE' | 'WEAK' | 'N/A';
export type RiskLevel = 'LOW RISK' | 'MEDIUM' | 'HIGH RISK' | 'IN TRADE' | 'N/A';
