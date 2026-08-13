import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  badgeText?: string;
  badgeColor?: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'slate';
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeColor = 'blue',
  accentColor = '#58a6ff',
}) => {
  const badgeClasses = {
    green: 'bg-[#3fb950]/10 text-[#3fb950] border-[#3fb950]/30',
    red: 'bg-[#f85149]/10 text-[#f85149] border-[#f85149]/30',
    yellow: 'bg-[#d29922]/10 text-[#d29922] border-[#d29922]/30',
    blue: 'bg-[#58a6ff]/10 text-[#58a6ff] border-[#58a6ff]/30',
    purple: 'bg-[#a371f7]/10 text-[#a371f7] border-[#a371f7]/30',
    slate: 'bg-slate-700/20 text-slate-400 border-slate-700',
  };

  return (
    <div className="p-5 rounded-xl bg-[#111827] border border-[#334155] shadow-lg relative overflow-hidden group hover:border-slate-500 transition-all">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">{title}</p>
        {Icon && (
          <div className="p-2 rounded-lg bg-white/5 text-slate-300 group-hover:text-white transition-colors">
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</h3>
        {badgeText && (
          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${badgeClasses[badgeColor]}`}>
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-[10px] text-slate-400 font-mono flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
