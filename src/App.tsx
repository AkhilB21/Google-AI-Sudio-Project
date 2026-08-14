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

import { INITIAL_INDICES } from './data/mockData';
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

  // Secondary Feeds sourced directly from SQLite Database
  const [indices] = useState<MarketIndex[]>(INITIAL_INDICES);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthData | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  // 1. Fetch Signals API from Backend (Google Sheet / Local CSV Backup)
  const fetchSignals = async (forceSync = false) => {
    try {
      setIsRefreshing(true);
      const url = forceSync ? '/api/signals/sync' : '/api/signals';
      const method = forceSync ? 'POST' : 'GET';
      const res = await fetch(url, { method });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
        // Deduplicate records by Symbol
        const seenSymbols = new Set<string>();
        const uniqueData = json.data.filter((item: any) => {
          const sym = (item.Symbol || item.Ticker || '').toString().trim().toUpperCase();
          if (!sym || seenSymbols.has(sym)) return false;
          seenSymbols.add(sym);
          return true;
        });

        // Deterministic, stock-specific enrichment
        const enriched: SignalStock[] = uniqueData.map((item: any, idx: number) => enrichStock(item, idx));
        const computedSummary = computeFunnelAndBuckets(enriched);

        setStocks(enriched);
        setSummary(computedSummary);
        if (!selectedStock && enriched.length > 0) {
          setSelectedStock(enriched[0]);
        }
      }
    } catch (err) {
      console.warn('Backend signals fetch deferred:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 2. Load SQLite Database Records (Trades, Alerts, System Health)
  const loadDbRecords = async () => {
    try {
      const [tradesRes, alertsRes, healthRes] = await Promise.allSettled([
        fetch('/api/db/trades'),
        fetch('/api/db/alerts'),
        fetch('/api/system/health'),
      ]);

      if (tradesRes.status === 'fulfilled' && tradesRes.value.ok) {
        const tradesData = await tradesRes.value.json();
        if (Array.isArray(tradesData) && tradesData.length > 0) setTrades(tradesData);
      }

      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const alertsData = await alertsRes.value.json();
        if (Array.isArray(alertsData) && alertsData.length > 0) setAlerts(alertsData);
      }

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        const healthData = await healthRes.value.json();
        if (healthData && healthData.apolloStatus) setSystemHealth(healthData);
      }
    } catch (err) {
      console.warn('SQLite records sync deferred:', err);
    }
  };

  // 3. Connect to WebSocket Live Streaming Server
  useEffect(() => {
    fetchSignals();
    loadDbRecords();

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    let ws: WebSocket | null = null;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
        ws?.send(JSON.stringify({ type: 'PING' }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'LIVE_PULSE' || msg.type === 'CACHE_REFRESH') {
            loadDbRecords();
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        setWsConnected(false);
      };

      ws.onerror = () => {
        setWsConnected(false);
      };
    } catch (e) {
      console.warn('WebSocket connection not available:', e);
    }

    return () => {
      if (ws) ws.close();
    };
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

  const handleMarkAllAlertsRead = async () => {
    try {
      await fetch('/api/db/alerts/mark-read', { method: 'POST' });
      setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch (err) {
      console.error('Failed to mark alerts as read:', err);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#0B1120] text-slate-200 font-sans flex flex-col overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* GLOBAL SHELL FRAME */}
      <AppBar
        stocks={stocks}
        unreadAlertsCount={unreadAlertsCount}
        onSelectStockFromSearch={handleSelectStock}
        onOpenAlertsTab={() => setActiveTab('alerts')}
        onRefreshData={() => fetchSignals(true)}
        isRefreshing={isRefreshing}
      />

      <TabBar activeTab={activeTab} onTabChange={(t) => setActiveTab(t)} unreadAlertsCount={unreadAlertsCount} />

      <MarketRegimeBanner stocks={stocks} />

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

        {activeTab === 'system' && (
          <SystemTab health={systemHealth || undefined} stocks={stocks} onRefreshData={() => fetchSignals(true)} />
        )}
      </div>

      {/* TICKER FOOTER */}
      <TickerFooter indices={indices} />
    </div>
  );
}
