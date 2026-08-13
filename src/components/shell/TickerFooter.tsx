import React from 'react';
import { MarketIndex } from '../../types';

interface TickerFooterProps {
  indices: MarketIndex[];
}

export const TickerFooter: React.FC<TickerFooterProps> = ({ indices }) => {
  return (
    <footer className="h-[28px] min-h-[28px] bg-[#0B1120] border-t border-[#334155] flex items-center overflow-hidden z-40 select-none font-mono text-[11px] text-slate-300">
      <div className="bg-[#111827] px-3 h-full flex items-center font-bold text-slate-400 text-[10px] uppercase border-r border-[#334155] shrink-0 z-10">
        NSE INDICES (14)
      </div>

      <div className="flex-1 overflow-x-auto no-scrollbar whitespace-nowrap flex items-center gap-6 px-4 py-1">
        {indices.map((idx) => {
          const isPos = idx.changePct >= 0;
          return (
            <div key={idx.symbol} className="inline-flex items-center gap-2 shrink-0">
              <span className="text-slate-400 font-semibold">{idx.symbol}:</span>
              <span className="text-white font-extrabold">{idx.value.toLocaleString('en-IN')}</span>
              <span className={`text-[10px] font-bold ${isPos ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                {isPos ? `+${idx.changePct.toFixed(2)}%` : `${idx.changePct.toFixed(2)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </footer>
  );
};
