import React from 'react';
import { Database, Server, Activity, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';
import { SystemHealthData } from '../../types';

interface SystemTabProps {
  health: SystemHealthData;
}

export const SystemTab: React.FC<SystemTabProps> = ({ health }) => {
  return (
    <div className="p-4 space-y-4 max-w-full overflow-hidden text-slate-200 font-sans">
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
              SYNCHRONIZED
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Database Footprint:</span>
              <span className="font-bold text-white">{health.dbSizeMB} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SQLite Tables Count:</span>
              <span className="font-bold text-indigo-300">{health.dbTables} Tables</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stale Data Tables:</span>
              <span className="font-bold text-[#3fb950]">{health.staleTables} Tables</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2 DETAIL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* API ENDPOINTS MONITOR */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 shadow-lg">
          <h4 className="font-extrabold text-white uppercase text-xs border-b border-white/10 pb-2 flex items-center justify-between">
            <span>REST API Endpoint Status (FastAPI Backend)</span>
            <span className="text-[10px] text-slate-400">Port 3000 Ingress</span>
          </h4>

          <div className="space-y-1.5">
            {health.apiEndpoints.map((ep) => (
              <div key={ep.path} className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5">
                <span className="font-bold text-white">{ep.path}</span>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-[#3fb950] font-bold">{ep.status} OK</span>
                  <span className="text-slate-400">({ep.latencyMs}ms)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SCORE DISTRIBUTION HISTOGRAM */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 shadow-lg flex flex-col justify-between">
          <h4 className="font-extrabold text-white uppercase text-xs border-b border-white/10 pb-2">
            Universe Composite Score Distribution Histogram
          </h4>

          {/* MOCK HISTOGRAM BARS */}
          <div className="h-32 bg-[#0B1120] rounded-lg border border-[#334155] p-3 flex items-end justify-between gap-1">
            {[10, 25, 45, 78, 95, 82, 54, 30, 15, 8].map((val, idx) => (
              <div key={idx} className="flex-1 bg-indigo-500 rounded-t-sm" style={{ height: `${val}%` }} />
            ))}
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 pt-1">
            <span>Mean Score: <strong className="text-white">45.2</strong></span>
            <span>Median: <strong className="text-white">42.0</strong></span>
            <span>Std Dev: <strong className="text-white">18.3</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
