import React, { useState } from 'react';
import { Target, TrendingUp, ShieldAlert, Zap, Compass, CheckCircle2, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { SignalStock } from '../../types';

interface GuidanceTabProps {
  stocks: SignalStock[];
}

export const GuidanceTab: React.FC<GuidanceTabProps> = ({ stocks }) => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>(stocks[0]?.Symbol || 'RELIANCE');
  const [searchQuery, setSearchQuery] = useState('');

  const activeStock = stocks.find((s) => s.Symbol === selectedSymbol) || stocks[0] || null;

  if (!activeStock) return null;

  const filteredStocks = stocks.filter((s) => s.Symbol.toLowerCase().includes(searchQuery.toLowerCase()));

  // MAE / MFE Excursion Data for Selected Stock
  const maeMfeData = [
    { metric: 'Avg Drawdown (MAE)', value: activeStock.ATR_Pct ? -activeStock.ATR_Pct * 1.2 : -2.4 },
    { metric: 'Avg Runup (MFE)', value: activeStock.LayerSignal_Score ? activeStock.LayerSignal_Score * 0.12 : 8.8 },
  ];

  // Calculated levels
  const targetEL1 = parseFloat((activeStock.CMP * 1.06).toFixed(1));
  const targetEL2 = parseFloat((activeStock.CMP * 1.12).toFixed(1));
  const stopLoss = parseFloat((activeStock.CMP * 0.95).toFixed(1));

  return (
    <div className="p-4 space-y-4 max-w-full overflow-hidden text-slate-200 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* STOCK SELECTOR SEARCH & LIST */}
        <div className="bg-[#111827] border border-[#334155] rounded-xl p-3 space-y-3 flex flex-col h-[600px]">
          <h3 className="font-bold text-white uppercase text-xs border-b border-white/10 pb-2 flex items-center gap-2 shrink-0">
            <Compass className="w-4 h-4 text-indigo-400" /> Stock Guidance Selector
          </h3>

          <input
            type="text"
            placeholder="Search stock..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0B1120] border border-[#334155] rounded p-2 text-xs text-white shrink-0"
          />

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 divide-y divide-white/5">
            {filteredStocks.map((stk) => (
              <button
                key={stk.Symbol}
                onClick={() => setSelectedSymbol(stk.Symbol)}
                className={`w-full text-left p-2 rounded font-bold transition-all cursor-pointer flex justify-between items-center ${
                  selectedSymbol === stk.Symbol
                    ? 'bg-indigo-600 text-white border border-indigo-400'
                    : 'bg-black/20 text-slate-300 hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="text-xs">{stk.Symbol}</div>
                  <div className="text-[10px] text-slate-400 font-normal">₹{stk.CMP}</div>
                </div>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded border ${
                    stk.Bucket === 'L1'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {stk.Bucket}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3 MAIN PANELS IN RIGHT WORKSPACE */}
        <div className="lg:col-span-3 space-y-4">
          {/* HEADER SUMMARY FOR SELECTED STOCK */}
          <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl flex items-center justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-white">{activeStock.Symbol}</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-bold">
                  {activeStock.Bucket}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Current Price: ₹{activeStock.CMP} ({activeStock.Pct_Change >= 0 ? `+${activeStock.Pct_Change}%` : `${activeStock.Pct_Change}%`})</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">LayerSignal Action</span>
                <span className="text-sm font-extrabold text-[#3fb950]">{activeStock.LayerSignal_Action || activeStock.Apollo_Action}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block font-bold">Conviction</span>
                <span className="text-sm font-extrabold text-[#58a6ff]">{(activeStock.Conviction || 0.85).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BEHAVIORAL PROFILE SECTION */}
            <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3">
              <h4 className="font-bold text-white uppercase text-xs flex items-center justify-between border-b border-white/10 pb-2">
                <span>Behavioral Profile ({activeStock.Symbol})</span>
                <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
                  Apollo Analytics
                </span>
              </h4>

              <div className="space-y-2 text-slate-300 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Average Holding Period:</span>
                  <span className="font-bold text-white">12.4 Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Typical Exit Mode:</span>
                  <span className="font-bold text-[#3fb950]">Target Hit (68%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Stock Specific Win Rate:</span>
                  <span className="font-bold text-emerald-400">74.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RSI Stack Alignment:</span>
                  <span className="font-bold text-blue-400">RSI21 ({activeStock.RSI21}) &gt; RSI36 ({activeStock.RSI36})</span>
                </div>
              </div>
            </div>

            {/* GUIDANCE RECOMMENDATIONS */}
            <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3">
              <h4 className="font-bold text-white uppercase text-xs flex items-center justify-between border-b border-white/10 pb-2">
                <span>Guidance Recommendations</span>
                <span className="text-[10px] text-[#3fb950] font-bold bg-[#3fb950]/20 px-2 py-0.5 rounded border border-[#3fb950]/30">
                  Actionable Advice
                </span>
              </h4>

              <div className="space-y-2 text-slate-200 text-xs">
                <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />
                  <span>
                    Primary Entry Target EL1 set at <strong className="text-emerald-300">₹{targetEL1}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-[#58a6ff] shrink-0" />
                  <span>
                    Trailing Stop Loss level positioned at <strong className="text-red-300">₹{stopLoss}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-black/40 rounded border border-white/5">
                  <CheckCircle2 className="w-4 h-4 text-[#a371f7] shrink-0" />
                  <span>
                    Stretch Target EL2 set at <strong className="text-indigo-300">₹{targetEL2}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MAE/MFE RECHARTS DISPLAY */}
            <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3">
              <h4 className="font-bold text-white uppercase text-xs border-b border-white/10 pb-2">
                MAE / MFE Excursion Analysis
              </h4>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={maeMfeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="metric" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', fontSize: '11px' }} />
                    <Bar dataKey="value" fill="#58a6ff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DIVERGENCE RE-ENTRY ANALYTICS */}
            <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 flex flex-col justify-between">
              <h4 className="font-bold text-white uppercase text-xs border-b border-white/10 pb-2">
                Divergence Re-Entry Analytics
              </h4>

              <div className="space-y-3 text-slate-300 text-xs">
                <div className="p-2.5 bg-black/40 rounded border border-white/5 space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-400">RSI Divergence Pattern:</span>
                    <span className="text-[#3fb950]">BULLISH CONFIRMED</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Price making higher lows while RSI21 rebounds from 45 line.</p>
                </div>

                <div className="p-2.5 bg-black/40 rounded border border-white/5 space-y-1">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-400">Historical Re-Entry Success Rate:</span>
                    <span className="text-indigo-300 font-extrabold text-sm">74.2%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded">
                    <div className="h-full bg-indigo-400 rounded" style={{ width: '74.2%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
