import React, { useMemo } from 'react';
import { Bot, Shield, CheckCircle, XCircle, AlertTriangle, Scale, Compass, Activity, Globe, Eye, Flame, Lock } from 'lucide-react';
import { SignalAggregation, SMCAnalysis, DeltaFlow, HTFBias, DeliveryModel, NewsItem } from '../types/terminal';

interface MultiAgentAssemblyCardProps {
  symbol: string;
  signal: SignalAggregation;
  smc: SMCAnalysis;
  delta: DeltaFlow;
  htf: HTFBias;
  delivery: DeliveryModel;
  news: NewsItem[];
  lang: 'pt' | 'en';
}

export const MultiAgentAssemblyCard: React.FC<MultiAgentAssemblyCardProps> = ({
  symbol,
  signal,
  smc,
  delta,
  htf,
  delivery,
  news,
  lang,
}) => {
  const isPt = lang === 'pt';
  const sym = symbol.split('-')[0];

  // Geopolitical / Macro check in live news
  const geopoliticalAlert = useMemo(() => {
    const geoKeywords = ['war', 'guerra', 'conflict', 'míssil', 'attack', 'ataque', 'tensão', 'escalation', 'sanctions', 'sanções', 'fed rate', 'cpi', 'inflação', 'geopolitical'];
    const matched = news.find((n) => {
      const lower = n.title.toLowerCase();
      return geoKeywords.some((k) => lower.includes(k));
    });

    if (matched) {
      return {
        active: true,
        title: matched.title,
        impact: matched.impact,
        source: matched.source,
      };
    }
    return { active: false, title: '', impact: 'LOW' as const, source: '' };
  }, [news]);

  // Evaluate the 6 AI Quant Agents based on quantitative state
  const agents = useMemo(() => {
    // 1. SMC Agent
    const smcBull = smc.bos || smc.sweepDir === 'SSL_SWEPT' || (smc.choch && smc.choch.direction === 'BULLISH');
    const smcBear = smc.sweepDir === 'BSL_SWEPT' || (smc.choch && smc.choch.direction === 'BEARISH');
    const smcVote: 'CALL' | 'PUT' | 'AGUARDAR' = smcBull && !smcBear ? 'CALL' : smcBear && !smcBull ? 'PUT' : 'AGUARDAR';
    const smcStatus = smcVote !== 'AGUARDAR' ? 'APPROVED' : 'CAUTION';

    // 2. Orderflow & CVD Agent
    const deltaBull = delta.cvdSlope === 'UP' && delta.divergence !== 'BEARISH_DIV';
    const deltaBear = delta.cvdSlope === 'DOWN' && delta.divergence !== 'BULLISH_DIV';
    const deltaVote: 'CALL' | 'PUT' | 'AGUARDAR' = deltaBull ? 'CALL' : deltaBear ? 'PUT' : 'AGUARDAR';
    const deltaStatus = deltaVote !== 'AGUARDAR' ? 'APPROVED' : 'CAUTION';

    // 3. Macro & Geopolitics Agent
    let macroVote: 'CALL' | 'PUT' | 'AGUARDAR' = 'AGUARDAR';
    let macroStatus: 'APPROVED' | 'VETOED' | 'CAUTION' = 'APPROVED';
    let macroRationale = isPt ? 'Cenário macroeconômico estável sem choques geopolíticos' : 'Macro environment stable without geopolitical shocks';

    const normalizedSignalDir: 'CALL' | 'PUT' | 'AGUARDAR' =
      signal.dir === 'CALL' ? 'CALL' : signal.dir === 'PUT' ? 'PUT' : 'AGUARDAR';

    if (geopoliticalAlert.active) {
      if (symbol.includes('XAU') || symbol.includes('WTI') || symbol.includes('BRENT')) {
        macroVote = 'CALL'; // Commodities/Safe-Havens rise during war
        macroRationale = isPt ? 'Tensão geopolítica favorece refúgio seguro institucional' : 'Geopolitical tensions favor safe-haven asset';
      } else {
        macroVote = 'AGUARDAR';
        macroStatus = geopoliticalAlert.impact === 'EXTREME' ? 'VETOED' : 'CAUTION';
        macroRationale = isPt ? 'Risco geopolítico/guerra ativo — postura defensiva prudente' : 'Active geopolitical/war risk — defensive caution';
      }
    } else {
      macroVote = normalizedSignalDir;
    }

    // 4. Multi-Timeframe Agent
    const htfVote: 'CALL' | 'PUT' | 'AGUARDAR' = htf.aligned === 'BULLISH' ? 'CALL' : htf.aligned === 'BEARISH' ? 'PUT' : 'AGUARDAR';
    const htfStatus = htfVote === signal.dir && signal.dir !== 'AGUARDAR' ? 'APPROVED' : htf.aligned === 'NEUTRAL' ? 'CAUTION' : 'VETOED';

    // 5. Risk & Targets Agent (RR >= 1.8)
    const riskPassed = signal.riskReward >= 1.8 && signal.sl > 0;
    const riskVote: 'CALL' | 'PUT' | 'AGUARDAR' = riskPassed ? normalizedSignalDir : 'AGUARDAR';
    const riskStatus = riskPassed ? 'APPROVED' : 'CAUTION';

    // 6. Validator & Anti-Whipsaw Agent
    const isTradeActive = signal.status === 'ACTIVE_TRADE' || signal.status === 'TARGET_1_HIT' || signal.status === 'TARGET_2_HIT';
    let validatorStatus: 'APPROVED' | 'VETOED' | 'CAUTION' = 'APPROVED';
    let validatorRationale = '';

    if (isTradeActive) {
      validatorStatus = 'APPROVED';
      validatorRationale = isPt ? 'Operação em andamento travada no robô contra oscilações de ruído' : 'Active position locked against noisy flips';
    } else if (signal.dir === 'AGUARDAR') {
      validatorStatus = 'CAUTION';
      validatorRationale = isPt ? 'Aguardando confluência de pelo menos 80% do Conselho' : 'Waiting for 80% consensus confirmation';
    } else {
      validatorStatus = 'APPROVED';
      validatorRationale = isPt ? 'Confluência institucional verificada e validada' : 'Institutional confluence verified';
    }

    return [
      {
        id: 'smc',
        name: isPt ? 'Agente 1: Estrutura & SMC' : 'Agent 1: Structure & SMC',
        role: isPt ? 'Quebras de estrutura (BOS), FVG e Sweeps de liquidez' : 'BOS, Liquidity Sweeps & Order Blocks',
        vote: smcVote,
        status: smcStatus,
        keyMetric: smc.sweepDetected ? (smc.sweepDir || 'SWEEP DETECTADO') : (smc.choch ? `CHoCH ${smc.choch.direction}` : 'Estrutura Intacta'),
        rationale: smcVote === 'CALL' ? (isPt ? 'Liquidez vendedora varrida com rejeição compradora' : 'Sell-side liquidity swept') : smcVote === 'PUT' ? (isPt ? 'Liquidez compradora varrida com forte absorção' : 'Buy-side liquidity swept') : (isPt ? 'Sem rompimento limpo de estrutura' : 'No clean structure break'),
      },
      {
        id: 'orderflow',
        name: isPt ? 'Agente 2: Fluxo & Delta (CVD)' : 'Agent 2: Flow & Delta (CVD)',
        role: isPt ? 'Volume Delta Cumulativo e absorção de grandes players' : 'Cumulative Volume Delta & Whales Absorption',
        vote: deltaVote,
        status: deltaStatus,
        keyMetric: `CVD ${delta.cvdSlope} • Div: ${delta.divergence}`,
        rationale: delta.cvdSlope === 'UP' ? (isPt ? 'Agressão compradora dominante no book' : 'Dominant buyer aggression') : delta.cvdSlope === 'DOWN' ? (isPt ? 'Pressão vendedora contínua e absorção' : 'Heavy seller aggression') : (isPt ? 'Equilíbrio neutro de ordens' : 'Neutral orderflow'),
      },
      {
        id: 'macro',
        name: isPt ? 'Agente 3: Macro & Geopolítica' : 'Agent 3: Macro & Geopolitics',
        role: isPt ? 'Monitor de Guerra, Taxas de Juros, Inflação & Choques Globais' : 'War Monitor, Fed Rates, CPI & Global Shocks',
        vote: macroVote,
        status: macroStatus,
        keyMetric: geopoliticalAlert.active ? '⚠️ EVENTO GEOPOLÍTICO DETECTADO' : 'Mercado Estável',
        rationale: macroRationale,
      },
      {
        id: 'htf',
        name: isPt ? 'Agente 4: Multi-Timeframe' : 'Agent 4: Multi-Timeframe',
        role: isPt ? 'Harmonia entre 1D, 4H, 1H, 15m e 5m' : 'Alignment across 1D, 4H, 1H, 15m and 5m',
        vote: htfVote,
        status: htfStatus,
        keyMetric: `Alinhamento HTF: ${htf.alignmentScore}% (${htf.aligned})`,
        rationale: htf.aligned !== 'NEUTRAL' ? (isPt ? `Tendência primária institucional alinhada em ${htf.aligned}` : `Primary trend aligned ${htf.aligned}`) : (isPt ? 'Timeframes superiores em divergência' : 'Higher timeframes diverging'),
      },
      {
        id: 'risk',
        name: isPt ? 'Agente 5: Gestor de Risco & Alvos' : 'Agent 5: Risk & Target Manager',
        role: isPt ? 'Relação R:R >= 1:1.8, Trailing Stop e Metas Parciais' : 'RR >= 1:1.8, Trailing Stop & Targets',
        vote: riskVote,
        status: riskStatus,
        keyMetric: `R:R 1:${signal.riskReward.toFixed(1)} • TP1: ${signal.tp1.toFixed(1)}`,
        rationale: riskPassed ? (isPt ? `Setup com retorno assimétrico favorável (1:${signal.riskReward.toFixed(1)})` : `Asymmetric risk/reward passed`) : (isPt ? 'Risco desfavorável ou stop excessivamente exposto' : 'Poor risk-reward ratio'),
      },
      {
        id: 'validator',
        name: isPt ? 'Agente 6: Validador & Anti-Whipsaw' : 'Agent 6: Anti-Whipsaw Validator',
        role: isPt ? 'Consenso final e trava anti-inversão espúria de sinais' : 'Consensus enforcement & noise lock',
        vote: normalizedSignalDir,
        status: validatorStatus,
        keyMetric: signal.status === 'ACTIVE_TRADE' ? '🔒 POSIÇÃO TRAVADA' : 'AUDITANDO CONEXÕES',
        rationale: validatorRationale,
      },
    ];
  }, [smc, delta, htf, signal, geopoliticalAlert, isPt, symbol]);

  // Calculate consensus percentage
  const consensusApproved = agents.filter((a) => a.status === 'APPROVED').length;
  const consensusScore = Math.round((consensusApproved / agents.length) * 100);

  return (
    <div className="bg-[#07071a] border border-[#1a1a44] rounded-xl p-3.5 sm:p-4 flex flex-col gap-3.5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#151538] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#ce93d8]/15 border border-[#ce93d8]/30 flex items-center justify-center text-[#ce93d8]">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white tracking-wider flex items-center gap-2">
              <span>{isPt ? 'CONSELHO MULTI-AGENTE DE IA' : 'MULTI-AGENT AI ASSEMBLY'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-[#ce93d8]/20 text-[#ce93d8] border border-[#ce93d8]/30">
                6 QUANTS
              </span>
            </h3>
            <p className="text-[10px] text-[#7070a0]">
              {isPt
                ? `Análise simultânea de ${sym} por 6 agentes especialistas com poder de veto`
                : `Simultaneous audit of ${sym} by 6 specialized quant agents`}
            </p>
          </div>
        </div>

        {/* Consensus Meter */}
        <div className="text-right font-mono">
          <div className="text-[10px] text-[#707090]">
            {isPt ? 'Consenso Institucional' : 'Consensus Score'}
          </div>
          <div className="text-sm sm:text-base font-bold flex items-center gap-1.5 justify-end">
            <span className={consensusScore >= 80 ? 'text-[#00e676]' : consensusScore >= 50 ? 'text-[#ffd54f]' : 'text-[#ff5252]'}>
              {consensusScore}%
            </span>
            <span className="text-[10px] text-[#606090]">({consensusApproved}/6)</span>
          </div>
        </div>
      </div>

      {/* Geopolitical Alert Banner if active */}
      {geopoliticalAlert.active && (
        <div className="p-2.5 rounded-lg bg-[#ff3d00]/10 border border-[#ff3d00]/30 flex items-start gap-2 text-xs text-[#ffab91] animate-in fade-in duration-300">
          <AlertTriangle className="w-4 h-4 text-[#ff5252] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-bold text-[#ff5252] flex items-center gap-2">
              <span>{isPt ? 'ALERTA DE RISCO MACRO / GEOPOLÍTICO' : 'GEOPOLITICAL / MACRO EVENT DETECTED'}</span>
              <span className="text-[9px] px-1 py-0.2 bg-[#ff5252]/20 rounded font-mono">
                {geopoliticalAlert.impact}
              </span>
            </div>
            <div className="text-[11px] text-[#c0a0a0] truncate mt-0.5">
              "{geopoliticalAlert.title}"
            </div>
            <div className="text-[10px] text-[#e57373] mt-1 font-mono">
              {isPt
                ? 'Agente 3 e Agente 6 adaptaram a sensibilidade do robô para proteger contra reversões causadas por notícias.'
                : 'Agents 3 and 6 engaged defensive filters to prevent news-driven whipsaws.'}
            </div>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {agents.map((agent) => {
          const isApproved = agent.status === 'APPROVED';
          const isVetoed = agent.status === 'VETOED';
          return (
            <div
              key={agent.id}
              className={`p-2.5 rounded-lg border transition-all ${
                isApproved
                  ? 'bg-[#0a0a26] border-[#1e1e50]'
                  : isVetoed
                  ? 'bg-[#1e0a0a] border-[#ff5252]/30'
                  : 'bg-[#151528] border-[#252548]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  {agent.id === 'validator' ? (
                    <Scale className="w-3.5 h-3.5 text-[#ce93d8]" />
                  ) : agent.id === 'macro' ? (
                    <Globe className="w-3.5 h-3.5 text-[#ffd54f]" />
                  ) : agent.id === 'orderflow' ? (
                    <Activity className="w-3.5 h-3.5 text-[#00e676]" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-[#4dd0e1]" />
                  )}
                  {agent.name}
                </span>

                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 ${
                  isApproved
                    ? 'bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30'
                    : isVetoed
                    ? 'bg-[#ff5252]/15 text-[#ff5252] border border-[#ff5252]/30'
                    : 'bg-[#ffd54f]/15 text-[#ffd54f] border border-[#ffd54f]/30'
                }`}>
                  {isApproved ? <CheckCircle className="w-3 h-3" /> : isVetoed ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {agent.status}
                </span>
              </div>

              <div className="text-[10px] text-[#7070a0] mb-1.5 truncate">
                {agent.role}
              </div>

              <div className="p-1.5 rounded bg-[#050514] border border-[#141432] text-[10px] font-mono flex items-center justify-between text-[#a0a0c8] mb-1">
                <span>{isPt ? 'Métrica Chave:' : 'Key Metric:'}</span>
                <span className="text-white font-bold">{agent.keyMetric}</span>
              </div>

              <div className="text-[10px] text-[#9090b8] italic">
                "{agent.rationale}"
              </div>
            </div>
          );
        })}
      </div>

      {/* Assembly Verdict Footer */}
      <div className="p-2.5 rounded-lg bg-[#050514] border border-[#18183c] flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#ce93d8]" />
          <span className="text-[11px] text-[#a0a0c0]">
            {isPt ? 'Veredito Final do Conselho:' : 'Assembly Consensus Verdict:'}{' '}
            <strong className={`font-mono ${signal.dir === 'CALL' ? 'text-[#00e676]' : signal.dir === 'PUT' ? 'text-[#ff5252]' : 'text-[#ffd54f]'}`}>
              {signal.dir === 'CALL' ? 'CALL (COMPRA AUTORIZADA)' : signal.dir === 'PUT' ? 'PUT (VENDA AUTORIZADA)' : 'AGUARDAR (PROTEÇÃO ATIVA)'}
            </strong>
          </span>
        </div>

        <div className="text-[10px] text-[#707090] font-mono">
          {signal.statusMessage}
        </div>
      </div>
    </div>
  );
};
