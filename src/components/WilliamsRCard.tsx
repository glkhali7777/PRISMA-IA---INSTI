import React from 'react';
import { WilliamsRResult } from '../types/terminal';

interface WilliamsRCardProps {
  williams: WilliamsRResult;
  lang: 'pt' | 'en';
}

export const WilliamsRCard: React.FC<WilliamsRCardProps> = ({ williams, lang }) => {
  const val = williams.value;
  const pct = Math.max(0, Math.min(100, (val + 100)));

  const getColor = () => {
    if (val < -80) return '#00e676';
    if (val > -20) return '#ff1744';
    return '#ffd600';
  };

  const color = getColor();

  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ce93d8]" />
          <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
            WILLIAMS %R (14)
          </span>
        </div>
        <span
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border"
          style={{
            color,
            borderColor: color + '40',
            backgroundColor: color + '15',
          }}
        >
          {williams.pattern}
        </span>
      </div>

      {/* Main Value Display */}
      <div className="text-center my-2">
        <span className="font-['Syne'] text-3xl font-extrabold tracking-tight" style={{ color }}>
          {val.toFixed(1)}
        </span>
      </div>

      {/* Meter Bar */}
      <div className="w-full h-2 bg-[#1a1a40] rounded-full overflow-hidden my-2 relative">
        <div
          className="h-full rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>

      {/* Scale markers */}
      <div className="flex justify-between text-[8px] font-mono text-[#7070a0] px-0.5">
        <span>-100</span>
        <span className="text-[#00e676] font-bold">-80 (Sobrevenda)</span>
        <span>-50</span>
        <span className="text-[#ff1744] font-bold">-20 (Sobrecompra)</span>
        <span>0</span>
      </div>

      {/* Pattern description */}
      <div className="mt-2.5 pt-2 border-t border-[#1a1a40] text-[10px] font-mono text-[#c8c8e8] leading-tight">
        {williams.desc}
      </div>
    </div>
  );
};
