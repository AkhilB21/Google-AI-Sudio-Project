import React from 'react';

interface SignalBadgeProps {
  action: string;
}

export const SignalBadge: React.FC<SignalBadgeProps> = ({ action }) => {
  const normalized = (action || 'HOLD').toUpperCase();

  const styles: Record<string, string> = {
    ENTRY: 'bg-[#3fb950]/15 text-[#3fb950] border-[#3fb950]/40 shadow-[0_0_10px_rgba(63,185,80,0.15)]',
    HOLD: 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/40',
    EXIT: 'bg-[#f85149]/15 text-[#f85149] border-[#f85149]/40 shadow-[0_0_10px_rgba(248,81,73,0.15)]',
    FLAT: 'bg-slate-700/20 text-slate-400 border-slate-600',
  };

  const styleClass = styles[normalized] || 'bg-slate-700/20 text-slate-300 border-slate-600';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border tracking-wider uppercase ${styleClass}`}>
      {normalized}
    </span>
  );
};
