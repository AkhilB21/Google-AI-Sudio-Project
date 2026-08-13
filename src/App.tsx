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
import { enrichStock, computeFunnelAndBuckets } from './utils/enrichment';

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
        // Deterministic, stock-specific enrichment
        const enriched: SignalStock[] = json.data.map((item: any, idx: number) => enrichStock(item, idx));
        const computedSummary = computeFunnelAndBuckets(enriched);

        setStocks(enriched);
        setSummary(computedSummary);
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
