import React from 'react';
import { LiquidityZone, OrderBlock } from '../types/terminal';

interface LiquidityAndObsCardProps {
  zones: { green: LiquidityZone[]; red: LiquidityZone[]; gray: LiquidityZone[] };
  obs: OrderBlock[];
  lang: 'pt' | 'en';
}

export const LiquidityAndObsCard: React.FC<LiquidityAndObsCardProps> = ({ zones, obs, lang }) => {
  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Liquidity Zones */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4dd0e1]" />
            <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
              {lang === 'pt' ? 'ZONAS DE LIQUIDEZ' : 'LIQUIDITY ZONES'}
            </span>
          </div>

          <div className="space-y-1">
            {zones.red.map((z, i) => (
              <div
                key={`red-${i}`}
                className="flex items-center justify-between px-2 py-1 bg-[#ff1744]/5 border border-[#ff1744]/20 rounded text-[10px] font-mono"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff1744]" />
                  <span className="font-bold text-[#ff1744]">
                    {z.mid > 1000 ? z.mid.toFixed(1) : z.mid.toFixed(4)}
                  </span>
                </div>
                <span className="text-[#7070a0]">
                  {lang === 'pt' ? 'Resistência' : 'Resistance'} {z.strength}%
                </span>
              </div>
            ))}

            {zones.green.map((z, i) => (
              <div
                key={`green-${i}`}
                className="flex items-center justify-between px-2 py-1 bg-[#00e676]/5 border border-[#00e676]/20 rounded text-[10px] font-mono"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00e676]" />
                  <span className="font-bold text-[#00e676]">
                    {z.mid > 1000 ? z.mid.toFixed(1) : z.mid.toFixed(4)}
                  </span>
                </div>
                <span className="text-[#7070a0]">
                  {lang === 'pt' ? 'Suporte' : 'Support'} {z.strength}%
                </span>
              </div>
            ))}

            {zones.green.length === 0 && zones.red.length === 0 && (
              <div className="text-[10px] font-mono text-[#7070a0] text-center py-2">
                Nenhuma zona de alta liquidez consolidada
              </div>
            )}
          </div>
        </div>

        {/* Order Blocks */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ce93d8]" />
            <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
              ORDER BLOCKS (OB)
            </span>
          </div>

          <div className="space-y-1">
            {obs.slice(0, 4).map((ob, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between px-2 py-1 rounded text-[10px] font-mono border ${
                  ob.type === 'BULL'
                    ? 'bg-[#00e676]/5 border-[#00e676]/20'
                    : 'bg-[#ff1744]/5 border-[#ff1744]/20'
                }`}
              >
                <div>
                  <div
                    className="font-bold font-['Syne']"
                    style={{ color: ob.type === 'BULL' ? '#00e676' : '#ff1744' }}
                  >
                    {ob.bottom > 1000 ? ob.bottom.toFixed(1) : ob.bottom.toFixed(4)} —{' '}
                    {ob.top > 1000 ? ob.top.toFixed(1) : ob.top.toFixed(4)}
                  </div>
                  <div className="text-[8px] text-[#7070a0]">
                    {ob.type === 'BULL' ? `Bullish ${ob.bullPct}% vol` : `Bearish ${100 - ob.bullPct}% vol`}
                  </div>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    ob.type === 'BULL' ? 'bg-[#00e676]/20 text-[#00e676]' : 'bg-[#ff1744]/20 text-[#ff1744]'
                  }`}
                >
                  {ob.type} OB
                </span>
              </div>
            ))}

            {obs.length === 0 && (
              <div className="text-[10px] font-mono text-[#7070a0] text-center py-2">
                Nenhum Order Block ativo identificado
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
