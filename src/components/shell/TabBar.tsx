import React from 'react';
import { TabId } from '../../types';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  unreadAlertsCount: number;
}

interface TabDef {
  id: TabId;
  label: string;
  priority: 'P0' | 'P1' | 'P2';
}

const TABS: TabDef[] = [
  { id: 'screener', label: 'Screener', priority: 'P0' },
  { id: 'watchlist', label: 'Watchlist', priority: 'P0' },
  { id: 'scanner', label: 'Scanner', priority: 'P1' },
  { id: 'analytics', label: 'Analytics', priority: 'P0' },
  { id: 'guidance', label: 'Guidance', priority: 'P1' },
  { id: 'alerts', label: 'Alerts', priority: 'P0' },
  { id: 'system', label: 'System', priority: 'P2' },
];

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange, unreadAlertsCount }) => {
  return (
    <nav className="h-[36px] min-h-[36px] bg-[#0B1120] border-b border-[#334155] px-4 flex items-center justify-between z-40 select-none overflow-x-auto">
      <div className="flex items-center gap-1 font-mono text-xs">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isP0 = tab.priority === 'P0';

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`h-[35px] px-3.5 flex items-center gap-1.5 font-extrabold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-[#58a6ff] text-white bg-white/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.id === 'alerts' && unreadAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[9px] bg-[#f85149] text-white font-bold rounded-full">
                  {unreadAlertsCount}
                </span>
              )}
              <span
                className={`text-[8px] px-1 rounded border font-mono ${
                  isP0
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : tab.priority === 'P1'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-slate-700/20 text-slate-400 border-slate-600/30'
                }`}
              >
                {tab.priority}
              </span>
            </button>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-slate-500">
        <span>Task-Based Workflow</span>
        <span>&bull;</span>
        <span>Unified Apollo + LayerSignal Engine</span>
      </div>
    </nav>
  );
};
