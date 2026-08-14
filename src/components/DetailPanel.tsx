import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  BarChart,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Activity,
  History,
  Target,
  Sparkles,
  Flame,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { SignalStock, IPOStock, ZoneTransition } from '../types';
import { SignalBadge } from './SignalBadge';
import { QualityBadge } from './QualityBadge';
import { RiskBadge } from './RiskBadge';
import { getQualityLevel, getRiskLevel, formatCurrencyINR, formatLargeNumber } from '../utils/calculations';

interface DetailPanelProps {
  stock: SignalStock | null;
  onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ stock, onClose }) => {
  const [ipoData, setIpoData] = useState<IPOStock | null>(null);
  const [zoneHistory, setZoneHistory] = useState<ZoneTransition[]>([]);
  const [isLoadingIpo, setIsLoadingIpo] = useState<boolean>(false);

  useEffect(() => {
    if (!stock) return;

    if (stock.ipoData) {
      setIpoData(stock.ipoData);
    }

    // Check backend for IPO data & zone history
    setIsLoadingIpo(true);
    fetch(`/api/ipo/stocks/${stock.Symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.error) {
          setIpoData(data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingIpo(false));

    fetch(`/api/ipo/zone-history/${stock.Symbol}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((hist) => {
        if (Array.isArray(hist)) setZoneHistory(hist);
      })
      .catch(() => {});
  }, [stock]);

  if (!stock) return null;

  const quality = getQualityLevel(stock);
  const risk = getRiskLevel(stock);
  const isPositive = stock.Pct_Change >= 0;

  // 52W range calculation
  const low52 = stock.Low52W || stock.CMP * 0.7;
  const high52 = stock.High52W || stock.CMP * 1.3;
  const range52 = high52 - low52 || 1;
  const pos52Pct = Math.min(100, Math.max(0, ((stock.CMP - low52) / range52) * 100));

  // IPO Zone Thermometer positioning
  const ipoThermometer = (() => {
    if (!ipoData) return null;
    const ip = ipoData.issue_price;
    const ath = ipoData.all_time_high;
    const baseline = ipoData.ipo_baseline;
    const cmp = ipoData.cmp;

    const minScale = Math.min(ip * 0.8, cmp * 0.95);
    const maxScale = Math.max(ath * 1.1, cmp * 1.05);
    const totalSpan = maxScale - minScale || 1;

    const ipPct = Math.max(0, Math.min(100, ((ip - minScale) / totalSpan) * 100));
    const basePct = Math.max(0, Math.min(100, ((baseline - minScale) / totalSpan) * 100));
    const athPct = Math.max(0, Math.min(100, ((ath - minScale) / totalSpan) * 100));
    const cmpPct = Math.max(0, Math.min(100, ((cmp - minScale) / totalSpan) * 100));

    return { ipPct, basePct, athPct, cmpPct, minScale, maxScale };
  })();

  const getZoneColor = (z: string) => {
    switch (z) {
      case 'NEW_HIGH':
        return 'text-[#3fb950] bg-emerald-500/20 border-[#3fb950]/40';
      case 'RECOVERY':
        return 'text-[#58a6ff] bg-blue-500/20 border-[#58a6ff]/40';
      case 'UNDER_PRESSURE':
        return 'text-[#d29922] bg-amber-500/20 border-[#d29922]/40';
      case 'BROKEN_IPO':
        return 'text-[#f87171] bg-red-500/20 border-[#f87171]/40';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[560px] bg-[#0B1120] border-l border-[#334155] shadow-2xl z-50 flex flex-col text-slate-200 overflow-hidden animate-in slide-in-from-right duration-300">
      {/* PANEL HEADER */}
      <div className="p-6 bg-[#111827] border-b border-[#334155] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-tight">{stock.Symbol}</h2>
            {ipoData ? (
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> IPO Stock ({ipoData.listing_stage})
              </span>
            ) : (
              <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                NSE:EQUITY
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Engine Signal Date: <span className="text-slate-200">{stock.Date}</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* PANEL CONTENT - SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* IPO LIFECYCLE & ZONE POSITION THERMOMETER (RENDERED IF STOCK IS AN IPO) */}
        {ipoData && (
          <div className="p-4 rounded-xl bg-[#111827] border-2 border-indigo-500/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Target className="w-4 h-4 text-indigo-400" /> IPO Zone Position & Lifecycle
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-extrabold border font-mono ${getZoneColor(ipoData.zone)}`}>
                {ipoData.zone.replace('_', ' ')}
              </span>
            </div>

            {/* ZONE THERMOMETER */}
            {ipoThermometer && (
              <div className="space-y-2 pt-1">
                <div className="relative pt-6 pb-4">
                  {/* Gauge Track */}
                  <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden flex border border-white/10">
                    <div style={{ width: `${ipoThermometer.ipPct}%` }} className="h-full bg-red-500/40" title="Broken IPO Zone" />
                    <div
                      style={{ width: `${Math.max(0, ipoThermometer.basePct - ipoThermometer.ipPct)}%` }}
                      className="h-full bg-amber-500/40"
                      title="Under Pressure Zone"
                    />
                    <div
                      style={{ width: `${Math.max(0, ipoThermometer.athPct - ipoThermometer.basePct)}%` }}
                      className="h-full bg-blue-500/40"
                      title="Recovery Zone"
                    />
                    <div
                      style={{ width: `${Math.max(0, 100 - ipoThermometer.athPct)}%` }}
                      className="h-full bg-emerald-500/40"
                      title="New High Zone"
                    />
                  </div>

                  {/* CMP Indicator Pointer */}
                  <div
                    className="absolute top-2.5 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                    style={{ left: `${ipoThermometer.cmpPct}%` }}
                  >
                    <div className="w-4 h-4 rounded-full bg-white border-2 border-indigo-500 shadow-lg shadow-indigo-500/50 flex items-center justify-center animate-pulse" />
                    <span className="text-[10px] font-black font-mono text-white bg-indigo-600 px-1 rounded shadow mt-0.5">
                      ₹{ipoData.cmp.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Thermometer Reference Labels */}
                <div className="grid grid-cols-3 text-[10px] font-mono pt-1 text-center border-t border-white/5">
                  <div className="text-left text-slate-400">
                    <span className="text-red-400 font-bold block">Issue Price</span>
                    <span>₹{ipoData.issue_price.toFixed(1)}</span>
                  </div>
                  <div className="text-center text-indigo-300">
                    <span className="text-indigo-400 font-bold block">IPO Baseline</span>
                    <span>₹{ipoData.ipo_baseline.toFixed(1)}</span>
                  </div>
                  <div className="text-right text-slate-400">
                    <span className="text-emerald-400 font-bold block">All-Time High</span>
                    <span>₹{ipoData.all_time_high.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6 COMPACT IPO METRICS */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[#0B1120] rounded-lg border border-[#334155]">
                <span className="text-[9px] text-slate-400 block">Dist to Base</span>
                <span className={`text-xs font-bold ${ipoData.distance_to_baseline_pct >= 0 ? 'text-[#58a6ff]' : 'text-amber-400'}`}>
                  {ipoData.distance_to_baseline_pct >= 0 ? '+' : ''}
                  {ipoData.distance_to_baseline_pct}%
                </span>
              </div>

              <div className="p-2.5 bg-[#0B1120] rounded-lg border border-[#334155]">
                <span className="text-[9px] text-slate-400 block">Dist to ATH</span>
                <span className="text-xs font-bold text-slate-300">{ipoData.distance_to_ath_pct}%</span>
              </div>

              <div className="p-2.5 bg-[#0B1120] rounded-lg border border-[#334155]">
                <span className="text-[9px] text-slate-400 block">Return vs Offer</span>
                <span className={`text-xs font-bold ${ipoData.return_from_issue_pct >= 0 ? 'text-[#3fb950]' : 'text-[#f87171]'}`}>
                  {ipoData.return_from_issue_pct >= 0 ? '+' : ''}
                  {ipoData.return_from_issue_pct}%
                </span>
              </div>

              <div className="p-2.5 bg-[#0B1120] rounded-lg border border-[#334155]">
                <span className="text-[9px] text-slate-400 block">Listing Age</span>
                <span className="text-xs font-bold text-white">{ipoData.days_since_listing} Days</span>
              </div>

              <div className="p-2.5 bg-[#0B1120] rounded-lg border border-[#334155]">
                <span className="text-[9px] text-slate-400 block">Baseline Ratio</span>
                <span className="text-xs font-bold text-indigo-300">{ipoData.baseline_ratio}x</span>
              </div>

              <div className="p-2.5 bg-[#0B1120] rounded-lg border border-[#334155]">
                <span className="text-[9px] text-slate-400 block">ATH Recovery</span>
                <span className="text-xs font-bold text-emerald-400">{ipoData.ath_recovery_pct}%</span>
              </div>
            </div>

            {/* HISTORICAL ZONE TRANSITION TIMELINE */}
            {zoneHistory.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <History className="w-3 h-3 text-slate-400" /> Zone Transition Timeline
                </span>
                <div className="space-y-1.5">
                  {zoneHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-2 bg-[#0B1120] rounded border border-white/5 flex items-center justify-between text-[11px] font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            item.transition_type === 'UPGRADE'
                              ? 'bg-emerald-500/20 text-[#3fb950]'
                              : 'bg-red-500/20 text-[#f87171]'
                          }`}
                        >
                          {item.transition_type}
                        </span>
                        <span className="text-slate-400">{item.old_zone}</span>
                        <span className="text-slate-600">&rarr;</span>
                        <span className="text-white font-bold">{item.new_zone}</span>
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        ₹{item.cmp_at_transition?.toFixed(0)} &bull; {item.transition_timestamp?.split('T')[0] || item.transition_timestamp?.split(' ')[0]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SIGNAL ACTION SUMMARY ROW */}
        <div className="p-4 rounded-xl bg-[#111827] border border-[#334155] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">LayerSignal Action</span>
            <div>
              <SignalBadge action={stock.LayerSignal_Action} />
            </div>
          </div>

          <div className="space-y-1 text-center">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Quality Score</span>
            <div>
              <QualityBadge quality={quality} />
            </div>
          </div>

          <div className="space-y-1 text-right">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Risk Profile</span>
            <div>
              <RiskBadge risk={risk} />
            </div>
          </div>
        </div>

        {/* 4 TOP METRIC CARDS */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-[#111827] border border-[#334155]">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Current Market Price</span>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {formatCurrencyINR(stock.CMP || stock.Close)}
            </div>
            <div
              className={`mt-1 text-xs font-mono font-bold flex items-center gap-1 ${
                isPositive ? 'text-[#3fb950]' : 'text-[#f85149]'
              }`}
            >
              {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {stock.Pct_Change >= 0 ? `+${stock.Pct_Change.toFixed(2)}%` : `${stock.Pct_Change.toFixed(2)}%`}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-[#334155]">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">LayerSignal Score</span>
            <div className="text-xl font-extrabold text-indigo-400 font-mono mt-1">
              {stock.LayerSignal_Score?.toFixed(1) || '0.0'}
              <span className="text-xs text-slate-500 font-normal"> / 100</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Momentum Signal</p>
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-[#334155]">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Apollo Score</span>
            <div className="text-xl font-extrabold text-[#a371f7] font-mono mt-1">
              {stock.Apollo_Score?.toFixed(1) || '0.0'}
              <span className="text-xs text-slate-500 font-normal"> / 148</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Action: {stock.Apollo_Action}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-[#334155]">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Exit Pressure</span>
            <div
              className={`text-xl font-extrabold font-mono mt-1 ${
                stock.Exit_Pressure > 50 ? 'text-[#f85149]' : 'text-[#3fb950]'
              }`}
            >
              {stock.Exit_Pressure?.toFixed(1) || '0.0'}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Profit-Taking Risk</p>
          </div>
        </div>

        {/* 52-WEEK RANGE VISUALIZER */}
        <div className="p-4 rounded-xl bg-[#111827] border border-[#334155] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase text-[10px]">52-Week Range Position</span>
            <span className="text-indigo-400 font-bold text-[11px]">
              Proximity to High: {stock['52W_Prox']?.toFixed(1) || '0.0'}%
            </span>
          </div>

          <div className="relative pt-2 pb-1">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full"
                style={{ width: '100%' }}
              />
            </div>
            <div
              className="absolute top-1 -translate-x-1/2 w-3 h-4 bg-white border-2 border-indigo-600 rounded-sm shadow-md"
              style={{ left: `${pos52Pct}%` }}
              title={`CMP: ${stock.CMP}`}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
            <span>Low: {formatCurrencyINR(low52)}</span>
            <span className="text-white font-bold">CMP: {formatCurrencyINR(stock.CMP || stock.Close)}</span>
            <span>High: {formatCurrencyINR(high52)}</span>
          </div>
        </div>

        {/* TECHNICAL INDICATORS GRID */}
        <div className="p-4 rounded-xl bg-[#111827] border border-[#334155] space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-[#58a6ff]" /> Technical Indicators
          </h4>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs font-mono">
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">RSI (21)</span>
              <span
                className={`font-bold ${
                  (stock.RSI21 ?? 50) > 70
                    ? 'text-[#f85149]'
                    : (stock.RSI21 ?? 50) < 30
                    ? 'text-[#3fb950]'
                    : 'text-slate-200'
                }`}
              >
                {stock.RSI21?.toFixed(1) || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">P/E Ratio</span>
              <span className="font-bold text-slate-200">{stock.PE?.toFixed(1) || 'N/A'}</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">ADX Trend Strength</span>
              <span className="font-bold text-indigo-300">{stock.ADX?.toFixed(1) || 'N/A'}</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">ATR Volatility %</span>
              <span className="font-bold text-slate-200">{stock.ATR_Pct?.toFixed(1) || 'N/A'}%</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">Stochastic Index</span>
              <span className="font-bold text-slate-200">{stock.Stochastic?.toFixed(1) || 'N/A'}</span>
            </div>

            <div className="flex justify-between col-span-2 pt-1">
              <span className="text-slate-400">Traded Value (Turnover)</span>
              <span className="font-bold text-indigo-300">{formatLargeNumber(stock.Traded_Value)}</span>
            </div>
          </div>
        </div>

        {/* OHLC DATA GRID */}
        <div className="p-4 rounded-xl bg-[#111827] border border-[#334155] space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <BarChart className="w-3.5 h-3.5 text-[#58a6ff]" /> OHLC & Volume Summary
          </h4>

          <div className="grid grid-cols-4 gap-2 font-mono text-center">
            <div className="p-2 bg-black/30 rounded border border-white/5">
              <span className="text-[9px] text-slate-500 block">OPEN</span>
              <span className="text-xs font-bold text-slate-200">{stock.Open}</span>
            </div>
            <div className="p-2 bg-black/30 rounded border border-white/5">
              <span className="text-[9px] text-slate-500 block">HIGH</span>
              <span className="text-xs font-bold text-[#3fb950]">{stock.High}</span>
            </div>
            <div className="p-2 bg-black/30 rounded border border-white/5">
              <span className="text-[9px] text-slate-500 block">LOW</span>
              <span className="text-xs font-bold text-[#f85149]">{stock.Low}</span>
            </div>
            <div className="p-2 bg-black/30 rounded border border-white/5">
              <span className="text-[9px] text-slate-500 block">CLOSE</span>
              <span className="text-xs font-bold text-slate-200">{stock.Close}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-white/5 text-slate-400">
            <span>Volume (Shares)</span>
            <span className="text-white font-bold">{stock.Volume?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

