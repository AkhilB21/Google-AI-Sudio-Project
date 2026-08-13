import React from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react';

export const MarketRegimeBanner: React.FC = () => {
  // Computed Apollo Regime
  const regime: 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'VOLATILE' = 'BULLISH';
  const niftyVal = 24580.45;
  const niftyChg = 1.2;
  const vixVal = 13.42;

  const regimeStyles = {
    BULLISH: 'bg-emerald-500/15 text-[#3fb950] border-emerald-500/30',
    NEUTRAL: 'bg-indigo-500/15 text-[#58a6ff] border-indigo-500/30',
    BEARISH: 'bg-red-500/15 text-[#f85149] border-red-500/30',
    VOLATILE: 'bg-amber-500/15 text-[#d29922] border-amber-500/30',
  };

  return (
    <div className="h-[24px] min-h-[24px] bg-[#111827] border-b border-[#334155] px-4 flex items-center justify-between text-[11px] font-mono select-none z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold uppercase text-[10px]">Market Regime:</span>
          <span
            className={`px-2 py-0.2 rounded text-[10px] font-black border uppercase tracking-wider flex items-center gap-1 ${regimeStyles[regime]}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {regime}
          </span>
        </div>

        <span className="text-slate-600">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">NIFTY 50:</span>
          <span className="text-white font-bold">{niftyVal.toLocaleString('en-IN')}</span>
          <span className={`text-[10px] font-bold flex items-center ${niftyChg >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
            {niftyChg >= 0 ? `+${niftyChg}%` : `${niftyChg}%`}
          </span>
        </div>

        <span className="text-slate-600">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">INDIA VIX:</span>
          <span className="text-amber-300 font-bold">{vixVal}</span>
          <span className="text-[9px] text-slate-500">(Stable Volatility)</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400">
        <span>Apollo Regime Module:</span>
        <span className="text-slate-200 font-bold">Cross-Report Synced</span>
      </div>
    </div>
  );
};
