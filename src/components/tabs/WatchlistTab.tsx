import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Maximize2,
  CheckCircle2,
  XCircle,
  Zap,
  BookOpen,
  PlusCircle,
  TrendingUp,
  ShieldAlert,
  Target
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { SignalStock, TradeRecord } from '../../types';
import { SignalBadge } from '../SignalBadge';

interface WatchlistTabProps {
  stocks: SignalStock[];
  selectedStock: SignalStock | null;
  onSelectStock: (stock: SignalStock) => void;
  trades: TradeRecord[];
}

export const WatchlistTab: React.FC<WatchlistTabProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
  trades,
}) => {
  const currentStock = selectedStock || stocks[0] || null;

  // Center Sub-tab state
  const [centerTab, setCenterTab] = useState<'chart' | 'analysis' | 'journal' | 'holdings'>('chart');

  // Right Panel Collapse State
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // Accordions open state
  const [openAccordions, setOpenAccordions] = useState<Record<number, boolean>>({
    1: true, // RSI Stack
    2: true, // RSI Cushion
    4: true, // Position Sizer
    6: true, // Score Breakdown
    7: true, // Gate Details
    8: true, // Entry/Exit Layers
  });

  const toggleAccordion = (num: number) => {
    setOpenAccordions((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  // Filter Pills for Left Stock List
  const [leftFilter, setLeftFilter] = useState<'ALL' | 'L1' | 'L2' | 'L3' | 'ENTRY'>('ALL');

  // Trade Journal state
  const [journalEntries, setJournalEntries] = useState<
    Array<{ id: string; symbol: string; date: string; note: string; target: number; stopLoss: number }>
  >([
    {
      id: 'j1',
      symbol: currentStock?.Symbol || 'RELIANCE',
      date: new Date().toISOString().split('T')[0],
      note: 'LayerSignal L1 breakout confirmed above 20D SMA. Entry placed with 1.5% risk limit.',
      target: currentStock ? parseFloat((currentStock.CMP * 1.08).toFixed(1)) : 2900,
      stopLoss: currentStock ? parseFloat((currentStock.CMP * 0.95).toFixed(1)) : 2600,
    },
  ]);

  const [newNote, setNewNote] = useState('');
  const [newTarget, setNewTarget] = useState<string>('');
  const [newSL, setNewSL] = useState<string>('');

  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStock || !newNote.trim()) return;
    setJournalEntries((prev) => [
      {
        id: Date.now().toString(),
        symbol: currentStock.Symbol,
        date: new Date().toISOString().split('T')[0],
        note: newNote.trim(),
        target: parseFloat(newTarget) || parseFloat((currentStock.CMP * 1.08).toFixed(1)),
        stopLoss: parseFloat(newSL) || parseFloat((currentStock.CMP * 0.95).toFixed(1)),
      },
      ...prev,
    ]);
    setNewNote('');
    setNewTarget('');
    setNewSL('');
  };

  const filteredStockList = stocks.filter((s) => {
    if (leftFilter === 'L1') return s.Bucket === 'L1';
    if (leftFilter === 'L2') return s.Bucket === 'L2';
    if (leftFilter === 'L3') return s.Bucket === 'L3';
    if (leftFilter === 'ENTRY') return (s.LayerSignal_Action || s.Apollo_Action) === 'ENTRY';
    return true;
  });

  // Position Sizer Calculations
  const [accountCapital, setAccountCapital] = useState<number>(1000000);
  const [riskPercent, setRiskPercent] = useState<number>(1.5);
  const atr = currentStock?.ATR_Pct ? (currentStock.CMP * currentStock.ATR_Pct) / 100 : (currentStock?.CMP || 1000) * 0.02;
  const maxRiskAmount = (accountCapital * riskPercent) / 100;
  const stopLossDistance = Math.max(1, atr * 1.5);
  const calculatedShares = Math.floor(maxRiskAmount / stopLossDistance);
  const totalPositionCost = calculatedShares * (currentStock?.CMP || 1000);

  if (!currentStock) return null;

  // Generate 30-day Chart Data for Recharts
  const chartData = Array.from({ length: 30 }).map((_, i) => {
    const base = currentStock.CMP * 0.9 + i * (currentStock.CMP * 0.005);
    const varFactor = Math.sin(i * 0.5) * (currentStock.CMP * 0.015);
    const price = parseFloat((base + varFactor).toFixed(1));
    const sma20 = parseFloat((price * 0.98).toFixed(1));
    const sma50 = parseFloat((price * 0.94).toFixed(1));
    const sma200 = parseFloat((price * 0.88).toFixed(1));
    const volume = Math.round(50000 + Math.abs(Math.cos(i)) * 200000);
    const rsi21Val = Math.min(85, Math.max(30, currentStock.RSI21 - 10 + i * 0.7));
    const rsi36Val = Math.min(80, Math.max(25, currentStock.RSI36 - 8 + i * 0.5));
    const rsi56Val = Math.min(75, Math.max(20, currentStock.RSI56 - 5 + i * 0.3));

    return {
      day: `D${i + 1}`,
      Price: price,
      '20D_SMA': sma20,
      '50D_SMA': sma50,
      '200D_SMA': sma200,
      Volume: volume,
      RSI21: rsi21Val,
      RSI36: rsi36Val,
      RSI56: rsi56Val,
    };
  });

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] w-full overflow-hidden text-slate-200 font-sans select-none">
      {/* LEFT PANEL -- STOCK LIST SELECTOR */}
      <aside className="w-full lg:w-60 bg-[#0B1120] border-r border-[#334155] flex flex-col shrink-0 overflow-hidden">
        <div className="p-3 bg-[#111827] border-b border-[#334155] space-y-2">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="font-extrabold text-white uppercase tracking-wider">Watchlist ({filteredStockList.length})</span>
            <span className="text-[10px] text-slate-400">Live Sync</span>
          </div>

          {/* FILTER PILLS */}
          <div className="flex gap-1 overflow-x-auto font-mono text-[10px]">
            {(['ALL', 'L1', 'L2', 'L3', 'ENTRY'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setLeftFilter(p)}
                className={`px-2 py-0.5 rounded border font-bold cursor-pointer transition-colors ${
                  leftFilter === p
                    ? 'bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]'
                    : 'bg-black/30 text-slate-400 border-white/5'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* SCROLLABLE STOCK LIST */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5 font-mono text-xs">
          {filteredStockList.map((stk) => {
            const isSelected = stk.Symbol === currentStock.Symbol;

            return (
              <div
                key={stk.Symbol}
                onClick={() => onSelectStock(stk)}
                className={`p-3 hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between ${
                  isSelected ? 'bg-indigo-950/40 border-l-4 border-[#58a6ff]' : ''
                }`}
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{stk.Symbol}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-mono border ${
                        stk.Bucket === 'L1'
                          ? 'bg-[#3fb950]/15 text-[#3fb950] border-[#3fb950]/30'
                          : stk.Bucket === 'L2'
                          ? 'bg-[#58a6ff]/15 text-[#58a6ff] border-[#58a6ff]/30'
                          : 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/30'
                      }`}
                    >
                      {stk.Bucket}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">₹{stk.CMP || stk.Close}</div>
                </div>

                <div className="text-right">
                  <SignalBadge action={stk.LayerSignal_Action || stk.Apollo_Action} />
                  <div className={`text-[10px] font-bold mt-1 ${stk.Pct_Change >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                    {stk.Pct_Change >= 0 ? `+${stk.Pct_Change.toFixed(2)}%` : `${stk.Pct_Change.toFixed(2)}%`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* CENTER PANEL -- PRIMARY ANALYSIS WORKSPACE */}
      <main className="flex-1 bg-[#111827] flex flex-col overflow-y-auto border-r border-[#334155] p-4 space-y-4">
        {/* THROWBACK ALERT BANNER */}
        {currentStock.ThrowbackAlert || currentStock.Bucket === 'L2' ? (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between font-mono text-xs text-amber-300 shadow-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <span className="font-bold uppercase text-[11px]">Throwback Pattern Detected: </span>
                <span className="text-slate-200">
                  {currentStock.Symbol} is pulling back to recent breakout level (₹{(currentStock.CMP * 0.98).toFixed(1)}).
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40 font-bold">
              CONFIRMING SUPPORT
            </span>
          </div>
        ) : null}

        {/* 4 SUMMARY STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-[#0B1120] border border-[#334155] rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Entry Score</span>
            <div className="text-2xl font-black font-mono text-[#3fb950]">
              {currentStock.LayerSignal_Score?.toFixed(0) || '82'}
              <span className="text-xs text-slate-500 font-normal"> / 100</span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">LayerSignal Composite</p>
          </div>

          <div className="p-3.5 bg-[#0B1120] border border-[#334155] rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Exit Pressure</span>
            <div className={`text-2xl font-black font-mono ${currentStock.Exit_Pressure > 50 ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>
              {currentStock.Exit_Pressure?.toFixed(1) || '18.4'}%
            </div>
            <p className="text-[10px] font-mono text-slate-400">Profit-Taking Risk</p>
          </div>

          <div className="p-3.5 bg-[#0B1120] border border-[#334155] rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Apollo Score</span>
            <div className="text-2xl font-black font-mono text-[#a371f7]">
              {currentStock.Apollo_Score?.toFixed(1) || '78.5'}
            </div>
            <p className="text-[10px] font-mono text-slate-400">Backtest Profile Validated</p>
          </div>

          <div className="p-3.5 bg-[#0B1120] border border-[#334155] rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Conviction</span>
            <div className="text-2xl font-black font-mono text-[#58a6ff]">
              {(currentStock.Conviction || 0.85).toFixed(2)}
            </div>
            <p className="text-[10px] font-mono text-slate-400">High Confidence Setup</p>
          </div>
        </div>

        {/* SUB-TABS (CHART | ANALYSIS | JOURNAL | HOLDINGS) */}
        <div className="flex-1 flex flex-col bg-[#0B1120] border border-[#334155] rounded-xl overflow-hidden shadow-xl">
          <div className="h-10 bg-[#1E293B] border-b border-[#334155] px-4 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-1">
              {(['chart', 'analysis', 'journal', 'holdings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCenterTab(tab)}
                  className={`px-3 py-1 rounded font-bold uppercase text-[11px] transition-all cursor-pointer ${
                    centerTab === tab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-white">{currentStock.Symbol}</span>
              <span className="text-slate-400">₹{currentStock.CMP || currentStock.Close}</span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
            {/* RECHARTS CANDLESTICK / PRICE & VOLUME CHART */}
            {centerTab === 'chart' && (
              <div className="h-full min-h-[380px] flex flex-col justify-between space-y-4">
                <div className="p-3 bg-[#111827] rounded-lg border border-[#334155] space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold text-white">PRICE &amp; VOLUME OVERLAY (30-DAY HISTORICAL)</span>
                    <span className="text-[#3fb950] font-bold">SMAs: 20D (Cyan), 50D (Blue), 200D (Amber)</span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                        <XAxis dataKey="day" stroke="#64748b" fontSize={10} />
                        <YAxis yAxisId="price" orientation="right" domain={['auto', 'auto']} stroke="#64748b" fontSize={10} />
                        <YAxis yAxisId="volume" orientation="left" domain={[0, 'auto']} hide />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                        />
                        <Bar yAxisId="volume" dataKey="Volume" fill="#3b82f6" opacity={0.25} />
                        <Area yAxisId="price" type="monotone" dataKey="Price" stroke="#3fb950" fill="url(#colorPrice)" strokeWidth={2} />
                        <Line yAxisId="price" type="monotone" dataKey="20D_SMA" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
                        <Line yAxisId="price" type="monotone" dataKey="50D_SMA" stroke="#818cf8" strokeWidth={1.5} dot={false} />
                        <Line yAxisId="price" type="monotone" dataKey="200D_SMA" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="p-2 bg-[#111827] rounded border border-white/5">
                    <span className="text-slate-500 block">20D SMA</span>
                    <span className="font-bold text-[#38bdf8]">₹{(currentStock.CMP * 0.98).toFixed(1)}</span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-white/5">
                    <span className="text-slate-500 block">50D SMA</span>
                    <span className="font-bold text-[#818cf8]">₹{(currentStock.CMP * 0.94).toFixed(1)}</span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-white/5">
                    <span className="text-slate-500 block">200D SMA</span>
                    <span className="font-bold text-[#f59e0b]">₹{(currentStock.CMP * 0.88).toFixed(1)}</span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-white/5">
                    <span className="text-slate-500 block">52W Position</span>
                    <span className="font-bold text-[#58a6ff]">{currentStock['52W_Prox']?.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {centerTab === 'analysis' && (
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-xs flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" /> Deep Signal Analysis Breakdown
                </h4>
                <div className="p-3 bg-[#111827] rounded-lg border border-[#334155] space-y-2 text-slate-300 text-xs">
                  <p>
                    &bull; <strong>Apollo Engine Verdict:</strong> {currentStock.Apollo_Action} signal with composite score of{' '}
                    <span className="text-indigo-300 font-bold">{currentStock.Apollo_Score}</span>.
                  </p>
                  <p>
                    &bull; <strong>LayerSignal RSI Stack Alignment:</strong> RSI21 (<span className="text-[#3fb950] font-bold">{currentStock.RSI21}</span>) &gt; RSI36 (<span className="text-[#58a6ff] font-bold">{currentStock.RSI36}</span>) &gt; RSI56 (<span className="text-[#d29922] font-bold">{currentStock.RSI56}</span>).
                  </p>
                  <p>
                    &bull; <strong>Renko Trend &amp; ADX Strength:</strong> Brick state is <span className="text-[#3fb950] font-bold">{currentStock.Renko}</span> with ADX strength at <span className="text-white font-bold">{currentStock.ADX}</span>.
                  </p>
                  <p>
                    &bull; <strong>Volatility Risk Corridor:</strong> ATR Volatility is <span className="text-amber-300 font-bold">{currentStock.ATR_Pct}%</span>, well within safety threshold.
                  </p>
                </div>
              </div>
            )}

            {/* TRADE JOURNAL SUB-TAB */}
            {centerTab === 'journal' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white uppercase text-xs flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Stock Trade Journal &amp; Rationale Log
                  </h4>
                  <span className="text-[10px] text-slate-400">{currentStock.Symbol} Notes</span>
                </div>

                <form onSubmit={handleAddJournal} className="p-3 bg-[#111827] rounded-lg border border-[#334155] space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block font-bold">Target Price (₹)</label>
                      <input
                        type="number"
                        placeholder={`e.g. ${(currentStock.CMP * 1.08).toFixed(1)}`}
                        value={newTarget}
                        onChange={(e) => setNewTarget(e.target.value)}
                        className="w-full bg-[#0B1120] border border-[#334155] rounded p-1.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block font-bold">Stop Loss (₹)</label>
                      <input
                        type="number"
                        placeholder={`e.g. ${(currentStock.CMP * 0.95).toFixed(1)}`}
                        value={newSL}
                        onChange={(e) => setNewSL(e.target.value)}
                        className="w-full bg-[#0B1120] border border-[#334155] rounded p-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block font-bold">Entry Rationale &amp; Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Enter strategy thesis, pattern triggers, or key observations..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="w-full bg-[#0B1120] border border-[#334155] rounded p-1.5 text-xs text-white"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Save Journal Entry
                  </button>
                </form>

                <div className="space-y-2">
                  {journalEntries.filter((j) => j.symbol === currentStock.Symbol).length === 0 ? (
                    <div className="p-4 bg-[#111827] rounded border border-white/5 text-center text-slate-500">
                      No journal notes for {currentStock.Symbol} yet.
                    </div>
                  ) : (
                    journalEntries
                      .filter((j) => j.symbol === currentStock.Symbol)
                      .map((j) => (
                        <div key={j.id} className="p-3 bg-[#111827] rounded-lg border border-[#334155] space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span className="font-bold text-indigo-300">{j.date}</span>
                            <div className="flex items-center gap-3 font-bold">
                              <span className="text-[#3fb950]">Target: ₹{j.target}</span>
                              <span className="text-[#f85149]">SL: ₹{j.stopLoss}</span>
                            </div>
                          </div>
                          <p className="text-slate-200 text-xs">{j.note}</p>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}

            {centerTab === 'holdings' && (
              <div className="space-y-3">
                <h4 className="font-bold text-white uppercase text-xs">Current Position Details</h4>
                <div className="p-4 bg-[#111827] rounded border border-[#334155] grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">POSITION STATUS</span>
                    <span className="font-bold text-[#3fb950]">ACTIVE LONG</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">AVG ENTRY PRICE</span>
                    <span className="font-bold text-white">₹{(currentStock.CMP * 0.94).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">UNREALIZED P&amp;L</span>
                    <span className="font-bold text-[#3fb950]">+₹18,450 (+6.38%)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">TRAILING STOP LOSS</span>
                    <span className="font-bold text-[#f85149]">₹{(currentStock.CMP * 0.92).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* RIGHT PANEL -- DETAIL ACCORDION (9 SECTIONS) */}
      <aside
        className={`${
          isRightPanelCollapsed ? 'w-10' : 'w-full lg:w-[480px]'
        } bg-[#0B1120] flex flex-col shrink-0 overflow-hidden transition-all duration-300 border-l border-[#334155]`}
      >
        <div className="h-10 bg-[#111827] border-b border-[#334155] px-3 flex items-center justify-between font-mono text-xs">
          {!isRightPanelCollapsed && (
            <span className="font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-400" /> Deep-Dive Analytics (9 Sections)
            </span>
          )}
          <button
            onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
            className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isRightPanelCollapsed ? 'Expand Right Panel' : 'Collapse Right Panel'}
          >
            {isRightPanelCollapsed ? <ChevronRight className="w-4 h-4" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isRightPanelCollapsed && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
            {/* 1. RSI STACK VISUALIZATION */}
            <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#111827]">
              <button
                onClick={() => toggleAccordion(1)}
                className="w-full p-2.5 bg-[#1E293B] hover:bg-white/5 flex items-center justify-between font-bold text-white text-xs cursor-pointer"
              >
                <span>1. RSI Stack Visualization (21, 36, 56)</span>
                {openAccordions[1] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[1] && (
                <div className="p-3 space-y-3 text-xs border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#3fb950] font-bold">RSI21 (Short Term):</span>
                    <span className="font-extrabold text-white">{currentStock.RSI21?.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#58a6ff] font-bold">RSI36 (Medium Term):</span>
                    <span className="font-extrabold text-white">{currentStock.RSI36?.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#d29922] font-bold">RSI56 (Long Term):</span>
                    <span className="font-extrabold text-white">{currentStock.RSI56?.toFixed(1)}</span>
                  </div>

                  <div className="h-28 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#334155" opacity={0.3} />
                        <YAxis domain={[20, 90]} hide />
                        <Line type="monotone" dataKey="RSI21" stroke="#3fb950" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="RSI36" stroke="#58a6ff" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="RSI56" stroke="#d29922" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* 2. RSI CUSHION */}
            <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#111827]">
              <button
                onClick={() => toggleAccordion(2)}
                className="w-full p-2.5 bg-[#1E293B] hover:bg-white/5 flex items-center justify-between font-bold text-white text-xs cursor-pointer"
              >
                <span>2. RSI Cushion Analysis</span>
                {openAccordions[2] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[2] && (
                <div className="p-3 space-y-2 text-xs border-t border-white/5">
                  <div className="flex justify-between text-slate-300">
                    <span>Distance to Overbought (70):</span>
                    <span className="font-bold text-[#3fb950]">
                      +{(70 - (currentStock.RSI21 || 60)).toFixed(1)} pts cushion
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Distance to Oversold (30):</span>
                    <span className="font-bold text-slate-400">
                      +{( (currentStock.RSI21 || 60) - 30).toFixed(1)} pts margin
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 4. POSITION SIZER */}
            <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#111827]">
              <button
                onClick={() => toggleAccordion(4)}
                className="w-full p-2.5 bg-[#1E293B] hover:bg-white/5 flex items-center justify-between font-bold text-white text-xs cursor-pointer"
              >
                <span>4. Risk-Based Position Sizer</span>
                {openAccordions[4] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[4] && (
                <div className="p-3 space-y-2 text-xs border-t border-white/5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">CAPITAL (₹)</span>
                      <input
                        type="number"
                        value={accountCapital}
                        onChange={(e) => setAccountCapital(Number(e.target.value))}
                        className="w-full bg-[#0B1120] border border-[#334155] rounded p-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">RISK %</span>
                      <input
                        type="number"
                        step="0.1"
                        value={riskPercent}
                        onChange={(e) => setRiskPercent(Number(e.target.value))}
                        className="w-full bg-[#0B1120] border border-[#334155] rounded p-1 text-white font-bold"
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-black/40 rounded border border-white/5 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Max Risk Amount:</span>
                      <span className="font-bold text-[#f85149]">₹{maxRiskAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ATR Stop Loss Distance:</span>
                      <span className="font-bold text-amber-300">₹{stopLossDistance.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-1">
                      <span className="text-white font-bold">Recommended Quantity:</span>
                      <span className="font-extrabold text-[#3fb950]">{calculatedShares} Shares</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Position Cost:</span>
                      <span className="font-bold text-indigo-300">₹{totalPositionCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 6. SCORE BREAKDOWN */}
            <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#111827]">
              <button
                onClick={() => toggleAccordion(6)}
                className="w-full p-2.5 bg-[#1E293B] hover:bg-white/5 flex items-center justify-between font-bold text-white text-xs cursor-pointer"
              >
                <span>6. Score Component Breakdown</span>
                {openAccordions[6] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[6] && (
                <div className="p-3 text-xs border-t border-white/5 space-y-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Trend Score:</span>
                      <span className="font-bold text-emerald-400">{currentStock.SubScores?.trend || 80} / 100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded">
                      <div className="h-full bg-emerald-400 rounded" style={{ width: `${currentStock.SubScores?.trend || 80}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Momentum Score:</span>
                      <span className="font-bold text-blue-400">{currentStock.SubScores?.momentum || 85} / 100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded">
                      <div className="h-full bg-blue-400 rounded" style={{ width: `${currentStock.SubScores?.momentum || 85}%` }} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Volume Turnover:</span>
                      <span className="font-bold text-purple-400">{currentStock.SubScores?.volume || 75} / 100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded">
                      <div className="h-full bg-purple-400 rounded" style={{ width: `${currentStock.SubScores?.volume || 75}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 7. GATE DETAILS */}
            <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#111827]">
              <button
                onClick={() => toggleAccordion(7)}
                className="w-full p-2.5 bg-[#1E293B] hover:bg-white/5 flex items-center justify-between font-bold text-white text-xs cursor-pointer"
              >
                <span>7. Gate Details Inspector (5 Gates)</span>
                {openAccordions[7] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[7] && (
                <div className="p-3 text-xs border-t border-white/5 space-y-1.5">
                  {(currentStock.GatesExplanations || [
                    '1. Regime Gate Passed',
                    '2. Trend Gate Passed',
                    '3. Momentum Gate Passed',
                    '4. Volatility Gate Passed',
                    '5. Quality Gate Passed',
                  ]).map((exp, idx) => {
                    const passed = (currentStock.Gates || [true, true, true, true, true])[idx];
                    return (
                      <div key={idx} className="flex items-start gap-1.5 p-1.5 rounded bg-black/30 border border-white/5">
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
              )}
            </div>

            {/* 8. ENTRY/EXIT LAYERS */}
            <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#111827]">
              <button
                onClick={() => toggleAccordion(8)}
                className="w-full p-2.5 bg-[#1E293B] hover:bg-white/5 flex items-center justify-between font-bold text-white text-xs cursor-pointer"
              >
                <span>8. Entry/Exit Layer Target Ladder</span>
                {openAccordions[8] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[8] && (
                <div className="p-3 text-xs border-t border-white/5 space-y-1.5">
                  <div className="flex justify-between p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                    <span className="text-emerald-300 font-bold">Target EL1 (Primary):</span>
                    <span className="font-extrabold text-[#3fb950]">₹{(currentStock.CMP * 1.06).toFixed(1)} (+6.0%)</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                    <span className="text-emerald-300 font-bold">Target EL2 (Stretch):</span>
                    <span className="font-extrabold text-[#3fb950]">₹{(currentStock.CMP * 1.12).toFixed(1)} (+12.0%)</span>
                  </div>
                  <div className="flex justify-between p-1.5 bg-red-500/10 border border-red-500/20 rounded">
                    <span className="text-red-300 font-bold">Stop Loss Level:</span>
                    <span className="font-extrabold text-[#f85149]">₹{(currentStock.CMP * 0.95).toFixed(1)} (-5.0%)</span>
                  </div>
                </div>
              )}
            </div>

            {/* 9. HISTORICAL L3 TRACKING */}
            <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#111827]">
              <button
                onClick={() => toggleAccordion(9)}
                className="w-full p-2.5 bg-[#1E293B] hover:bg-white/5 flex items-center justify-between font-bold text-white text-xs cursor-pointer"
              >
                <span>9. Historical L3 Bucket Timeline</span>
                {openAccordions[9] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[9] && (
                <div className="p-3 text-xs text-slate-300 border-t border-white/5 space-y-2">
                  {(currentStock.HistoricalL3Events || [
                    { date: '2026-06-15', event: 'L3 Bucket Entry', price: currentStock.CMP * 0.85, outcomePct: 18.2 },
                    { date: '2026-03-10', event: 'L2 Breakout', price: currentStock.CMP * 0.75, outcomePct: 22.4 },
                  ]).map((ev, eIdx) => (
                    <div key={eIdx} className="p-2 bg-black/30 rounded border border-white/5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-indigo-300 block">{ev.event} ({ev.date})</span>
                        <span className="text-[10px] text-slate-400">Entry Price: ₹{ev.price.toFixed(1)}</span>
                      </div>
                      <span className="font-extrabold text-[#3fb950] text-xs">+{ev.outcomePct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
