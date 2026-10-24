import React from 'react';
import { ScenarioProjection } from '../types/terminal';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ScenarioCardProps {
  scenarios: ScenarioProjection;
  lang: 'pt' | 'en';
}

export const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenarios, lang }) => {
  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ce93d8]" />
          <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
            {lang === 'pt' ? 'PROJEÇÃO DE CENÁRIOS' : 'SCENARIO PROJECTION'}
          </span>
        </div>
        <div className="text-[10px] font-mono">
          <span className="text-[#7070a0]">{lang === 'pt' ? 'Nível de decisão: ' : 'Decision level: '}</span>
          <span className="font-bold text-[#ffd600]">
            {scenarios.keyDecisionLevel > 1000
              ? scenarios.keyDecisionLevel.toFixed(1)
              : scenarios.keyDecisionLevel.toFixed(4)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Bullish */}
        <div className="bg-[#07071a] border border-[#00e676]/20 p-2.5 rounded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#00e676] font-bold">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                BULLISH
              </span>
              <span className="font-['Syne'] text-base">{scenarios.bullish.prob}%</span>
            </div>
            <div className="w-full h-1 bg-[#1a1a40] rounded-full overflow-hidden my-1.5">
              <div
                className="h-full bg-[#00e676] rounded-full"
                style={{ width: `${scenarios.bullish.prob}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-[#c8c8e8] leading-tight mt-1">
              {scenarios.bullish.narr}
            </p>
          </div>
          <div className="text-[9px] font-mono text-[#7070a0] mt-2 pt-1 border-t border-[#1a1a40]">
            Alvos: <span className="text-[#00e676]">{scenarios.bullish.target1}</span> → <span className="text-[#00e676]">{scenarios.bullish.target2}</span>
          </div>
        </div>

        {/* Bearish */}
        <div className="bg-[#07071a] border border-[#ff1744]/20 p-2.5 rounded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#ff1744] font-bold">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" />
                BEARISH
              </span>
              <span className="font-['Syne'] text-base">{scenarios.bearish.prob}%</span>
            </div>
            <div className="w-full h-1 bg-[#1a1a40] rounded-full overflow-hidden my-1.5">
              <div
                className="h-full bg-[#ff1744] rounded-full"
                style={{ width: `${scenarios.bearish.prob}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-[#c8c8e8] leading-tight mt-1">
              {scenarios.bearish.narr}
            </p>
          </div>
          <div className="text-[9px] font-mono text-[#7070a0] mt-2 pt-1 border-t border-[#1a1a40]">
            Alvos: <span className="text-[#ff1744]">{scenarios.bearish.target1}</span> → <span className="text-[#ff1744]">{scenarios.bearish.target2}</span>
          </div>
        </div>

        {/* Neutral */}
        <div className="bg-[#07071a] border border-[#ffd600]/20 p-2.5 rounded flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#ffd600] font-bold">
              <span className="flex items-center gap-1">
                <Minus className="w-3.5 h-3.5" />
                {lang === 'pt' ? 'LATERAL' : 'RANGING'}
              </span>
              <span className="font-['Syne'] text-base">{scenarios.neutral.prob}%</span>
            </div>
            <div className="w-full h-1 bg-[#1a1a40] rounded-full overflow-hidden my-1.5">
              <div
                className="h-full bg-[#ffd600] rounded-full"
                style={{ width: `${scenarios.neutral.prob}%` }}
              />
            </div>
            <p className="text-[10px] font-mono text-[#c8c8e8] leading-tight mt-1">
              {scenarios.neutral.narr}
            </p>
          </div>
          <div className="text-[9px] font-mono text-[#7070a0] mt-2 pt-1 border-t border-[#1a1a40]">
            Faixa: <span className="text-[#ffd600]">{scenarios.neutral.rangeLow} - {scenarios.neutral.rangeHigh}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
