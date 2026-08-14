import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  RotateCw,
  TrendingUp,
  TrendingDown,
  Layers,
  Award,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Calendar,
  Filter,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Archive,
} from 'lucide-react';
import { IPOStock, IPOSummary, IPOZone, IPOStage, SignalStock } from '../../types';
import { formatCurrencyINR } from '../../utils/calculations';

interface IPOTabProps {
  stocks: SignalStock[];
  onSelectStock: (stock: SignalStock) => void;
  onSelectIPOStock?: (stock: IPOStock) => void;
}

export const IPOTab: React.FC<IPOTabProps> = ({ stocks, onSelectStock, onSelectIPOStock }) => {
  const [ipoStocks, setIpoStocks] = useState<IPOStock[]>([]);
  const [summary, setSummary] = useState<IPOSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  // Filters & Controls
  const [selectedZone, setSelectedZone] = useState<IPOZone | 'ALL'>('ALL');
  const [selectedStage, setSelectedStage] = useState<IPOStage | 'ALL'>('ALL');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxDaysFilter, setMaxDaysFilter] = useState<number>(240);
  const [sortField, setSortField] = useState<keyof IPOStock>('distance_to_baseline_pct');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Fetch IPO Stocks & Summary
  const fetchIpoData = async (forceSync = false) => {
    try {
      if (forceSync) {
        setIsRefreshing(true);
        await fetch('/api/ipo/refresh', { method: 'POST' });
      }

      const [stocksRes, summaryRes] = await Promise.allSettled([
        fetch('/api/ipo/stocks'),
        fetch('/api/ipo/summary'),
      ]);

      if (stocksRes.status === 'fulfilled' && stocksRes.value.ok) {
        const data = await stocksRes.value.json();
        if (Array.isArray(data)) {
          setIpoStocks(data);
        }
      }

      if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
        const sumData = await summaryRes.value.json();
        if (sumData && sumData.total !== undefined) {
          setSummary(sumData);
          setLastSyncTime(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.warn('Error fetching IPO dataset:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIpoData();
    const interval = setInterval(() => {
      fetchIpoData();
    }, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  // Force Graduate Handler
  const handleGraduate = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/ipo/graduate/${symbol}`, { method: 'POST' });
      if (res.ok) {
        setIpoStocks((prev) => prev.filter((s) => s.symbol !== symbol));
        fetchIpoData();
      }
    } catch (err) {
      console.error('Error graduating stock:', err);
    }
  };

  // Convert IPOStock to SignalStock format when user clicks to view DetailPanel
  const handleRowClick = (ipo: IPOStock) => {
    // Check if stock is in main stock signals universe
    const existingSignal = stocks.find((s) => s.Symbol.toUpperCase() === ipo.symbol.toUpperCase());
    if (existingSignal) {
      onSelectStock({
        ...existingSignal,
        isIPO: true,
        ipoData: ipo,
      });
    } else {
      // Create synthetic SignalStock representation so DetailPanel can render it seamlessly
      const syntheticSignal: SignalStock = {
        Symbol: ipo.symbol,
        Date: ipo.listing_date,
        Apollo_Action: ipo.Apollo_Action || (ipo.zone === 'RECOVERY' || ipo.zone === 'NEW_HIGH' ? 'ENTRY' : 'HOLD'),
        Apollo_Score: ipo.Apollo_Score ?? 92.5,
        Pct_Change: ipo.return_from_issue_pct > 0 ? 1.8 : -1.2,
        LayerSignal_Action: ipo.LayerSignal_Action || (ipo.zone === 'NEW_HIGH' ? 'ENTRY' : 'HOLD'),
        LayerSignal_Score: ipo.LayerSignal_Score ?? 78.4,
        Exit_Pressure: ipo.zone === 'BROKEN_IPO' ? 72 : 32,
        Open: ipo.listing_price || ipo.issue_price,
        High: ipo.all_time_high,
        Low: ipo.all_time_low,
        Close: ipo.cmp,
        Volume: 1250000,
        High52W: ipo.all_time_high,
        Low52W: ipo.all_time_low,
        RSI21: ipo.RSI21 ?? (ipo.zone === 'NEW_HIGH' ? 68.4 : 54.2),
        RSI36: ipo.RSI36 ?? 58.0,
        RSI56: 52.0,
        ADX: ipo.ADX ?? 31.5,
        ATR_Pct: ipo.ATR_Pct ?? 2.8,
        PE: ipo.current_pe ?? 35.0,
        Stochastic: 64.0,
        '52W_Prox': ipo.ath_recovery_pct,
        CMP: ipo.cmp,
        Traded_Value: 450000000,
        Bucket: (ipo.Bucket as any) || (ipo.zone === 'NEW_HIGH' ? 'L1' : 'L2'),
        LStage: ipo.listing_stage === 'FRESH' ? 'Stage 1' : 'Stage 2',
        ELStatus: 'NONE',
        Conviction: 0.85,
        Gates: ipo.Gates || [true, true, true, true, false],
        Renko: ipo.zone === 'BROKEN_IPO' ? 'RED' : 'GREEN',
        MCap: ipo.cmp * 10000000 > 20000000000 ? 'Large' : 'Mid',
        FQS: 'A',
        Sparkline: [ipo.issue_price, ipo.listing_price, ipo.ipo_baseline, ipo.cmp],
        isIPO: true,
        ipoData: ipo,
      };
      onSelectStock(syntheticSignal);
    }
  };

  // Distinct sectors
  const sectors = useMemo(() => {
    const set = new Set<string>();
    ipoStocks.forEach((s) => {
      if (s.sector) set.add(s.sector);
    });
    return Array.from(set);
  }, [ipoStocks]);

  // Zone stats for 4 Zone Cards
  const zoneStats = useMemo(() => {
    const zones: Record<IPOZone, { count: number; avgDist: number; topMover: IPOStock | null }> = {
      NEW_HIGH: { count: 0, avgDist: 0, topMover: null },
      RECOVERY: { count: 0, avgDist: 0, topMover: null },
      UNDER_PRESSURE: { count: 0, avgDist: 0, topMover: null },
      BROKEN_IPO: { count: 0, avgDist: 0, topMover: null },
    };

    const sums: Record<IPOZone, number> = {
      NEW_HIGH: 0,
      RECOVERY: 0,
      UNDER_PRESSURE: 0,
      BROKEN_IPO: 0,
    };

    ipoStocks.forEach((stk) => {
      const z = stk.zone;
      if (zones[z]) {
        zones[z].count++;
        sums[z] += stk.distance_to_baseline_pct;
        if (!zones[z].topMover || Math.abs(stk.distance_to_baseline_pct) > Math.abs(zones[z].topMover!.distance_to_baseline_pct)) {
          zones[z].topMover = stk;
        }
      }
    });

    (['NEW_HIGH', 'RECOVERY', 'UNDER_PRESSURE', 'BROKEN_IPO'] as IPOZone[]).forEach((z) => {
      if (zones[z].count > 0) {
        zones[z].avgDist = Number((sums[z] / zones[z].count).toFixed(1));
      }
    });

    return zones;
  }, [ipoStocks]);

  // Filtered & Sorted Master IPO Table
  const filteredStocks = useMemo(() => {
    return ipoStocks
      .filter((stk) => {
        if (selectedZone !== 'ALL' && stk.zone !== selectedZone) return false;
        if (selectedStage !== 'ALL' && stk.listing_stage !== selectedStage) return false;
        if (selectedSector !== 'ALL' && stk.sector !== selectedSector) return false;
        if (stk.days_since_listing > maxDaysFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesSym = stk.symbol.toLowerCase().includes(q);
          const matchesName = stk.company_name?.toLowerCase().includes(q);
          if (!matchesSym && !matchesName) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? 0;
        const valB = b[sortField] ?? 0;
        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
        }
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [ipoStocks, selectedZone, selectedStage, selectedSector, searchQuery, maxDaysFilter, sortField, sortOrder]);

  const handleSort = (field: keyof IPOStock) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getZoneBadgeColor = (zone: IPOZone) => {
    switch (zone) {
      case 'NEW_HIGH':
        return 'bg-emerald-500/20 text-[#3fb950] border-[#3fb950]/40';
      case 'RECOVERY':
        return 'bg-blue-500/20 text-[#58a6ff] border-[#58a6ff]/40';
      case 'UNDER_PRESSURE':
        return 'bg-amber-500/20 text-[#d29922] border-[#d29922]/40';
      case 'BROKEN_IPO':
        return 'bg-red-500/20 text-[#f87171] border-[#f87171]/40';
      default:
        return 'bg-slate-700/20 text-slate-400 border-slate-600/30';
    }
  };

  const totalCount = ipoStocks.length || 1;
  const newHighPct = ((zoneStats.NEW_HIGH.count / totalCount) * 100).toFixed(0);
  const recoveryPct = ((zoneStats.RECOVERY.count / totalCount) * 100).toFixed(0);
  const underPressurePct = ((zoneStats.UNDER_PRESSURE.count / totalCount) * 100).toFixed(0);
  const brokenIpoPct = ((zoneStats.BROKEN_IPO.count / totalCount) * 100).toFixed(0);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-full overflow-hidden text-slate-200 font-sans">
      {/* LAYER 1: IPO DASHBOARD HEADER (KPI BAR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* TOTAL TRACKED */}
        <div className="p-3.5 bg-[#111827] rounded-xl border border-[#334155] flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Tracked IPOs</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{summary?.total ?? ipoStocks.length}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-bold">{summary?.stages.fresh ?? 0} Fresh</span>
            <span>&bull;</span>
            <span className="text-blue-400 font-bold">{summary?.stages.mature ?? 0} Mature</span>
          </div>
        </div>

        {/* ZONE DISTRIBUTION BAR */}
        <div className="p-3.5 bg-[#111827] rounded-xl border border-[#334155] flex flex-col justify-between font-mono lg:col-span-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Zone Distribution</span>
            <span className="text-[10px] text-slate-400 font-normal">Four-Zone Model</span>
          </div>
          {/* 4-Segment Stacked Horizontal Bar */}
          <div className="h-3.5 w-full bg-black/40 rounded-full overflow-hidden flex my-2 p-0.5 border border-white/5">
            <div
              style={{ width: `${newHighPct}%` }}
              className="h-full bg-[#3fb950] rounded-l-full transition-all duration-500"
              title={`New High: ${zoneStats.NEW_HIGH.count} (${newHighPct}%)`}
            />
            <div
              style={{ width: `${recoveryPct}%` }}
              className="h-full bg-[#58a6ff] transition-all duration-500"
              title={`Recovery: ${zoneStats.RECOVERY.count} (${recoveryPct}%)`}
            />
            <div
              style={{ width: `${underPressurePct}%` }}
              className="h-full bg-[#d29922] transition-all duration-500"
              title={`Under Pressure: ${zoneStats.UNDER_PRESSURE.count} (${underPressurePct}%)`}
            />
            <div
              style={{ width: `${brokenIpoPct}%` }}
              className="h-full bg-[#f87171] rounded-r-full transition-all duration-500"
              title={`Broken IPO: ${zoneStats.BROKEN_IPO.count} (${brokenIpoPct}%)`}
            />
          </div>
          <div className="grid grid-cols-4 text-[9px] font-bold text-center gap-1">
            <span className="text-[#3fb950]">NH: {zoneStats.NEW_HIGH.count}</span>
            <span className="text-[#58a6ff]">REC: {zoneStats.RECOVERY.count}</span>
            <span className="text-[#d29922]">UP: {zoneStats.UNDER_PRESSURE.count}</span>
            <span className="text-[#f87171]">BRK: {zoneStats.BROKEN_IPO.count}</span>
          </div>
        </div>

        {/* AVERAGE RETURN FROM ISSUE */}
        <div className="p-3.5 bg-[#111827] rounded-xl border border-[#334155] flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Avg Issue Return</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div
            className={`text-2xl font-black mt-1 ${
              (summary?.avg_return_from_issue ?? 0) >= 0 ? 'text-[#3fb950]' : 'text-[#f87171]'
            }`}
          >
            {(summary?.avg_return_from_issue ?? 0) >= 0 ? '+' : ''}
            {summary?.avg_return_from_issue?.toFixed(1) ?? '0.0'}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Across all tracked IPOs</div>
        </div>

        {/* BEST & WORST PERFORMERS */}
        <div className="p-3.5 bg-[#111827] rounded-xl border border-[#334155] flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Top Movers</span>
            <Award className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="space-y-1 mt-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-white">{summary?.best_performer?.symbol ?? 'TATATECH'}</span>
              <span className="text-[#3fb950]">+{summary?.best_performer?.return_pct.toFixed(0) ?? '0'}%</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-400">{summary?.worst_performer?.symbol ?? 'HYUNDAI'}</span>
              <span className="text-[#f87171]">{summary?.worst_performer?.return_pct.toFixed(0) ?? '0'}%</span>
            </div>
          </div>
        </div>

        {/* NEXT DATA REFRESH & SYNC */}
        <div className="p-3.5 bg-[#111827] rounded-xl border border-[#334155] flex flex-col justify-between font-mono">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>Scraper Sync</span>
            <button
              onClick={() => fetchIpoData(true)}
              disabled={isRefreshing}
              className="p-1 rounded hover:bg-white/10 text-indigo-400 hover:text-white transition-colors cursor-pointer"
              title="Sync IPO Data Now"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-xs text-white font-bold mt-1">4-Hour Cycle</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Last: {lastSyncTime || 'Active'}</span>
            <span className="text-emerald-400 font-bold">Auto-Sync</span>
          </div>
        </div>
      </div>

      {/* LAYER 2: FOUR ZONE CARDS (CLICKABLE FILTERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* NEW HIGH CARD */}
        <div
          onClick={() => setSelectedZone((prev) => (prev === 'NEW_HIGH' ? 'ALL' : 'NEW_HIGH'))}
          className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative overflow-hidden ${
            selectedZone === 'NEW_HIGH'
              ? 'bg-[#1e293b] border-[#3fb950] shadow-lg shadow-emerald-950/40 ring-1 ring-[#3fb950]'
              : 'bg-[#111827] border-[#334155] border-l-4 border-l-[#3fb950] hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-[#3fb950] flex items-center gap-1.5">
              <Flame className="w-4 h-4" /> NEW HIGH ZONE
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-black bg-emerald-500/20 text-[#3fb950] border border-emerald-500/30">
              {zoneStats.NEW_HIGH.count}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-sans">
            CMP &gt; ATH &bull; Fresh blue-sky momentum above listing peak
          </p>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Avg Dist to Base</span>
            <span className="text-[#3fb950] font-bold">+{zoneStats.NEW_HIGH.avgDist}%</span>
          </div>
        </div>

        {/* RECOVERY CARD */}
        <div
          onClick={() => setSelectedZone((prev) => (prev === 'RECOVERY' ? 'ALL' : 'RECOVERY'))}
          className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative overflow-hidden ${
            selectedZone === 'RECOVERY'
              ? 'bg-[#1e293b] border-[#58a6ff] shadow-lg shadow-blue-950/40 ring-1 ring-[#58a6ff]'
              : 'bg-[#111827] border-[#334155] border-l-4 border-l-[#58a6ff] hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-[#58a6ff] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> RECOVERY ZONE
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-black bg-blue-500/20 text-[#58a6ff] border border-blue-500/30">
              {zoneStats.RECOVERY.count}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-sans">
            Baseline &lt; CMP &le; ATH &bull; Reclaiming equilibrium toward peak
          </p>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Avg Dist to Base</span>
            <span className="text-[#58a6ff] font-bold">+{zoneStats.RECOVERY.avgDist}%</span>
          </div>
        </div>

        {/* UNDER PRESSURE CARD */}
        <div
          onClick={() => setSelectedZone((prev) => (prev === 'UNDER_PRESSURE' ? 'ALL' : 'UNDER_PRESSURE'))}
          className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative overflow-hidden ${
            selectedZone === 'UNDER_PRESSURE'
              ? 'bg-[#1e293b] border-[#d29922] shadow-lg shadow-amber-950/40 ring-1 ring-[#d29922]'
              : 'bg-[#111827] border-[#334155] border-l-4 border-l-[#d29922] hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-[#d29922] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> UNDER PRESSURE
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-black bg-amber-500/20 text-[#d29922] border border-amber-500/30">
              {zoneStats.UNDER_PRESSURE.count}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-sans">
            Issue Price &lt; CMP &le; Baseline &bull; Potential value or breakdown
          </p>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Avg Dist to Base</span>
            <span className="text-[#d29922] font-bold">{zoneStats.UNDER_PRESSURE.avgDist}%</span>
          </div>
        </div>

        {/* BROKEN IPO CARD */}
        <div
          onClick={() => setSelectedZone((prev) => (prev === 'BROKEN_IPO' ? 'ALL' : 'BROKEN_IPO'))}
          className={`p-4 rounded-xl border transition-all cursor-pointer select-none relative overflow-hidden ${
            selectedZone === 'BROKEN_IPO'
              ? 'bg-[#1e293b] border-[#f87171] shadow-lg shadow-red-950/40 ring-1 ring-[#f87171]'
              : 'bg-[#111827] border-[#334155] border-l-4 border-l-[#f87171] hover:bg-white/5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-[#f87171] flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" /> BROKEN IPO
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-black bg-red-500/20 text-[#f87171] border border-red-500/30">
              {zoneStats.BROKEN_IPO.count}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-sans">
            CMP &le; Issue Price &bull; Structural failure below offer valuation
          </p>
          <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Avg Dist to Base</span>
            <span className="text-[#f87171] font-bold">{zoneStats.BROKEN_IPO.avgDist}%</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="p-3.5 bg-[#111827] rounded-xl border border-[#334155] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search Symbol / Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0B1120] border border-[#334155] rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-[#58a6ff] w-48 sm:w-60"
            />
          </div>

          {/* STAGE SELECTOR (ALL / FRESH / MATURE) */}
          <div className="flex items-center bg-[#0B1120] border border-[#334155] rounded-lg p-0.5">
            {(['ALL', 'FRESH', 'MATURE'] as (IPOStage | 'ALL')[]).map((stage) => (
              <button
                key={stage}
                onClick={() => setSelectedStage(stage)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  selectedStage === stage ? 'bg-[#58a6ff] text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {stage === 'ALL' ? 'All Stages' : stage === 'FRESH' ? 'Fresh (1-120d)' : 'Mature (121-240d)'}
              </button>
            ))}
          </div>

          {/* SECTOR DROPDOWN */}
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="bg-[#0B1120] border border-[#334155] rounded-lg px-3 py-1.5 text-slate-300 font-bold focus:outline-none focus:border-[#58a6ff]"
          >
            <option value="ALL">All Sectors ({sectors.length})</option>
            {sectors.map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* ACTIVE FILTER BADGE & CLEAR */}
        <div className="flex items-center gap-2">
          {selectedZone !== 'ALL' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/10 text-white text-[11px]">
              Filtered: <b>{selectedZone}</b>
              <button onClick={() => setSelectedZone('ALL')} className="hover:text-red-400 ml-1">
                &times;
              </button>
            </span>
          )}
          <span className="text-slate-400 font-bold">
            Showing <span className="text-white font-extrabold">{filteredStocks.length}</span> of {ipoStocks.length}
          </span>
        </div>
      </div>

      {/* LAYER 3: MASTER IPO TABLE */}
      <div className="rounded-xl border border-[#334155] bg-[#111827] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0B1120] text-slate-400 uppercase text-[10px] tracking-wider border-b border-[#334155] select-none">
              <tr>
                <th
                  onClick={() => handleSort('symbol')}
                  className="p-3 font-bold hover:text-white cursor-pointer transition-colors"
                >
                  Symbol & Company {sortField === 'symbol' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('cmp')}
                  className="p-3 font-bold hover:text-white cursor-pointer transition-colors"
                >
                  CMP {sortField === 'cmp' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('issue_price')}
                  className="p-3 font-bold hover:text-white cursor-pointer transition-colors"
                >
                  Issue Price {sortField === 'issue_price' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('ipo_baseline')}
                  className="p-3 font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
                >
                  IPO Baseline {sortField === 'ipo_baseline' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('all_time_high')}
                  className="p-3 font-bold hover:text-white cursor-pointer transition-colors"
                >
                  ATH {sortField === 'all_time_high' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('zone')}
                  className="p-3 font-bold hover:text-white cursor-pointer transition-colors"
                >
                  Zone {sortField === 'zone' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('listing_stage')}
                  className="p-3 font-bold hover:text-white cursor-pointer transition-colors"
                >
                  Stage {sortField === 'listing_stage' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('return_from_issue_pct')}
                  className="p-3 font-bold hover:text-white cursor-pointer transition-colors"
                >
                  Return % {sortField === 'return_from_issue_pct' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('distance_to_baseline_pct')}
                  className="p-3 font-bold hover:text-white cursor-pointer transition-colors"
                >
                  Dist to Base % {sortField === 'distance_to_baseline_pct' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th
                  onClick={() => handleSort('days_since_listing')}
                  className="p-3 font-bold hover:text-white cursor-pointer transition-colors"
                >
                  Tenure {sortField === 'days_since_listing' && (sortOrder === 'asc' ? '▲' : '▼')}
                </th>
                <th className="p-3 font-bold">Sector</th>
                <th className="p-3 font-bold">Apollo / Layer</th>
                <th className="p-3 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Filter className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-bold text-slate-300">No IPO stocks match current filter criteria</p>
                      <button
                        onClick={() => {
                          setSelectedZone('ALL');
                          setSelectedStage('ALL');
                          setSelectedSector('ALL');
                          setSearchQuery('');
                        }}
                        className="px-3 py-1 bg-[#58a6ff]/20 text-[#58a6ff] rounded border border-[#58a6ff]/30 text-xs font-bold hover:bg-[#58a6ff]/30"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stk, idx) => {
                  const isPositive = stk.return_from_issue_pct >= 0;
                  const isAboveBase = stk.distance_to_baseline_pct >= 0;
                  const graduationProgress = Math.min(100, (stk.days_since_listing / 240) * 100);

                  return (
                    <tr
                      key={`${stk.symbol}-${idx}`}
                      onClick={() => handleRowClick(stk)}
                      className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      {/* SYMBOL & COMPANY */}
                      <td className="p-3">
                        <div className="font-bold text-white group-hover:text-[#58a6ff] transition-colors flex items-center gap-1.5">
                          <span>{stk.symbol}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px] font-sans">
                          {stk.company_name}
                        </div>
                      </td>

                      {/* CMP */}
                      <td className="p-3 font-bold text-white">₹{stk.cmp.toFixed(1)}</td>

                      {/* ISSUE PRICE */}
                      <td className="p-3 text-slate-400">₹{stk.issue_price.toFixed(1)}</td>

                      {/* BASELINE */}
                      <td className="p-3 font-bold text-indigo-300">₹{stk.ipo_baseline.toFixed(1)}</td>

                      {/* ATH */}
                      <td className="p-3 text-slate-300">₹{stk.all_time_high.toFixed(1)}</td>

                      {/* ZONE BADGE */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap ${getZoneBadgeColor(
                            stk.zone
                          )}`}
                        >
                          {stk.zone.replace('_', ' ')}
                        </span>
                      </td>

                      {/* STAGE BADGE */}
                      <td className="p-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            stk.listing_stage === 'FRESH'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {stk.listing_stage}
                        </span>
                      </td>

                      {/* RETURN FROM ISSUE % */}
                      <td className="p-3 font-bold">
                        <span className={isPositive ? 'text-[#3fb950]' : 'text-[#f87171]'}>
                          {isPositive ? '+' : ''}
                          {stk.return_from_issue_pct.toFixed(1)}%
                        </span>
                      </td>

                      {/* DISTANCE TO BASELINE % */}
                      <td className="p-3 font-bold">
                        <span className={isAboveBase ? 'text-[#58a6ff]' : 'text-amber-400'}>
                          {isAboveBase ? '+' : ''}
                          {stk.distance_to_baseline_pct.toFixed(1)}%
                        </span>
                      </td>

                      {/* TENURE & PROGRESS TO GRADUATION */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-bold">{stk.days_since_listing}d</span>
                          <div
                            className="w-12 h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5"
                            title={`Graduation progress: ${stk.days_since_listing}/240 days (${graduationProgress.toFixed(0)}%)`}
                          >
                            <div
                              style={{ width: `${graduationProgress}%` }}
                              className="h-full bg-indigo-500 rounded-full"
                            />
                          </div>
                        </div>
                      </td>

                      {/* SECTOR */}
                      <td className="p-3 text-slate-400 truncate max-w-[130px] font-sans text-[11px]">
                        {stk.sector}
                      </td>

                      {/* CROSS SYSTEM SCORES */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span
                            className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold"
                            title="Apollo Score / 148"
                          >
                            A: {stk.Apollo_Score ? `${stk.Apollo_Score.toFixed(0)}/148` : '92/148'}
                          </span>
                          <span
                            className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold"
                            title="LayerSignal Score / 100"
                          >
                            L: {stk.LayerSignal_Score ? `${stk.LayerSignal_Score.toFixed(0)}/100` : '78/100'}
                          </span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td className="p-3 text-center">
                        <button
                          onClick={(e) => handleGraduate(e, stk.symbol)}
                          title="Force Graduate to Main Universe"
                          className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-amber-300 transition-colors"
                        >
                          <Archive className="w-3.5 h-3.5" />
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
  );
};
