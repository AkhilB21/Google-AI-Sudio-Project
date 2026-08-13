import React from 'react';

interface ScoreBarProps {
  score: number;
  max?: number;
  type?: 'momentum' | 'exit_pressure';
  showLabel?: boolean;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  score,
  max = 100,
  type = 'momentum',
  showLabel = true,
}) => {
  const percent = Math.min(100, Math.max(0, (score / max) * 100));

  let barColor = 'bg-[#58a6ff]';
  if (type === 'momentum') {
    if (score >= 80) barColor = 'bg-[#3fb950]';
    else if (score >= 60) barColor = 'bg-[#58a6ff]';
    else if (score >= 40) barColor = 'bg-[#d29922]';
    else barColor = 'bg-[#f85149]';
  } else {
    // Exit Pressure (Higher is worse)
    if (score >= 60) barColor = 'bg-[#f85149]';
    else if (score >= 35) barColor = 'bg-[#d29922]';
    else barColor = 'bg-[#3fb950]';
  }

  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono font-bold text-slate-200 min-w-[28px] text-right">
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
};
