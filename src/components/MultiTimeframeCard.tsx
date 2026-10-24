import React from 'react';
import { HTFBias, SMCAnalysis, Bias } from '../types/terminal';

interface MultiTimeframeCardProps {
  htf: HTFBias;
  smc: SMCAnalysis;
  lang: 'pt' | 'en';
}

export const MultiTimeframeCard: React.FC<MultiTimeframeCardProps> = ({ htf, smc, lang }) => {
  const renderBiasTag = (bias: Bias) => {
    let colorCls = 'text-[#ffd600] bg-[#ffd600]/10 border-[#ffd600]/30';
    if (bias === 'BULLISH') colorCls = 'text-[#00e676] bg-[#00e676]/10 border-[#00e676]/30';
    if (bias === 'BEARISH') colorCls = 'text-[#ff1744] bg-[#ff1744]/10 border-[#ff1744]/30';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-['Syne'] font-bold border ${colorCls}`}>
        {bias}
      </span>
    );
  };

  const tfList = [
    { label: '1D (Macro)', bias: htf.d1 },
    { label: '4H (Principal)', bias: htf.h4 },
    { label: '1H (Intermediário)', bias: htf.h1 },
    { label: '15m (Setup)', bias: htf.m15 },
    { label: '5m (Timing)', bias: htf.m5 },
  ];

  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ce93d8]" />
          <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
            {lang === 'pt' ? 'VIÉS MULTI-TIMEFRAME' : 'MULTI-TIMEFRAME BIAS'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-[#7070a0]">Alinhamento:</span>
          {renderBiasTag(htf.aligned)}
        </div>
      </div>

      {/* Grid of timeframes */}
      <div className="space-y-1.5 mt-2">
        {tfList.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-1 border-b border-[#1a1a40]/60 last:border-none text-[11px] font-mono"
          >
            <span className="text-[#7070a0]">{item.label}</span>
            {renderBiasTag(item.bias)}
          </div>
        ))}
      </div>

      {/* SMC Tags Section */}
      <div className="mt-3 pt-2 border-t border-[#1a1a40]">
        <div className="text-[9px] font-mono text-[#7070a0] uppercase tracking-wider mb-1.5">
          {lang === 'pt' ? 'ESTRUTURA SMC DETECTADA' : 'SMC STRUCTURE'}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {smc.bos && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#00e676]/40 text-[#00e676] bg-[#00e676]/10">
              BOS ↑
            </span>
          )}
          {smc.choch && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#ce93d8]/40 text-[#ce93d8] bg-[#ce93d8]/10">
              CHoCH 🔄
            </span>
          )}
          {smc.sweepDetected && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#ffd600]/40 text-[#ffd600] bg-[#ffd600]/10">
              {smc.sweepDir === 'SSL_SWEPT' ? '⚡ SSL SWEEP' : '⚡ BSL SWEEP'}
            </span>
          )}
          {smc.fvgs && smc.fvgs.length > 0 && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#4dd0e1]/40 text-[#4dd0e1] bg-[#4dd0e1]/10">
              FVG ×{smc.fvgs.length}
            </span>
          )}
          {smc.eqh && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#64b5f6]/40 text-[#64b5f6] bg-[#64b5f6]/10">
              EQH {smc.eqh > 1000 ? smc.eqh.toFixed(1) : smc.eqh.toFixed(4)}
            </span>
          )}
          {smc.eql && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[#ff8a65]/40 text-[#ff8a65] bg-[#ff8a65]/10">
              EQL {smc.eql > 1000 ? smc.eql.toFixed(1) : smc.eql.toFixed(4)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
