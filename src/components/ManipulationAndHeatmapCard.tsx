import React from 'react';
import { ManipulationAlert, LiquidationHeatmap } from '../types/terminal';
import { ShieldCheck, AlertOctagon, Flame } from 'lucide-react';

interface ManipulationAndHeatmapCardProps {
  manip: ManipulationAlert;
  heatmap: LiquidationHeatmap;
  currentPrice: number;
  lang: 'pt' | 'en';
}

export const ManipulationAndHeatmapCard: React.FC<ManipulationAndHeatmapCardProps> = ({
  manip,
  heatmap,
  currentPrice,
  lang,
}) => {
  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Manipulation Detection */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ff1744]" />
            <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
              {lang === 'pt' ? 'DETECÇÃO DE MANIPULAÇÃO' : 'MANIPULATION DETECTOR'}
            </span>
          </div>

          <div
            className={`p-2.5 rounded border flex items-start gap-2.5 ${
              manip.detected
                ? 'bg-[#ff1744]/10 border-[#ff1744]/40 text-[#ff1744]'
                : 'bg-[#00e676]/5 border-[#00e676]/20 text-[#00e676]'
            }`}
          >
            {manip.detected ? (
              <AlertOctagon className="w-5 h-5 flex-shrink-0 text-[#ff1744] mt-0.5" />
            ) : (
              <ShieldCheck className="w-5 h-5 flex-shrink-0 text-[#00e676] mt-0.5" />
            )}

            <div>
              <div className="font-['Syne'] text-xs font-bold tracking-wide">
                {manip.detected
                  ? manip.type || (lang === 'pt' ? 'ATIVIDADE SUSPEITA' : 'SUSPICIOUS ACTIVITY')
                  : lang === 'pt'
                  ? 'MERCADO LIMPO'
                  : 'CLEAN MARKET'}
              </div>
              <p className="text-[10px] font-mono text-[#c8c8e8] mt-1 leading-relaxed">
                {manip.desc}
              </p>
              {manip.detected && (
                <div className="mt-1.5 text-[9px] font-mono font-bold text-[#ffd600]">
                  {lang === 'pt' ? 'AÇÃO RECOMENDADA:' : 'RECOMMENDED ACTION:'} {manip.recommendation}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Liquidation Heatmap */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-3.5 h-3.5 text-[#ff8a65]" />
            <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
              {lang === 'pt' ? 'HEATMAP DE LIQUIDAÇÕES' : 'LIQUIDATION HEATMAP'}
            </span>
          </div>

          <div className="space-y-1.5">
            {heatmap.clusters.map((c, i) => (
              <div
                key={i}
                className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono border ${
                  c.side === 'SHORT_LIQUIDATION'
                    ? 'bg-[#00e676]/5 border-[#00e676]/20'
                    : 'bg-[#ff1744]/5 border-[#ff1744]/20'
                }`}
              >
                <span className="font-bold font-['Syne'] text-[#c8c8e8]">
                  {c.priceLevel > 1000 ? c.priceLevel.toFixed(1) : c.priceLevel.toFixed(4)}
                </span>
                <span className="text-[#7070a0]">
                  {c.side === 'SHORT_LIQUIDATION' ? 'Liq Shorts' : 'Liq Longs'} (+{c.distancePct}%)
                </span>
                <span
                  className="font-bold text-[9px]"
                  style={{ color: c.side === 'SHORT_LIQUIDATION' ? '#00e676' : '#ff1744' }}
                >
                  ${(c.estimatedLiqSize / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
          </div>

          <p className="text-[9px] font-mono text-[#7070a0] mt-2 leading-tight">
            {heatmap.narrative}
          </p>
        </div>
      </div>
    </div>
  );
};
