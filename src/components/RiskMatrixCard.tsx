import React from 'react';
import { HTFBias, DeltaFlow, ManipulationAlert, SMCAnalysis } from '../types/terminal';

interface RiskMatrixCardProps {
  htf: HTFBias;
  delta: DeltaFlow;
  manip: ManipulationAlert;
  smc: SMCAnalysis;
  fundingRate: number;
  openInterest: number;
  lang: 'pt' | 'en';
}

export const RiskMatrixCard: React.FC<RiskMatrixCardProps> = ({
  htf,
  delta,
  manip,
  smc,
  fundingRate,
  openInterest,
  lang,
}) => {
  const getBadge = (text: string, status: 'good' | 'bad' | 'warn' | 'neutral') => {
    let cls = 'text-[#7070a0] border-[#252550] bg-[#07071a]';
    if (status === 'good') cls = 'text-[#00e676] border-[#00e676]/30 bg-[#00e676]/10';
    if (status === 'bad') cls = 'text-[#ff1744] border-[#ff1744]/30 bg-[#ff1744]/10';
    if (status === 'warn') cls = 'text-[#ffd600] border-[#ffd600]/30 bg-[#ffd600]/10';

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${cls}`}>
        {text}
      </span>
    );
  };

  const isFundingExtreme = Math.abs(fundingRate) > 0.0008;

  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ce93d8]" />
          <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
            {lang === 'pt' ? 'MATRIZ DE RISCO INSTITUCIONAL' : 'INSTITUTIONAL RISK MATRIX'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
        <div className="bg-[#07071a] p-2 rounded border border-[#1a1a40] flex flex-col justify-between">
          <span className="text-[#7070a0]">HTF MACRO:</span>
          <div className="mt-1">
            {getBadge(
              htf.aligned,
              htf.aligned === 'BULLISH' ? 'good' : htf.aligned === 'BEARISH' ? 'bad' : 'neutral'
            )}
          </div>
        </div>

        <div className="bg-[#07071a] p-2 rounded border border-[#1a1a40] flex flex-col justify-between">
          <span className="text-[#7070a0]">LIQUIDEZ:</span>
          <div className="mt-1">
            {getBadge(
              smc.sweepDetected ? 'SWEPT ⚡' : 'ESTRUTURADA',
              smc.sweepDetected ? 'warn' : 'good'
            )}
          </div>
        </div>

        <div className="bg-[#07071a] p-2 rounded border border-[#1a1a40] flex flex-col justify-between">
          <span className="text-[#7070a0]">FLUXO CVD:</span>
          <div className="mt-1">
            {getBadge(
              delta.cvdSlope === 'UP' ? 'COMPRADOR' : delta.cvdSlope === 'DOWN' ? 'VENDEDOR' : 'NEUTRO',
              delta.cvdSlope === 'UP' ? 'good' : delta.cvdSlope === 'DOWN' ? 'bad' : 'neutral'
            )}
          </div>
        </div>

        <div className="bg-[#07071a] p-2 rounded border border-[#1a1a40] flex flex-col justify-between">
          <span className="text-[#7070a0]">FUNDING RATE:</span>
          <div className="mt-1">
            {getBadge(
              isFundingExtreme ? `${(fundingRate * 100).toFixed(4)}% EXT` : `${(fundingRate * 100).toFixed(4)}%`,
              isFundingExtreme ? 'warn' : 'neutral'
            )}
          </div>
        </div>

        <div className="bg-[#07071a] p-2 rounded border border-[#1a1a40] flex flex-col justify-between">
          <span className="text-[#7070a0]">ARMADILHAS (TRAP):</span>
          <div className="mt-1">
            {getBadge(
              manip.detected ? (manip.type || 'ALERTA') : 'LIMPO',
              manip.detected ? 'bad' : 'good'
            )}
          </div>
        </div>

        <div className="bg-[#07071a] p-2 rounded border border-[#1a1a40] flex flex-col justify-between">
          <span className="text-[#7070a0]">EFICIÊNCIA:</span>
          <div className="mt-1">
            {getBadge(
              delta.deltaStrength > 60 ? 'ALTA' : 'MÉDIA',
              delta.deltaStrength > 60 ? 'good' : 'neutral'
            )}
          </div>
        </div>

        <div className="bg-[#07071a] p-2 rounded border border-[#1a1a40] flex flex-col justify-between">
          <span className="text-[#7070a0]">OPEN INTEREST:</span>
          <div className="mt-1">
            {getBadge(openInterest > 0 ? 'ATIVO' : 'ESTÁVEL', 'good')}
          </div>
        </div>

        <div className="bg-[#07071a] p-2 rounded border border-[#1a1a40] flex flex-col justify-between">
          <span className="text-[#7070a0]">CORRELAÇÃO MACRO:</span>
          <div className="mt-1">{getBadge('RISK-ON', 'good')}</div>
        </div>
      </div>
    </div>
  );
};
