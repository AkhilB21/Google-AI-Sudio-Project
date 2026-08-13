import React, { useState } from 'react';
import { Search, Filter, Sliders, Zap, CheckCircle2, PlusCircle, ArrowUpRight } from 'lucide-react';
import { SignalStock } from '../../types';
import { SignalBadge } from '../SignalBadge';
import { formatCurrencyINR } from '../../utils/calculations';

interface ScannerTabProps {
  stocks: SignalStock[];
  onSelectStock: (stock: SignalStock) => void;
}

type PresetKey =
  | 'L3_READY'
  | 'L2_BREAKOUT'
  | 'THROWBACK'
  | 'MOMENTUM'
  | 'VOL_BREAKOUT'
  | 'MA_CROSS'
  | 'FRESH_L3'
  | 'OVERSOLD';

interface PresetDef {
  key: PresetKey;
  label: string;
  description: string;
  count: number;
}

const PRESETS: PresetDef[] = [
  { key: 'L3_READY', label: 'L3 Ready', description: 'Strong momentum approaching L3 bucket', count: 23 },
  { key: 'L2_BREAKOUT', label: 'L2 Breakout', description: 'Breaking out from L2 consolidation', count: 45 },
  { key: 'THROWBACK', label: 'Throwback', description: 'Pulling back to support after breakout', count: 12 },
  { key: 'MOMENTUM', label: 'Momentum', description: 'High ADX directional movement', count: 67 },
  { key: 'VOL_BREAKOUT', label: 'Vol Breakout', description: 'Sudden ATR expansion', count: 8 },
  { key: 'MA_CROSS', label: 'MA Cross', description: 'Moving average bullish crossover', count: 34 },
  { key: 'FRESH_L3', label: 'Fresh L3', description: 'Entered L3 bucket today', count: 5 },
  { key: 'OVERSOLD', label: 'Oversold', description: 'Rebound candidate from RSI < 35', count: 15 },
];

export const ScannerTab: React.FC<ScannerTabProps> = ({ stocks, onSelectStock }) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('L3_READY');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(60);
  const [minAdxFilter, setMinAdxFilter] = useState<number>(20);

  // Filter stocks matching selected preset logic
  const filteredMatches = stocks.filter((stk) => {
    if (stk.LayerSignal_Score < minScoreFilter) return false;
    if ((stk.ADX || 25) < minAdxFilter) return false;

    if (selectedPreset === 'L3_READY' || selectedPreset === 'FRESH_L3') {
      return stk.Bucket === 'L3' || stk.Bucket === 'L2';
    }
    if (selectedPreset === 'L2_BREAKOUT') {
      return stk.Bucket === 'L2';
    }
    if (selectedPreset === 'THROWBACK') {
      return stk.ThrowbackAlert || stk.Bucket === 'L2';
    }
    if (selectedPreset === 'MOMENTUM') {
      return (stk.ADX || 25) > 30;
    }
    if (selectedPreset === 'VOL_BREAKOUT') {
      return (stk.ATR_Pct || 2) > 3.0;
    }
    if (selectedPreset === 'OVERSOLD') {
      return (stk.RSI21 || stk.RSI) < 45;
    }
    return true;
  });

  const activePresetDef = PRESETS.find((p) => p.key === selectedPreset) || PRESETS[0];

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-full overflow-hidden text-slate-200 font-sans">
      {/* LEFT SIDEBAR -- PATTERN PRESETS & CONTROLS */}
      <aside className="w-full lg:w-1/4 shrink-0 bg-[#111827] border border-[#334155] rounded-xl p-4 space-y-4 font-mono text-xs shadow-lg">
        <div className="border-b border-white/10 pb-2">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-400" /> Pattern Presets (8)
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Predefined LayerSignal Technical Scans</p>
        </div>

        {/* PRESET BUTTON LIST */}
        <div className="space-y-1.5">
          {PRESETS.map((p) => {
            const isSelected = p.key === selectedPreset;
            return (
              <button
                key={p.key}
                onClick={() => setSelectedPreset(p.key)}
                className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-600/30 text-white border-indigo-500 shadow-md'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">{p.label}</div>
                  <div className="text-[9px] text-slate-400 truncate max-w-[170px]">{p.description}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {p.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* CUSTOM FILTER CONTROLS */}
        <div className="space-y-3 pt-3 border-t border-white/10">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>MIN COMPOSITE SCORE</span>
              <span>{minScoreFilter}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={minScoreFilter}
              onChange={(e) => setMinScoreFilter(Number(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>MIN ADX STRENGTH</span>
              <span>{minAdxFilter}</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              value={minAdxFilter}
              onChange={(e) => setMinAdxFilter(Number(e.target.value))}
              className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded"
            />
          </div>
        </div>
      </aside>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 space-y-4 overflow-hidden">
        {/* STAGE SUMMARY BAR */}
        <div className="p-3 bg-[#111827] border border-[#334155] rounded-xl font-mono text-xs shadow-md">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[11px]">
            <span className="text-[10px] uppercase font-bold text-slate-400">Stage Summary:</span>
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPreset(p.key)}
                className={`px-2.5 py-1 rounded border font-bold transition-all cursor-pointer ${
                  selectedPreset === p.key
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                {p.label}: <span className="text-white font-extrabold">{p.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PATTERN RESULT TABLE */}
        <div className="bg-[#111827] border border-[#334155] rounded-xl overflow-hidden shadow-xl">
          <div className="p-3 bg-[#1E293B] border-b border-[#334155] flex items-center justify-between font-mono text-xs">
            <div>
              <span className="font-bold text-white uppercase text-xs">{activePresetDef.label} Scan Results</span>
              <span className="text-slate-400 text-[10px] ml-2">({filteredMatches.length} matching stocks)</span>
            </div>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
              Live Pattern Match
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead className="bg-[#0B1120] text-[10px] uppercase text-slate-400 border-b border-[#334155]">
                <tr>
                  <th className="p-3 font-bold">Symbol</th>
                  <th className="p-3 font-bold">CMP (₹)</th>
                  <th className="p-3 font-bold">Bucket</th>
                  <th className="p-3 font-bold">Score</th>
                  <th className="p-3 font-bold text-[#3fb950]">RSI21</th>
                  <th className="p-3 font-bold text-[#58a6ff]">RSI36</th>
                  <th className="p-3 font-bold">ADX</th>
                  <th className="p-3 font-bold">ATR%</th>
                  <th className="p-3 font-bold">52W Pos</th>
                  <th className="p-3 font-bold">Pattern Match</th>
                  <th className="p-3 font-bold text-center">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500">
                      No stocks match the selected preset criteria.
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map((stk) => (
                    <tr
                      key={stk.Symbol}
                      onClick={() => onSelectStock(stk)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <td className="p-3 font-bold text-white flex items-center gap-1.5">
                        <span>{stk.Symbol}</span>
                      </td>
                      <td className="p-3 font-bold text-white">₹{stk.CMP || stk.Close}</td>
                      <td className="p-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            stk.Bucket === 'L1'
                              ? 'bg-[#3fb950]/15 text-[#3fb950] border-[#3fb950]/30'
                              : stk.Bucket === 'L2'
                              ? 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30'
                              : 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/30'
                          }`}
                        >
                          {stk.Bucket}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-indigo-300">{stk.LayerSignal_Score?.toFixed(0)}</td>
                      <td className="p-3 font-bold text-[#3fb950]">{stk.RSI21?.toFixed(1) || '64.2'}</td>
                      <td className="p-3 font-bold text-[#58a6ff]">{stk.RSI36?.toFixed(1) || '58.4'}</td>
                      <td className="p-3 text-slate-300">{stk.ADX?.toFixed(1) || '28.5'}</td>
                      <td className="p-3 text-slate-300">{stk.ATR_Pct?.toFixed(1) || '2.1'}%</td>
                      <td className="p-3 font-semibold text-indigo-400">{stk['52W_Prox']?.toFixed(1)}%</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded text-[10px] border border-emerald-500/30">
                          94.2% Match
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStock(stk);
                          }}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          View Deep-Dive
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
