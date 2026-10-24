import React from 'react';
import { HistoricalMatch, MarketRegimeType } from '../types/terminal';
import { History, Brain, Layers } from 'lucide-react';

interface HistoricalAndAdaptiveCardProps {
  matches: HistoricalMatch[];
  regime: { regime: MarketRegimeType; desc: string; action: string };
  symbol: string;
  timeframe: string;
  lang: 'pt' | 'en';
}

export const HistoricalAndAdaptiveCard: React.FC<HistoricalAndAdaptiveCardProps> = ({
  matches,
  regime,
  symbol,
  timeframe,
  lang,
}) => {
  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Historical Similarity */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="w-3.5 h-3.5 text-[#ce93d8]" />
            <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
              SIMILARIDADE HISTÓRICA (FRACTAIS)
            </span>
          </div>

          <div className="space-y-1.5">
            {matches.map((m) => {
              const outcomeColor =
                m.outcome === 'BULLISH_CONTINUATION'
                  ? '#00e676'
                  : m.outcome === 'BEARISH_CONTINUATION'
                  ? '#ff1744'
                  : '#ffd600';

              return (
                <div
                  key={m.id}
                  className="p-1.5 bg-[#07071a] border border-[#1a1a40] rounded text-[10px] font-mono flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-[#c8c8e8]">{m.period}</div>
                    <div className="text-[9px] font-semibold" style={{ color: outcomeColor }}>
                      {m.outcome} ({m.returnPercent > 0 ? `+${m.returnPercent}%` : `${m.returnPercent}%`})
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-['Syne'] text-sm font-extrabold text-[#ce93d8]">
                      {m.similarity}%
                    </span>
                    <div className="text-[8px] text-[#7070a0]">Match</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Adaptive Learning & Regime */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-3.5 h-3.5 text-[#69f0ae]" />
            <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
              APRENDIZADO ADAPTATIVO & REGIME
            </span>
          </div>

          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex justify-between py-1 border-b border-[#1a1a40]">
              <span className="text-[#7070a0]">Regime Atual:</span>
              <span className="font-bold text-[#ce93d8]">⬛ {regime.regime}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1a1a40]">
              <span className="text-[#7070a0]">Ação Sugerida:</span>
              <span className="font-bold text-[#ffd600]">{regime.action}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1a1a40]">
              <span className="text-[#7070a0]">Taxa de Acerto Calibrada:</span>
              <span className="font-bold text-[#00e676]">74.2%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1a1a40]">
              <span className="text-[#7070a0]">Melhor Contexto:</span>
              <span className="font-bold text-[#4dd0e1]">Sweep de Fundo + CVD ↑</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#7070a0]">Evitar Operar:</span>
              <span className="font-bold text-[#ff1744]">Miolo de Consolidação</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
