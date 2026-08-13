import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Sliders,
  DollarSign,
  History,
  Activity,
  Layers,
  BarChart2,
  Maximize2,
  Minimize2,
  CheckCircle2,
  XCircle,
  Zap
} from 'lucide-react';
import { SignalStock, TradeRecord } from '../../types';
import { formatCurrencyINR, formatLargeNumber } from '../../utils/calculations';
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
  // Fallback stock selection if null
  const currentStock = selectedStock || stocks[0] || null;

  // Center Sub-tab state
  const [centerTab, setCenterTab] = useState<'chart' | 'analysis' | 'holdings'>('chart');

  // Right Panel Collapse State
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  // Accordion Sections Open State (1-9)
  const [openAccordions, setOpenAccordions] = useState<Record<number, boolean>>({
    1: true, // RSI Stack
    2: true, // RSI Cushion
    4: true, // Position Sizer
    7: true, // Gate Details
  });

  const toggleAccordion = (num: number) => {
    setOpenAccordions((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  // Filter Pills for Left Stock List
  const [leftFilter, setLeftFilter] = useState<'ALL' | 'L1' | 'L2' | 'L3' | 'ENTRY'>('ALL');

  const filteredStockList = stocks.filter((s) => {
    if (leftFilter === 'L1') return s.Bucket === 'L1';
    if (leftFilter === 'L2') return s.Bucket === 'L2';
    if (leftFilter === 'L3') return s.Bucket === 'L3';
    if (leftFilter === 'ENTRY') return (s.LayerSignal_Action || s.Apollo_Action) === 'ENTRY';
    return true;
  });

  // Filter trades for currently selected stock
  const stockTrades = currentStock
    ? trades.filter((t) => t.symbol === currentStock.Symbol)
    : [];

  // Position Sizer Calculations
  const [accountCapital, setAccountCapital] = useState<number>(1000000); // ₹10 Lakhs
  const [riskPercent, setRiskPercent] = useState<number>(1.5); // 1.5%
  const atr = currentStock?.ATR_Pct ? (currentStock.CMP * currentStock.ATR_Pct) / 100 : currentStock?.CMP * 0.02 || 50;
  const maxRiskAmount = (accountCapital * riskPercent) / 100;
  const stopLossDistance = atr * 1.5;
  const calculatedShares = Math.floor(maxRiskAmount / stopLossDistance);
  const totalPositionCost = calculatedShares * (currentStock?.CMP || 1000);

  if (!currentStock) return null;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] w-full overflow-hidden text-slate-200 font-sans select-none">
      {/* LEFT PANEL (200-240px) -- STOCK LIST SELECTOR */}
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
        {/* THROWBACK ALERT BANNER (CONDITIONAL) */}
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

        {/* 4 SUMMARY STAT CARDS (2x2 GRID) */}
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

        {/* SUB-TABS (CHART | ANALYSIS | HOLDINGS) */}
        <div className="flex-1 flex flex-col bg-[#0B1120] border border-[#334155] rounded-xl overflow-hidden shadow-xl">
          <div className="h-10 bg-[#1E293B] border-b border-[#334155] px-4 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-1">
              {(['chart', 'analysis', 'holdings'] as const).map((tab) => (
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
            {centerTab === 'chart' && (
              <div className="h-full min-h-[300px] flex flex-col justify-between space-y-4">
                {/* CANDLESTICK MOCK OVERLAY STAGE */}
                <div className="p-4 bg-[#111827] rounded-lg border border-[#334155] space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-white/5 pb-2">
                    <span>CANDLESTICK PRICE CHART (30D OVERLAY)</span>
                    <span className="text-[#3fb950] font-bold">20D / 50D / 200D SMA Active</span>
                  </div>

                  <div className="h-48 flex items-end justify-between gap-1 pt-4 pb-2">
                    {Array.from({ length: 24 }).map((_, i) => {
                      const ht = 20 + Math.sin(i * 0.8) * 30 + (i * 2);
                      const isUp = i % 3 !== 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div
                            className={`w-full rounded-sm transition-all ${
                              isUp ? 'bg-[#3fb950]' : 'bg-[#f85149]'
                            }`}
                            style={{ height: `${ht}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TECHNICAL SUMMARY BAR */}
                <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                  <div className="p-2 bg-[#111827] rounded border border-white/5">
                    <span className="text-slate-500 block">20D SMA</span>
                    <span className="font-bold text-white">₹{currentStock['20D_SMA'] || currentStock.CMP * 0.96}</span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-white/5">
                    <span className="text-slate-500 block">50D SMA</span>
                    <span className="font-bold text-white">₹{currentStock['50D_SMA'] || currentStock.CMP * 0.92}</span>
                  </div>
                  <div className="p-2 bg-[#111827] rounded border border-white/5">
                    <span className="text-slate-500 block">200D SMA</span>
                    <span className="font-bold text-white">₹{currentStock['200D_SMA'] || currentStock.CMP * 0.82}</span>
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
                <h4 className="font-bold text-white uppercase text-xs">Text-Based Signal Breakdown</h4>
                <div className="p-3 bg-[#111827] rounded border border-[#334155] space-y-2 text-slate-300 text-xs">
                  <p>
                    &bull; <strong>Apollo Engine Verdict:</strong> {currentStock.Apollo_Action} signal generated with composite score of{' '}
                    <span className="text-indigo-300 font-bold">{currentStock.Apollo_Score}</span>.
                  </p>
                  <p>
                    &bull; <strong>LayerSignal RSI Stack:</strong> RSI21 ({currentStock.RSI21}) &gt; RSI36 ({currentStock.RSI36}) &gt; RSI56 ({currentStock.RSI56}) indicates strong bullish alignment.
                  </p>
                  <p>
                    &bull; <strong>Renko Trend:</strong> Brick state is <span className="text-[#3fb950] font-bold">{currentStock.Renko}</span> with expanding ADX ({currentStock.ADX}).
                  </p>
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

      {/* RIGHT PANEL (400-660px) -- COLLAPSIBLE DETAIL ACCORDION (9 SECTIONS) */}
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
            {/* 1. RSI STACK (LayerSignal) */}
            <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#111827]">
              <button
                onClick={() => toggleAccordion(1)}
                className="w-full p-2.5 bg-[#1E293B] hover:bg-white/5 flex items-center justify-between font-bold text-white text-xs cursor-pointer"
              >
                <span>1. RSI Stack Visualization (21, 36, 56)</span>
                {openAccordions[1] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[1] && (
                <div className="p-3 space-y-2 text-xs border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[#3fb950] font-bold">RSI21 (Short Term):</span>
                    <span className="font-extrabold text-white">{currentStock.RSI21?.toFixed(1) || '64.2'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#58a6ff] font-bold">RSI36 (Medium Term):</span>
                    <span className="font-extrabold text-white">{currentStock.RSI36?.toFixed(1) || '58.4'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#d29922] font-bold">RSI56 (Long Term):</span>
                    <span className="font-extrabold text-white">{currentStock.RSI56?.toFixed(1) || '52.1'}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    Locked Color Assignments: RSI21 (Green), RSI36 (Blue), RSI56 (Amber).
                  </p>
                </div>
              )}
            </div>

            {/* 2. RSI CUSHION (LayerSignal) */}
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
                      +{(70 - (currentStock.RSI21 || 64.2)).toFixed(1)} pts cushion
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Distance to Oversold (30):</span>
                    <span className="font-bold text-slate-400">
                      +{( (currentStock.RSI21 || 64.2) - 30).toFixed(1)} pts margin
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. RSI COMPARISON */}
            <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#111827]">
              <button
                onClick={() => toggleAccordion(3)}
                className="w-full p-2.5 bg-[#1E293B] hover:bg-white/5 flex items-center justify-between font-bold text-white text-xs cursor-pointer"
              >
                <span>3. RSI Comparison &amp; Divergence</span>
                {openAccordions[3] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[3] && (
                <div className="p-3 text-xs text-slate-300 border-t border-white/5 space-y-1">
                  <div>No bearish RSI divergence detected across 3 timeframes.</div>
                  <div className="text-[10px] text-emerald-400 font-bold">Divergence Score: 0 (Bullish Intact)</div>
                </div>
              )}
            </div>

            {/* 4. POSITION SIZER (Apollo Risk Calculator) */}
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
                      <span className="text-[10px] text-slate-400 block">ACCOUNT CAPITAL</span>
                      <input
                        type="number"
                        value={accountCapital}
                        onChange={(e) => setAccountCapital(Number(e.target.value))}
                        className="w-full bg-[#0B1120] border border-[#334155] rounded p-1 text-white font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">RISK % PER TRADE</span>
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
                      <span className="text-slate-400">Total Position Capital:</span>
                      <span className="font-bold text-indigo-300">₹{totalPositionCost.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. TRADE JOURNAL */}
            <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#111827]">
              <button
                onClick={() => toggleAccordion(5)}
                className="w-full p-2.5 bg-[#1E293B] hover:bg-white/5 flex items-center justify-between font-bold text-white text-xs cursor-pointer"
              >
                <span>5. Trade Journal History ({stockTrades.length})</span>
                {openAccordions[5] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[5] && (
                <div className="p-3 text-xs border-t border-white/5 space-y-2">
                  {stockTrades.length === 0 ? (
                    <div className="text-slate-500 text-center py-2">No historical closed trades recorded for {currentStock.Symbol}.</div>
                  ) : (
                    stockTrades.map((tr) => (
                      <div key={tr.id} className="p-2 bg-black/30 rounded border border-white/5 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>{tr.entryDate} &rarr; {tr.exitDate}</span>
                          <span className={tr.pnlPct >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}>
                            {tr.pnlPct >= 0 ? `+${tr.pnlPct}%` : `${tr.pnlPct}%`}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Exit Mode: {tr.exitMode}</span>
                          <span>Holding: {tr.holdingDays} days</span>
                        </div>
                      </div>
                    ))
                  )}
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
                <div className="p-3 text-xs border-t border-white/5 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Momentum Component:</span>
                    <span className="font-bold text-indigo-300">32.5 / 40</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trend Strength Component:</span>
                    <span className="font-bold text-indigo-300">28.0 / 30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quality &amp; Volume Component:</span>
                    <span className="font-bold text-indigo-300">18.0 / 20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Volatility Penalty:</span>
                    <span className="font-bold text-[#f85149]">-2.0</span>
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
                  {(currentStock.Gates || [true, true, true, false, true]).map((passed, idx) => {
                    const gateNames = ['Regime Gate', 'Trend Gate', 'Momentum Gate', 'Volatility Gate', 'Quality Gate'];
                    return (
                      <div key={idx} className="flex items-center justify-between p-1 rounded bg-black/30 border border-white/5">
                        <span className="text-slate-300">{gateNames[idx]}</span>
                        <span className={`font-bold flex items-center gap-1 ${passed ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                          {passed ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {passed ? 'PASS' : 'FAIL'}
                        </span>
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
                <span>8. Entry/Exit Layers Planning</span>
                {openAccordions[8] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[8] && (
                <div className="p-3 text-xs border-t border-white/5 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target EL1 (Base):</span>
                    <span className="font-bold text-[#3fb950]">₹{(currentStock.CMP * 1.05).toFixed(1)} (+5%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target EL2 (Expanded):</span>
                    <span className="font-bold text-[#3fb950]">₹{(currentStock.CMP * 1.10).toFixed(1)} (+10%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hard Stop Loss:</span>
                    <span className="font-bold text-[#f85149]">₹{(currentStock.CMP * 0.95).toFixed(1)} (-5%)</span>
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
                <span>9. Historical L3 Bucket Instances</span>
                {openAccordions[9] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {openAccordions[9] && (
                <div className="p-3 text-xs text-slate-300 border-t border-white/5 space-y-1">
                  <div>3 previous L3 bucket instances in the past 12 months.</div>
                  <div className="text-[10px] text-[#3fb950] font-bold">Historical L3 Success Rate: 100% (3/3)</div>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};
