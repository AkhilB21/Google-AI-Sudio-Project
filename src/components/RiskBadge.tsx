import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  risk: RiskLevel;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk }) => {
  if (risk === 'N/A') return <span className="text-slate-600 font-mono text-[11px]">—</span>;

  const styles: Record<RiskLevel, string> = {
    'LOW RISK': 'bg-[#3fb950]/15 text-[#3fb950] border-[#3fb950]/30',
    MEDIUM: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    'HIGH RISK': 'bg-[#f85149]/15 text-[#f85149] border-[#f85149]/30',
    'IN TRADE': 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/30',
    'N/A': 'text-slate-600',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold border uppercase whitespace-nowrap ${styles[risk]}`}>
      {risk}
    </span>
  );
};
