import React from 'react';
import { X, TrendingUp, TrendingDown, ShieldAlert, BarChart, ArrowUpRight, ArrowDownRight, Layers, Activity } from 'lucide-react';
import { SignalStock } from '../types';
import { SignalBadge } from './SignalBadge';
import { QualityBadge } from './QualityBadge';
import { RiskBadge } from './RiskBadge';
import { getQualityLevel, getRiskLevel, formatCurrencyINR, formatLargeNumber } from '../utils/calculations';

interface DetailPanelProps {
  stock: SignalStock | null;
  onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ stock, onClose }) => {
  if (!stock) return null;

  const quality = getQualityLevel(stock);
  const risk = getRiskLevel(stock);
  const isPositive = stock.Pct_Change >= 0;

  // 52W range calculation
  const low52 = stock.Low52W || stock.CMP * 0.7;
  const high52 = stock.High52W || stock.CMP * 1.3;
  const range52 = high52 - low52 || 1;
  const pos52Pct = Math.min(100, Math.max(0, ((stock.CMP - low52) / range52) * 100));

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] lg:w-[540px] bg-[#0B1120] border-l border-[#334155] shadow-2xl z-50 flex flex-col text-slate-200 overflow-hidden animate-in slide-in-from-right duration-300">
      {/* PANEL HEADER */}
      <div className="p-6 bg-[#111827] border-b border-[#334155] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-white tracking-tight">{stock.Symbol}</h2>
            <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
              NSE:EQUITY
            </span>
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
            <div className={`mt-1 text-xs font-mono font-bold flex items-center gap-1 ${isPositive ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
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
              <span className="text-xs text-slate-500 font-normal"> / 100</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Action: {stock.Apollo_Action}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#111827] border border-[#334155]">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Exit Pressure</span>
            <div className={`text-xl font-extrabold font-mono mt-1 ${stock.Exit_Pressure > 50 ? 'text-[#f85149]' : 'text-[#3fb950]'}`}>
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
              <span className="text-slate-400">RSI (14)</span>
              <span className={`font-bold ${stock.RSI > 70 ? 'text-[#f85149]' : stock.RSI < 30 ? 'text-[#3fb950]' : 'text-slate-200'}`}>
                {stock.RSI?.toFixed(1) || 'N/A'}
              </span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">P/E Ratio</span>
              <span className="font-bold text-slate-200">{stock.PE?.toFixed(1) || 'N/A'}</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">20D SMA</span>
              <span className="font-bold text-slate-200">{formatCurrencyINR(stock['20D_SMA'])}</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">50D SMA</span>
              <span className="font-bold text-slate-200">{formatCurrencyINR(stock['50D_SMA'])}</span>
            </div>

            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-slate-400">200D SMA</span>
              <span className="font-bold text-slate-200">{formatCurrencyINR(stock['200D_SMA'])}</span>
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

        {/* ALL 19 FIELDS RAW MAPPING */}
        <div className="p-4 rounded-xl bg-[#111827] border border-[#334155] space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Complete Field Telemetry
          </h4>

          <div className="divide-y divide-white/5 text-xs font-mono">
            {Object.entries(stock).map(([key, val]) => (
              <div key={key} className="py-1.5 flex justify-between items-center">
                <span className="text-slate-500">{key}</span>
                <span className="text-slate-300 font-semibold">{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
