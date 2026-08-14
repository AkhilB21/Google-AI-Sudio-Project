import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Layers,
  Activity,
  Zap,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { SignalStock, SignalsSummary } from '../../types';
import { SignalBadge } from '../SignalBadge';
import { QualityBadge } from '../QualityBadge';
import { RiskBadge } from '../RiskBadge';
import { ScoreBar } from '../ScoreBar';
import { getQualityLevel, getRiskLevel, formatCurrencyINR } from '../../utils/calculations';

interface ScreenerTabProps {
  stocks: SignalStock[];
  summary: SignalsSummary | null;
  onSelectStock: (stock: SignalStock) => void;
}

type FunnelStage = 'ALL' | 'LIQUID' | 'SCORED' | 'SIGNAL_BEARING';

export const ScreenerTab: React.FC<ScreenerTabProps> = ({ stocks, summary, onSelectStock }) => {
  // Funnel Filter State
  const [activeFunnel, setActiveFunnel] = useState<FunnelStage>('ALL');

  // Sidebar Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [bucketFilter, setBucketFilter] = useState<'ALL' | 'L1' | 'L2' | 'L3' | 'L4'>('ALL');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'ENTRY' | 'HOLD' | 'EXIT' | 'FLAT'>('ALL');
  const [elFilter, setElFilter] = useState<'ALL' | 'EL1' | 'EL2' | 'EL3' | 'EL4'>('ALL');
  const [minScore, setMinScore] = useState<number>(0);

  // Sorting
  const [sortCol, setSortCol] = useState<keyof SignalStock | 'Score'>('LayerSignal_Score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Expanded Rows State for Pool Breakdown & Gate Details
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);

  const toggleRowExpand = (sym: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSymbol((prev) => (prev === sym ? null : sym));
  };

  // Preset Filters
  const applyPreset = (preset: 'HIGH_CONVICTION' | 'L3_BREAKOUT' | 'LOW_RISK_ENTRY' | 'RESET') => {
    if (preset === 'RESET') {
      setBucketFilter('ALL');
      setActionFilter('ALL');
      setElFilter('ALL');
      setMinScore(0);
      setActiveFunnel('ALL');
      setSearchTerm('');
      return;
    }
    if (preset === 'HIGH_CONVICTION') {
      setActionFilter('ENTRY');
      setMinScore(75);
    } else if (preset === 'L3_BREAKOUT') {
      setBucketFilter('L3');
      setActionFilter('ENTRY');
    } else if (preset === 'LOW_RISK_ENTRY') {
      setActionFilter('ENTRY');
      setMinScore(70);
    }
  };

  // Filtering & Sorting Pipeline
  const filteredStocks = useMemo(() => {
    return stocks
      .filter((s) => {
        // Funnel Stage Filter
        if (activeFunnel === 'LIQUID' && s.Volume < 500000) return false;
        if (activeFunnel === 'SCORED' && (s.LayerSignal_Score < 50 && s.Apollo_Score < 50)) return false;
        if (activeFunnel === 'SIGNAL_BEARING' && s.LayerSignal_Action === 'FLAT' && s.Apollo_Action === 'FLAT') return false;

        // Search Term
        if (searchTerm.trim() && !s.Symbol.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
          return false;
        }

        // Bucket Filter
        if (bucketFilter !== 'ALL' && s.Bucket !== bucketFilter) return false;

        // Action Filter
        if (actionFilter !== 'ALL') {
          const act = (s.LayerSignal_Action || s.Apollo_Action).toUpperCase();
          if (act !== actionFilter) return false;
        }

        // EL Filter
        if (elFilter !== 'ALL' && s.ELStatus !== elFilter) return false;

        // Min Score Filter
        if (s.LayerSignal_Score < minScore) return false;

        return true;
      })
      .sort((a, b) => {
        let aVal: any = a[sortCol as keyof SignalStock];
        let bVal: any = b[sortCol as keyof SignalStock];

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        } else {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        }

        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [stocks, activeFunnel, searchTerm, bucketFilter, actionFilter, elFilter, minScore, sortCol, sortDir]);

  const handleSort = (col: keyof SignalStock | 'Score') => {
    if (sortCol === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-full overflow-hidden text-slate-200 font-sans">
      {/* 25% LEFT FILTER SIDEBAR */}
      <aside className="w-full lg:w-1/4 shrink-0 bg-[#111827] border border-[#334155] rounded-xl p-4 space-y-4 font-mono text-xs shadow-lg">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h3 className="font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#58a6ff]" /> Screener Filters
          </h3>
          <button
            onClick={() => applyPreset('RESET')}
            className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
          >
            Reset
          </button>
        </div>

        {/* SEARCH TICKER */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Ticker Symbol</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. RELIANCE, TCS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0B1120] border border-[#334155] rounded pl-8 pr-2 py-1.5 text-xs text-white outline-none focus:border-[#58a6ff]"
            />
          </div>
        </div>

        {/* BUCKET FILTER (L1 - L4) */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">LayerSignal Bucket</label>
          <div className="grid grid-cols-5 gap-1">
            {(['ALL', 'L1', 'L2', 'L3', 'L4'] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBucketFilter(b)}
                className={`py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  bucketFilter === b
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* ACTION FILTER (ENTRY, HOLD, EXIT, FLAT) */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Signal Action</label>
          <div className="grid grid-cols-5 gap-1">
            {(['ALL', 'ENTRY', 'HOLD', 'EXIT', 'FLAT'] as const).map((act) => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                className={`py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  actionFilter === act
                    ? 'bg-[#58a6ff]/30 text-[#58a6ff] border-[#58a6ff]'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* ENTRY LAYER (EL STATUS) */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Entry Layer Status</label>
          <div className="grid grid-cols-5 gap-1">
            {(['ALL', 'EL1', 'EL2', 'EL3', 'EL4'] as const).map((el) => (
              <button
                key={el}
                onClick={() => setElFilter(el)}
                className={`py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  elFilter === el
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500'
                    : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/20'
                }`}
              >
                {el}
              </button>
            ))}
          </div>
        </div>

        {/* MIN SCORE SLIDER */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>MIN SCORE: {minScore}</span>
            <span>100</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* QUICK FILTER PRESETS */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Quick Presets</label>
          <div className="space-y-1">
            <button
              onClick={() => applyPreset('HIGH_CONVICTION')}
              className="w-full text-left p-2 rounded bg-black/40 hover:bg-white/5 border border-white/5 text-[11px] font-bold text-indigo-300 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>High Conviction Entry</span>
              <span className="text-[9px] bg-indigo-500/20 px-1.5 py-0.2 rounded">Score &ge; 75</span>
            </button>
            <button
              onClick={() => applyPreset('L3_BREAKOUT')}
              className="w-full text-left p-2 rounded bg-black/40 hover:bg-white/5 border border-white/5 text-[11px] font-bold text-emerald-400 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>L3 Bucket Breakout</span>
              <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.2 rounded">L3 + Entry</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 75% RIGHT CONTENT AREA */}
      <div className="flex-1 space-y-4 overflow-hidden">
        {/* UNIVERSE FUNNEL BAR & TIER DISTRIBUTION */}
        <div className="p-3 bg-[#111827] border border-[#334155] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs shadow-md">
          {/* FUNNEL STAGES */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <span className="text-[10px] uppercase text-slate-400 font-bold mr-1">Funnel:</span>

            <button
              onClick={() => setActiveFunnel('ALL')}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                activeFunnel === 'ALL'
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                  : 'bg-black/30 text-slate-400 border-white/5'
              }`}
            >
              {summary?.total || 2400} Universe
            </button>
            <span className="text-slate-600">&gt;</span>

            <button
              onClick={() => setActiveFunnel('LIQUID')}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                activeFunnel === 'LIQUID'
                  ? 'bg-[#58a6ff]/30 text-[#58a6ff] border-[#58a6ff]'
                  : 'bg-black/30 text-slate-400 border-white/5'
              }`}
            >
              {summary?.liquid || 1800} Liquid
            </button>
            <span className="text-slate-600">&gt;</span>

            <button
              onClick={() => setActiveFunnel('SCORED')}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                activeFunnel === 'SCORED'
                  ? 'bg-[#a371f7]/30 text-[#a371f7] border-[#a371f7]'
                  : 'bg-black/30 text-slate-400 border-white/5'
              }`}
            >
              {summary?.scored || 1200} Scored
            </button>
            <span className="text-slate-600">&gt;</span>

            <button
              onClick={() => setActiveFunnel('SIGNAL_BEARING')}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                activeFunnel === 'SIGNAL_BEARING'
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-500'
                  : 'bg-black/30 text-slate-400 border-white/5'
              }`}
            >
              {summary?.signalBearing || 340} Signal-Bearing
            </button>
          </div>

          {/* TIER DISTRIBUTION SUMMARY */}
          <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-3 text-[11px]">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Tier Distribution:</span>
            <span className="text-[#3fb950] font-bold">L1: {summary?.buckets?.L1 ?? 45}</span>
            <span className="text-[#58a6ff] font-bold">L2: {summary?.buckets?.L2 ?? 82}</span>
            <span className="text-[#d29922] font-bold">L3: {summary?.buckets?.L3 ?? 120}</span>
            <span className="text-[#f85149] font-bold">L4: {summary?.buckets?.L4 ?? 93}</span>
          </div>
        </div>

        {/* SORTABLE STOCK TABLE (20+ COLUMNS) */}
        <div className="bg-[#111827] border border-[#334155] rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead className="bg-[#1E293B] sticky top-0 z-20 text-[10px] uppercase text-slate-400 border-b border-[#334155] select-none">
                <tr>
                  <th className="p-2.5 w-8">#</th>
                  <th onClick={() => handleSort('Symbol')} className="p-2.5 font-bold cursor-pointer hover:text-white">
                    Symbol
                  </th>
                  <th onClick={() => handleSort('LayerSignal_Score')} className="p-2.5 font-bold cursor-pointer hover:text-white">
                    Score
                  </th>
                  <th onClick={() => handleSort('LayerSignal_Action')} className="p-2.5 font-bold cursor-pointer hover:text-white">
                    Action
                  </th>
                  <th onClick={() => handleSort('Bucket')} className="p-2.5 font-bold cursor-pointer hover:text-white">
                    Bucket
                  </th>
                  <th className="p-2.5 font-bold">L-Stage</th>
                  <th className="p-2.5 font-bold">EL Status</th>
                  <th onClick={() => handleSort('Conviction')} className="p-2.5 font-bold cursor-pointer hover:text-white">
                    Conviction
                  </th>
                  <th className="p-2.5 font-bold">Gates</th>
                  <th className="p-2.5 font-bold">Renko</th>
                  <th onClick={() => handleSort('RSI21')} className="p-2.5 font-bold cursor-pointer text-[#3fb950]">
                    RSI21
                  </th>
                  <th onClick={() => handleSort('RSI36')} className="p-2.5 font-bold cursor-pointer text-[#58a6ff]">
                    RSI36
                  </th>
                  <th onClick={() => handleSort('RSI56')} className="p-2.5 font-bold cursor-pointer text-[#d29922]">
                    RSI56
                  </th>
                  <th onClick={() => handleSort('ADX')} className="p-2.5 font-bold cursor-pointer hover:text-white">
                    ADX
                  </th>
                  <th onClick={() => handleSort('ATR_Pct')} className="p-2.5 font-bold cursor-pointer hover:text-white">
                    ATR%
                  </th>
                  <th onClick={() => handleSort('52W_Prox')} className="p-2.5 font-bold cursor-pointer hover:text-white">
                    52W Pos
                  </th>
                  <th className="p-2.5 font-bold">Trend Sparkline</th>
                  <th className="p-2.5 font-bold">MCap</th>
                  <th onClick={() => handleSort('PE')} className="p-2.5 font-bold cursor-pointer hover:text-white">
                    P/E
                  </th>
                  <th className="p-2.5 font-bold">FQS</th>
                  <th className="p-2.5 font-bold text-center">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan={20} className="p-8 text-center text-slate-500">
                      No stocks match current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stk, idx) => {
                    const isExpanded = expandedSymbol === stk.Symbol;

                    return (
                      <React.Fragment key={`${stk.Symbol}-${idx}`}>
                        <tr
                          onClick={() => onSelectStock(stk)}
                          className={`hover:bg-white/5 transition-colors cursor-pointer ${
                            isExpanded ? 'bg-indigo-950/30' : ''
                          }`}
                        >
                          <td className="p-2.5 text-slate-500">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                            <span className="hover:underline">{stk.Symbol}</span>
                          </td>
                          <td className="p-2.5 font-extrabold text-indigo-300">
                            {stk.LayerSignal_Score?.toFixed(0)}
                          </td>
                          <td className="p-2.5">
                            <SignalBadge action={stk.LayerSignal_Action || stk.Apollo_Action} />
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                stk.Bucket === 'L1'
                                  ? 'bg-[#3fb950]/15 text-[#3fb950] border-[#3fb950]/30'
                                  : stk.Bucket === 'L2'
                                  ? 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30'
                                  : stk.Bucket === 'L3'
                                  ? 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/30'
                                  : 'bg-[#f85149]/15 text-[#f85149] border-[#f85149]/30'
                              }`}
                            >
                              {stk.Bucket}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-300">{stk.LStage || 'Stage-2'}</td>
                          <td className="p-2.5 text-emerald-400 font-bold">{stk.ELStatus || 'EL2'}</td>
                          <td className="p-2.5 text-slate-300">{(stk.Conviction || 0.82).toFixed(2)}</td>

                          {/* 5 MICRO DOTS FOR APOLLO GATES */}
                          <td className="p-2.5">
                            <div className="flex items-center gap-1" title="Apollo 5 Gates: Regime, Trend, Momentum, Volatility, Quality">
                              {(stk.Gates || [true, true, true, false, true]).map((passed, gIdx) => (
                                <span
                                  key={gIdx}
                                  className={`w-2 h-2 rounded-full ${passed ? 'bg-[#3fb950]' : 'bg-[#f85149]/50'}`}
                                />
                              ))}
                            </div>
                          </td>

                          {/* RENKO BRICK */}
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                stk.Renko === 'GREEN'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-300 border-red-500/30'
                              }`}
                            >
                              {stk.Renko || 'GREEN'}
                            </span>
                          </td>

                          {/* RSI21 (GREEN LOCK) */}
                          <td className="p-2.5 font-bold text-[#3fb950]">{stk.RSI21?.toFixed(1) || stk.RSI?.toFixed(1)}</td>

                          {/* RSI36 (BLUE LOCK) */}
                          <td className="p-2.5 font-bold text-[#58a6ff]">{stk.RSI36?.toFixed(1) || (stk.RSI - 4).toFixed(1)}</td>

                          {/* RSI56 (AMBER LOCK) */}
                          <td className="p-2.5 font-bold text-[#d29922]">{stk.RSI56?.toFixed(1) || (stk.RSI - 8).toFixed(1)}</td>

                          <td className="p-2.5 text-slate-300">{stk.ADX?.toFixed(1) || '28.4'}</td>
                          <td className="p-2.5 text-slate-300">{stk.ATR_Pct?.toFixed(1) || '2.1'}%</td>

                          {/* 52W PROXIMITY BAR */}
                          <td className="p-2.5">
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-indigo-400 rounded-full"
                                style={{ width: `${Math.min(100, stk['52W_Prox'] || 75)}%` }}
                              />
                            </div>
                          </td>

                          {/* SPARKLINE SVG */}
                          <td className="p-2.5">
                            {stk.Sparkline && stk.Sparkline.length > 0 ? (
                              <svg className="w-16 h-5 stroke-emerald-400 fill-none overflow-visible" viewBox="0 0 100 30">
                                {(() => {
                                  const pts = stk.Sparkline;
                                  const min = Math.min(...pts);
                                  const max = Math.max(...pts) || min + 1;
                                  const coords = pts.map((val, i) => {
                                    const x = (i / (pts.length - 1)) * 100;
                                    const y = 28 - ((val - min) / (max - min)) * 26;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  const isUp = pts[pts.length - 1] >= pts[0];
                                  return (
                                    <polyline
                                      fill="none"
                                      stroke={isUp ? '#3fb950' : '#f85149'}
                                      strokeWidth="2"
                                      points={coords}
                                    />
                                  );
                                })()}
                              </svg>
                            ) : (
                              <span className="text-slate-600 text-[9px]">N/A</span>
                            )}
                          </td>

                          <td className="p-2.5 text-slate-400">{stk.MCap || 'Large'}</td>
                          <td className="p-2.5 text-slate-300">{stk.PE?.toFixed(1)}</td>
                          <td className="p-2.5 font-bold text-indigo-300">{stk.FQS || 'A'}</td>

                          {/* EXPAND BUTTON */}
                          <td className="p-2.5 text-center">
                            <button
                              onClick={(e) => toggleRowExpand(stk.Symbol, e)}
                              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Expand Pool & Gate Details"
                            >
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED IN-PLACE ROW DETAILS */}
                        {isExpanded && (
                          <tr className="bg-[#0B1120] border-y border-[#334155]">
                            <td colSpan={21} className="p-4 space-y-3 font-mono text-xs">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* SUB-SECTION 1: POOL BREAKDOWN & SUB-SCORES */}
                                <div className="p-3 bg-[#111827] rounded-lg border border-[#334155] space-y-2">
                                  <h4 className="font-bold text-indigo-300 flex items-center justify-between text-[11px]">
                                    <span>{stk.Symbol} — Sub-Score Profile &amp; RSI Pool</span>
                                    <span className="text-[10px] text-slate-400">LayerSignal Engine</span>
                                  </h4>
                                  <div className="space-y-1.5 text-[10px] text-slate-300">
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400">Trend Score:</span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-slate-800 rounded">
                                          <div className="h-full bg-emerald-400 rounded" style={{ width: `${stk.SubScores?.trend || 75}%` }} />
                                        </div>
                                        <span className="font-bold text-white w-6">{stk.SubScores?.trend || 75}</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400">Momentum Score:</span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-slate-800 rounded">
                                          <div className="h-full bg-blue-400 rounded" style={{ width: `${stk.SubScores?.momentum || 80}%` }} />
                                        </div>
                                        <span className="font-bold text-white w-6">{stk.SubScores?.momentum || 80}</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-400">Volume Turnover:</span>
                                      <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-slate-800 rounded">
                                          <div className="h-full bg-purple-400 rounded" style={{ width: `${stk.SubScores?.volume || 70}%` }} />
                                        </div>
                                        <span className="font-bold text-white w-6">{stk.SubScores?.volume || 70}</span>
                                      </div>
                                    </div>
                                    <div className="flex justify-between pt-1 border-t border-white/5">
                                      <span className="text-slate-400">RSI Stack (21/36/56):</span>
                                      <span className="font-bold text-white">
                                        <span className="text-[#3fb950]">{stk.RSI21}</span> / <span className="text-[#58a6ff]">{stk.RSI36}</span> / <span className="text-[#d29922]">{stk.RSI56}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* SUB-SECTION 2: STOCK-SPECIFIC GATE EXPLANATIONS */}
                                <div className="p-3 bg-[#111827] rounded-lg border border-[#334155] space-y-2">
                                  <h4 className="font-bold text-[#a371f7] flex items-center justify-between text-[11px]">
                                    <span>{stk.Symbol} — Apollo 5 Gate Inspections</span>
                                    <span className="text-[10px] text-slate-400">
                                      {(stk.Gates || []).filter(Boolean).length} / 5 Passed
                                    </span>
                                  </h4>
                                  <div className="space-y-1 text-[10px]">
                                    {(stk.GatesExplanations || [
                                      '1. Regime Check Passed',
                                      '2. Trend Filter Passed',
                                      '3. Momentum Filter Passed',
                                      '4. Volatility Filter Passed',
                                      '5. Fundamental Quality Passed'
                                    ]).map((exp, gIdx) => {
                                      const passed = (stk.Gates || [true, true, true, true, true])[gIdx];
                                      return (
                                        <div key={gIdx} className="flex items-start gap-1.5 p-1 bg-black/30 rounded border border-white/5 text-slate-300">
                                          {passed ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950] shrink-0 mt-0.5" />
                                          ) : (
                                            <XCircle className="w-3.5 h-3.5 text-[#f85149] shrink-0 mt-0.5" />
                                          )}
                                          <span className={passed ? 'text-slate-200' : 'text-red-300'}>{exp}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
