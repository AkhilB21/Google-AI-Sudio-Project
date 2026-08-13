import React, { useState, useEffect } from 'react';
import { Bell, Filter, CheckCircle2, ShieldAlert, Zap, Layers, PlusCircle, Trash2, Mail, Smartphone, Send } from 'lucide-react';
import { AlertItem } from '../../types';

interface AlertsTabProps {
  alerts: AlertItem[];
  onMarkAllRead: () => void;
  onSelectStockBySymbol: (symbol: string) => void;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  channel: string;
  enabled: boolean;
}

export const AlertsTab: React.FC<AlertsTabProps> = ({ alerts, onMarkAllRead, onSelectStockBySymbol }) => {
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Apollo' | 'LayerSignal' | 'System'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Entry' | 'Exit' | 'Regime' | 'Scoring' | 'System'>('All');

  // Channels state
  const [channels, setChannels] = useState({
    email: true,
    push: true,
    telegram: false,
    webhook: false,
  });

  // Custom Alert Rules state backed by SQLite
  const [rules, setRules] = useState<AlertRule[]>([
    { id: 'r1', name: 'L1 Breakout Alert', condition: 'Stock enters L1 Bucket && RSI21 > 60', channel: 'Push, Email', enabled: true },
    { id: 'r2', name: 'Throwback Pattern Alert', condition: 'Stock in L2 Bucket && Price pullback <= 2%', channel: 'Push', enabled: true },
    { id: 'r3', name: 'Market Regime Shift', condition: 'Nifty Index crosses 50D SMA', channel: 'Email, Telegram', enabled: true },
  ]);

  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleCond, setNewRuleCond] = useState('');

  useEffect(() => {
    fetch('/api/db/rules')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setRules(data);
        }
      })
      .catch((err) => console.error('Failed to load rules:', err));
  }, []);

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim() || !newRuleCond.trim()) return;

    const payload = {
      name: newRuleName.trim(),
      condition: newRuleCond.trim(),
      channel: channels.email && channels.push ? 'Push, Email' : channels.email ? 'Email' : 'Push',
    };

    try {
      const res = await fetch('/api/db/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setRules((prev) => [
        ...prev,
        {
          id: data.id || `R_${Date.now()}`,
          name: payload.name,
          condition: payload.condition,
          channel: payload.channel,
          enabled: true,
        },
      ]);
      setNewRuleName('');
      setNewRuleCond('');
    } catch (err) {
      console.error('Failed to add rule:', err);
    }
  };

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteRule = async (id: string) => {
    try {
      await fetch(`/api/db/rules/${id}`, { method: 'DELETE' });
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (sourceFilter !== 'All' && a.source !== sourceFilter) return false;
    if (typeFilter !== 'All' && a.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-full overflow-hidden text-slate-200 font-sans">
      {/* DELIVERY CHANNEL TOGGLES & RULE ENGINE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* CHANNELS PANEL */}
        <div className="p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 shadow-lg">
          <h4 className="font-extrabold text-white uppercase text-xs border-b border-white/10 pb-2 flex items-center justify-between">
            <span>Notification Delivery Channels</span>
            <Bell className="w-4 h-4 text-indigo-400" />
          </h4>

          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-black/30 rounded border border-white/5">
              <span className="flex items-center gap-2 text-slate-300">
                <Mail className="w-3.5 h-3.5 text-blue-400" /> Email Notifications
              </span>
              <input
                type="checkbox"
                checked={channels.email}
                onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>
            <div className="flex justify-between items-center p-2 bg-black/30 rounded border border-white/5">
              <span className="flex items-center gap-2 text-slate-300">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Browser Push
              </span>
              <input
                type="checkbox"
                checked={channels.push}
                onChange={(e) => setChannels({ ...channels, push: e.target.checked })}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>
            <div className="flex justify-between items-center p-2 bg-black/30 rounded border border-white/5">
              <span className="flex items-center gap-2 text-slate-300">
                <Send className="w-3.5 h-3.5 text-sky-400" /> Telegram Bot Integration
              </span>
              <input
                type="checkbox"
                checked={channels.telegram}
                onChange={(e) => setChannels({ ...channels, telegram: e.target.checked })}
                className="accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* ACTIVE ALERT RULES TABLE */}
        <div className="md:col-span-2 p-4 bg-[#111827] border border-[#334155] rounded-xl space-y-3 shadow-lg flex flex-col justify-between">
          <h4 className="font-extrabold text-white uppercase text-xs border-b border-white/10 pb-2 flex items-center justify-between">
            <span>Active Trigger Rules ({rules.length})</span>
            <span className="text-[10px] text-indigo-300">Real-time Rule Evaluator</span>
          </h4>

          <div className="space-y-1.5 overflow-y-auto max-h-36 pr-1">
            {rules.map((r) => (
              <div key={r.id} className="p-2 bg-black/40 rounded border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>{r.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({r.condition})</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleRule(r.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                      r.enabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    {r.enabled ? 'ACTIVE' : 'MUTED'}
                  </button>
                  <button onClick={() => deleteRule(r.id)} className="text-slate-500 hover:text-red-400 cursor-pointer p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddRule} className="flex gap-2 pt-2 border-t border-white/10">
            <input
              type="text"
              placeholder="Rule Name"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              className="w-1/3 bg-[#0B1120] border border-[#334155] rounded p-1.5 text-xs text-white"
            />
            <input
              type="text"
              placeholder="Trigger Condition (e.g., RSI21 > 75)"
              value={newRuleCond}
              onChange={(e) => setNewRuleCond(e.target.value)}
              className="flex-1 bg-[#0B1120] border border-[#334155] rounded p-1.5 text-xs text-white"
            />
            <button type="submit" className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded font-bold text-white text-xs cursor-pointer">
              Add
            </button>
          </form>
        </div>
      </div>

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
