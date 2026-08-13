import React, { useState } from 'react';
import { Database, Server, Activity, CheckCircle2, ShieldAlert, Cpu, RefreshCw, Terminal, FileText, Trash2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SystemHealthData } from '../../types';

interface SystemTabProps {
  health: SystemHealthData;
  onRefreshData?: () => void;
}

export const SystemTab: React.FC<SystemTabProps> = ({ health = {
  apolloScanTime: 'Just now',
  apolloDuration: '142ms',
  apolloProcessed: 297,
  apolloStatus: 'HEALTHY',
  layerScanTime: 'Just now',
  layerDuration: '88ms',
  layerPatterns: 40,
  layerStatus: 'HEALTHY',
  dbSizeMB: 0.85,
  dbTables: 5,
  lastDbUpdate: new Date().toISOString(),
  staleTables: 0,
  apiEndpoints: [
    { path: '/api/signals', status: 200, latencyMs: 24 },
    { path: '/api/signals/sync', status: 200, latencyMs: 110 },
    { path: '/api/db/trades', status: 200, latencyMs: 12 },
    { path: '/api/db/alerts', status: 200, latencyMs: 15 },
  ]
}, onRefreshData }) => {
  const [logFilter, setLogFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [cacheClearedMsg, setCacheClearedMsg] = useState(false);

  const mockLogs = [
    { time: '14:32:01', level: 'INFO', msg: 'LayerSignal engine connected to Express server on port 3000' },
    { time: '14:32:02', level: 'INFO', msg: 'Loaded signal_export.py CSV dataset (297 records, 18 columns)' },
    { time: '14:32:05', level: 'INFO', msg: 'Enrichment pipeline computed RSI stacks and 5-Gate checks for 297 symbols' },
    { time: '14:32:10', level: 'WARN', msg: 'CMP delay detected for stock SUZLON (15s latency)' },
    { time: '14:32:15', level: 'INFO', msg: '60-second in-memory server cache refreshed successfully' },
    { time: '14:32:22', level: 'INFO', msg: 'Funnel bucket recalculation complete: L1(12), L2(28), L3(45), L4(212)' },
  ];

  const filteredLogs = mockLogs.filter((l) => logFilter === 'ALL' || l.level === logFilter);

  const handleClearCache = async () => {
    setIsClearingCache(true);
    if (onRefreshData) {
      await onRefreshData();
    }
    setTimeout(() => {
      setIsClearingCache(false);
      setCacheClearedMsg(true);
      setTimeout(() => setCacheClearedMsg(false), 3000);
    }, 500);
  };

  const scoreHistData = [
    { range: '0-10', count: 12 },
    { range: '10-20', count: 28 },
    { range: '20-30', count: 45 },
    { range: '30-40', count: 78 },
    { range: '40-50', count: 95 },
    { range: '50-60', count: 82 },
    { range: '60-70', count: 54 },
    { range: '70-80', count: 30 },
    { range: '80-90', count: 18 },
    { range: '90-100', count: 8 },
  ];

  return (
    <div className="p-4 space-y-4 max-w-full overflow-hidden text-slate-200 font-sans">
      {/* CLEAR CACHE & REFRESH HEADER ACTION */}
      <div className="p-3 bg-[#111827] border border-[#334155] rounded-xl flex items-center justify-between font-mono text-xs shadow-md">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-indigo-400" />
          <span className="font-extrabold text-white uppercase">Server Status &amp; Cache Control</span>
          <span className="text-[10px] text-[#3fb950] bg-[#3fb950]/20 px-2 py-0.5 rounded border border-[#3fb950]/30 font-bold">
            60s TTL Cache Active
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cacheClearedMsg && (
            <span className="text-[10px] text-emerald-400 font-bold animate-pulse">Cache Cleared!</span>
          )}
          <button
            onClick={handleClearCache}
            disabled={isClearingCache}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded font-bold text-white text-xs flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isClearingCache ? 'Clearing...' : 'Clear Server Cache'}
          </button>
        </div>
      </div>

      {/* 3 PRIMARY ENGINE STATUS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* APOLLO ENGINE STATUS */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="font-extrabold text-[#a371f7] text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#a371f7]" /> Apollo Backtest Engine
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
              {health.apolloStatus}
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Last Pipeline Scan:</span>
              <span className="font-bold text-white">{health.apolloScanTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Execution Duration:</span>
              <span className="font-bold text-indigo-300">{health.apolloDuration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stocks Processed:</span>
              <span className="font-bold text-white">{health.apolloProcessed} Universe</span>
            </div>
          </div>
        </div>

        {/* LAYERSIGNAL ENGINE STATUS */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="font-extrabold text-emerald-400 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> LayerSignal Scanner
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
              {health.layerStatus}
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Last Live Scan:</span>
              <span className="font-bold text-white">{health.layerScanTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Execution Duration:</span>
              <span className="font-bold text-emerald-400">{health.layerDuration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Patterns Detected:</span>
              <span className="font-bold text-white">{health.layerPatterns} Setups</span>
            </div>
          </div>
        </div>

        {/* DATA HEALTH & SQLITE STATUS */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h4 className="font-extrabold text-[#58a6ff] text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-[#58a6ff]" /> SQLite Data Layer
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3fb950]/20 text-[#3fb950] border border-[#3fb950]/30">
              CONNECTED
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">SQLite Path:</span>
              <span className="font-bold text-white text-[10px]">/data/apollo_layer.db</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Database Size:</span>
              <span className="font-bold text-indigo-300">{health.dbSizeMB} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Tables:</span>
              <span className="font-bold text-[#3fb950]">{health.dbTables} Tables</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSV FILE INSPECTOR & SCORE DISTRIBUTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* CSV FILE INSPECTOR */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 shadow-lg">
          <h4 className="font-extrabold text-white uppercase text-xs border-b border-white/10 pb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" /> Engine CSV File Inspector
          </h4>

          <div className="space-y-2 text-slate-300 text-xs">
            <div className="flex justify-between p-2 bg-black/30 rounded border border-white/5">
              <span className="text-slate-400">Source Script:</span>
              <span className="font-bold text-indigo-300">signal_export.py</span>
            </div>
            <div className="flex justify-between p-2 bg-black/30 rounded border border-white/5">
              <span className="text-slate-400">Total Stocks Loaded:</span>
              <span className="font-bold text-emerald-400">297 Records</span>
            </div>
            <div className="flex justify-between p-2 bg-black/30 rounded border border-white/5">
              <span className="text-slate-400">Parsed CSV Headers:</span>
              <span className="font-bold text-white text-[10px]">Symbol, CMP, RSI21, RSI36, RSI56, Action, Score...</span>
            </div>
          </div>
        </div>

        {/* RECHARTS SCORE DISTRIBUTION HISTOGRAM */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 shadow-lg flex flex-col justify-between">
          <h4 className="font-extrabold text-white uppercase text-xs border-b border-white/10 pb-2">
            Universe Composite Score Distribution
          </h4>

          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreHistData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="range" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: '#0B1120', borderColor: '#334155', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LIVE SYSTEM LOG VIEWER */}
      <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 font-mono text-xs shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h4 className="font-extrabold text-white uppercase text-xs flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" /> Live System Log Viewer
          </h4>

          <div className="flex items-center gap-1 text-[10px]">
            {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLogFilter(lvl)}
                className={`px-2 py-0.5 rounded font-bold cursor-pointer border ${
                  logFilter === lvl
                    ? 'bg-indigo-600 text-white border-indigo-400'
                    : 'bg-black/30 text-slate-400 border-white/5'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="h-44 bg-[#0B1120] rounded-lg border border-[#334155] p-3 overflow-y-auto space-y-1 text-[11px]">
          {filteredLogs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0">[{log.time}]</span>
              <span
                className={`font-bold shrink-0 ${
                  log.level === 'INFO'
                    ? 'text-[#58a6ff]'
                    : log.level === 'WARN'
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {log.level}:
              </span>
              <span className="text-slate-300">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
