import React, { useState } from 'react';
import { Target, TrendingUp, ShieldAlert, Zap, Compass, CheckCircle2 } from 'lucide-react';
import { SignalStock } from '../../types';

interface GuidanceTabProps {
  stocks: SignalStock[];
}

export const GuidanceTab: React.FC<GuidanceTabProps> = ({ stocks }) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(stocks[0]?.Symbol || 'TCS');

  const activeStock = stocks.find((s) => s.Symbol === selectedSymbol) || stocks[0];

  return (
    <div className="p-4 space-y-4 max-w-full overflow-hidden text-slate-200 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* STOCK SELECTOR (CURRENTLY HELD / RECENTLY CLOSED) */}
        <div className="bg-[#111827] border border-[#334155] rounded-xl p-4 space-y-3">
          <h3 className="font-bold text-white uppercase text-xs border-b border-white/10 pb-2 flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" /> Stock Selector
          </h3>

          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Currently Held</span>
            <div className="space-y-1">
              {['TCS', 'RELIANCE', 'INFY', 'ICICIBANK'].map((sym) => (
                <button
                  key={sym}
                  onClick={() => setSelectedSymbol(sym)}
                  className={`w-full text-left p-2 rounded border font-bold transition-all cursor-pointer ${
                    selectedSymbol === sym
                      ? 'bg-indigo-600 text-white border-indigo-400'
                      : 'bg-black/30 text-slate-300 border-white/5 hover:bg-white/5'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3 MAIN CARDS IN A GRID */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BEHAVIORAL PROFILE SECTION */}
            <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3">
              <h4 className="font-bold text-white uppercase text-xs flex items-center justify-between border-b border-white/10 pb-2">
                <span>Behavioral Profile ({selectedSymbol})</span>
                <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  Apollo Analytics
                </span>
              </h4>

              <div className="space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Holding Period:</span>
                  <span className="font-bold text-white">12 Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Typical Exit Mode:</span>
                  <span className="font-bold text-[#3fb950]">Target Hit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stock Specific Win Rate:</span>
                  <span className="font-bold text-emerald-400">68%</span>
                </div>
              </div>
            </div>

            {/* GUIDANCE RECOMMENDATIONS */}
            <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3">
              <h4 className="font-bold text-white uppercase text-xs flex items-center justify-between border-b border-white/10 pb-2">
                <span>Guidance Recommendations</span>
                <span className="text-[10px] text-[#3fb950] font-bold bg-[#3fb950]/20 px-2 py-0.5 rounded border border-[#3fb950]/30">
                  Actionable
                </span>
              </h4>

              <div className="space-y-2 text-slate-200">
                <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />
                  <span>Hold signal remains strong</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-[#58a6ff] shrink-0" />
                  <span>Consider moving stop-loss to cost price</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-[#a371f7] shrink-0" />
                  <span>Next target level is EL2 based on layer progression</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MAE/MFE DISTRIBUTION */}
            <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3">
              <h4 className="font-bold text-white uppercase text-xs border-b border-white/10 pb-2">
                MAE / MFE Excursion Distribution
              </h4>
              <p className="text-slate-400 text-[11px]">
                Histogram showing Maximum Adverse Excursion (-2.1% avg) and Maximum Favorable Excursion (+8.4% avg).
              </p>
            </div>

            {/* DIVERGENCE RE-ENTRY ANALYTICS */}
            <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3">
              <h4 className="font-bold text-white uppercase text-xs border-b border-white/10 pb-2">
                Divergence Re-Entry Analytics
              </h4>
              <div className="space-y-1 text-slate-300">
                <div>RSI divergence detected at current price levels.</div>
                <div className="text-[#3fb950] font-bold">Historical Re-Entry Success Rate: 42%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
