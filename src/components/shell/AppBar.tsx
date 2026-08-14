import React, { useState } from 'react';
import { Search, Bell, Settings, Zap, CheckCircle2, Sliders, X, Shield, Activity, RefreshCw } from 'lucide-react';
import { SignalStock } from '../../types';

interface AppBarProps {
  stocks: SignalStock[];
  unreadAlertsCount: number;
  onSelectStockFromSearch: (stock: SignalStock) => void;
  onOpenAlertsTab: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
}

export const AppBar: React.FC<AppBarProps> = ({
  stocks,
  unreadAlertsCount,
  onSelectStockFromSearch,
  onOpenAlertsTab,
  onRefreshData,
  isRefreshing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Search matches
  const searchResults = searchQuery.trim()
    ? stocks
        .filter(
          (s) =>
            s.Symbol.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            s.Apollo_Action.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
            s.LayerSignal_Action.toLowerCase().includes(searchQuery.toLowerCase().trim())
        )
        .slice(0, 6)
    : [];

  return (
    <>
      <header className="h-[46px] min-h-[46px] bg-[#0B1120] border-b border-[#334155] px-4 flex items-center justify-between z-50 text-slate-200 select-none">
        {/* LOGO & BRAND MARK */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-[#a371f7]/20 border border-[#a371f7]/50 flex items-center justify-center text-[#a371f7] shadow-[0_0_10px_rgba(163,113,247,0.25)]">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-white text-xs tracking-tight">Apollo + LayerSignal</span>
            <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2 rounded border border-indigo-500/30 uppercase tracking-wide">
              v1.0 UNIFIED
            </span>
          </div>
        </div>

        {/* GLOBAL SEARCH INPUT */}
        <div className="relative w-64 md:w-80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Global Search (Symbol, Action, Metric)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              className="w-full h-7 bg-[#111827] border border-[#334155] rounded px-8 py-1 text-[11px] font-mono text-white placeholder-slate-500 outline-none focus:border-[#58a6ff] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* SEARCH AUTOCOMPLETE DROPDOWN */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-8 left-0 w-full bg-[#111827] border border-[#334155] rounded-lg shadow-2xl z-50 overflow-hidden font-mono text-xs divide-y divide-white/5">
              {searchResults.map((stk, idx) => (
                <div
                  key={`${stk.Symbol}-${idx}`}
                  onClick={() => {
                    onSelectStockFromSearch(stk);
                    setSearchQuery('');
                  }}
                  className="p-2.5 hover:bg-white/10 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{stk.Symbol}</span>
                    <span className="text-[10px] text-slate-400">₹{stk.CMP || stk.Close}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                      Score: {stk.LayerSignal_Score?.toFixed(0)}
                    </span>
                    <span className="text-[#3fb950] font-bold">{stk.LayerSignal_Action}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT ACTION CONTROLS */}
        <div className="flex items-center gap-3">
          {/* REFRESH BUTTON */}
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Sync Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#58a6ff] ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* ALERT BELL WITH UNREAD BADGE */}
          <button
            onClick={onOpenAlertsTab}
            className="relative p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="System & Signal Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#f85149] rounded-full animate-pulse shadow-[0_0_8px_rgba(248,81,73,0.8)]" />
            )}
          </button>

          {/* ENGINE HEALTH INDICATORS */}
          <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 rounded bg-[#111827] border border-[#334155] text-[10px] font-mono">
            <span className="text-slate-400">Engines:</span>
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[#3fb950]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                Apollo
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-[#3fb950]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                LayerSignal
              </span>
            </div>
          </div>

          {/* SETTINGS GEAR */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Preferences & Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SETTINGS PREFERENCES MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#334155] w-full max-w-md rounded-xl p-5 shadow-2xl font-mono text-xs space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" /> Dashboard Preferences
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                <div>
                  <div className="font-bold text-white">Auto Refresh Feed</div>
                  <div className="text-[10px] text-slate-400">Sync with NSE SQLite every 30s</div>
                </div>
                <input type="checkbox" defaultChecked className="accent-indigo-500 cursor-pointer" />
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                <div>
                  <div className="font-bold text-white">RSI Color Lock (v21)</div>
                  <div className="text-[10px] text-slate-400">RSI21 (Green), RSI36 (Blue), RSI56 (Amber)</div>
                </div>
                <span className="text-[10px] text-[#3fb950] font-bold bg-[#3fb950]/10 px-2 py-0.5 rounded border border-[#3fb950]/20">
                  LOCKED
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-black/30 border border-white/5">
                <div>
                  <div className="font-bold text-white">Theme Background Tier</div>
                  <div className="text-[10px] text-slate-400">Deep Blue (#0B1120) Command Center</div>
                </div>
                <span className="text-[10px] text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  TIER 0
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold cursor-pointer transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
