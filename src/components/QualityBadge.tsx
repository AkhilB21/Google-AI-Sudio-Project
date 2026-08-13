import React from 'react';
import { QualityLevel } from '../types';

interface QualityBadgeProps {
  quality: QualityLevel;
}

export const QualityBadge: React.FC<QualityBadgeProps> = ({ quality }) => {
  if (quality === 'N/A') return <span className="text-slate-600 font-mono text-[11px]">—</span>;

  const styles: Record<QualityLevel, string> = {
    STRONG: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]',
    GOOD: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    MODERATE: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    WEAK: 'bg-red-500/20 text-red-400 border-red-500/40',
    'N/A': 'text-slate-600',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border tracking-wide uppercase ${styles[quality]}`}>
      {quality}
    </span>
  );
};
