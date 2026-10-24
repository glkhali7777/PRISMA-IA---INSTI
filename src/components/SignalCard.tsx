import React, { useState } from 'react';
import { SignalAggregation } from '../types/terminal';
import { ShieldCheck, ShieldAlert, Target, TrendingUp, AlertTriangle, ChevronDown, ChevronUp, Lock, RefreshCcw } from 'lucide-react';

interface SignalCardProps {
  signal: SignalAggregation;
  symbol: string;
  timeframe: string;
  onResetSignal?: () => void;
  lang: 'pt' | 'en';
}

export const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  symbol,
  timeframe,
  onResetSignal,
  lang,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const sym = symbol.split('-')[0];
  const circumference = 264;
  const strokeDashoffset = circumference - (signal.confidence / 100) * circumference;

  const isActive = signal.status === 'ACTIVE_TRADE' || signal.status === 'TARGET_1_HIT' || signal.status === 'TARGET_2_HIT';
  const isCall = signal.dir === 'CALL';
  const isPut = signal.dir === 'PUT';

  const getDirColor = () => {
    if (isCall) return '#00e676';
    if (isPut) return '#ff1744';
    return '#ffd600';
  };

  const dirColor = getDirColor();
  const activeTrade = signal.activeTrade;

  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden text-center shadow-lg">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isActive ? 'animate-ping' : ''
            }`}
            style={{ backgroundColor: dirColor }}
          />
          <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
            {lang === 'pt' ? 'ROBÔ INSTITUCIONAL' : 'INSTITUTIONAL ROBOT'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isActive ? (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" />
              {lang === 'pt' ? 'SINAL TRAVADO' : 'SIGNAL LOCKED'}
            </span>
          ) : (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#4dd0e1]/10 text-[#4dd0e1] border border-[#4dd0e1]/30">
              {lang === 'pt' ? 'FILTRO ATIVO' : 'FILTER ACTIVE'}
            </span>
          )}
          <span className="text-[10px] font-mono text-[#7070a0]">
            {sym} • {timeframe.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Signal Display */}
      <div className="my-1">
        <div
          className="font-['Syne'] text-3xl font-extrabold tracking-widest transition-all drop-shadow-[0_0_20px_currentColor]"
          style={{ color: dirColor }}
        >
          {signal.dir}
        </div>

        {/* Status explanation subtext */}
        <div className="text-[10px] font-mono font-semibold mt-0.5" style={{ color: dirColor }}>
          {isActive
            ? (lang === 'pt' ? 'POSIÇÃO ATIVA & PROTEGIDA CONTRA INVERSÃO' : 'ACTIVE TRADE PROTECTED AGAINST FLIPS')
            : (lang === 'pt' ? 'FILTRO ANTI-ERRO: AGUARDANDO GATILHO LIMPO' : 'ANTI-WHIPSAW FILTER: AWAITING CLEAN TRIGGER')}
        </div>
      </div>

      {/* Confidence Gauge or Active Trade Progress */}
      {isActive && activeTrade ? (
        <div className="bg-[#07071a] border border-[#1a1a40] p-2.5 rounded my-2 text-left">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="text-[#7070a0]">PnL Não Realizado:</span>
            <span
              className={`font-['Syne'] text-sm font-extrabold ${
                activeTrade.pnlPercent >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'
              }`}
            >
              {activeTrade.pnlPercent >= 0 ? '+' : ''}
              {activeTrade.pnlPercent.toFixed(2)}%
            </span>
          </div>

          <div className="w-full h-2 bg-[#1a1a40] rounded-full overflow-hidden my-1.5">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(5, signal.tradeProgressPct)}%`,
                backgroundColor: dirColor,
              }}
            />
          </div>

          <div className="flex justify-between text-[9px] font-mono text-[#7070a0]">
            <span>Entrada: {activeTrade.entryPrice.toFixed(1)}</span>
            <span className="text-[#00e676] font-bold">TP1: {activeTrade.tp1Price.toFixed(1)}</span>
          </div>
        </div>
      ) : (
        /* Confidence Ring Gauge */
        <div className="relative w-24 h-24 mx-auto my-2">
          <svg width="96" height="96" viewBox="0 0 100 100" className="-rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1a1a40" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={dirColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-['Syne'] text-xl font-extrabold text-[#c8c8e8]">
              {signal.confidence}%
            </span>
            <span className="text-[8px] font-mono text-[#7070a0] tracking-wider uppercase">
              {lang === 'pt' ? 'CONFIANÇA' : 'CONFIDENCE'}
            </span>
          </div>
        </div>
      )}

      {/* Entry, Stop, TP Grid */}
      <div className="grid grid-cols-3 gap-1.5 mt-2">
        <div className="bg-[#07071a] border border-[#1a1a40] p-1.5 rounded">
          <div className="text-[8px] text-[#7070a0] tracking-wider font-mono uppercase">
            {lang === 'pt' ? 'ENTRADA' : 'ENTRY'}
          </div>
          <div className="font-['Syne'] text-xs font-bold text-[#ffd600] mt-0.5">
            {signal.entry ? (signal.entry > 1000 ? signal.entry.toFixed(1) : signal.entry.toFixed(4)) : '--'}
          </div>
        </div>

        <div className="bg-[#07071a] border border-[#1a1a40] p-1.5 rounded">
          <div className="text-[8px] text-[#7070a0] tracking-wider font-mono uppercase">
            {lang === 'pt' ? 'STOP' : 'STOP'}
          </div>
          <div className="font-['Syne'] text-xs font-bold text-[#ff1744] mt-0.5">
            {signal.sl ? (signal.sl > 1000 ? signal.sl.toFixed(1) : signal.sl.toFixed(4)) : '--'}
          </div>
        </div>

        <div className="bg-[#07071a] border border-[#1a1a40] p-1.5 rounded">
          <div className="text-[8px] text-[#7070a0] tracking-wider font-mono uppercase">
            {lang === 'pt' ? 'ALVO 1' : 'TARGET 1'}
          </div>
          <div className="font-['Syne'] text-xs font-bold text-[#00e676] mt-0.5">
            {signal.tp1 ? (signal.tp1 > 1000 ? signal.tp1.toFixed(1) : signal.tp1.toFixed(4)) : '--'}
          </div>
        </div>
      </div>

      {/* Secondary Targets */}
      <div className="grid grid-cols-2 gap-1.5 mt-1.5">
        <div className="bg-[#07071a] border border-[#1a1a40] px-2 py-1 rounded flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#7070a0]">TP2 (1:2):</span>
          <span className="text-[#00e676] font-bold">
            {signal.tp2 ? (signal.tp2 > 1000 ? signal.tp2.toFixed(1) : signal.tp2.toFixed(4)) : '--'}
          </span>
        </div>
        <div className="bg-[#07071a] border border-[#1a1a40] px-2 py-1 rounded flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#7070a0]">TP3 (1:3):</span>
          <span className="text-[#00e676] font-bold">
            {signal.tp3 ? (signal.tp3 > 1000 ? signal.tp3.toFixed(1) : signal.tp3.toFixed(4)) : '--'}
          </span>
        </div>
      </div>

      {/* Toggle Institutional 6-Filter Audit */}
      <div className="mt-2.5 pt-2 border-t border-[#1a1a40]">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between text-[10px] font-mono text-[#4dd0e1] hover:text-[#ce93d8] bg-[#07071a] px-2 py-1 rounded border border-[#1a1a40] transition-all"
        >
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4dd0e1]" />
            <span>{lang === 'pt' ? 'Auditoria dos 6 Filtros Anti-Ruído' : '6-Filter Noise Audit'}</span>
          </span>
          {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFilters && signal.filters && (
          <div className="bg-[#07071a] border border-[#1a1a40] rounded mt-1.5 p-2 text-left space-y-1.5 text-[9px] font-mono">
            {Object.entries(signal.filters)
              .filter(([key]) => key !== 'overallPassed' && key !== 'whipsawsBlockedCount')
              .map(([key, check]: any) => (
                <div key={key} className="flex items-start justify-between gap-1 border-b border-[#1a1a40]/60 pb-1 last:border-none last:pb-0">
                  <div>
                    <span className="text-[#c8c8e8] font-bold">{check.name}:</span>{' '}
                    <span className="text-[#7070a0]">{check.reason}</span>
                  </div>
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded ${
                      check.passed
                        ? 'bg-[#00e676]/20 text-[#00e676]'
                        : 'bg-[#ff1744]/20 text-[#ff1744]'
                    }`}
                  >
                    {check.passed ? 'APROVADO' : 'BLOQUEADO'}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Reasons / Anti-Flip Message */}
      <div className="mt-2 text-left max-h-24 overflow-y-auto space-y-1">
        {signal.reasons.length > 0 ? (
          signal.reasons.map((r, i) => (
            <div key={i} className="text-[10px] font-mono text-[#c8c8e8] flex items-start gap-1.5 leading-tight">
              <span className="text-[#ce93d8] select-none">•</span>
              <span>{r}</span>
            </div>
          ))
        ) : (
          <div className="text-[10px] font-mono text-[#7070a0] text-center">
            {lang === 'pt' ? 'Filtro anti-ruído ativo...' : 'Noise filter active...'}
          </div>
        )}
      </div>

      {/* Manual Reset Button if trade is active */}
      {isActive && onResetSignal && (
        <button
          onClick={onResetSignal}
          className="w-full mt-2 py-1 text-[10px] font-mono text-[#ff8a65] border border-[#ff8a65]/40 rounded hover:bg-[#ff8a65]/10 flex items-center justify-center gap-1"
        >
          <RefreshCcw className="w-3 h-3" />
          <span>{lang === 'pt' ? 'Encerrar Trade / Resetar Sinal' : 'Close Trade / Reset'}</span>
        </button>
      )}
    </div>
  );
};
