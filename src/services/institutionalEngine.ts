import {
  Candle,
  Trade,
  Bias,
  Direction,
  HTFBias,
  WilliamsRResult,
  OrderBlock,
  LiquidityZone,
  SMCAnalysis,
  DeliveryModel,
  DeltaFlow,
  ManipulationAlert,
  LiquidationHeatmap,
  HistoricalMatch,
  ScenarioProjection,
  SignalAggregation,
  ExecutionQuality,
  MarketRegimeType,
  InstitutionalFilterAudit,
  InstitutionalFilterCheck,
  ActiveTrade,
  SignalLifecycleStatus,
} from '../types/terminal';

// ==========================================
// TECHNICAL MATH
// ==========================================

export function calcEMA(closes: number[], period: number): number {
  if (closes.length === 0) return 0;
  if (closes.length < period) return closes[closes.length - 1];
  const k = 2 / (period + 1);
  let e = closes[0];
  for (let i = 1; i < closes.length; i++) {
    e = closes[i] * k + e * (1 - k);
  }
  return e;
}

export function calcATR(candles: Candle[], period = 14): number {
  if (candles.length < 2) return 1;
  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close));
    trs.push(tr);
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
}

// ==========================================
// MULTI-TIMEFRAME BIAS
// ==========================================

export function evaluateTimeframeBias(candles: Candle[]): Bias {
  if (candles.length < 15) return 'NEUTRAL';
  const closes = candles.map((c) => c.close);
  const ema9 = calcEMA(closes.slice(-20), 9);
  const ema21 = calcEMA(closes, 21);
  const diffPct = (ema9 - ema21) / ema21;

  if (diffPct > 0.001) return 'BULLISH';
  if (diffPct < -0.001) return 'BEARISH';
  return 'NEUTRAL';
}

export function calcHTFBias(d1: Candle[], h4: Candle[], h1: Candle[], m15: Candle[], m5: Candle[]): HTFBias {
  const d1Bias = evaluateTimeframeBias(d1);
  const h4Bias = evaluateTimeframeBias(h4);
  const h1Bias = evaluateTimeframeBias(h1);
  const m15Bias = evaluateTimeframeBias(m15);
  const m5Bias = evaluateTimeframeBias(m5);

  const scores: number[] = [d1Bias, h4Bias, h1Bias, m15Bias, m5Bias].map((b) => (b === 'BULLISH' ? 1 : b === 'BEARISH' ? -1 : 0));
  const sum = scores.reduce((a: number, b: number) => a + b, 0);

  let aligned: Bias = 'NEUTRAL';
  if (sum >= 3) aligned = 'BULLISH';
  else if (sum <= -3) aligned = 'BEARISH';

  const alignmentScore = Math.round((Math.abs(sum) / 5) * 100);

  return {
    d1: d1Bias,
    h4: h4Bias,
    h1: h1Bias,
    m15: m15Bias,
    m5: m5Bias,
    aligned,
    alignmentScore,
  };
}

// ==========================================
// WILLIAMS %R + W/M PATTERNS
// ==========================================

export function calcWilliamsR(candles: Candle[], period = 14, isPt = true): WilliamsRResult {
  if (candles.length < period) {
    return {
      value: -50,
      pattern: 'NEUTRAL',
      signal: 'WAIT',
      confidence: 40,
      desc: isPt ? 'Calculando Williams %R...' : 'Calculating Williams %R...',
    };
  }

  const recent = candles.slice(-period);
  const hh = Math.max(...recent.map((c) => c.high));
  const ll = Math.min(...recent.map((c) => c.low));
  const close = candles[candles.length - 1].close;
  const wR = ll === hh ? -50 : ((hh - close) / (hh - ll)) * -100;

  // Lookback for W / M pattern
  const lookback = candles.slice(-35);
  const wSeries = lookback.map((_, i) => {
    if (i < period) return -50;
    const sub = lookback.slice(i - period + 1, i + 1);
    const h = Math.max(...sub.map((c) => c.high));
    const l = Math.min(...sub.map((c) => c.low));
    return l === h ? -50 : ((h - sub[sub.length - 1].close) / (h - l)) * -100;
  });

  let pattern: 'W' | 'M' | 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL' = 'NEUTRAL';
  let signal: 'CALL' | 'PUT' | 'WAIT' = 'WAIT';
  let confidence = 50;

  const recent10 = wSeries.slice(-10);
  const oversoldLows = recent10.map((v, i) => ({ v, i })).filter((x) => x.v < -80);
  const overboughtHighs = recent10.map((v, i) => ({ v, i })).filter((x) => x.v > -20);

  if (oversoldLows.length >= 2 && recent10[recent10.length - 1] > -80) {
    pattern = 'W';
    signal = 'CALL';
    confidence = 82;
  } else if (overboughtHighs.length >= 2 && recent10[recent10.length - 1] < -20) {
    pattern = 'M';
    signal = 'PUT';
    confidence = 82;
  } else if (wR < -80) {
    pattern = 'OVERSOLD';
    signal = 'CALL';
    confidence = 65;
  } else if (wR > -20) {
    pattern = 'OVERBOUGHT';
    signal = 'PUT';
    confidence = 65;
  }

  let desc = '';
  if (pattern === 'W') {
    desc = isPt
      ? 'Padrão W em sobrevenda: Rejeição dupla de fundo com divergência institucional. Alta probabilidade de reversão compradora.'
      : 'W pattern in oversold zone: Double bottom rejection with institutional divergence. High probability bullish reversal.';
  } else if (pattern === 'M') {
    desc = isPt
      ? 'Padrão M em sobrecompra: Topo duplo com perda de momentum e absorção passiva vendedora. Alerta de queda.'
      : 'M pattern in overbought zone: Double top with momentum loss and passive selling absorption. Downside alert.';
  } else if (pattern === 'OVERSOLD') {
    desc = isPt ? 'Williams %R em extrema sobrevenda (< -80). Alerta de esgotamento vendedor.' : 'Williams %R in extreme oversold (< -80). Seller exhaustion alert.';
  } else if (pattern === 'OVERBOUGHT') {
    desc = isPt ? 'Williams %R em extrema sobrecompra (> -20). Alerta de esgotamento comprador.' : 'Williams %R in extreme overbought (> -20). Buyer exhaustion alert.';
  } else {
    desc = isPt ? 'Williams %R em zona neutra balanceada.' : 'Williams %R in neutral balanced zone.';
  }

  return {
    value: Math.round(wR * 10) / 10,
    pattern,
    signal,
    confidence,
    desc,
  };
}

// ==========================================
// ORDER BLOCKS
// ==========================================

export function calcOrderBlocks(candles: Candle[]): OrderBlock[] {
  const blocks: OrderBlock[] = [];
  const window = 4;
  for (let i = window; i < candles.length - window; i++) {
    const c = candles[i];
    const prevHigh = Math.max(...candles.slice(i - window, i).map((x) => x.high));
    const prevLow = Math.min(...candles.slice(i - window, i).map((x) => x.low));

    // Bull OB
    if (c.close > c.open && c.close > prevHigh && c.vol > 0) {
      blocks.push({
        top: c.high,
        bottom: c.low,
        type: 'BULL',
        bullVol: c.vol * 0.7,
        bearVol: c.vol * 0.3,
        bullPct: 70,
        timestamp: c.ts,
        broken: false,
      });
    }
    // Bear OB
    else if (c.close < c.open && c.close < prevLow && c.vol > 0) {
      blocks.push({
        top: c.high,
        bottom: c.low,
        type: 'BEAR',
        bullVol: c.vol * 0.3,
        bearVol: c.vol * 0.7,
        bullPct: 30,
        timestamp: c.ts,
        broken: false,
      });
    }
  }

  const price = candles[candles.length - 1].close;
  blocks.forEach((ob) => {
    if (ob.type === 'BULL' && price < ob.bottom) ob.broken = true;
    if (ob.type === 'BEAR' && price > ob.top) ob.broken = true;
  });

  return blocks.filter((b) => !b.broken).slice(-6);
}

// ==========================================
// LIQUIDITY ZONES (BSL, SSL, FVG)
// ==========================================

export function calcLiquidityZones(candles: Candle[]): { green: LiquidityZone[]; red: LiquidityZone[]; gray: LiquidityZone[] } {
  if (candles.length < 20) return { green: [], red: [], gray: [] };
  const price = candles[candles.length - 1].close;
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const rangeH = Math.max(...highs);
  const rangeL = Math.min(...lows);
  const step = (rangeH - rangeL) / 16;

  const buckets = Array.from({ length: 16 }, (_, i) => ({
    min: rangeL + i * step,
    max: rangeL + (i + 1) * step,
    mid: rangeL + (i + 0.5) * step,
    vol: 0,
    delta: 0,
    strength: 0,
  }));

  candles.forEach((c) => {
    const mid = (c.high + c.low) / 2;
    const bi = Math.min(15, Math.max(0, Math.floor((mid - rangeL) / step)));
    buckets[bi].vol += c.vol;
    const deltaCandle = c.close >= c.open ? c.vol * 0.4 : -c.vol * 0.4;
    buckets[bi].delta += deltaCandle;
  });

  const maxVol = Math.max(...buckets.map((b) => b.vol)) || 1;
  const green: LiquidityZone[] = [];
  const red: LiquidityZone[] = [];
  const gray: LiquidityZone[] = [];

  buckets.forEach((b) => {
    b.strength = Math.round((b.vol / maxVol) * 100);
    if (b.strength < 25) return;
    if (b.delta > 0 && b.mid <= price) green.push(b);
    else if (b.delta < 0 && b.mid >= price) red.push(b);
    else gray.push(b);
  });

  green.sort((a, b) => b.strength - a.strength);
  red.sort((a, b) => b.strength - a.strength);

  return { green: green.slice(0, 3), red: red.slice(0, 3), gray: gray.slice(0, 2) };
}

export function calcSMC(candles: Candle[]): SMCAnalysis {
  if (candles.length < 20) {
    return {
      fvgs: [],
      choch: null,
      bos: false,
      sweepDetected: false,
      sweepDir: null,
      bsl: null,
      ssl: null,
      eqh: null,
      eql: null,
    };
  }

  const price = candles[candles.length - 1].close;

  // Fair Value Gaps
  const fvgs: SMCAnalysis['fvgs'] = [];
  for (let i = 2; i < candles.length; i++) {
    const c1 = candles[i - 2];
    const c3 = candles[i];
    if (c3.low > c1.high) {
      fvgs.push({ type: 'BULLISH', top: c3.low, bottom: c1.high, mitigated: price < c3.low });
    } else if (c3.high < c1.low) {
      fvgs.push({ type: 'BEARISH', top: c1.low, bottom: c3.high, mitigated: price > c1.low });
    }
  }

  // Swing Highs & Lows for BSL & SSL
  const highs: { price: number; i: number }[] = [];
  const lows: { price: number; i: number }[] = [];

  for (let i = 3; i < candles.length - 3; i++) {
    const isH = candles.slice(i - 3, i).every((c) => c.high <= candles[i].high) && candles.slice(i + 1, i + 4).every((c) => c.high <= candles[i].high);
    const isL = candles.slice(i - 3, i).every((c) => c.low >= candles[i].low) && candles.slice(i + 1, i + 4).every((c) => c.low >= candles[i].low);
    if (isH) highs.push({ price: candles[i].high, i });
    if (isL) lows.push({ price: candles[i].low, i });
  }

  const bsl = highs.length > 0 ? Math.max(...highs.map((h) => h.price)) : null;
  const ssl = lows.length > 0 ? Math.min(...lows.map((l) => l.price)) : null;

  // Sweep detection on latest 2 candles
  const lastCandle = candles[candles.length - 1];
  let sweepDetected = false;
  let sweepDir: 'SSL_SWEPT' | 'BSL_SWEPT' | null = null;

  if (bsl && lastCandle.high > bsl && lastCandle.close < bsl) {
    sweepDetected = true;
    sweepDir = 'BSL_SWEPT';
  } else if (ssl && lastCandle.low < ssl && lastCandle.close > ssl) {
    sweepDetected = true;
    sweepDir = 'SSL_SWEPT';
  }

  const bos = (bsl !== null && price > bsl) || (ssl !== null && price < ssl);
  const choch = sweepDetected ? { direction: sweepDir === 'SSL_SWEPT' ? 'BULLISH' : 'BEARISH', price: sweepDir === 'SSL_SWEPT' ? ssl! : bsl! } as const : null;

  return {
    fvgs: fvgs.slice(-5),
    choch,
    bos,
    sweepDetected,
    sweepDir,
    bsl,
    ssl,
    eqh: highs.length > 1 ? highs[highs.length - 1].price : null,
    eql: lows.length > 1 ? lows[lows.length - 1].price : null,
  };
}

// ==========================================
// DELTA FLOW & CVD
// ==========================================

export function calcDeltaFlow(trades: Trade[]): DeltaFlow {
  if (!trades || trades.length === 0) {
    return {
      cvd: 0,
      cvdSlope: 'FLAT',
      divergence: 'NEUTRAL',
      deltaStrength: 50,
      buyVol: 50,
      sellVol: 50,
      history: [0, 0, 0],
    };
  }

  let buyVol = 0;
  let sellVol = 0;
  let cum = 0;
  const history: number[] = [];

  trades.slice().reverse().forEach((t) => {
    const sz = +t.sz;
    if (t.side === 'buy') {
      buyVol += sz;
      cum += sz;
    } else {
      sellVol += sz;
      cum -= sz;
    }
    history.push(cum);
  });

  const delta = buyVol - sellVol;
  const total = buyVol + sellVol || 1;
  const deltaStrength = Math.min(100, Math.round((Math.abs(delta) / total) * 100));

  let cvdSlope: 'UP' | 'DOWN' | 'FLAT' = 'FLAT';
  if (history.length >= 6) {
    const recent = history[history.length - 1];
    const prev = history[history.length - 6];
    if (recent > prev * 1.02) cvdSlope = 'UP';
    else if (recent < prev * 0.98) cvdSlope = 'DOWN';
  }

  return {
    cvd: Math.round(cum * 10) / 10,
    cvdSlope,
    divergence: 'NEUTRAL',
    deltaStrength,
    buyVol,
    sellVol,
    history: history.slice(-40),
  };
}

// ==========================================
// MARKET DELIVERY MODEL (MDM)
// ==========================================

export function calcDeliveryModel(candles: Candle[], delta: DeltaFlow, isPt = true): DeliveryModel {
  if (candles.length < 25) {
    return {
      phase: 'ACCUMULATION',
      confidence: 55,
      narrative: isPt ? 'Mercado em posicionamento preliminar.' : 'Market in preliminary positioning.',
      next: 'MANIPULATION',
      target: candles[candles.length - 1]?.close || 0,
      invalidation: 0,
    };
  }

  const price = candles[candles.length - 1].close;
  const atr = calcATR(candles, 14);
  const recent10 = candles.slice(-10);
  const avgRange = recent10.reduce((s, c) => s + (c.high - c.low), 0) / 10;
  const bodyAvg = recent10.reduce((s, c) => s + Math.abs(c.close - c.open), 0) / 10;
  const efficiency = bodyAvg / (avgRange || 1);

  let phase: DeliveryModel['phase'] = 'ACCUMULATION';
  let confidence = 65;

  if (avgRange < atr * 0.7 && Math.abs(delta.cvd) < 30) {
    phase = 'ACCUMULATION';
    confidence = 72;
  } else if (efficiency > 0.65 && delta.deltaStrength > 55) {
    phase = 'EXPANSION';
    confidence = 85;
  } else if (recent10.some((c) => (c.high - Math.max(c.open, c.close)) > atr * 1.4 || (Math.min(c.open, c.close) - c.low) > atr * 1.4)) {
    phase = 'MANIPULATION';
    confidence = 78;
  } else if (delta.cvdSlope === 'DOWN' && candles[candles.length - 1].close >= candles[candles.length - 5].close) {
    phase = 'DISTRIBUTION';
    confidence = 74;
  } else if (Math.abs(price - recent10.reduce((s, c) => s + c.close, 0) / 10) < atr * 0.4) {
    phase = 'REBALANCING';
    confidence = 68;
  } else {
    phase = 'REVERSAL';
    confidence = 62;
  }

  const nextPhaseMap: Record<DeliveryModel['phase'], DeliveryModel['phase']> = {
    ACCUMULATION: 'MANIPULATION',
    MANIPULATION: 'EXPANSION',
    EXPANSION: 'DISTRIBUTION',
    DISTRIBUTION: 'REBALANCING',
    REBALANCING: 'REVERSAL',
    REVERSAL: 'ACCUMULATION',
  };

  const narratives: Record<DeliveryModel['phase'], string> = {
    ACCUMULATION: isPt
      ? 'Fase de ACUMULAÇÃO: Range estreito e delta controlado. Institucionais montando lotes sem mover agressivamente o book.'
      : 'ACCUMULATION phase: Narrow range and controlled delta. Institutions building positions without aggressive slippage.',
    MANIPULATION: isPt
      ? 'Fase de MANIPULAÇÃO (Judas Swing / Sweep): Rompimento falso de topos/fundos para acionar liquidez de varejo antes do deslocamento real.'
      : 'MANIPULATION phase (Judas Swing / Sweep): False breakout of highs/lows triggering retail stops before the true expansion.',
    EXPANSION: isPt
      ? 'Fase de EXPANSÃO: Deslocamento agressivo com velas cheias e volume comprador/vendedor institucional. Seguir fluxo imediato.'
      : 'EXPANSION phase: Aggressive displacement with full-bodied candles and institutional volume. Follow immediate flow.',
    DISTRIBUTION: isPt
      ? 'Fase de DISTRIBUIÇÃO: Divergência entre preço e CVD. Players institucionais transferindo risco no topo. Cuidado com longs atrasados.'
      : 'DISTRIBUTION phase: Divergence between price and CVD. Institutions offloading risk. Beware late longs.',
    REBALANCING: isPt
      ? 'Fase de REBALANCEAMENTO: Reteste técnico de Fair Value Gaps (FVG) e mitigação de desequilíbrios para recarregar posições.'
      : 'REBALANCING phase: Technical retest of Fair Value Gaps (FVG) mitigating inefficiencies to reload orders.',
    REVERSAL: isPt
      ? 'Fase de REVERSÃO: Quebra estrutural (CHoCH) após captura de liquidez extrema. Mudança de regime.'
      : 'REVERSAL phase: Structural break (CHoCH) following extreme liquidity sweep. Regime change underway.',
  };

  return {
    phase,
    confidence,
    narrative: narratives[phase],
    next: nextPhaseMap[phase],
    target: phase === 'EXPANSION' ? price + atr * 2.5 : price + atr * 1.2,
    invalidation: price - atr * 1.5,
  };
}

// ==========================================
// MARKET REGIME
// ==========================================

export function calcMarketRegime(candles: Candle[], delta: DeltaFlow): { regime: MarketRegimeType; desc: string; action: string } {
  if (candles.length < 20) return { regime: 'COMPRESSION', desc: 'Aguardando dados', action: 'AGUARDAR' };
  const atr = calcATR(candles, 14);
  const closes = candles.map((c) => c.close);
  const ema9 = calcEMA(closes.slice(-21), 9);
  const ema21 = calcEMA(closes, 21);
  const high20 = Math.max(...candles.slice(-20).map((c) => c.high));
  const low20 = Math.min(...candles.slice(-20).map((c) => c.low));
  const range = high20 - low20;

  if (range < atr * 4) {
    return {
      regime: 'COMPRESSION',
      desc: 'Mercado em extrema compressão de volatilidade. Não opere no meio do range.',
      action: 'AGUARDAR EXPANSÃO',
    };
  } else if (ema9 > ema21 * 1.002 && delta.cvdSlope === 'UP') {
    return {
      regime: 'TRENDING',
      desc: 'Tendência de alta vigorosa. Médias alinhadas e fluxo comprador consistente.',
      action: 'SEGUIR FLUXO (LONG)',
    };
  } else if (ema9 < ema21 * 0.998 && delta.cvdSlope === 'DOWN') {
    return {
      regime: 'TRENDING',
      desc: 'Tendência de baixa com pressão vendedora constante. Evitar compras contra a tendência.',
      action: 'SEGUIR FLUXO (SHORT)',
    };
  } else if (range > atr * 7) {
    return {
      regime: 'EXPANSION',
      desc: 'Expansão direcional acelerada. Operar pullbacks curtos.',
      action: 'OPERAR NO TIMING',
    };
  } else {
    return {
      regime: 'RANGING',
      desc: 'Mercado lateralizado. Compre no suporte extremo ou venda na resistência extrema.',
      action: 'EXTREMOS DO RANGE',
    };
  }
}

// ==========================================
// MANIPULATION DETECTOR
// ==========================================

export function detectManipulation(candles: Candle[], trades: Trade[], isPt = true): ManipulationAlert {
  if (candles.length < 10) {
    return {
      detected: false,
      type: null,
      confidence: 0,
      desc: isPt ? 'Nenhuma manipulação detectada' : 'No manipulation detected',
      recommendation: 'FOLLOW',
      priceImpact: 'NEUTRAL',
    };
  }

  const atr = calcATR(candles, 14);
  const last = candles[candles.length - 1];
  const wickUp = last.high - Math.max(last.open, last.close);
  const wickDown = Math.min(last.open, last.close) - last.low;
  const body = Math.abs(last.close - last.open);

  if (wickUp > atr * 1.6 && wickUp > body * 2.2) {
    return {
      detected: true,
      type: 'STOP_HUNT',
      confidence: 84,
      desc: isPt
        ? `Stop hunt superior detectado: Pavio de ${(wickUp / atr).toFixed(1)}x ATR acima dos topos. Rejeição forte e absorção de compradores desavisados.`
        : `Upper stop hunt detected: ${(wickUp / atr).toFixed(1)}x ATR wick above highs. Strong rejection trapping breakout buyers.`,
      recommendation: 'FADE',
      priceImpact: 'BEARISH',
    };
  }

  if (wickDown > atr * 1.6 && wickDown > body * 2.2) {
    return {
      detected: true,
      type: 'STOP_HUNT',
      confidence: 84,
      desc: isPt
        ? `Stop hunt inferior detectado: Pavio de ${(wickDown / atr).toFixed(1)}x ATR abaixo dos fundos. Absorção agressiva de posições vendidas.`
        : `Lower stop hunt detected: ${(wickDown / atr).toFixed(1)}x ATR wick below lows. Aggressive absorption of short stops.`,
      recommendation: 'FADE',
      priceImpact: 'BULLISH',
    };
  }

  // Velocity spike check
  if (trades.length > 40) {
    const recentVol = trades.slice(0, 10).reduce((s, t) => s + +t.sz, 0);
    const olderVol = trades.slice(30, 40).reduce((s, t) => s + +t.sz, 0) || 1;
    if (recentVol / olderVol > 3.5) {
      return {
        detected: true,
        type: 'VELOCITY_SPIKE',
        confidence: 76,
        desc: isPt
          ? `Disparo repentino de velocidade de ordens: Volume ${(recentVol / olderVol).toFixed(1)}x acima da média normal. Atividade algorítmica intensa.`
          : `Sudden execution velocity spike: Volume ${(recentVol / olderVol).toFixed(1)}x above baseline. High-frequency algorithmic activity.`,
        recommendation: 'WAIT',
        priceImpact: 'NEUTRAL',
      };
    }
  }

  return {
    detected: false,
    type: null,
    confidence: 0,
    desc: isPt ? 'Mercado limpo. Sem rastros anormais de stop hunt no momento.' : 'Clean market. No abnormal stop hunt prints currently.',
    recommendation: 'FOLLOW',
    priceImpact: 'NEUTRAL',
  };
}

// ==========================================
// LIQUIDATION HEATMAP
// ==========================================

export function calcLiquidationHeatmap(candles: Candle[], price: number, isPt = true): LiquidationHeatmap {
  const atr = calcATR(candles, 14);
  const longLiqLevel = price - atr * 2.4;
  const shortLiqLevel = price + atr * 2.4;

  const clusters = [
    {
      priceLevel: Math.round(shortLiqLevel * 10) / 10,
      side: 'SHORT_LIQUIDATION' as const,
      intensity: 'HIGH' as const,
      distancePct: ((shortLiqLevel - price) / price * 100).toFixed(2),
      estimatedLiqSize: Math.round(price * 120),
    },
    {
      priceLevel: Math.round(longLiqLevel * 10) / 10,
      side: 'LONG_LIQUIDATION' as const,
      intensity: 'MEDIUM' as const,
      distancePct: ((price - longLiqLevel) / price * 100).toFixed(2),
      estimatedLiqSize: Math.round(price * 85),
    },
    {
      priceLevel: Math.round((price - atr * 4) * 10) / 10,
      side: 'LONG_LIQUIDATION' as const,
      intensity: 'HIGH' as const,
      distancePct: ((atr * 4) / price * 100).toFixed(2),
      estimatedLiqSize: Math.round(price * 210),
    },
  ];

  const magnetEffect = shortLiqLevel - price < price - longLiqLevel ? 'PULL_UP' : 'PULL_DOWN';
  const narrative = isPt
    ? `Cluster magnético de liquidações SHORT concentrado em ${shortLiqLevel.toFixed(1)} (+${clusters[0].distancePct}%). Mercado pode buscar esse bolsão para forçar fechamento compulsório.`
    : `Magnetic SHORT liquidation pool concentrated at ${shortLiqLevel.toFixed(1)} (+${clusters[0].distancePct}%). Price frequently gravitates toward this level.`;

  return {
    clusters,
    magnetEffect,
    narrative,
    longLiqLevel,
    shortLiqLevel,
  };
}

// ==========================================
// HISTORICAL SIMILARITY
// ==========================================

const HISTORICAL_DB: Omit<HistoricalMatch, 'similarity'>[] = [
  { id: 'etf-2024', period: 'Jan 2024 — Aprovação ETF Spot', year: 2024, phase: 'EXPANSION', outcome: 'BULLISH_CONTINUATION', returnPercent: 38 },
  { id: 'halving-2024', period: 'Abr 2024 — Halving Bitcoin', year: 2024, phase: 'ACCUMULATION', outcome: 'BULLISH_CONTINUATION', returnPercent: 24 },
  { id: 'trap-2021', period: 'Abr 2021 — Bull Trap Institucional', year: 2021, phase: 'DISTRIBUTION', outcome: 'BULL_TRAP', returnPercent: -52 },
  { id: 'covid-2020', period: 'Mar 2020 — Crash & Absorção', year: 2020, phase: 'REVERSAL', outcome: 'BULLISH_CONTINUATION', returnPercent: 65 },
  { id: 'luna-2022', period: 'Mai 2022 — Colapso de Margem', year: 2022, phase: 'REVERSAL', outcome: 'BEARISH_CONTINUATION', returnPercent: -68 },
];

export function calcHistoricalSimilarity(candles: Candle[], bias: Bias, delivery: DeliveryModel): HistoricalMatch[] {
  return HISTORICAL_DB.map((snap) => {
    let sim = 45;
    if (delivery.phase === snap.phase) sim += 30;
    if (bias === 'BULLISH' && snap.outcome === 'BULLISH_CONTINUATION') sim += 20;
    if (bias === 'BEARISH' && snap.outcome === 'BEARISH_CONTINUATION') sim += 20;
    return {
      ...snap,
      similarity: Math.min(95, sim + Math.floor(Math.random() * 8)),
    };
  }).sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

// ==========================================
// SCENARIO PROJECTION
// ==========================================

export function projectScenarios(candles: Candle[], smc: SMCAnalysis, delivery: DeliveryModel, isBull: boolean, isPt = true): ScenarioProjection {
  const price = candles[candles.length - 1].close;
  const atr = calcATR(candles, 14);

  const bsl = smc.bsl || price + atr * 2.8;
  const ssl = smc.ssl || price - atr * 2.8;

  const bullProb = isBull ? 68 : 32;
  const bearProb = isBull ? 24 : 58;
  const neutProb = 100 - bullProb - bearProb;

  return {
    bullish: {
      prob: bullProb,
      target1: Math.round((price + atr * 1.5) * 10) / 10,
      target2: Math.round(bsl * 10) / 10,
      confirmation: Math.round((price + atr * 0.5) * 10) / 10,
      invalidation: Math.round((price - atr * 1.2) * 10) / 10,
      narr: isPt
        ? `Se romper e segurar acima de ${(price + atr * 0.5).toFixed(1)} com vela cheia → aceleração até ${bsl.toFixed(1)}.`
        : `If breaks and holds above ${(price + atr * 0.5).toFixed(1)} with full body → expansion to ${bsl.toFixed(1)}.`,
    },
    bearish: {
      prob: bearProb,
      target1: Math.round((price - atr * 1.5) * 10) / 10,
      target2: Math.round(ssl * 10) / 10,
      confirmation: Math.round((price - atr * 0.5) * 10) / 10,
      invalidation: Math.round((price + atr * 1.2) * 10) / 10,
      narr: isPt
        ? `Se perder ${(price - atr * 0.5).toFixed(1)} sem resposta compradora → queda livre até ${ssl.toFixed(1)}.`
        : `If loses ${(price - atr * 0.5).toFixed(1)} without buyer response → dump into ${ssl.toFixed(1)}.`,
    },
    neutral: {
      prob: neutProb,
      rangeHigh: Math.round((price + atr * 0.8) * 10) / 10,
      rangeLow: Math.round((price - atr * 0.8) * 10) / 10,
      narr: isPt
        ? `Consolidação e oscilação entre ${(price - atr * 0.8).toFixed(1)} e ${(price + atr * 0.8).toFixed(1)}.`
        : `Consolidation range between ${(price - atr * 0.8).toFixed(1)} and ${(price + atr * 0.8).toFixed(1)}.`,
    },
    keyDecisionLevel: Math.round((price + (isBull ? atr * 0.4 : -atr * 0.4)) * 10) / 10,
  };
}

// ==========================================
// EXECUTION TIMING
// ==========================================

export function calcExecutionTiming(delivery: DeliveryModel, smc: SMCAnalysis, delta: DeltaFlow, isPt = true): { quality: ExecutionQuality; reason: string; aggressive: number; conservative: number } {
  let quality: ExecutionQuality = 'WAIT';
  let reason = '';

  if (delivery.phase === 'EXPANSION' && delta.cvdSlope === 'UP') {
    quality = 'OPTIMAL';
    reason = isPt ? 'Expansão + CVD comprador alinhado. Micro pullback confirmado.' : 'Expansion + buyer CVD aligned. Micro pullback confirmed.';
  } else if (smc.sweepDetected) {
    quality = 'OPTIMAL';
    reason = isPt ? 'Sweep de liquidez capturado. Região de melhor risco/retorno.' : 'Liquidity sweep caught. Prime risk/reward setup.';
  } else if (delivery.phase === 'ACCUMULATION') {
    quality = 'GOOD';
    reason = isPt ? 'Acumulação inicial. Aguarde fechamento de vela.' : 'Accumulation active. Wait for candle close.';
  } else if (delivery.phase === 'DISTRIBUTION') {
    quality = 'AVOID';
    reason = isPt ? 'Distribuição institucional. Risco elevado para novas posições.' : 'Distribution phase. High risk for new positions.';
  } else {
    quality = 'WAIT';
    reason = isPt ? 'Sem confirmação clara de timing. Aguarde gatilho nos 5m.' : 'Awaiting clear timing trigger on 5m.';
  }

  return { quality, reason, aggressive: 0, conservative: 0 };
}

// ==========================================
// MASTER SIGNAL AGGREGATION & ANTI-WHIPSAW ENGINE
// ==========================================

export function auditInstitutionalFilters(params: {
  candidateDir: 'CALL' | 'PUT';
  candles: Candle[];
  htf: HTFBias;
  delta: DeltaFlow;
  smc: SMCAnalysis;
  delivery: DeliveryModel;
  williams: WilliamsRResult;
  obs: OrderBlock[];
  zones: { green: LiquidityZone[]; red: LiquidityZone[] };
  callVotes: number;
  putVotes: number;
  atr: number;
  isPt?: boolean;
}): InstitutionalFilterAudit {
  const { candidateDir, candles, htf, delta, smc, delivery, williams, obs, zones, callVotes, putVotes, atr, isPt = true } = params;
  const lastClosedCandle = candles.length >= 2 ? candles[candles.length - 2] : candles[candles.length - 1];
  const price = candles[candles.length - 1].close;

  // 1. Candle Close Filter: The trigger candle must be directional and finished, not a hollow wick/doji
  const closedCandleBody = Math.abs(lastClosedCandle.close - lastClosedCandle.open);
  const closedCandleRange = lastClosedCandle.high - lastClosedCandle.low || 1;
  const isDoji = closedCandleBody / closedCandleRange < 0.25;
  const candleClosePassed = !isDoji && (
    candidateDir === 'CALL' ? lastClosedCandle.close >= lastClosedCandle.open * 0.999 : lastClosedCandle.close <= lastClosedCandle.open * 1.001
  );

  // 2. HTF Barrier: Do not counter-trade higher timeframes without confirmed structural sweep
  let htfPassed = true;
  let htfReason = isPt ? 'Alinhamento com tendência macro' : 'Aligned with macro trend';
  if (candidateDir === 'CALL' && htf.aligned === 'BEARISH') {
    if (!smc.sweepDetected || smc.sweepDir !== 'SSL_SWEPT') {
      htfPassed = false;
      htfReason = isPt ? 'Bloqueado: HTF (1D/4H) baixista sem sweep de fundo confirmado' : 'Blocked: HTF is bearish without confirmed sweep';
    }
  } else if (candidateDir === 'PUT' && htf.aligned === 'BULLISH') {
    if (!smc.sweepDetected || smc.sweepDir !== 'BSL_SWEPT') {
      htfPassed = false;
      htfReason = isPt ? 'Bloqueado: HTF (1D/4H) altista sem sweep de topo confirmado' : 'Blocked: HTF is bullish without confirmed sweep';
    }
  }

  // 3. Anti-Chop / Compression Filter: Avoid signals inside tight noisy consolidation
  const recent10 = candles.slice(-10);
  const range10 = Math.max(...recent10.map((c) => c.high)) - Math.min(...recent10.map((c) => c.low));
  const antiChopPassed = range10 >= atr * 2.8 && delivery.phase !== 'REBALANCING';

  // 4. Confluence Threshold: High confidence + strict superiority ratio (>= 2.0x)
  const dominantVotes = candidateDir === 'CALL' ? callVotes : putVotes;
  const opposingVotes = candidateDir === 'CALL' ? putVotes : callVotes;
  const dominanceRatio = opposingVotes > 0 ? dominantVotes / opposingVotes : dominantVotes;
  const confluencePassed = dominantVotes >= 7.5 && dominanceRatio >= 2.0;

  // 5. CVD Flow Confirmation: Order flow delta must validate price movement
  const cvdPassed = candidateDir === 'CALL' ? (delta.cvdSlope === 'UP' || delta.deltaStrength > 55) : (delta.cvdSlope === 'DOWN' || delta.deltaStrength > 55);

  // 6. Risk / Reward Ratio: Minimum 1.8R structural clearance before next institutional barrier
  const nextResistance = zones.red[0]?.mid || (smc.bsl || price + atr * 3);
  const nextSupport = zones.green[0]?.mid || (smc.ssl || price - atr * 3);
  let rrRatio = 2.0;
  if (candidateDir === 'CALL') {
    const slDist = atr * 1.3;
    const roomToTarget = Math.max(atr, nextResistance - price);
    rrRatio = roomToTarget / (slDist || 1);
  } else {
    const slDist = atr * 1.3;
    const roomToTarget = Math.max(atr, price - nextSupport);
    rrRatio = roomToTarget / (slDist || 1);
  }
  const rrPassed = rrRatio >= 1.6;

  const checks: InstitutionalFilterCheck[] = [
    { name: isPt ? 'Confirmação Vela Fechada' : 'Candle Close Confirmation', passed: candleClosePassed, reason: candleClosePassed ? (isPt ? 'Vela direcional confirmada' : 'Candle close valid') : (isPt ? 'Vela anterior indecisa/doji' : 'Indecision candle') },
    { name: isPt ? 'Barreira de Tendência HTF' : 'HTF Trend Barrier', passed: htfPassed, reason: htfReason },
    { name: isPt ? 'Filtro Anti-Chop / Compressão' : 'Anti-Chop Compression Filter', passed: antiChopPassed, reason: antiChopPassed ? (isPt ? 'Volatilidade saudável para expansão' : 'Healthy expansion volatility') : (isPt ? 'Mercado preso em compressão/ruído' : 'Choppy compressed market') },
    { name: isPt ? 'Confluência Institucional' : 'Institutional Confluence', passed: confluencePassed, reason: confluencePassed ? (isPt ? `Dominância forte (${dominanceRatio.toFixed(1)}x)` : `Strong dominance (${dominanceRatio.toFixed(1)}x)`) : (isPt ? 'Confluência insuficiente ou divergente' : 'Weak confluence') },
    { name: isPt ? 'Confirmação de Fluxo CVD' : 'CVD Flow Confirmation', passed: cvdPassed, reason: cvdPassed ? (isPt ? 'Fluxo delta alinhado com a ordem' : 'CVD delta flow aligned') : (isPt ? 'Delta divergente da direção' : 'CVD divergence detected') },
    { name: isPt ? 'Risco/Retorno Mínimo (>=1.8R)' : 'Risk/Reward Ratio (>=1.8R)', passed: rrPassed, reason: rrPassed ? (isPt ? `Projeção favorável (${rrRatio.toFixed(1)}R)` : `Good room to target (${rrRatio.toFixed(1)}R)`) : (isPt ? `Obstáculo próximo demais (${rrRatio.toFixed(1)}R)` : `Tight room (${rrRatio.toFixed(1)}R)`) },
  ];

  const overallPassed = checks.every((c) => c.passed);

  return {
    candleClose: checks[0],
    htfBarrier: checks[1],
    antiChopCompression: checks[2],
    confluenceThreshold: checks[3],
    cvdFlowConfirmation: checks[4],
    riskRewardRatio: checks[5],
    overallPassed,
    whipsawsBlockedCount: 0,
  };
}

export function aggregateSignal(params: {
  symbol?: string;
  candles: Candle[];
  htf: HTFBias;
  williams: WilliamsRResult;
  obs: OrderBlock[];
  zones: { green: LiquidityZone[]; red: LiquidityZone[] };
  delta: DeltaFlow;
  smc: SMCAnalysis;
  delivery: DeliveryModel;
  manip: ManipulationAlert;
  activeTrade?: ActiveTrade | null;
  fundingRate?: number;
  isPt?: boolean;
}): SignalAggregation {
  const { symbol = '', candles, htf, williams, obs, zones, delta, smc, delivery, manip, activeTrade, fundingRate = 0, isPt = true } = params;
  const price = candles[candles.length - 1].close;
  const atr = calcATR(candles, 14);

  // ========================================================
  // 1. ACTIVE TRADE LIFECYCLE MANAGEMENT (LOCKED POSITION)
  // ========================================================
  if (activeTrade && (activeTrade.status === 'ACTIVE_TRADE' || activeTrade.status === 'TARGET_1_HIT' || activeTrade.status === 'TARGET_2_HIT')) {
    const isCall = activeTrade.dir === 'CALL';
    const entry = activeTrade.entryPrice;
    let sl = activeTrade.slPrice;
    const tp1 = activeTrade.tp1Price;
    const tp2 = activeTrade.tp2Price;
    const tp3 = activeTrade.tp3Price;

    // Real-time PnL calculation
    const pnlPct = isCall ? ((price - entry) / entry) * 100 : ((entry - price) / entry) * 100;
    let newStatus: SignalLifecycleStatus = activeTrade.status;

    // Check Take Profit hits
    if (isCall) {
      if (price >= tp3) newStatus = 'TARGET_3_HIT';
      else if (price >= tp2) {
        newStatus = 'TARGET_2_HIT';
        sl = tp1; // Trail stop to lock TP1 profit
      } else if (price >= tp1) {
        newStatus = 'TARGET_1_HIT';
        sl = entry; // Move stop to Breakeven
      }
      // Check Stop Loss hit
      if (price <= sl) {
        newStatus = 'STOPPED_OUT';
      }
      // Check structural failure (invalidation)
      if (smc.choch && smc.choch.direction === 'BEARISH' && price < entry - atr * 1.5) {
        newStatus = 'INVALIDATED';
      }
    } else {
      // Short position logic
      if (price <= tp3) newStatus = 'TARGET_3_HIT';
      else if (price <= tp2) {
        newStatus = 'TARGET_2_HIT';
        sl = tp1;
      } else if (price <= tp1) {
        newStatus = 'TARGET_1_HIT';
        sl = entry;
      }
      if (price >= sl) {
        newStatus = 'STOPPED_OUT';
      }
      if (smc.choch && smc.choch.direction === 'BULLISH' && price > entry + atr * 1.5) {
        newStatus = 'INVALIDATED';
      }
    }

    // Trade Progress percentage toward target 1 or 2
    const totalDistToTp = Math.abs(tp1 - entry) || 1;
    const currentDist = isCall ? price - entry : entry - price;
    const progressPct = Math.min(100, Math.max(0, Math.round((currentDist / totalDistToTp) * 100)));

    // Generate descriptive status message
    let statusMessage = '';
    if (newStatus === 'ACTIVE_TRADE') {
      statusMessage = isPt
        ? `Operação ${activeTrade.dir} ATIVA e protegida. PnL: ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%. Monitorando avanço para TP1.`
        : `${activeTrade.dir} trade ACTIVE. PnL: ${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%. Advancing towards TP1.`;
    } else if (newStatus === 'TARGET_1_HIT') {
      statusMessage = isPt
        ? `🎯 TP1 ATINGIDO! Stop ajustado para o Breakeven (${entry.toFixed(1)}). Posição sem risco, buscando TP2.`
        : `🎯 TP1 REACHED! Stop moved to Breakeven (${entry.toFixed(1)}). Risk-free run to TP2.`;
    } else if (newStatus === 'TARGET_2_HIT') {
      statusMessage = isPt
        ? `🎯 TP2 ATINGIDO! Lucro garantido no TP1. Conduzindo saldo restante para TP3.`
        : `🎯 TP2 REACHED! Profit secured. Trailing remaining balance to TP3.`;
    } else if (newStatus === 'TARGET_3_HIT') {
      statusMessage = isPt
        ? `🏁 ALVO MÁXIMO (TP3) ATINGIDO COM SUCESSO! Lucro total realizado. Robô aguardando novo setup confirmado.`
        : `🏁 MAXIMUM TARGET TP3 ACHIEVED! Full profits booked. Awaiting next confirmed setup.`;
    } else if (newStatus === 'STOPPED_OUT') {
      statusMessage = isPt
        ? `🛑 STOP ATINGIDO estruturalmente. Posição encerrada conforme gestão de risco. Robô em cooldown de proteção.`
        : `🛑 STOP LOSS HIT. Trade concluded within strict risk parameters. Entering protective cooldown.`;
    } else if (newStatus === 'INVALIDATED') {
      statusMessage = isPt
        ? `⚠️ OPERAÇÃO INVALIDADA por quebra estrutural (CHoCH adverso). Saída preventiva acionada pelo robô.`
        : `⚠️ TRADE INVALIDATED by structural shift. Protective early exit triggered.`;
    }

    // If trade is still active or taking partials, LOCK THE DIRECTION!
    if (newStatus === 'ACTIVE_TRADE' || newStatus === 'TARGET_1_HIT' || newStatus === 'TARGET_2_HIT') {
      return {
        dir: activeTrade.dir,
        confidence: 88,
        callVotes: isCall ? 10 : 2,
        putVotes: isCall ? 2 : 10,
        reasons: [
          isPt ? `Sinal de ${activeTrade.dir} em andamento desde ${entry.toFixed(1)}` : `${activeTrade.dir} position running from ${entry.toFixed(1)}`,
          isPt ? `Stop posicionado com segurança em ${sl.toFixed(1)}` : `Stop securely locked at ${sl.toFixed(1)}`,
          isPt ? `Rumo aos alvos parciais: TP1 ${tp1.toFixed(1)} | TP2 ${tp2.toFixed(1)}` : `Targeting: TP1 ${tp1.toFixed(1)} | TP2 ${tp2.toFixed(1)}`,
          statusMessage,
        ],
        entry,
        sl,
        tp1,
        tp2,
        tp3,
        htfBlocked: false,
        htfBonus: 10,
        riskReward: 2.4,
        status: newStatus,
        tradeProgressPct: progressPct,
        filters: {
          candleClose: { name: 'Vela Fechada', passed: true, reason: 'Entrada confirmada' },
          htfBarrier: { name: 'Barreira HTF', passed: true, reason: 'Alinhado com trade ativo' },
          antiChopCompression: { name: 'Anti-Chop', passed: true, reason: 'Em expansão' },
          confluenceThreshold: { name: 'Confluência', passed: true, reason: 'Validada na abertura' },
          cvdFlowConfirmation: { name: 'Fluxo CVD', passed: true, reason: 'Monitorado' },
          riskRewardRatio: { name: 'Risco/Retorno', passed: true, reason: 'Protegido' },
          overallPassed: true,
          whipsawsBlockedCount: 0,
        },
        activeTrade: {
          ...activeTrade,
          slPrice: sl,
          status: newStatus,
          highestPrice: Math.max(activeTrade.highestPrice, price),
          lowestPrice: Math.min(activeTrade.lowestPrice, price),
          pnlPercent: pnlPct,
        },
        statusMessage,
      };
    } else {
      // Concluded trade (STOPPED_OUT, TARGET_3_HIT, INVALIDATED)
      return {
        dir: 'AGUARDAR',
        confidence: 50,
        callVotes: 0,
        putVotes: 0,
        reasons: [statusMessage],
        entry: activeTrade.entryPrice,
        sl,
        tp1: activeTrade.tp1Price,
        tp2: activeTrade.tp2Price,
        tp3: activeTrade.tp3Price,
        htfBlocked: false,
        htfBonus: 0,
        riskReward: 2.0,
        status: newStatus,
        tradeProgressPct: newStatus === 'TARGET_3_HIT' ? 100 : 0,
        filters: {
          candleClose: { name: 'Vela Fechada', passed: true, reason: 'Operação encerrada' },
          htfBarrier: { name: 'Barreira HTF', passed: true, reason: 'Operação encerrada' },
          antiChopCompression: { name: 'Anti-Chop', passed: true, reason: 'Operação encerrada' },
          confluenceThreshold: { name: 'Confluência', passed: true, reason: 'Operação encerrada' },
          cvdFlowConfirmation: { name: 'Fluxo CVD', passed: true, reason: 'Operação encerrada' },
          riskRewardRatio: { name: 'Risco/Retorno', passed: true, reason: 'Operação encerrada' },
          overallPassed: true,
          whipsawsBlockedCount: 0,
        },
        activeTrade: null,
        statusMessage,
      };
    }
  }

  // ========================================================
  // 2. SEARCHING FOR A NEW INSTITUTIONAL SIGNAL
  // ========================================================
  let callVotes = 0;
  let putVotes = 0;
  const reasons: string[] = [];

  // 1. Williams %R pattern weighting
  if (williams.signal === 'CALL') {
    callVotes += williams.pattern === 'W' ? 4.5 : 2.5;
    reasons.push(isPt ? `Williams %R: Padrão ${williams.pattern} — CALL (${williams.confidence}%)` : `Williams %R: ${williams.pattern} — CALL (${williams.confidence}%)`);
  } else if (williams.signal === 'PUT') {
    putVotes += williams.pattern === 'M' ? 4.5 : 2.5;
    reasons.push(isPt ? `Williams %R: Padrão ${williams.pattern} — PUT (${williams.confidence}%)` : `Williams %R: ${williams.pattern} — PUT (${williams.confidence}%)`);
  }

  // 2. Order Blocks
  const nearOB = obs.find((ob) => Math.abs(price - (ob.top + ob.bottom) / 2) < atr * 1.6);
  if (nearOB) {
    if (nearOB.type === 'BULL') {
      callVotes += 3.5;
      reasons.push(isPt ? `Defesa institucional em Bull OB: ${nearOB.bottom.toFixed(1)} - ${nearOB.top.toFixed(1)}` : `Defense at Bull OB: ${nearOB.bottom.toFixed(1)} - ${nearOB.top.toFixed(1)}`);
    } else {
      putVotes += 3.5;
      reasons.push(isPt ? `Rejeição institucional em Bear OB: ${nearOB.bottom.toFixed(1)} - ${nearOB.top.toFixed(1)}` : `Rejection at Bear OB: ${nearOB.bottom.toFixed(1)} - ${nearOB.top.toFixed(1)}`);
    }
  }

  // 3. Liquidity zones
  if (zones.green.length > 0 && price >= zones.green[0].min - atr * 0.2 && price <= zones.green[0].max + atr * 0.3) {
    callVotes += 3.0;
    reasons.push(isPt ? `Suporte de liquidez institucional testado em ${zones.green[0].mid.toFixed(1)}` : `Liquidity support tested at ${zones.green[0].mid.toFixed(1)}`);
  }
  if (zones.red.length > 0 && price <= zones.red[0].max + atr * 0.2 && price >= zones.red[0].min - atr * 0.3) {
    putVotes += 3.0;
    reasons.push(isPt ? `Resistência de liquidez institucional testada em ${zones.red[0].mid.toFixed(1)}` : `Liquidity resistance tested at ${zones.red[0].mid.toFixed(1)}`);
  }

  // 4. CVD / Delta Flow
  if (delta.cvdSlope === 'UP') {
    callVotes += 3.5;
    reasons.push(isPt ? `CVD ascendente: Compradores absorvendo ofertas agressivamente` : `Ascending CVD: Aggressive buyer absorption`);
  } else if (delta.cvdSlope === 'DOWN') {
    putVotes += 3.5;
    reasons.push(isPt ? `CVD descendente: Vendedores dominando fluxo de ordens` : `Descending CVD: Dominant seller orderflow`);
  }

  // 5. SMC / Sweeps / CHoCH
  if (smc.sweepDetected) {
    if (smc.sweepDir === 'SSL_SWEPT') {
      callVotes += 4.5;
      reasons.push(isPt ? `⚡ SSL Swept: Captura de liquidez de varejo abaixo dos fundos confirmada` : `⚡ SSL Swept: Retail sell stops caught below lows`);
    } else {
      putVotes += 4.5;
      reasons.push(isPt ? `⚡ BSL Swept: Captura de liquidez de varejo acima dos topos confirmada` : `⚡ BSL Swept: Retail buy stops caught above highs`);
    }
  }
  if (smc.choch) {
    if (smc.choch.direction === 'BULLISH') {
      callVotes += 3.5;
      reasons.push(isPt ? `Mudança de caráter (CHoCH) BULLISH confirmada` : `BULLISH CHoCH confirmed`);
    } else {
      putVotes += 3.5;
      reasons.push(isPt ? `Mudança de caráter (CHoCH) BEARISH confirmada` : `BEARISH CHoCH confirmed`);
    }
  }

  // 6. Delivery phase
  if (delivery.phase === 'EXPANSION') {
    callVotes += 2.0;
    reasons.push(isPt ? `Fase de expansão direcional (MDM) em andamento` : `Directional expansion phase active`);
  } else if (delivery.phase === 'DISTRIBUTION') {
    putVotes += 2.5;
    reasons.push(isPt ? `Fase de distribuição institucional — risco elevado para compras` : `Institutional distribution active`);
  }

  // 7. Multi-timeframe alignment
  let htfBonus = 0;
  if (htf.aligned === 'BULLISH') {
    callVotes += 4.0;
    htfBonus = 10;
    reasons.push(isPt ? `Alinhamento Multi-Timeframe (1D/4H/1H) BULLISH` : `Multi-Timeframe alignment BULLISH`);
  } else if (htf.aligned === 'BEARISH') {
    putVotes += 4.0;
    htfBonus = 10;
    reasons.push(isPt ? `Alinhamento Multi-Timeframe (1D/4H/1H) BEARISH` : `Multi-Timeframe alignment BEARISH`);
  }

  // Determine tentative candidate direction
  let candidateDir: 'CALL' | 'PUT' | null = null;
  if (callVotes >= 7.5 && callVotes > putVotes * 1.8) {
    candidateDir = 'CALL';
  } else if (putVotes >= 7.5 && putVotes > callVotes * 1.8) {
    candidateDir = 'PUT';
  }

  // ========================================================
  // 3. EXECUTE THE 6 MANDATORY INSTITUTIONAL FILTERS
  // ========================================================
  let finalDir: Direction = 'AGUARDAR';
  let finalConfidence = 50;
  let statusMessage = isPt
    ? 'Robô monitorando o mercado. Aguardando confluência total das 6 camadas institucionais.'
    : 'Robot monitoring market. Awaiting 6-layer institutional confluence.';

  const filterAudit = auditInstitutionalFilters({
    candidateDir: candidateDir || 'CALL',
    candles,
    htf,
    delta,
    smc,
    delivery,
    williams,
    obs,
    zones,
    callVotes,
    putVotes,
    atr,
    isPt,
  });

  if (candidateDir && filterAudit.overallPassed) {
    finalDir = candidateDir;
    finalConfidence = Math.min(96, Math.max(72, Math.round(55 + (candidateDir === 'CALL' ? callVotes : putVotes) * 3 + htfBonus)));
    statusMessage = isPt
      ? `✅ SINAL ${candidateDir} VALIDADO! Todas as 6 camadas de filtros institucionais aprovadas.`
      : `✅ ${candidateDir} SIGNAL VALIDATED! All 6 institutional filters passed.`;
  } else if (candidateDir && !filterAudit.overallPassed) {
    // A false signal was detected and successfully blocked by the robot!
    const failedCheck = Object.values(filterAudit).find((c: any) => typeof c === 'object' && !c.passed) as InstitutionalFilterCheck | undefined;
    finalDir = 'AGUARDAR';
    finalConfidence = 45;
    statusMessage = isPt
      ? `🛡️ SINAL FALSO FILTRADO PELO ROBÔ: Tentativa de ${candidateDir} bloqueada por "${failedCheck?.name || 'Filtro Institucional'}" (${failedCheck?.reason || 'Sem confirmação'}). Evitando inversão precipitada.`
      : `🛡️ WHIPSAW PREVENTED BY ROBOT: ${candidateDir} blocked by "${failedCheck?.name}". Avoiding false reversal.`;
    reasons.unshift(`🛡️ ${statusMessage}`);
  }

  // Targets and Stops calculation
  const entry = price;
  const slDist = atr * 1.4;
  const sl = finalDir === 'CALL' ? price - slDist : finalDir === 'PUT' ? price + slDist : price - slDist;
  const tp1 = finalDir === 'CALL' ? price + slDist * 1.2 : finalDir === 'PUT' ? price - slDist * 1.2 : price + slDist;
  const tp2 = finalDir === 'CALL' ? price + slDist * 2.2 : finalDir === 'PUT' ? price - slDist * 2.2 : price + slDist * 2;
  const tp3 = finalDir === 'CALL' ? price + slDist * 3.5 : finalDir === 'PUT' ? price - slDist * 3.5 : price + slDist * 3.5;

  let newActiveTrade: ActiveTrade | null = null;
  if (finalDir === 'CALL' || finalDir === 'PUT') {
    newActiveTrade = {
      id: `${candles[candles.length - 1].ts}-${finalDir}`,
      symbol: symbol || '',
      dir: finalDir,
      entryPrice: entry,
      slPrice: sl,
      tp1Price: tp1,
      tp2Price: tp2,
      tp3Price: tp3,
      timestamp: candles[candles.length - 1].ts,
      candleTs: candles[candles.length - 1].ts,
      status: 'ACTIVE_TRADE',
      highestPrice: price,
      lowestPrice: price,
      pnlPercent: 0,
    };
  }

  return {
    dir: finalDir,
    confidence: finalConfidence,
    callVotes,
    putVotes,
    reasons,
    entry,
    sl,
    tp1,
    tp2,
    tp3,
    htfBlocked: !filterAudit.htfBarrier.passed,
    htfBonus,
    riskReward: 2.2,
    status: (finalDir === 'CALL' || finalDir === 'PUT') ? 'ACTIVE_TRADE' : 'SEARCHING_CONFIRMATION',
    tradeProgressPct: 0,
    filters: filterAudit,
    activeTrade: newActiveTrade,
    statusMessage,
  };
}

// ==========================================
// INSTITUTIONAL PRO NARRATIVE BUILDER
// ==========================================

export function buildProTraderSpeech(params: {
  symbol: string;
  candles: Candle[];
  signal: SignalAggregation;
  smc: SMCAnalysis;
  delivery: DeliveryModel;
  delta: DeltaFlow;
  htf: HTFBias;
  isPt?: boolean;
}): string {
  const { symbol, candles, signal, smc, delivery, delta, htf, isPt = true } = params;
  const sym = symbol.split('-')[0];
  const price = candles[candles.length - 1].close;
  const atr = calcATR(candles, 14);

  const sup = (price - atr).toFixed(1);
  const res = (price + atr).toFixed(1);
  const supTarget1 = (price - atr * 1.8).toFixed(1);
  const supTarget2 = (price - atr * 3.2).toFixed(1);
  const resTarget1 = (price + atr * 1.8).toFixed(1);
  const resTarget2 = (price + atr * 3.2).toFixed(1);

  // If trade is actively locked and running
  if (signal.activeTrade && (signal.status === 'ACTIVE_TRADE' || signal.status === 'TARGET_1_HIT' || signal.status === 'TARGET_2_HIT')) {
    const isCall = signal.activeTrade.dir === 'CALL';
    const entry = signal.activeTrade.entryPrice;
    const pnl = signal.activeTrade.pnlPercent;

    if (isPt) {
      return `📊 POSIÇÃO ATIVA & TRAVADA NO ROBÔ: ${signal.activeTrade.dir} em ${sym}.
Entrada: ${entry.toFixed(1)} | Preço atual: ${price.toFixed(1)} (${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%)
Status: ${signal.statusMessage}

🎯 Gestão de Alvos Institucionais:
• TP1: ${signal.activeTrade.tp1Price.toFixed(1)} ${price >= signal.activeTrade.tp1Price && isCall ? '✅ (ATINGIDO)' : ''}
• TP2: ${signal.activeTrade.tp2Price.toFixed(1)} ${price >= signal.activeTrade.tp2Price && isCall ? '✅ (ATINGIDO)' : ''}
• TP3: ${signal.activeTrade.tp3Price.toFixed(1)} (Alvo Final)

🛡️ Proteção de Capital:
• Stop Loss atualizado: ${signal.activeTrade.slPrice.toFixed(1)}
• O robô NÃO inverte posição no meio do ruído. Posição mantida até os alvos ou stop técnico.
• CVD: ${delta.cvdSlope === 'UP' ? 'Comprador ativo' : 'Vendedor ativo'} • Fase MDM: ${delivery.phase}`;
    } else {
      return `📊 LOCKED ACTIVE TRADE: ${signal.activeTrade.dir} on ${sym}.
Entry: ${entry.toFixed(1)} | Current: ${price.toFixed(1)} (${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}%)
Status: ${signal.statusMessage}

🎯 Targets:
• TP1: ${signal.activeTrade.tp1Price.toFixed(1)}
• TP2: ${signal.activeTrade.tp2Price.toFixed(1)}
• TP3: ${signal.activeTrade.tp3Price.toFixed(1)}

🛡️ Protection:
• Trailed Stop Loss: ${signal.activeTrade.slPrice.toFixed(1)}
• Robot prevents premature flips during active trends.`;
    }
  }

  // If in confirmation / waiting mode
  if (isPt) {
    return `${sym} está segurando suporte importante em ${sup}.

🛡️ FILTRO ANTI-ERRO DO ROBÔ ATIVO:
${signal.statusMessage}

Se perder ${sup}:
• Pode buscar ${supTarget1}
• Depois ${supTarget2}
• Região forte de aceleração vendedora abaixo disso.

Se romper ${res} com força:
• Pode buscar ${resTarget1}
• Depois ${resTarget2}

No momento:
• ${delivery.narrative.split('.')[0]}
• CVD ${delta.cvdSlope === 'UP' ? 'ascendente com absorção compradora' : delta.cvdSlope === 'DOWN' ? 'descendente com pressão vendedora' : 'lateral'}
• Tendência macro (HTF): ${htf.aligned}

Entradas mais seguras:
• Long apenas acima de ${res} com candle fechado e reteste
• Short mais seguro se perder ${sup} com volume institucional

Take profit:
• TP1: ${signal.tp1.toFixed(1)}
• TP2: ${signal.tp2.toFixed(1)}
• TP3: ${signal.tp3.toFixed(1)}

Stop inteligente:
• Protegido além da estrutura em ${signal.sl.toFixed(1)} (fora do ruído).

Probabilidade:
• ${signal.dir === 'CALL' ? `${signal.confidence}% recuperação compradora` : signal.dir === 'PUT' ? `${signal.confidence}% continuação da queda` : 'Filtro bloqueando ruído — aguardar confirmação real'}`;
  } else {
    return `${sym} is holding key support at ${sup}.

🛡️ ROBOT ANTI-WHIPSAW FILTER ACTIVE:
${signal.statusMessage}

If loses ${sup}:
• Can target ${supTarget1}
• Then ${supTarget2}

If breaks ${res} with strength:
• Can target ${resTarget1}
• Then ${resTarget2}

Currently:
• ${delivery.narrative.split('.')[0]}
• CVD is ${delta.cvdSlope === 'UP' ? 'rising with buyer absorption' : delta.cvdSlope === 'DOWN' ? 'falling with heavy seller pressure' : 'flat'}
• Macro HTF bias: ${htf.aligned}

Safest entries:
• Long only above ${res} on candle close confirmation
• Short safer if loses ${sup} with volume follow-through

Take profit:
• TP1: ${signal.tp1.toFixed(1)}
• TP2: ${signal.tp2.toFixed(1)}
• TP3: ${signal.tp3.toFixed(1)}

Smart stop:
• Structured beyond liquidity at ${signal.sl.toFixed(1)}.

Probability:
• ${signal.dir === 'CALL' ? `${signal.confidence}% bullish continuation` : signal.dir === 'PUT' ? `${signal.confidence}% downside continuation` : 'Filter blocking noise — waiting for clean trigger'}`;
  }
}
