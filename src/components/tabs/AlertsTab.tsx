import React, { useState } from 'react';
import { Bell, Filter, CheckCircle2, ShieldAlert, Zap, Layers } from 'lucide-react';
import { AlertItem } from '../../types';

interface AlertsTabProps {
  alerts: AlertItem[];
  onMarkAllRead: () => void;
  onSelectStockBySymbol: (symbol: string) => void;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({ alerts, onMarkAllRead, onSelectStockBySymbol }) => {
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Apollo' | 'LayerSignal' | 'System'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Entry' | 'Exit' | 'Regime' | 'Scoring' | 'System'>('All');

  const filteredAlerts = alerts.filter((a) => {
    if (sourceFilter !== 'All' && a.source !== sourceFilter) return false;
    if (typeFilter !== 'All' && a.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-full overflow-hidden text-slate-200 font-sans">
      {/* FILTER BAR */}
      <div className="p-3 bg-[#111827] border border-[#334155] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono text-xs shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          {/* SOURCE FILTER */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Source:</span>
            {(['All', 'Apollo', 'LayerSignal', 'System'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSourceFilter(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  sourceFilter === s
                    ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500'
                    : 'bg-black/30 text-slate-400 border-white/5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* TYPE FILTER */}
          <div className="flex items-center gap-1.5 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-3">
            <span className="text-slate-400 font-bold uppercase text-[10px]">Type:</span>
            {(['All', 'Entry', 'Exit', 'Regime', 'Scoring', 'System'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                  typeFilter === t
                    ? 'bg-[#58a6ff]/30 text-[#58a6ff] border-[#58a6ff]'
                    : 'bg-black/30 text-slate-400 border-white/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onMarkAllRead}
          className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-300 rounded cursor-pointer transition-colors shrink-0"
        >
          Mark All Read
        </button>
      </div>

      {/* CHRONOLOGICAL ALERT FEED */}
      <div className="bg-[#111827] border border-[#334155] rounded-xl overflow-hidden shadow-xl font-mono text-xs divide-y divide-white/5">
        <div className="p-3 bg-[#1E293B] border-b border-[#334155] font-bold text-white text-xs flex justify-between items-center">
          <span>Chronological Alert Feed ({filteredAlerts.length})</span>
          <span className="text-[10px] text-slate-400">Live Notification Center</span>
        </div>

        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No alerts match the selected criteria.</div>
        ) : (
          filteredAlerts.map((alt) => (
            <div
              key={alt.id}
              onClick={() => alt.symbol && onSelectStockBySymbol(alt.symbol)}
              className={`p-4 hover:bg-white/5 transition-colors cursor-pointer flex items-start gap-3 ${
                !alt.read ? 'bg-indigo-950/20 border-l-4 border-[#58a6ff]' : ''
              }`}
            >
              <span className="text-slate-500 text-[10px] font-bold shrink-0 mt-0.5">{alt.timestamp}</span>

              {/* SOURCE BADGE */}
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border shrink-0 ${
                  alt.source === 'Apollo'
                    ? 'bg-[#a371f7]/20 text-[#a371f7] border-[#a371f7]/40'
                    : alt.source === 'LayerSignal'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                }`}
              >
                [{alt.source}]
              </span>

              <div className="flex-1 space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>{alt.title}</span>
                  {alt.symbol && <span className="text-indigo-400 hover:underline">({alt.symbol})</span>}
                </div>
                <p className="text-slate-300 text-[11px]">{alt.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
