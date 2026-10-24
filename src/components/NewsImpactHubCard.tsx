import React, { useState, useMemo } from 'react';
import { Newspaper, Flame, Globe, AlertTriangle, ShieldAlert, ArrowUpRight, ArrowDownRight, Filter, ExternalLink, Zap } from 'lucide-react';
import { NewsItem, WhaleEvent } from '../types/terminal';

interface NewsImpactHubCardProps {
  news: NewsItem[];
  whales: WhaleEvent[];
  lang: 'pt' | 'en';
}

interface TranslatedNewsItem {
  id: string;
  originalTitle: string;
  translatedTitle: string;
  source: string;
  timestamp: number;
  impactLevel: 'EXTREMO' | 'ALTO' | 'MÉDIO' | 'BAIXO';
  category: 'GEOPOLITICA' | 'MACRO' | 'REGULACAO' | 'ONCHAIN';
  affectedAssets: string[];
  tradingGuidance: string;
  isWarRelated: boolean;
}

export const NewsImpactHubCard: React.FC<NewsImpactHubCardProps> = ({
  news,
  whales,
  lang,
}) => {
  const isPt = lang === 'pt';
  const [activeTab, setActiveTab] = useState<'ALL' | 'GEOPOLITICA' | 'MACRO' | 'WHALES'>('ALL');

  // Translate and enrich incoming news items with market impacts and affected assets
  const enrichedNews: TranslatedNewsItem[] = useMemo(() => {
    return news.map((item, idx) => {
      const titleLower = item.title.toLowerCase();

      // Detection rules
      const isWar =
        titleLower.includes('war') ||
        titleLower.includes('conflict') ||
        titleLower.includes('missile') ||
        titleLower.includes('attack') ||
        titleLower.includes('military') ||
        titleLower.includes('tensions') ||
        titleLower.includes('iran') ||
        titleLower.includes('russia') ||
        titleLower.includes('ukraine') ||
        titleLower.includes('middle east');

      const isMacro =
        titleLower.includes('fed') ||
        titleLower.includes('powell') ||
        titleLower.includes('rate') ||
        titleLower.includes('inflation') ||
        titleLower.includes('cpi') ||
        titleLower.includes('yield') ||
        titleLower.includes('dollar') ||
        titleLower.includes('treasury');

      const isReg =
        titleLower.includes('sec') ||
        titleLower.includes('etf') ||
        titleLower.includes('court') ||
        titleLower.includes('legal') ||
        titleLower.includes('binance') ||
        titleLower.includes('gensler');

      let category: 'GEOPOLITICA' | 'MACRO' | 'REGULACAO' | 'ONCHAIN' = 'ONCHAIN';
      if (isWar) category = 'GEOPOLITICA';
      else if (isMacro) category = 'MACRO';
      else if (isReg) category = 'REGULACAO';

      // Determine affected assets
      const affected: string[] = [];
      if (isWar) {
        affected.push('XAU/USD', 'WTI/USD', 'BTC/USDT', 'DXY');
      } else if (isMacro) {
        affected.push('BTC/USDT', 'EUR/USD', 'SPX500', 'DXY');
      } else if (titleLower.includes('eth') || titleLower.includes('ethereum')) {
        affected.push('ETH/USDT', 'OP/USDT', 'ARB/USDT');
      } else if (titleLower.includes('sol') || titleLower.includes('solana')) {
        affected.push('SOL/USDT', 'JTO/USDT', 'RAY/USDT');
      } else if (titleLower.includes('xrp') || titleLower.includes('ripple')) {
        affected.push('XRP/USDT');
      } else if (titleLower.includes('doge') || titleLower.includes('meme')) {
        affected.push('DOGE/USDT', 'PEPE/USDT', 'SHIB/USDT');
      } else {
        affected.push('BTC/USDT', 'MERCADO GERAL');
      }

      // Determine translated title & trading guidance
      let translatedTitle = item.title;
      let guidance = isPt ? 'Volatilidade moderada. Aguardar confirmação de rompimento.' : 'Moderate volatility expected.';
      let impactLevel: 'EXTREMO' | 'ALTO' | 'MÉDIO' | 'BAIXO' = 'MÉDIO';

      if (isWar) {
        impactLevel = 'EXTREMO';
        translatedTitle = `[ALERTA GEOPOLÍTICO] Tensões militares e risco global impactam mercados e commodities: ${item.title}`;
        guidance = isPt
          ? '⚠️ RISCO DE CHOQUE: Disparo de volatilidade em Ouro e Petróleo. Robô opera em modo de máxima defesa.'
          : '⚠️ SHOCK RISK: Gold & Oil volatility spike. Defensive algorithms activated.';
      } else if (isMacro) {
        impactLevel = 'ALTO';
        translatedTitle = `[MACROECONOMIA & TAXAS] Dados monetários e política de juros: ${item.title}`;
        guidance = isPt
          ? 'Atenção aos spreads e liquidez antes de fechamento de velas operacionais.'
          : 'High impact on currency pairs and equity benchmarks.';
      } else if (item.impact === 'HIGH') {
        impactLevel = 'ALTO';
        guidance = isPt ? 'Forte fluxo de ordens detectado no livro institucional.' : 'Strong institutional orderflow.';
      }

      return {
        id: `news-${idx}-${item.timestamp}`,
        originalTitle: item.title,
        translatedTitle,
        source: item.source,
        timestamp: item.timestamp,
        impactLevel,
        category,
        affectedAssets: affected,
        tradingGuidance: guidance,
        isWarRelated: isWar,
      };
    });
  }, [news, isPt]);

  const warAlertPresent = enrichedNews.some((n) => n.isWarRelated);

  const filteredNews = useMemo(() => {
    if (activeTab === 'GEOPOLITICA') return enrichedNews.filter((n) => n.category === 'GEOPOLITICA');
    if (activeTab === 'MACRO') return enrichedNews.filter((n) => n.category === 'MACRO' || n.category === 'REGULACAO');
    return enrichedNews;
  }, [activeTab, enrichedNews]);

  return (
    <div className="bg-[#07071a] border border-[#1a1a44] rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#151538] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#ffd54f]/15 border border-[#ffd54f]/30 flex items-center justify-center text-[#ffd54f]">
            <Newspaper className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white tracking-wider flex items-center gap-2">
              <span>{isPt ? 'RADAR DE NOTÍCIAS & IMPACTO' : 'LIVE NEWS & IMPACT RADAR'}</span>
              <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-[#7070a0]">
              {isPt ? 'Tradução em tempo real e cálculo de impacto em ativos' : 'Real-time translation & asset impact calculation'}
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              activeTab === 'ALL' ? 'bg-[#ce93d8] text-black font-bold' : 'bg-[#101030] text-[#707090] hover:text-white'
            }`}
          >
            {isPt ? 'Todas' : 'All'}
          </button>
          <button
            onClick={() => setActiveTab('GEOPOLITICA')}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              activeTab === 'GEOPOLITICA' ? 'bg-[#ff5252] text-white font-bold' : 'bg-[#101030] text-[#707090] hover:text-white'
            }`}
          >
            {isPt ? 'Guerra' : 'War'}
          </button>
          <button
            onClick={() => setActiveTab('MACRO')}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              activeTab === 'MACRO' ? 'bg-[#ffd54f] text-black font-bold' : 'bg-[#101030] text-[#707090] hover:text-white'
            }`}
          >
            Macro
          </button>
          <button
            onClick={() => setActiveTab('WHALES')}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${
              activeTab === 'WHALES' ? 'bg-[#4dd0e1] text-black font-bold' : 'bg-[#101030] text-[#707090] hover:text-white'
            }`}
          >
            {isPt ? 'Baleias' : 'Whales'}
          </button>
        </div>
      </div>

      {/* Geopolitical Risk Warning Header if triggered */}
      {warAlertPresent && (
        <div className="p-2.5 rounded-lg bg-[#ff1744]/15 border border-[#ff1744]/40 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-[#ff5252] shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs">
            <div className="font-bold text-[#ff5252] flex items-center gap-2">
              <span>{isPt ? 'ALERTA DE ALTA VOLATILIDADE / CONFLITO BÉLICO' : 'HIGH VOLATILITY / WAR RISK ALERT'}</span>
            </div>
            <div className="text-[11px] text-[#e0a0a0] mt-0.5">
              {isPt
                ? 'Notícias geopolíticas extremas detectadas. Pares com Ouro (XAU/USD), Petróleo (WTI) e Criptos sob regime de proteção do robô.'
                : 'Geopolitical events detected. Gold, Oil and Crypto pairs under defensive volatility filters.'}
            </div>
          </div>
        </div>
      )}

      {/* Content based on Tab */}
      {activeTab === 'WHALES' ? (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {whales.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#606090]">
              {isPt ? 'Monitorando fluxo institucional de baleias...' : 'Tracking institutional whales...'}
            </div>
          ) : (
            whales.map((w, i) => (
              <div
                key={i}
                className="p-2 rounded-lg bg-[#0a0a24] border border-[#1c1c44] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${w.impact === 'BULLISH' ? 'bg-[#00e676]' : 'bg-[#ff5252]'}`}></span>
                  <div>
                    <div className="font-bold text-white font-mono">
                      {w.amount.toFixed(2)} BTC ({(w.amountUsd / 1e6).toFixed(2)}M USD)
                    </div>
                    <div className="text-[10px] text-[#7070a0]">{w.reason}</div>
                  </div>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                  w.impact === 'BULLISH' ? 'bg-[#00e676]/15 text-[#00e676]' : 'bg-[#ff5252]/15 text-[#ff5252]'
                }`}>
                  {w.impact}
                </span>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {filteredNews.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#606090]">
              {isPt ? 'Nenhuma notícia nesta categoria no momento.' : 'No news in this category.'}
            </div>
          ) : (
            filteredNews.map((n) => (
              <div
                key={n.id}
                className={`p-2.5 rounded-lg border transition-all ${
                  n.impactLevel === 'EXTREMO'
                    ? 'bg-[#180a0a] border-[#ff5252]/40'
                    : n.impactLevel === 'ALTO'
                    ? 'bg-[#141005] border-[#ffd54f]/30'
                    : 'bg-[#0a0a22] border-[#18183c]'
                }`}
              >
                {/* Meta row */}
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                      n.impactLevel === 'EXTREMO'
                        ? 'bg-[#ff5252]/20 text-[#ff5252] border border-[#ff5252]/40'
                        : n.impactLevel === 'ALTO'
                        ? 'bg-[#ffd54f]/20 text-[#ffd54f] border border-[#ffd54f]/40'
                        : 'bg-[#4dd0e1]/10 text-[#4dd0e1] border border-[#4dd0e1]/30'
                    }`}>
                      IMPACTO {n.impactLevel}
                    </span>

                    <span className="text-[10px] text-[#606090] font-mono">
                      {n.source}
                    </span>
                  </div>

                  <span className="text-[9px] text-[#505078] font-mono">
                    {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* News Title */}
                <div className="text-xs font-semibold text-white leading-snug mb-1.5">
                  {n.translatedTitle}
                </div>

                {/* Affected Assets Badges */}
                <div className="flex items-center gap-1 flex-wrap mb-1.5">
                  <span className="text-[9px] text-[#7070a0] font-mono">
                    {isPt ? 'Ativos afetados:' : 'Affected:'}
                  </span>
                  {n.affectedAssets.map((assetBadge, bIdx) => (
                    <span
                      key={bIdx}
                      className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#141438] text-[#ce93d8] border border-[#2a2a60]"
                    >
                      {assetBadge}
                    </span>
                  ))}
                </div>

                {/* Trading Guidance */}
                <div className="p-1.5 rounded bg-[#04040e] border border-[#141430] text-[10px] font-mono text-[#a0a0c0]">
                  💡 {n.tradingGuidance}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
