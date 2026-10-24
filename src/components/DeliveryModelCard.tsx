import React from 'react';
import { DeliveryModel, DeliveryPhase } from '../types/terminal';

interface DeliveryModelCardProps {
  delivery: DeliveryModel;
  lang: 'pt' | 'en';
}

const PHASES: { id: DeliveryPhase; labelPt: string; labelEn: string; code: string }[] = [
  { id: 'ACCUMULATION', labelPt: 'ACUMULAÇÃO', labelEn: 'ACCUMULATION', code: 'ACC' },
  { id: 'MANIPULATION', labelPt: 'MANIPULAÇÃO', labelEn: 'MANIPULATION', code: 'MAN' },
  { id: 'EXPANSION', labelPt: 'EXPANSÃO', labelEn: 'EXPANSION', code: 'EXP' },
  { id: 'DISTRIBUTION', labelPt: 'DISTRIBUIÇÃO', labelEn: 'DISTRIBUTION', code: 'DIS' },
  { id: 'REBALANCING', labelPt: 'REBALANCEAMENTO', labelEn: 'REBALANCING', code: 'REB' },
  { id: 'REVERSAL', labelPt: 'REVERSÃO', labelEn: 'REVERSAL', code: 'REV' },
];

export const DeliveryModelCard: React.FC<DeliveryModelCardProps> = ({ delivery, lang }) => {
  const currentIndex = PHASES.findIndex((p) => p.id === delivery.phase);

  const getPhaseColor = (p: DeliveryPhase) => {
    switch (p) {
      case 'ACCUMULATION':
        return '#64b5f6';
      case 'MANIPULATION':
        return '#ce93d8';
      case 'EXPANSION':
        return '#69f0ae';
      case 'DISTRIBUTION':
        return '#ff8a65';
      case 'REBALANCING':
        return '#4dd0e1';
      case 'REVERSAL':
        return '#ef9a9a';
      default:
        return '#ce93d8';
    }
  };

  const currentColor = getPhaseColor(delivery.phase);
  const currentPhaseObj = PHASES.find((p) => p.id === delivery.phase);
  const currentLabel = lang === 'pt' ? currentPhaseObj?.labelPt : currentPhaseObj?.labelEn;
  const nextPhaseObj = PHASES.find((p) => p.id === delivery.next);
  const nextLabel = lang === 'pt' ? nextPhaseObj?.labelPt : nextPhaseObj?.labelEn;

  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ce93d8]" />
          <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
            {lang === 'pt' ? 'FASE DE ENTREGA (MDM)' : 'MARKET DELIVERY MODEL'}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold" style={{ color: currentColor }}>
          {delivery.confidence}% CONF
        </span>
      </div>

      {/* Current Phase Badge */}
      <div
        className="inline-flex items-center gap-2 px-2.5 py-1 rounded text-xs font-['Syne'] font-bold tracking-wider mb-2 border"
        style={{
          color: currentColor,
          borderColor: currentColor + '50',
          backgroundColor: currentColor + '15',
        }}
      >
        <span>◈</span>
        <span>{currentLabel || delivery.phase}</span>
      </div>

      {/* Progress Timeline */}
      <div className="flex items-center gap-1 my-2">
        {PHASES.map((p, idx) => {
          const isPassed = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                  isCurrent
                    ? 'shadow-[0_0_8px_currentColor]'
                    : isPassed
                    ? 'opacity-80'
                    : 'bg-[#1a1a40]'
                }`}
                style={{
                  backgroundColor: isCurrent ? currentColor : isPassed ? '#00e676' : undefined,
                  color: currentColor,
                }}
              />
              <span
                className={`text-[8px] font-mono tracking-tighter ${
                  isCurrent ? 'font-bold text-[#c8c8e8]' : 'text-[#7070a0]'
                }`}
              >
                {p.code}
              </span>
            </div>
          );
        })}
      </div>

      {/* Narrative */}
      <div className="text-[10px] font-mono text-[#c8c8e8] leading-relaxed border-l-2 border-[#ce93d8] pl-2.5 py-0.5 mt-2 bg-[#07071a]/50 rounded-r">
        {delivery.narrative}
      </div>

      {/* Next Phase Indicator */}
      <div className="flex items-center justify-between text-[10px] font-mono mt-2.5 pt-2 border-t border-[#1a1a40]">
        <span className="text-[#7070a0]">{lang === 'pt' ? 'Próxima fase:' : 'Next phase:'}</span>
        <span className="font-bold text-[#ce93d8]">{nextLabel || delivery.next}</span>
      </div>
    </div>
  );
};
