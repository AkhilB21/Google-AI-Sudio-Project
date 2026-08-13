/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Layers,
  Database,
  ShieldCheck,
  BarChart3,
  Cpu,
  Activity,
  Terminal,
  Play,
  Pause,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Server,
  HardDrive,
  LogOut,
  ChevronRight,
  Sliders,
  Download,
  Key,
  Wifi
} from 'lucide-react';

// Log interface
interface ActivityLog {
  id: string;
  type: 'SQLITE_QUERY' | 'AUTH_SUCCESS' | 'ENGINE_WARN' | 'SYS_HEALTH' | 'API_GATEWAY';
  timestamp: string;
  message: string;
}

// Session interface
interface ActiveSession {
  id: string;
  user: string;
  role: string;
  ip: string;
  status: 'active' | 'idle' | 'expired';
  lastSeen: string;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sqlite' | 'auth' | 'performance'>('dashboard');

  // Live System State
  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(true);
  const [loadMultiplier, setLoadMultiplier] = useState<number>(1);
  const [uptimeSeconds, setUptimeSeconds] = useState<number>(1217471); // ~14 days
  const [recentQueriesCount, setRecentQueriesCount] = useState<number>(1429);
  const [avgLatencyMs, setAvgLatencyMs] = useState<number>(24);
  const [dbThroughput, setDbThroughput] = useState<number>(82);
  const [activeThreads, setActiveThreads] = useState<number>(18);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('Last 60 mins');

  // SQLite Explorer State
  const [selectedTable, setSelectedTable] = useState<string>('sessions');
  const [customSql, setCustomSql] = useState<string>('SELECT * FROM sessions WHERE user_id = ?;');
  const [queryResult, setQueryResult] = useState<{ headers: string[]; rows: (string | number)[][] } | null>({
    headers: ['id', 'user_id', 'auth_token', 'ip_address', 'status', 'created_at'],
    rows: [
      ['sess_98a1', 'usr_dev01', 'tk_live_99218', '192.168.1.104', 'ACTIVE', '2026-08-12 22:15:00'],
      ['sess_98a2', 'usr_admin', 'tk_live_10283', '127.0.0.1', 'ACTIVE', '2026-08-12 22:28:11'],
      ['sess_98a3', 'usr_guest', 'tk_live_88319', '10.0.4.12', 'EXPIRED', '2026-08-12 20:04:45'],
      ['sess_98a4', 'usr_api_bot', 'tk_live_40192', '172.16.0.4', 'ACTIVE', '2026-08-12 22:30:02']
    ]
  });
  const [queryExecutionTime, setQueryExecutionTime] = useState<number>(1.2);

  // Activity Logs
  const [logs, setLogs] = useState<ActivityLog[]>([
    { id: '1', type: 'SQLITE_QUERY', timestamp: '14:42:01', message: 'SELECT * FROM sessions WHERE user_id = ?' },
    { id: '2', type: 'AUTH_SUCCESS', timestamp: '14:41:55', message: 'Token refreshed for dev_admin' },
    { id: '3', type: 'ENGINE_WARN', timestamp: '14:40:22', message: 'High concurrency detected on thread #4' },
    { id: '4', type: 'SQLITE_QUERY', timestamp: '14:39:48', message: "UPDATE system_stats SET value = 'OK'" },
    { id: '5', type: 'SYS_HEALTH', timestamp: '14:38:12', message: 'Garbage collection completed in 4.2ms' },
    { id: '6', type: 'API_GATEWAY', timestamp: '14:37:05', message: 'POST /api/v1/telemetry 200 OK - 18ms' }
  ]);

  // Auth Sessions
  const [sessions, setSessions] = useState<ActiveSession[]>([
    { id: 's1', user: 'dev_admin', role: 'Super Admin', ip: '127.0.0.1', status: 'active', lastSeen: 'Just now' },
    { id: 's2', user: 'system_service', role: 'Service Account', ip: '10.0.2.15', status: 'active', lastSeen: '12s ago' },
    { id: 's3', user: 'analyst_01', role: 'Read-Only', ip: '192.168.1.45', status: 'idle', lastSeen: '4m ago' },
    { id: 's4', user: 'ci_cd_runner', role: 'Automation', ip: '172.17.0.2', status: 'expired', lastSeen: '1h ago' }
  ]);

  // Live Performance Point Generation
  const [perfData, setPerfData] = useState<number[]>([150, 140, 160, 130, 145, 100, 110, 90, 105, 80, 85, 60, 70, 40, 55, 30, 45]);

  // Dynamic simulation tick
  useEffect(() => {
    if (!isEngineRunning) return;

    const interval = setInterval(() => {
      // Tick uptime
      setUptimeSeconds((prev) => prev + 1);

      // Fluctuating real-time stats
      const reqDelta = Math.floor((Math.random() - 0.48) * 40 * loadMultiplier);
      setRecentQueriesCount((prev) => Math.max(1000, Math.min(3000, prev + reqDelta)));

      const latDelta = Math.floor((Math.random() - 0.5) * 3 * loadMultiplier);
      setAvgLatencyMs((prev) => Math.max(12, Math.min(80, prev + latDelta)));

      const dbDelta = Math.floor((Math.random() - 0.49) * 4 * loadMultiplier);
      setDbThroughput((prev) => Math.max(40, Math.min(180, prev + dbDelta)));

      // Shift performance chart
      setPerfData((prev) => {
        const nextVal = Math.max(20, Math.min(180, prev[prev.length - 1] + (Math.random() - 0.5) * 25 * loadMultiplier));
        return [...prev.slice(1), nextVal];
      });

      // Randomly inject new log event (25% chance per tick)
      if (Math.random() < 0.35) {
        const logTypes: ActivityLog['type'][] = ['SQLITE_QUERY', 'AUTH_SUCCESS', 'ENGINE_WARN', 'SYS_HEALTH', 'API_GATEWAY'];
        const chosenType = logTypes[Math.floor(Math.random() * logTypes.length)];
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const messages: Record<ActivityLog['type'], string[]> = {
          SQLITE_QUERY: [
            'SELECT * FROM sessions WHERE user_id = ?',
            "UPDATE system_stats SET value = 'OK'",
            'INSERT INTO audit_events (action, ts) VALUES (...)',
            'BEGIN TRANSACTION READ ONLY'
          ],
          AUTH_SUCCESS: [
            'Token refreshed for dev_admin',
            'OAuth handshake validated via TLS 1.3',
            'Session session_98a2 heart-beat acknowledged'
          ],
          ENGINE_WARN: [
            'High concurrency detected on thread #4',
            'Memory threshold 75% reached in worker pool',
            'I/O queue latency spiked to 32ms briefly'
          ],
          SYS_HEALTH: [
            'Garbage collection completed in 3.8ms',
            'SQLite WAL file truncated (0 pages remaining)',
            'Worker pool threads balanced successfully'
          ],
          API_GATEWAY: [
            'GET /api/v1/metrics 200 OK - 12ms',
            'POST /api/v1/query 200 OK - 8ms',
            'GET /healthz 200 OK - 2ms'
          ]
        };

        const randomMsg = messages[chosenType][Math.floor(Math.random() * messages[chosenType].length)];

        setLogs((prev) => [
          {
            id: String(Date.now()),
            type: chosenType,
            timestamp: timeStr,
            message: randomMsg
          },
          ...prev.slice(0, 19)
        ]);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isEngineRunning, loadMultiplier]);

  // Format uptime
  const formattedUptime = useMemo(() => {
    const d = Math.floor(uptimeSeconds / (3600 * 24));
    const h = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const m = Math.floor((uptimeSeconds % 3600) / 60);
    const s = uptimeSeconds % 60;
    return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
  }, [uptimeSeconds]);

  // SVG path calculation for performance chart
  const pathD = useMemo(() => {
    const stepX = 800 / (perfData.length - 1);
    return perfData.map((val, idx) => `${idx === 0 ? 'M' : 'L'}${idx * stepX},${val}`).join(' ');
  }, [perfData]);

  const fillD = useMemo(() => {
    return `${pathD} L800,200 L0,200 Z`;
  }, [pathD]);

  // Handle SQL execution
  const executeCustomSql = () => {
    const startTime = performance.now();
    setTimeout(() => {
      setQueryExecutionTime(Number((performance.now() - startTime + Math.random() * 2).toFixed(2)));
      if (customSql.toLowerCase().includes('sessions')) {
        setQueryResult({
          headers: ['id', 'user_id', 'auth_token', 'ip_address', 'status', 'created_at'],
          rows: [
            ['sess_98a1', 'usr_dev01', 'tk_live_99218', '192.168.1.104', 'ACTIVE', '2026-08-12 22:15:00'],
            ['sess_98a2', 'usr_admin', 'tk_live_10283', '127.0.0.1', 'ACTIVE', '2026-08-12 22:28:11'],
            ['sess_98a3', 'usr_guest', 'tk_live_88319', '10.0.4.12', 'EXPIRED', '2026-08-12 20:04:45']
          ]
        });
      } else if (customSql.toLowerCase().includes('audit')) {
        setQueryResult({
          headers: ['event_id', 'action', 'severity', 'timestamp'],
          rows: [
            ['evt_101', 'USER_LOGIN', 'INFO', '2026-08-12 22:31:01'],
            ['evt_102', 'DB_BACKUP_SNAPSHOT', 'SUCCESS', '2026-08-12 22:00:00'],
            ['evt_103', 'CONFIG_RELOAD', 'NOTICE', '2026-08-12 21:15:30']
          ]
        });
      } else {
        setQueryResult({
          headers: ['metric_key', 'metric_value', 'updated_at'],
          rows: [
            ['engine_status', 'RUNNING', '2026-08-12 22:32:00'],
            ['active_threads', String(activeThreads), '2026-08-12 22:32:00'],
            ['avg_latency_ms', `${avgLatencyMs}ms`, '2026-08-12 22:32:00']
          ]
        });
      }
    }, 150);
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!searchFilter.trim()) return logs;
    const term = searchFilter.toLowerCase();
    return logs.filter(
      (l) => l.type.toLowerCase().includes(term) || l.message.toLowerCase().includes(term) || l.timestamp.includes(term)
    );
  }, [logs, searchFilter]);

  return (
    <div className="flex h-screen w-screen bg-[#050506] text-slate-300 font-sans overflow-hidden select-none">
      {/* ASIDE SIDEBAR */}
      <aside className="w-64 border-r border-white/5 flex flex-col bg-[#0a0a0c]">
        {/* LOGO */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-glow-indigo">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight text-base">PY_ENGINE v1.0</span>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-4">
            Core Systems
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all text-left ${
              activeTab === 'dashboard'
                ? 'bg-white/5 text-white border-l-2 border-indigo-500 shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('sqlite')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all text-left ${
              activeTab === 'sqlite'
                ? 'bg-white/5 text-white border-l-2 border-indigo-500 shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 text-indigo-400" />
            SQLite Explorer
          </button>

          <button
            onClick={() => setActiveTab('auth')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all text-left ${
              activeTab === 'auth'
                ? 'bg-white/5 text-white border-l-2 border-indigo-500 shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Auth Logs
          </button>

          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-4 mt-4">
            Analytics
          </div>

          <button
            onClick={() => setActiveTab('performance')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all text-left ${
              activeTab === 'performance'
                ? 'bg-white/5 text-white border-l-2 border-indigo-500 shadow-sm'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Performance
          </button>
        </nav>

        {/* PROFILE / FOOTER CONTROL */}
        <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-glow-indigo">
              DA
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">dev_admin</p>
              <p className="text-[10px] text-slate-500 truncate font-mono">auth.active.session</p>
            </div>
          </div>
          <button
            onClick={() => setIsEngineRunning(!isEngineRunning)}
            className={`w-full py-2 text-[11px] font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 ${
              isEngineRunning
                ? 'bg-white/5 hover:bg-white/10 text-slate-300'
                : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-600/50'
            }`}
          >
            {isEngineRunning ? (
              <>
                <Pause className="w-3 h-3 text-amber-400" /> Pause Engine
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-emerald-400" /> Resume Engine
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER BAR */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0c]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-medium text-white tracking-tight capitalize">
              {activeTab === 'dashboard' && 'System Overview'}
              {activeTab === 'sqlite' && 'SQLite Database Explorer'}
              {activeTab === 'auth' && 'Authentication & Access Logs'}
              {activeTab === 'performance' && 'Performance Analytics'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full border border-white/5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isEngineRunning ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              <span className={`text-xs font-mono font-semibold ${isEngineRunning ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isEngineRunning ? 'ENGINE_READY' : 'ENGINE_PAUSED'}
              </span>
            </div>

            <div className="h-4 w-[1px] bg-white/10"></div>

            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              SQLITE: <span className="text-white font-semibold">1.2GB</span>
            </div>

            {/* Quick Simulate Traffic Trigger */}
            <button
              onClick={() => {
                setLoadMultiplier((prev) => (prev >= 3 ? 1 : prev + 1));
              }}
              title="Toggle Traffic Simulation Load"
              className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs font-mono text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3 h-3 text-indigo-400" />
              LOAD: <span className="font-bold text-white">{loadMultiplier}x</span>
            </button>
          </div>
        </header>

        {/* SECTION CONTENT */}
        <section className="p-8 flex-1 space-y-6 overflow-y-auto">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <>
              {/* TOP METRICS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* METRIC 1 */}
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 shadow-lg relative overflow-hidden group hover:border-white/20 transition-all">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity className="w-12 h-12 text-indigo-400" />
                  </div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                    Real-time Requests
                  </p>
                  <h3 className="text-3xl font-bold text-white tracking-tight">
                    {recentQueriesCount.toLocaleString()}
                    <span className="text-xs font-normal text-slate-500 ml-1">/s</span>
                  </h3>
                  <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                    <span className="flex items-center gap-0.5 font-semibold">
                      ▲ +{(12.4 * loadMultiplier).toFixed(1)}%
                    </span>
                    <span className="text-slate-500">vs last hour</span>
                  </div>
                </div>

                {/* METRIC 2 */}
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 shadow-lg group hover:border-white/20 transition-all">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                    Avg Latency
                  </p>
                  <h3 className="text-3xl font-bold text-white tracking-tight">
                    {avgLatencyMs}
                    <span className="text-xs font-normal text-slate-500 ml-1">ms</span>
                  </h3>
                  <div className="mt-4 flex gap-1 items-end h-6">
                    <div className="w-1 bg-indigo-500/50 h-3 rounded-full animate-pulse"></div>
                    <div className="w-1 bg-indigo-500/50 h-5 rounded-full"></div>
                    <div className="w-1 bg-indigo-500 h-6 rounded-full"></div>
                    <div className="w-1 bg-indigo-500 h-4 rounded-full"></div>
                    <div className="w-1 bg-indigo-500 h-5 rounded-full"></div>
                    <div className="w-1 bg-indigo-500/50 h-3 rounded-full"></div>
                    <div className="w-1 bg-indigo-500 h-4 rounded-full"></div>
                  </div>
                </div>

                {/* METRIC 3 */}
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 shadow-lg hover:border-white/20 transition-all">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                    Database Read/Write
                  </p>
                  <h3 className="text-3xl font-bold text-white tracking-tight">
                    {dbThroughput}
                    <span className="text-xs font-normal text-slate-500 ml-1">MB/s</span>
                  </h3>
                  <p className="text-[10px] mt-3 text-slate-500 font-mono flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-slate-400" /> Current I/O Throughput
                  </p>
                </div>

                {/* METRIC 4 */}
                <div className="p-5 rounded-xl bg-white/5 border border-white/10 shadow-lg hover:border-white/20 transition-all">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">
                    Active Threads
                  </p>
                  <h3 className="text-3xl font-bold text-white tracking-tight">{activeThreads}</h3>
                  <div className="mt-4 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500 rounded-full"
                      style={{ width: `${Math.min(100, (activeThreads / 24) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* LOWER DUAL PANELS */}
              <div className="flex flex-col lg:flex-row gap-6 min-h-[380px]">
                {/* ENGINE PERFORMANCE GRAPH CARD */}
                <div className="flex-1 p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-sm font-bold text-white">Engine Performance</h4>
                      <p className="text-xs text-slate-500">Resource utilization over the specified timeframe</p>
                    </div>
                    <select
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="bg-[#0a0a0c] border border-white/10 text-xs rounded-lg px-3 py-1.5 text-slate-300 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <option>Last 60 mins</option>
                      <option>Last 24 hours</option>
                      <option>Realtime 60s</option>
                    </select>
                  </div>

                  <div className="flex-1 relative min-h-[220px]">
                    <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" style={{ stopColor: 'rgba(79,70,229,0.35)', stopOpacity: 1 }} />
                          <stop offset="100%" style={{ stopColor: 'rgba(79,70,229,0)', stopOpacity: 0 }} />
                        </linearGradient>
                      </defs>
                      <path d={fillD} fill="url(#grad)" />
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="transition-all duration-300"
                      />
                      <circle
                        cx="800"
                        cy={perfData[perfData.length - 1]}
                        r="5"
                        fill="#6366f1"
                        className="animate-ping opacity-75"
                      />
                      <circle cx="800" cy={perfData[perfData.length - 1]} r="4" fill="#6366f1" />
                    </svg>

                    <div className="absolute top-2 left-2 flex gap-4 bg-black/40 px-3 py-1.5 rounded-md border border-white/5 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          CPU_LOAD: <strong className="text-white">{(perfData[perfData.length - 1] / 2).toFixed(1)}%</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          MEM_SWAP: <strong className="text-white">312MB</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECENT ACTIVITY LOG PANEL */}
                <div className="w-full lg:w-96 p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white">Recent Activity</h4>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      LIVE STREAM
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 font-mono max-h-[320px] pr-1">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded bg-black/40 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="flex justify-between text-[10px] mb-1">
                          <span
                            className={
                              log.type === 'SQLITE_QUERY'
                                ? 'text-indigo-400'
                                : log.type === 'AUTH_SUCCESS'
                                ? 'text-emerald-400'
                                : log.type === 'ENGINE_WARN'
                                ? 'text-amber-400'
                                : log.type === 'SYS_HEALTH'
                                ? 'text-purple-400'
                                : 'text-blue-400'
                            }
                          >
                            {log.type}
                          </span>
                          <span className="text-slate-600">{log.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 break-all">{log.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: SQLITE EXPLORER */}
          {activeTab === 'sqlite' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    SQL Query Console
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">Tables:</span>
                    {['sessions', 'audit_events', 'system_stats'].map((tbl) => (
                      <button
                        key={tbl}
                        onClick={() => {
                          setSelectedTable(tbl);
                          setCustomSql(`SELECT * FROM ${tbl};`);
                        }}
                        className={`text-xs px-2.5 py-1 rounded font-mono transition-colors ${
                          selectedTable === tbl
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {tbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={customSql}
                    onChange={(e) => setCustomSql(e.target.value)}
                    rows={3}
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-xs font-mono text-indigo-300 outline-none focus:border-indigo-500 transition-colors"
                  ></textarea>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={executeCustomSql}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-glow-indigo flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" /> Execute Query
                    </button>
                    <span className="text-[11px] font-mono text-slate-500">
                      Execution time: <strong className="text-emerald-400">{queryExecutionTime}ms</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* QUERY RESULTS TABLE */}
              {queryResult && (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white">Query Results ({queryResult.rows.length} rows)</h4>
                    <button className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono">
                      <Download className="w-3.5 h-3.5" /> Export CSV
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 bg-white/5">
                          {queryResult.headers.map((h, i) => (
                            <th key={i} className="p-3 font-semibold uppercase tracking-wider text-[10px]">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {queryResult.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-3 text-slate-300">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUTH LOGS */}
          {activeTab === 'auth' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white">Active Authenticated Sessions</h3>
                    <p className="text-xs text-slate-500">Current JWT token sessions and connection IP records</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search session..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="bg-black/50 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                        <th className="p-3">User Identity</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Last Active</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono">
                      {sessions
                        .filter((s) => s.user.toLowerCase().includes(searchFilter.toLowerCase()))
                        .map((s) => (
                          <tr key={s.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 text-white font-semibold flex items-center gap-2">
                              <Key className="w-3.5 h-3.5 text-indigo-400" />
                              {s.user}
                            </td>
                            <td className="p-3 text-slate-400">{s.role}</td>
                            <td className="p-3 text-slate-300">{s.ip}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                  s.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : s.status === 'idle'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}
                              >
                                {s.status}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">{s.lastSeen}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setSessions((prev) => prev.filter((sess) => sess.id !== s.id));
                                }}
                                className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold rounded transition-colors"
                              >
                                Revoke Session
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERFORMANCE ANALYTICS */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Cpu className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">CPU Core Distribution</h4>
                      <p className="text-xs text-slate-500">8 Virtual Cores active</p>
                    </div>
                  </div>
                  <div className="space-y-3 font-mono text-xs">
                    {[38, 54, 22, 71, 40, 18, 62, 45].map((coreVal, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-slate-500 w-12 text-[10px]">CORE #{i}</span>
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${coreVal * loadMultiplier}%` }}
                          ></div>
                        </div>
                        <span className="text-slate-300 w-8 text-right text-[10px]">
                          {Math.min(99, Math.floor(coreVal * loadMultiplier))}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Server className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Memory Allocation</h4>
                      <p className="text-xs text-slate-500">3.8 GB / 16.0 GB Used</p>
                    </div>
                  </div>
                  <div className="flex justify-center items-center h-48 relative">
                    <div className="w-36 h-36 rounded-full border-8 border-indigo-500/30 border-t-indigo-500 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">23.7%</span>
                      <span className="text-[10px] text-slate-500 font-mono">RAM UTILIZED</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Wifi className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Network Traffic</h4>
                      <p className="text-xs text-slate-500">Inbound & Outbound sockets</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-xs font-mono">
                    <div className="p-3 bg-black/40 rounded border border-white/5">
                      <div className="text-[10px] text-slate-500 mb-1">INBOUND THROUGHPUT</div>
                      <div className="text-lg font-bold text-emerald-400">142.8 KB/s</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded border border-white/5">
                      <div className="text-[10px] text-slate-500 mb-1">OUTBOUND THROUGHPUT</div>
                      <div className="text-lg font-bold text-indigo-400">894.2 KB/s</div>
                    </div>
                    <div className="p-3 bg-black/40 rounded border border-white/5">
                      <div className="text-[10px] text-slate-500 mb-1">PACKET LOSS RATE</div>
                      <div className="text-lg font-bold text-white">0.00%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* FOOTER BAR */}
        <footer className="h-8 bg-black border-t border-white/5 flex items-center px-8 justify-between text-[10px] font-mono text-slate-600">
          <div className="flex items-center gap-3">
            <span className="text-slate-400">CONNECTED: 127.0.0.1:8000</span>
            <span className="text-white/20">|</span>
            <span className="text-emerald-500/80">SOCKET_OPEN</span>
          </div>

          <div className="flex items-center gap-6">
            <span>UPTIME: <strong className="text-slate-300">{formattedUptime}</strong></span>
            <span>API_KEY: <strong className="text-slate-400">****_k8s2</strong></span>
          </div>
        </footer>
      </main>
    </div>
  );
}

