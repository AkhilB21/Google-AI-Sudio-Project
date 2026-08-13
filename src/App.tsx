import React, { useState, useEffect } from 'react';
import { SignalStock, SignalsSummary, TabId, AlertItem, MarketIndex, TradeRecord, SystemHealthData } from './types';
import { AppBar } from './components/shell/AppBar';
import { TabBar } from './components/shell/TabBar';
import { MarketRegimeBanner } from './components/shell/MarketRegimeBanner';
import { TickerFooter } from './components/shell/TickerFooter';

import { ScreenerTab } from './components/tabs/ScreenerTab';
import { WatchlistTab } from './components/tabs/WatchlistTab';
import { ScannerTab } from './components/tabs/ScannerTab';
import { AnalyticsTab } from './components/tabs/AnalyticsTab';
import { GuidanceTab } from './components/tabs/GuidanceTab';
import { AlertsTab } from './components/tabs/AlertsTab';
import { SystemTab } from './components/tabs/SystemTab';

import { INITIAL_INDICES, INITIAL_ALERTS, INITIAL_TRADES, INITIAL_SYSTEM_HEALTH } from './data/mockData';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabId>('screener');

  // Core Data States
  const [stocks, setStocks] = useState<SignalStock[]>([]);
  const [summary, setSummary] = useState<SignalsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Selected Stock across Screener / Watchlist
  const [selectedStock, setSelectedStock] = useState<SignalStock | null>(null);

  // Secondary Data Feeds
  const [indices] = useState<MarketIndex[]>(INITIAL_INDICES);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [trades] = useState<TradeRecord[]>(INITIAL_TRADES);
  const [systemHealth] = useState<SystemHealthData>(INITIAL_SYSTEM_HEALTH);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  // Fetch Signals API from Backend
  const fetchSignals = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/signals');
      const json = await res.json();

      if (json && json.data) {
        // Enforce required defaults for missing fields
        const enriched: SignalStock[] = json.data.map((item: any, idx: number) => ({
          ...item,
          Bucket: item.Bucket || (idx % 4 === 0 ? 'L1' : idx % 4 === 1 ? 'L2' : idx % 4 === 2 ? 'L3' : 'L4'),
          LStage: item.LStage || `Stage-${(idx % 3) + 1}`,
          ELStatus: item.ELStatus || (idx % 2 === 0 ? 'EL2' : 'EL1'),
          Conviction: item.Conviction || parseFloat((0.75 + (idx % 25) * 0.01).toFixed(2)),
          Gates: item.Gates || [true, true, true, idx % 5 !== 0, true],
          Renko: item.Renko || (idx % 2 === 0 ? 'GREEN' : 'RED'),
          MCap: item.MCap || (idx % 3 === 0 ? 'Large' : idx % 3 === 1 ? 'Mid' : 'Small'),
          FQS: item.FQS || (idx % 4 === 0 ? 'A' : idx % 4 === 1 ? 'B' : 'C'),
          RSI21: item.RSI21 || item.RSI || 62.5,
          RSI36: item.RSI36 || Math.max(30, (item.RSI || 60) - 4),
          RSI56: item.RSI56 || Math.max(25, (item.RSI || 60) - 8),
          ADX: item.ADX || 28.4,
          ATR_Pct: item.ATR_Pct || 2.1,
          ThrowbackAlert: idx === 1 || idx === 3,
        }));

        setStocks(enriched);
        setSummary(json.summary);
        if (!selectedStock && enriched.length > 0) {
          setSelectedStock(enriched[0]);
        }
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

  const handleSelectStock = (stk: SignalStock) => {
    setSelectedStock(stk);
    setActiveTab('watchlist');
  };

  const handleSelectStockBySymbol = (symbol: string) => {
    const found = stocks.find((s) => s.Symbol === symbol);
    if (found) {
      setSelectedStock(found);
    }
    setActiveTab('watchlist');
  };

  const handleMarkAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  return (
    <div className="h-screen w-screen bg-[#0B1120] text-slate-200 font-sans flex flex-col overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* GLOBAL SHELL FRAME */}
      <AppBar
        stocks={stocks}
        unreadAlertsCount={unreadAlertsCount}
        onSelectStockFromSearch={handleSelectStock}
        onOpenAlertsTab={() => setActiveTab('alerts')}
        onRefreshData={fetchSignals}
        isRefreshing={isRefreshing}
      />

      <TabBar activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} unreadAlertsCount={unreadAlertsCount} />

      <MarketRegimeBanner />

      {/* CONTENT AREA (FILLS REMAINING VIEWPORT HEIGHT) */}
      <div className="flex-1 overflow-y-auto bg-[#0B1120]">
        {activeTab === 'screener' && (
          <ScreenerTab stocks={stocks} summary={summary} onSelectStock={handleSelectStock} />
        )}

        {activeTab === 'watchlist' && (
          <WatchlistTab
            stocks={stocks}
            selectedStock={selectedStock}
            onSelectStock={(stk) => setSelectedStock(stk)}
            trades={trades}
          />
        )}

        {activeTab === 'scanner' && <ScannerTab stocks={stocks} onSelectStock={handleSelectStock} />}

        {activeTab === 'analytics' && <AnalyticsTab trades={trades} stocks={stocks} />}

        {activeTab === 'guidance' && <GuidanceTab stocks={stocks} />}

        {activeTab === 'alerts' && (
          <AlertsTab
            alerts={alerts}
            onMarkAllRead={handleMarkAllAlertsRead}
            onSelectStockBySymbol={handleSelectStockBySymbol}
          />
        )}

        {activeTab === 'system' && <SystemTab health={systemHealth} />}
      </div>

      {/* TICKER FOOTER */}
      <TickerFooter indices={indices} />
    </div>
  );
}
