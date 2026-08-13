import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Layers,
  Activity,
  ShieldCheck,
  TrendingUp,
  Zap,
  Info,
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

import { SignalStock, SignalsSummary, QualityLevel, RiskLevel } from './types';
import { getQualityLevel, getRiskLevel, formatCurrencyINR } from './utils/calculations';
import { StatCard } from './components/StatCard';
import { DonutChart } from './components/DonutChart';
import { SignalBadge } from './components/SignalBadge';
import { QualityBadge } from './components/QualityBadge';
import { RiskBadge } from './components/RiskBadge';
import { ScoreBar } from './components/ScoreBar';
import { DetailPanel } from './components/DetailPanel';

type SortColumn =
  | 'Symbol'
  | 'CMP'
  | 'Pct_Change'
  | 'Apollo_Score'
  | 'LayerSignal_Score'
  | 'Exit_Pressure'
  | 'RSI'
  | 'PE'
  | '52W_Prox';

export default function App() {
  // Data States
  const [stocks, setStocks] = useState<SignalStock[]>([]);
  const [summary, setSummary] = useState<SignalsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Selected Stock for Side Panel
  const [selectedStock, setSelectedStock] = useState<SignalStock | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [qualityFilter, setQualityFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // Sorting
  const [sortColumn, setSortColumn] = useState<SortColumn>('LayerSignal_Score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch Signals API
  const fetchSignals = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/signals');
      const json = await res.json();

      if (json && json.data) {
        setStocks(json.data);
        setSummary(json.summary);
        setLastUpdated(json.summary?.generatedAt || new Date().toISOString());
      }
    } catch (err) {
      console.error('Failed to fetch signals:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  // Handle Header Sorting Click
  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  // Filter & Sort Pipeline
  const filteredAndSortedStocks = useMemo(() => {
    return stocks
      .filter((s) => {
        // Ticker / Symbol search
        if (searchTerm.trim() && !s.Symbol.toLowerCase().includes(searchTerm.toLowerCase().trim())) {
          return false;
        }

        // Action Filter (ENTRY, HOLD, EXIT, FLAT)
        const sAction = (s.LayerSignal_Action || s.Apollo_Action || '').toUpperCase();
        if (actionFilter !== 'ALL' && sAction !== actionFilter) {
          return false;
        }

        // Quality Filter
        if (qualityFilter !== 'ALL') {
          const q = getQualityLevel(s);
          if (q !== qualityFilter) return false;
        }

        // Risk Filter
        if (riskFilter !== 'ALL') {
          const r = getRiskLevel(s);
          if (r !== riskFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let aVal: any = a[sortColumn];
        let bVal: any = b[sortColumn];

        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = (bVal || '').toLowerCase();
        } else {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [stocks, searchTerm, actionFilter, qualityFilter, riskFilter, sortColumn, sortDirection]);

  return (
    <div className="min-h-screen w-full bg-[#0B1120] text-slate-200 font-sans selection:bg-indigo-600 selection:text-white flex flex-col">
      {/* HEADER BAR */}
      <header className="h-16 border-b border-[#334155] bg-[#111827]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#a371f7]/20 border border-[#a371f7]/40 rounded-lg flex items-center justify-center text-[#a371f7] shadow-[0_0_15px_rgba(163,113,247,0.2)]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-white tracking-tight">Apollo + LayerSignal</h1>
              <span className="text-[10px] uppercase tracking-wider font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                Screener MVP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Engine Signal Fusion & Live Market Analytics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-[#334155] text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse"></span>
            <span className="text-[#3fb950] font-bold">CSV SYNC ACTIVE</span>
          </div>

          <button
            onClick={fetchSignals}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-[#111827] hover:bg-slate-800 border border-[#334155] text-xs font-mono text-slate-200 rounded-lg flex items-center gap-2 transition-all cursor-pointer hover:border-slate-400"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#58a6ff] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh Data'}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* STATS CARDS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard
            title="Tracked Stocks"
            value={summary?.total || 0}
            subtitle="Engine Universe"
            icon={Database}
            accentColor="#58a6ff"
          />

          <StatCard
            title="ENTRY Signals"
            value={summary?.ENTRY || 0}
            subtitle="High Quality Setup"
            icon={TrendingUp}
            badgeText="BULLISH"
            badgeColor="green"
            accentColor="#3fb950"
          />

          <StatCard
            title="HOLD Signals"
            value={summary?.HOLD || 0}
            subtitle="In Trade"
            icon={Activity}
            badgeText="CAUTION"
            badgeColor="yellow"
            accentColor="#d29922"
          />

          <StatCard
            title="EXIT Signals"
            value={summary?.EXIT || 0}
            subtitle="Profit-Taking / Cut"
            icon={ShieldCheck}
            badgeText="BEARISH"
            badgeColor="red"
            accentColor="#f85149"
          />

          <StatCard
            title="Avg Momentum"
            value={summary?.avgScore?.toFixed(1) || '0.0'}
            subtitle="LayerSignal Score"
            icon={Zap}
            accentColor="#a371f7"
          />

          <StatCard
            title="Avg Exit Pressure"
            value={summary?.avgExitPressure?.toFixed(1) || '0.0'}
            subtitle="Risk Gauge"
            icon={Info}
            badgeText={summary && summary.avgExitPressure > 40 ? 'HIGH' : 'STABLE'}
            badgeColor={summary && summary.avgExitPressure > 40 ? 'red' : 'blue'}
            accentColor="#58a6ff"
          />
        </div>

        {/* DONUT CHART & QUICK STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {summary && (
              <DonutChart
                summary={summary}
                selectedFilter={actionFilter}
                onFilterSelect={(act) => setActionFilter(act)}
              />
            )}
          </div>

          <div className="p-5 rounded-xl bg-[#111827] border border-[#334155] shadow-lg flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center justify-between">
                <span>Entry Quality Distribution</span>
                <span className="text-[10px] text-slate-500">ENTRY Signals Only</span>
              </h3>

              <div className="space-y-2 pt-1 font-mono text-xs">
                <div className="flex justify-between items-center p-2 rounded bg-black/30 border border-white/5">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> STRONG
                  </span>
                  <span className="font-extrabold text-white">{summary?.quality.STRONG || 0}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-black/30 border border-white/5">
                  <span className="text-indigo-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span> GOOD
                  </span>
                  <span className="font-extrabold text-white">{summary?.quality.GOOD || 0}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-black/30 border border-white/5">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> MODERATE
                  </span>
                  <span className="font-extrabold text-white">{summary?.quality.MODERATE || 0}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded bg-black/30 border border-white/5">
                  <span className="text-red-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> WEAK
                  </span>
                  <span className="font-extrabold text-white">{summary?.quality.WEAK || 0}</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-mono pt-3 border-t border-white/5 flex items-center justify-between">
              <span>Last Data Merge:</span>
              <span className="text-slate-300">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Just now'}
              </span>
            </div>
          </div>
        </div>

        {/* SCREENER FILTER CONTROLS */}
        <div className="p-4 rounded-xl bg-[#111827] border border-[#334155] shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* SEARCH BOX */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticker symbol (e.g. RELIANCE, TCS, INFY)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B1120] border border-[#334155] rounded-lg pl-10 pr-4 py-2 text-xs font-mono text-white outline-none focus:border-[#58a6ff] transition-colors"
              />
            </div>

            {/* CLEAR FILTERS */}
            {(searchTerm || actionFilter !== 'ALL' || qualityFilter !== 'ALL' || riskFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActionFilter('ALL');
                  setQualityFilter('ALL');
                  setRiskFilter('ALL');
                }}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-400 hover:text-white rounded-lg transition-colors shrink-0"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* FILTER BUTTON GROUPS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5 text-xs font-mono">
            {/* SIGNAL ACTION FILTER */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Signal Action</label>
              <div className="flex flex-wrap gap-1">
                {['ALL', 'ENTRY', 'HOLD', 'EXIT', 'FLAT'].map((act) => (
                  <button
                    key={act}
                    onClick={() => setActionFilter(act)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                      actionFilter === act
                        ? 'bg-[#58a6ff]/20 text-[#58a6ff] border-[#58a6ff]'
                        : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>

            {/* QUALITY FILTER */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Signal Quality</label>
              <div className="flex flex-wrap gap-1">
                {['ALL', 'STRONG', 'GOOD', 'MODERATE', 'WEAK'].map((q) => (
                  <button
                    key={q}
                    onClick={() => setQualityFilter(q)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                      qualityFilter === q
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* RISK FILTER */}
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400">Risk Profile</label>
              <div className="flex flex-wrap gap-1">
                {['ALL', 'LOW RISK', 'MEDIUM', 'HIGH RISK', 'IN TRADE'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r)}
                    className={`px-2 py-1 rounded text-[10px] font-bold border transition-all cursor-pointer ${
                      riskFilter === r
                        ? 'bg-[#a371f7]/20 text-[#a371f7] border-[#a371f7]'
                        : 'bg-black/30 text-slate-400 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SCREENER TABLE CONTAINER */}
        <div className="p-4 rounded-xl bg-[#111827] border border-[#334155] shadow-lg space-y-3 overflow-hidden">
          <div className="flex items-center justify-between px-2 text-xs font-mono text-slate-400">
            <div>
              Showing <strong className="text-white">{filteredAndSortedStocks.length}</strong> of{' '}
              <strong className="text-white">{stocks.length}</strong> stocks
            </div>
            <div className="text-[11px] text-slate-500">
              Sorted by <strong className="text-indigo-400">{sortColumn}</strong> ({sortDirection.toUpperCase()})
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[#334155]">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-black/50 text-slate-400 border-b border-[#334155] text-[10px] uppercase tracking-wider select-none">
                  <th
                    onClick={() => handleSort('Symbol')}
                    className="p-3 font-extrabold cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Symbol
                      {sortColumn === 'Symbol' &&
                        (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#58a6ff]" /> : <ChevronDown className="w-3 h-3 text-[#58a6ff]" />)}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('CMP')}
                    className="p-3 font-extrabold cursor-pointer hover:text-white transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      CMP (₹)
                      {sortColumn === 'CMP' &&
                        (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#58a6ff]" /> : <ChevronDown className="w-3 h-3 text-[#58a6ff]" />)}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('Pct_Change')}
                    className="p-3 font-extrabold cursor-pointer hover:text-white transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      24h Chg
                      {sortColumn === 'Pct_Change' &&
                        (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#58a6ff]" /> : <ChevronDown className="w-3 h-3 text-[#58a6ff]" />)}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('Apollo_Score')}
                    className="p-3 font-extrabold cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Apollo
                      {sortColumn === 'Apollo_Score' &&
                        (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#58a6ff]" /> : <ChevronDown className="w-3 h-3 text-[#58a6ff]" />)}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('LayerSignal_Score')}
                    className="p-3 font-extrabold cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      LayerSignal
                      {sortColumn === 'LayerSignal_Score' &&
                        (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#58a6ff]" /> : <ChevronDown className="w-3 h-3 text-[#58a6ff]" />)}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('Exit_Pressure')}
                    className="p-3 font-extrabold cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Exit Pressure
                      {sortColumn === 'Exit_Pressure' &&
                        (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#58a6ff]" /> : <ChevronDown className="w-3 h-3 text-[#58a6ff]" />)}
                    </div>
                  </th>

                  <th className="p-3 font-extrabold">Quality</th>
                  <th className="p-3 font-extrabold">Risk</th>

                  <th
                    onClick={() => handleSort('RSI')}
                    className="p-3 font-extrabold cursor-pointer hover:text-white transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      RSI
                      {sortColumn === 'RSI' &&
                        (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#58a6ff]" /> : <ChevronDown className="w-3 h-3 text-[#58a6ff]" />)}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('PE')}
                    className="p-3 font-extrabold cursor-pointer hover:text-white transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      P/E
                      {sortColumn === 'PE' &&
                        (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#58a6ff]" /> : <ChevronDown className="w-3 h-3 text-[#58a6ff]" />)}
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('52W_Prox')}
                    className="p-3 font-extrabold cursor-pointer hover:text-white transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      52W Prox
                      {sortColumn === '52W_Prox' &&
                        (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-[#58a6ff]" /> : <ChevronDown className="w-3 h-3 text-[#58a6ff]" />)}
                    </div>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#58a6ff]" />
                      Loading Engine Signals...
                    </td>
                  </tr>
                ) : filteredAndSortedStocks.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-slate-500">
                      No stocks match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedStocks.map((stock) => {
                    const quality = getQualityLevel(stock);
                    const risk = getRiskLevel(stock);
                    const isSelected = selectedStock?.Symbol === stock.Symbol;

                    return (
                      <tr
                        key={stock.Symbol}
                        onClick={() => setSelectedStock(stock)}
                        className={`hover:bg-white/5 transition-colors cursor-pointer ${
                          isSelected ? 'bg-indigo-600/15 border-l-2 border-indigo-500' : ''
                        }`}
                      >
                        {/* SYMBOL */}
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <span className="hover:underline">{stock.Symbol}</span>
                        </td>

                        {/* CMP */}
                        <td className="p-3 text-right font-extrabold text-white">
                          {formatCurrencyINR(stock.CMP || stock.Close)}
                        </td>

                        {/* 24H PCT CHANGE */}
                        <td className="p-3 text-right font-bold">
                          <span className={stock.Pct_Change >= 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}>
                            {stock.Pct_Change >= 0 ? `+${stock.Pct_Change.toFixed(2)}%` : `${stock.Pct_Change.toFixed(2)}%`}
                          </span>
                        </td>

                        {/* APOLLO ACTION & SCORE */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <SignalBadge action={stock.Apollo_Action} />
                            <span className="text-slate-400 font-semibold">{stock.Apollo_Score?.toFixed(1)}</span>
                          </div>
                        </td>

                        {/* LAYERSIGNAL ACTION & SCORE */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <SignalBadge action={stock.LayerSignal_Action} />
                            <ScoreBar score={stock.LayerSignal_Score} type="momentum" />
                          </div>
                        </td>

                        {/* EXIT PRESSURE */}
                        <td className="p-3">
                          <ScoreBar score={stock.Exit_Pressure} type="exit_pressure" />
                        </td>

                        {/* QUALITY */}
                        <td className="p-3">
                          <QualityBadge quality={quality} />
                        </td>

                        {/* RISK */}
                        <td className="p-3">
                          <RiskBadge risk={risk} />
                        </td>

                        {/* RSI */}
                        <td className="p-3 text-right">
                          <span
                            className={
                              stock.RSI > 70 ? 'text-[#f85149] font-bold' : stock.RSI < 30 ? 'text-[#3fb950] font-bold' : 'text-slate-300'
                            }
                          >
                            {stock.RSI?.toFixed(1)}
                          </span>
                        </td>

                        {/* PE */}
                        <td className="p-3 text-right text-slate-300">{stock.PE?.toFixed(1)}</td>

                        {/* 52W PROXIMITY */}
                        <td className="p-3 text-right text-slate-300 font-semibold">
                          {stock['52W_Prox']?.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#334155] bg-black/40 py-4 px-8 text-center text-xs font-mono text-slate-500">
        Apollo + LayerSignal Screener Engine MVP &bull; Single-Page Architecture &bull; 100% Fully Compliant
      </footer>

      {/* DETAIL SIDE PANEL */}
      <DetailPanel stock={selectedStock} onClose={() => setSelectedStock(null)} />
    </div>
  );
}
