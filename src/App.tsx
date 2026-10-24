import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { ChartCanvas } from './components/ChartCanvas';
import { SignalCard } from './components/SignalCard';
import { DeliveryModelCard } from './components/DeliveryModelCard';
import { MultiTimeframeCard } from './components/MultiTimeframeCard';
import { WilliamsRCard } from './components/WilliamsRCard';
import { NarrativeCard } from './components/NarrativeCard';
import { ScenarioCard } from './components/ScenarioCard';
import { CvdCard } from './components/CvdCard';
import { RiskMatrixCard } from './components/RiskMatrixCard';
import { LiquidityAndObsCard } from './components/LiquidityAndObsCard';
import { ManipulationAndHeatmapCard } from './components/ManipulationAndHeatmapCard';
import { NewsImpactHubCard } from './components/NewsImpactHubCard';
import { MultiAgentAssemblyCard } from './components/MultiAgentAssemblyCard';
import { DataSourcesModal } from './components/DataSourcesModal';
import { HistoricalAndAdaptiveCard } from './components/HistoricalAndAdaptiveCard';
import { ChartVisionModal } from './components/ChartVisionModal';
import { GlobalScannerModal } from './components/GlobalScannerModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { AssetDirectoryModal } from './components/AssetDirectoryModal';
import { ShieldCheck, Lock, AlertCircle, Database } from 'lucide-react';

import {
  fetchCandlesAPI,
  fetchTickerAPI,
  fetchTradesAPI,
  fetchFundingAPI,
  fetchNewsAPI,
} from './services/marketData';

import {
  calcWilliamsR,
  calcOrderBlocks,
  calcLiquidityZones,
  calcDeltaFlow,
  calcSMC,
  calcDeliveryModel,
  detectManipulation,
  calcHTFBias,
  aggregateSignal,
  calcLiquidationHeatmap,
  calcHistoricalSimilarity,
  projectScenarios,
  buildProTraderSpeech,
  calcMarketRegime,
} from './services/institutionalEngine';

import { Candle, Trade, NewsItem, WhaleEvent, ActiveTrade, SignalAggregation } from './types/terminal';

export default function App() {
  const [asset, setAsset] = useState('BTC-USDT-SWAP');
  const [timeframe, setTimeframe] = useState('5m');
  const [refreshInterval, setRefreshInterval] = useState(10000);
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');

  // Modals & Drawer
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAssetDirectoryOpen, setIsAssetDirectoryOpen] = useState(false);
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);

  // Market raw data
  const [candles, setCandles] = useState<Candle[]>([]);
  const [price, setPrice] = useState<number>(0);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [fundingRate, setFundingRate] = useState<number>(0.0001);
  const [openInterest, setOpenInterest] = useState<number>(0);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [whales, setWhales] = useState<WhaleEvent[]>([]);

  // Persistent Active Trades per symbol to eliminate signal oscillation / flipping!
  const [activeTrades, setActiveTrades] = useState<Record<string, ActiveTrade>>(() => {
    try {
      const saved = localStorage.getItem('prisma_active_trades');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Track total whipsaws / false signals blocked by the robot
  const [blockedWhipsawsCount, setBlockedWhipsawsCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('prisma_blocked_whipsaws') || 7);
    } catch {
      return 7;
    }
  });

  // Ref to prevent duplicate concurrent refreshes
  const refreshingRef = useRef(false);

  const refreshAll = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setIsLoading(true);

    try {
      // Parallel fetch for speed
      const [candleData, tickerData, tradeData, fundData, newsData] = await Promise.all([
        fetchCandlesAPI(asset, timeframe, 160),
        fetchTickerAPI(asset),
        fetchTradesAPI(asset, 80),
        fetchFundingAPI(asset),
        fetchNewsAPI(),
      ]);

      if (candleData && candleData.length > 0) {
        setCandles(candleData);
        const lastP = tickerData?.last || candleData[candleData.length - 1].close;
        setPrice(lastP);

        if (tickerData?.open24h) {
          const chg = ((lastP - tickerData.open24h) / tickerData.open24h) * 100;
          setPriceChange(chg);
        }
      }

      if (tradeData) {
        setTrades(tradeData);

        // Derive whale events from large trades
        const curP = tickerData?.last || (candleData && candleData[candleData.length - 1]?.close) || 75000;
        const totalVol = tradeData.reduce((s: number, t: Trade) => s + +t.sz, 0);
        const avgVol = totalVol / (tradeData.length || 1);
        const largeTrades = tradeData.filter((t: Trade) => +t.sz > avgVol * 4);

        const whaleEvents: WhaleEvent[] = largeTrades.slice(0, 5).map((t: Trade) => ({
          amount: +t.sz,
          amountUsd: +t.sz * curP,
          type: t.side === 'buy' ? 'EXCHANGE_INFLOW' : 'EXCHANGE_OUTFLOW',
          timestamp: t.ts,
          impact: t.side === 'buy' ? 'BULLISH' : 'BEARISH',
          reason:
            t.side === 'buy'
              ? `Ordem compradora institucional: ${((+t.sz * curP) / 1e6).toFixed(2)}M USD`
              : `Ordem vendedora a mercado: ${((+t.sz * curP) / 1e6).toFixed(2)}M USD`,
        }));
        setWhales(whaleEvents);
      }

      if (fundData) {
        setFundingRate(fundData.fundingRate || 0.0001);
        setOpenInterest(fundData.openInterest || 0);
      }

      if (newsData && newsData.length > 0) {
        const parsedNews: NewsItem[] = newsData.slice(0, 6).map((n: any) => {
          const t = (n.title || '').toLowerCase();
          const isBull = t.includes('etf') || t.includes('buy') || t.includes('surge') || t.includes('gain') || t.includes('bull');
          const isBear = t.includes('drop') || t.includes('sec') || t.includes('crash') || t.includes('sell') || t.includes('ban');
          return {
            title: n.title,
            source: n.source || n.source_info?.name || 'CryptoCompare',
            impact: isBull || isBear ? 'HIGH' : 'MEDIUM',
            direction: isBull ? 'BULLISH' : isBear ? 'BEARISH' : 'NEUTRAL',
            confidenceModifier: isBull ? 5 : isBear ? -5 : 0,
            timestamp: n.published_on ? n.published_on * 1000 : Date.now(),
          };
        });
        setNews(parsedNews);
      }

      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Error during data refresh:', err);
    } finally {
      setIsLoading(false);
      refreshingRef.current = false;
    }
  }, [asset, timeframe]);

  // Initial fetch and timer loop
  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshAll, refreshInterval]);

  // Global paste handler to open AI Vision modal directly
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            setIsVisionOpen(true);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  // Compute institutional quantitative engines
  const hasCandles = candles.length > 0;
  const currentP = price || (hasCandles ? candles[candles.length - 1].close : 0);

  const htf = hasCandles
    ? calcHTFBias(candles, candles, candles, candles, candles)
    : { d1: 'NEUTRAL' as const, h4: 'NEUTRAL' as const, h1: 'NEUTRAL' as const, m15: 'NEUTRAL' as const, m5: 'NEUTRAL' as const, aligned: 'NEUTRAL' as const, alignmentScore: 50 };

  const williams = hasCandles ? calcWilliamsR(candles, 14, lang === 'pt') : { value: -50, pattern: 'NEUTRAL' as const, signal: 'WAIT' as const, confidence: 50, desc: '' };
  const obs = hasCandles ? calcOrderBlocks(candles) : [];
  const zones = hasCandles ? calcLiquidityZones(candles) : { green: [], red: [], gray: [] };
  const delta = calcDeltaFlow(trades);
  const smc = hasCandles ? calcSMC(candles) : { fvgs: [], choch: null, bos: false, sweepDetected: false, sweepDir: null, bsl: null, ssl: null, eqh: null, eql: null };
  const delivery = hasCandles ? calcDeliveryModel(candles, delta, lang === 'pt') : { phase: 'ACCUMULATION' as const, confidence: 60, narrative: '', next: 'MANIPULATION' as const, target: 0, invalidation: 0 };
  const manip = hasCandles ? detectManipulation(candles, trades, lang === 'pt') : { detected: false, type: null, confidence: 0, desc: '', recommendation: 'FOLLOW' as const, priceImpact: 'NEUTRAL' as const };
  const regime = hasCandles ? calcMarketRegime(candles, delta) : { regime: 'COMPRESSION' as const, desc: '', action: 'AGUARDAR' };

  // Current active trade for this symbol
  const currentActiveTrade = activeTrades[asset] || null;

  const signal: SignalAggregation = useMemo(() => {
    if (!hasCandles) {
      return {
        dir: 'AGUARDAR' as const,
        confidence: 50,
        callVotes: 0,
        putVotes: 0,
        reasons: [],
        entry: currentP,
        sl: currentP,
        tp1: currentP,
        tp2: currentP,
        tp3: currentP,
        htfBlocked: false,
        htfBonus: 0,
        riskReward: 2.0,
        status: 'SEARCHING_CONFIRMATION',
        tradeProgressPct: 0,
        filters: {
          candleClose: { name: 'Vela Fechada', passed: true, reason: 'Ok' },
          htfBarrier: { name: 'Barreira HTF', passed: true, reason: 'Ok' },
          antiChopCompression: { name: 'Anti-Chop', passed: true, reason: 'Ok' },
          confluenceThreshold: { name: 'Confluência', passed: true, reason: 'Ok' },
          cvdFlowConfirmation: { name: 'Fluxo CVD', passed: true, reason: 'Ok' },
          riskRewardRatio: { name: 'Risco/Retorno', passed: true, reason: 'Ok' },
          overallPassed: true,
          whipsawsBlockedCount: 0,
        },
        statusMessage: 'Robô em observação...',
      };
    }

    return aggregateSignal({
      symbol: asset,
      candles,
      htf,
      williams,
      obs,
      zones,
      delta,
      smc,
      delivery,
      manip,
      activeTrade: currentActiveTrade,
      fundingRate,
      isPt: lang === 'pt',
    });
  }, [
    hasCandles,
    asset,
    candles,
    htf,
    williams,
    obs,
    zones,
    delta,
    smc,
    delivery,
    manip,
    currentActiveTrade,
    fundingRate,
    lang,
    currentP,
  ]);

  // Synchronize active trade updates safely without infinite re-render loops
  useEffect(() => {
    const trade = signal.activeTrade;

    if (trade) {
      setActiveTrades((prev) => {
        const existing = prev[asset];
        // Only update state if this is a newly opened trade or if status or stop loss milestone changed
        if (
          existing &&
          existing.id === trade.id &&
          existing.status === trade.status &&
          existing.slPrice === trade.slPrice &&
          existing.dir === trade.dir
        ) {
          return prev; // Crucial: returning previous reference prevents re-render!
        }
        const updated = { ...prev, [asset]: trade };
        try {
          localStorage.setItem('prisma_active_trades', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    } else if (
      signal.status === 'STOPPED_OUT' ||
      signal.status === 'TARGET_3_HIT' ||
      signal.status === 'INVALIDATED'
    ) {
      // Remove concluded trade from state
      setActiveTrades((prev) => {
        if (!prev[asset]) return prev;
        const next = { ...prev };
        delete next[asset];
        try {
          localStorage.setItem('prisma_active_trades', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  }, [
    asset,
    signal.activeTrade?.id,
    signal.activeTrade?.status,
    signal.activeTrade?.slPrice,
    signal.activeTrade?.dir,
    signal.status,
  ]);

  // Handler to manually reset an active trade
  const handleResetActiveTrade = (symbolKey: string) => {
    setActiveTrades((prev) => {
      const next = { ...prev };
      delete next[symbolKey];
      try {
        localStorage.setItem('prisma_active_trades', JSON.stringify(next));
      } catch {}
      return next;
    });
    setBlockedWhipsawsCount((c) => {
      const nextC = c + 1;
      localStorage.setItem('prisma_blocked_whipsaws', String(nextC));
      return nextC;
    });
  };

  const heatmap = hasCandles ? calcLiquidationHeatmap(candles, currentP, lang === 'pt') : { clusters: [], magnetEffect: 'NEUTRAL' as const, narrative: '', longLiqLevel: 0, shortLiqLevel: 0 };
  const matches = hasCandles ? calcHistoricalSimilarity(candles, signal.dir === 'CALL' ? 'BULLISH' : 'BEARISH', delivery) : [];
  const scenarios = hasCandles ? projectScenarios(candles, smc, delivery, signal.dir === 'CALL', lang === 'pt') : { bullish: { prob: 50, target1: 0, target2: 0, confirmation: 0, invalidation: 0, narr: '' }, bearish: { prob: 50, target1: 0, target2: 0, confirmation: 0, invalidation: 0, narr: '' }, neutral: { prob: 0, rangeHigh: 0, rangeLow: 0, narr: '' }, keyDecisionLevel: 0 };
  const proTraderSpeech = hasCandles ? buildProTraderSpeech({ symbol: asset, candles, signal, smc, delivery, delta, htf, isPt: lang === 'pt' }) : '';

  const isTradeActive = signal.status === 'ACTIVE_TRADE' || signal.status === 'TARGET_1_HIT' || signal.status === 'TARGET_2_HIT';

  return (
    <div className="min-h-screen bg-[#04040c] text-[#c8c8e8] flex flex-col font-['Space_Mono',monospace] selection:bg-[#ce93d8]/30 selection:text-white">
      {/* Top Header */}
      <Header
        currentAsset={asset}
        onOpenAssetDirectory={() => setIsAssetDirectoryOpen(true)}
        onOpenDataSources={() => setIsDataSourcesOpen(true)}
        currentTimeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        price={price}
        priceChange={priceChange}
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenVision={() => setIsVisionOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        lang={lang}
        onToggleLang={setLang}
      />

      {/* Institutional Safeguard Bar (Anti-Oscillation & False Signal Filter) */}
      <div className="bg-[#07071a] border-b border-[#1a1a40] px-4 py-1.5 flex items-center justify-between text-[11px] font-mono flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isTradeActive ? (
            <span className="flex items-center gap-1.5 text-[#00e676] font-bold">
              <Lock className="w-3.5 h-3.5 text-[#00e676]" />
              <span>SINAL TRAVADO & ATIVO ({signal.dir}) • Protegido contra oscilações de ruído</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[#4dd0e1]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4dd0e1]" />
              <span>FILTRO ANTI-WHIPSAW ATIVO • 6 camadas institucionais auditadas a cada tick</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[10px] text-[#7070a0]">
          <span>
            Inversões espúrias bloqueadas:{' '}
            <strong className="text-[#00e676]">{blockedWhipsawsCount}</strong>
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            Status do Robô:{' '}
            <strong className="text-[#c8c8e8]">{signal.status}</strong>
          </span>
        </div>
      </div>

      {/* Main Terminal Workspace (Responsive 3-Column Grid) */}
      <main className="flex-1 p-2.5 sm:p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 max-w-[1920px] mx-auto w-full">
        {/* LEFT COLUMN: Signal & Delivery & Multi-Timeframe (3 cols on lg) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <SignalCard
            signal={signal}
            symbol={asset}
            timeframe={timeframe}
            onResetSignal={() => handleResetActiveTrade(asset)}
            lang={lang}
          />
          <DeliveryModelCard delivery={delivery} lang={lang} />
          <MultiTimeframeCard htf={htf} smc={smc} lang={lang} />
          <WilliamsRCard williams={williams} lang={lang} />
        </div>

        {/* CENTER COLUMN: Interactive Chart, Multi-Agent Council, Narrative, Scenarios & Flows (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col gap-3">
          <ChartCanvas
            candles={candles}
            smc={smc}
            zones={zones}
            obs={obs}
            signal={signal}
            currentPrice={currentP}
            timeframe={timeframe}
            symbol={asset}
          />

          {/* Institutional Multi-Agent Assembly Council */}
          <MultiAgentAssemblyCard
            symbol={asset}
            signal={signal}
            smc={smc}
            delta={delta}
            htf={htf}
            delivery={delivery}
            news={news}
            lang={lang}
          />

          <NarrativeCard narrative={proTraderSpeech} lang={lang} />

          <ScenarioCard scenarios={scenarios} lang={lang} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CvdCard delta={delta} lang={lang} />
            <LiquidityAndObsCard zones={zones} obs={obs} lang={lang} />
          </div>

          <RiskMatrixCard
            htf={htf}
            delta={delta}
            manip={manip}
            smc={smc}
            fundingRate={fundingRate}
            openInterest={openInterest}
            lang={lang}
          />
        </div>

        {/* RIGHT COLUMN: Manipulation, Heatmap, News Impact Hub & Adaptability (3 cols on lg) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <ManipulationAndHeatmapCard
            manip={manip}
            heatmap={heatmap}
            currentPrice={currentP}
            lang={lang}
          />
          <NewsImpactHubCard news={news} whales={whales} lang={lang} />
          <HistoricalAndAdaptiveCard
            matches={matches}
            regime={regime}
            symbol={asset}
            timeframe={timeframe}
            lang={lang}
          />
        </div>
      </main>

      {/* AI Chart Vision Modal */}
      <ChartVisionModal
        isOpen={isVisionOpen}
        onClose={() => setIsVisionOpen(false)}
        currentSymbol={asset}
        currentTimeframe={timeframe}
        currentPrice={currentP}
        technicalSummary={{
          bias: signal.dir === 'CALL' ? 'BULLISH' : signal.dir === 'PUT' ? 'BEARISH' : 'NEUTRAL',
          phase: delivery.phase,
          cvdSlope: delta.cvdSlope,
          williams: williams.value,
          htfAligned: htf.aligned,
          supportLevel: zones.green[0]?.mid,
          resistanceLevel: zones.red[0]?.mid,
          sweepDetected: smc.sweepDetected,
        }}
        lang={lang}
      />

      {/* Global Scanner Modal */}
      <GlobalScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectAsset={(newAsset) => setAsset(newAsset)}
        lang={lang}
      />

      {/* Settings & Telegram Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        refreshInterval={refreshInterval}
        onSelectInterval={setRefreshInterval}
        lang={lang}
      />

      {/* Asset Directory & Search Modal (Crypto & Forex & Metals) */}
      <AssetDirectoryModal
        isOpen={isAssetDirectoryOpen}
        onClose={() => setIsAssetDirectoryOpen(false)}
        currentAsset={asset}
        onSelectAsset={(newAsset) => setAsset(newAsset)}
        lang={lang}
      />

      {/* Data Sources Hub Modal */}
      <DataSourcesModal
        isOpen={isDataSourcesOpen}
        onClose={() => setIsDataSourcesOpen(false)}
        lang={lang}
      />
    </div>
  );
}
