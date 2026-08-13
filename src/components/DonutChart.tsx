import React from 'react';

interface DonutSegment {
  label: string;
  count: number;
  color: string;
}

interface DonutChartProps {
  summary: {
    total: number;
    ENTRY: number;
    HOLD: number;
    EXIT: number;
    FLAT: number;
  };
  onFilterSelect?: (action: string) => void;
  selectedFilter?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  summary,
  onFilterSelect,
  selectedFilter = 'ALL',
}) => {
  const segments: DonutSegment[] = [
    { label: 'ENTRY', count: summary.ENTRY, color: '#3fb950' },
    { label: 'HOLD', count: summary.HOLD, color: '#d29922' },
    { label: 'EXIT', count: summary.EXIT, color: '#f85149' },
    { label: 'FLAT', count: summary.FLAT, color: '#8b949e' },
  ];

  const total = summary.total || 1;
  const radius = 65;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <div className="p-5 rounded-xl bg-[#111827] border border-[#334155] shadow-lg flex flex-col md:flex-row items-center gap-6">
      <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth="20"
          />
          {segments.map((seg, idx) => {
            if (seg.count <= 0) return null;
            const percent = seg.count / total;
            const strokeDasharray = `${percent * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercent * circumference;
            cumulativePercent += percent;

            const isSelected = selectedFilter === seg.label;

            return (
              <circle
                key={idx}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isSelected ? 24 : 20}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 cursor-pointer hover:opacity-90"
                onClick={() => onFilterSelect && onFilterSelect(seg.label)}
              />
            );
          })}
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-extrabold text-white tracking-tight">{summary.total}</span>
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">TOTAL SIGNALS</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2">
        <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Signal Distribution</span>
          <span className="text-[10px] text-slate-500 font-mono">Engine Output</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {segments.map((seg) => {
            const pct = Math.round((seg.count / total) * 100) || 0;
            const isSelected = selectedFilter === seg.label;

            return (
              <button
                key={seg.label}
                onClick={() => onFilterSelect && onFilterSelect(isSelected ? 'ALL' : seg.label)}
                className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white/10 border-white/30 shadow-md'
                    : 'bg-black/30 border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }}></span>
                  <span className="text-xs font-mono font-bold text-slate-200">{seg.label}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-white">{seg.count}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({pct}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
