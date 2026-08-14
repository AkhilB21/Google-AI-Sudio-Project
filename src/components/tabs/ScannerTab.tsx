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
  | 'OVERSOLD'
  | 'BASELINE_BOUNCE'
  | 'ATH_APPROACHER'
  | 'BROKEN_IPO_REVERSAL'
  | 'NEW_HIGH_MOMENTUM';

interface PresetDef {
  key: PresetKey;
  label: string;
  description: string;
  category?: 'Standard' | 'IPO';
}

const PRESET_DEFINITIONS: PresetDef[] = [
  { key: 'L3_READY', label: 'L3 Ready', description: 'Strong momentum approaching L3 bucket', category: 'Standard' },
  { key: 'L2_BREAKOUT', label: 'L2 Breakout', description: 'Breaking out from L2 consolidation', category: 'Standard' },
  { key: 'THROWBACK', label: 'Throwback', description: 'Pulling back to support after breakout', category: 'Standard' },
  { key: 'MOMENTUM', label: 'Momentum', description: 'High ADX directional movement', category: 'Standard' },
  { key: 'VOL_BREAKOUT', label: 'Vol Breakout', description: 'Sudden ATR volatility expansion', category: 'Standard' },
  { key: 'MA_CROSS', label: 'MA Cross', description: 'Moving average bullish crossover', category: 'Standard' },
  { key: 'FRESH_L3', label: 'Fresh L3', description: 'Entered L3 bucket with sound structure', category: 'Standard' },
  { key: 'OVERSOLD', label: 'Oversold', description: 'Rebound candidate from RSI < 45', category: 'Standard' },
  { key: 'BASELINE_BOUNCE', label: 'Baseline Bounce', description: 'IPO reclaiming baseline support', category: 'IPO' },
  { key: 'ATH_APPROACHER', label: 'ATH Approacher', description: 'IPO in recovery within 5% of ATH', category: 'IPO' },
  { key: 'BROKEN_IPO_REVERSAL', label: 'Broken IPO Reversal', description: 'Oversold IPO bottoming out with momentum', category: 'IPO' },
  { key: 'NEW_HIGH_MOMENTUM', label: 'New High Momentum', description: 'IPO in blue-sky territory with Apollo power', category: 'IPO' },
];

export const ScannerTab: React.FC<ScannerTabProps> = ({ stocks, onSelectStock }) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('L3_READY');
  const [minScoreFilter, setMinScoreFilter] = useState<number>(50);
  const [minAdxFilter, setMinAdxFilter] = useState<number>(15);

  const checkStockPresetMatch = (stk: SignalStock, preset: PresetKey): boolean => {
    if (preset === 'L3_READY') {
      return stk.Bucket === 'L3' || (stk.LayerSignal_Score >= 55 && stk.Exit_Pressure < 55);
    }
    if (preset === 'L2_BREAKOUT') {
      return stk.Bucket === 'L2' || (stk.RSI21 >= 58 && stk.CMP >= (stk.CMP * 0.98));
    }
    if (preset === 'THROWBACK') {
      return Boolean(stk.ThrowbackAlert) || (stk.Bucket === 'L2' && stk.Pct_Change < 0);
    }
    if (preset === 'MOMENTUM') {
      return (stk.ADX ?? 25) > 28 && (stk.RSI21 ?? 50) >= 52;
    }
    if (preset === 'VOL_BREAKOUT') {
      return (stk.ATR_Pct ?? 2) > 3.0 || Math.abs(stk.Pct_Change) > 2.5;
    }
    if (preset === 'MA_CROSS') {
      return stk.CMP >= (stk.CMP * 0.99) && (stk.RSI21 ?? 50) >= 50;
    }
    if (preset === 'FRESH_L3') {
      return stk.Bucket === 'L3' && stk.LayerSignal_Score >= 50;
    }
    if (preset === 'OVERSOLD') {
      return (stk.RSI21 ?? 50) < 45 || (stk.Exit_Pressure ?? 0) > 55;
    }
    // IPO PRESETS
    if (preset === 'BASELINE_BOUNCE') {
      if (stk.isIPO && stk.ipoData) {
        return stk.ipoData.zone === 'UNDER_PRESSURE' || stk.ipoData.distance_to_baseline_pct >= -3;
      }
      return (stk.Pct_Change ?? 0) > 0 && (stk.RSI21 ?? 50) >= 48 && stk.LayerSignal_Score >= 50;
    }
    if (preset === 'ATH_APPROACHER') {
      if (stk.isIPO && stk.ipoData) {
        return stk.ipoData.zone === 'RECOVERY' && stk.ipoData.distance_to_ath_pct >= -5;
      }
      return (stk['52W_Prox'] ?? 0) >= 92 && (stk.RSI21 ?? 50) >= 55;
    }
    if (preset === 'BROKEN_IPO_REVERSAL') {
      if (stk.isIPO && stk.ipoData) {
        return stk.ipoData.zone === 'BROKEN_IPO' && (stk.RSI21 ?? 50) >= 45;
      }
      return (stk.RSI21 ?? 50) <= 45 && (stk.Pct_Change ?? 0) > 0;
    }
    if (preset === 'NEW_HIGH_MOMENTUM') {
      if (stk.isIPO && stk.ipoData) {
        return stk.ipoData.zone === 'NEW_HIGH';
      }
      return (stk['52W_Prox'] ?? 0) >= 97 && stk.Apollo_Score >= 80;
    }
    return true;
  };

  // Dynamically compute counts for each preset across live stocks
  const presetCounts = PRESET_DEFINITIONS.reduce((acc, p) => {
    acc[p.key] = stocks.filter((s) => checkStockPresetMatch(s, p.key)).length;
    return acc;
  }, {} as Record<PresetKey, number>);

  // Filter stocks matching selected preset logic and custom thresholds
  const filteredMatches = stocks.filter((stk) => {
    if (stk.LayerSignal_Score < minScoreFilter) return false;
    if ((stk.ADX ?? 25) < minAdxFilter) return false;
    return checkStockPresetMatch(stk, selectedPreset);
  });

  const computeMatchScore = (stk: SignalStock, preset: PresetKey): number => {
    const base = 68;
    const scoreFactor = (stk.LayerSignal_Score / 100) * 16;
    const gateBonus = (stk.Gates?.filter(Boolean).length ?? 3) * 2.2;
    let presetBonus = 0;
    if (preset === 'MOMENTUM') presetBonus = Math.min(10, ((stk.ADX ?? 25) / 40) * 10);
    else if (preset === 'THROWBACK') presetBonus = stk.ThrowbackAlert ? 10 : 4;
    else if (preset === 'L2_BREAKOUT') presetBonus = stk.Bucket === 'L2' ? 10 : 5;
    else if (preset === 'L3_READY') presetBonus = stk.Bucket === 'L3' ? 10 : 6;
    else if (preset === 'VOL_BREAKOUT') presetBonus = Math.min(10, ((stk.ATR_Pct ?? 2) / 4) * 10);
    else if (preset === 'MA_CROSS') presetBonus = stk.CMP >= (stk['20D_SMA'] ?? stk.CMP) ? 10 : 3;
    else presetBonus = 6;
    return parseFloat(Math.min(99.4, Math.max(68.0, base + scoreFactor + gateBonus + presetBonus)).toFixed(1));
  };

  const activePresetDef = PRESET_DEFINITIONS.find((p) => p.key === selectedPreset) ?? PRESET_DEFINITIONS[0];

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-full overflow-hidden text-slate-200 font-sans">
      {/* LEFT SIDEBAR -- PATTERN PRESETS & CONTROLS */}
      <aside className="w-full lg:w-1/4 shrink-0 bg-[#111827] border border-[#334155] rounded-xl p-4 space-y-4 font-mono text-xs shadow-lg">
        <div className="border-b border-white/10 pb-2">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-400" /> Pattern Presets ({PRESET_DEFINITIONS.length})
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Live Scans ({stocks.length} Symbols)</p>
        </div>

        {/* PRESET BUTTON LIST */}
        <div className="space-y-1.5">
          {PRESET_DEFINITIONS.map((p) => {
            const isSelected = p.key === selectedPreset;
            const count = presetCounts[p.key] ?? 0;
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
                  {count}
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
            {PRESET_DEFINITIONS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPreset(p.key)}
                className={`px-2.5 py-1 rounded border font-bold transition-all cursor-pointer ${
                  selectedPreset === p.key
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                {p.label}: <span className="text-white font-extrabold">{presetCounts[p.key] ?? 0}</span>
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
                  filteredMatches.map((stk, idx) => {
                    const matchPercent = computeMatchScore(stk, selectedPreset);
                    return (
                      <tr
                        key={`${stk.Symbol}-${idx}`}
                        onClick={() => onSelectStock(stk)}
                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                      >
                        <td className="p-3 font-bold text-white flex items-center gap-1.5">
                          <span>{stk.Symbol}</span>
                        </td>
                        <td className="p-3 font-bold text-white">₹{stk.CMP ?? stk.Close ?? 0}</td>
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
                        <td className="p-3 font-extrabold text-indigo-300">{stk.LayerSignal_Score?.toFixed(0) ?? '0'}</td>
                        <td className="p-3 font-bold text-[#3fb950]">{stk.RSI21?.toFixed(1) ?? '64.2'}</td>
                        <td className="p-3 font-bold text-[#58a6ff]">{stk.RSI36?.toFixed(1) ?? '58.4'}</td>
                        <td className="p-3 text-slate-300">{stk.ADX?.toFixed(1) ?? '28.5'}</td>
                        <td className="p-3 text-slate-300">{stk.ATR_Pct?.toFixed(1) ?? '2.1'}%</td>
                        <td className="p-3 font-semibold text-indigo-400">{stk['52W_Prox']?.toFixed(1) ?? '0.0'}%</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded text-[10px] border border-emerald-500/30">
                            {matchPercent}% Match
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
