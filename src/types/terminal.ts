export interface Candle {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  vol: number;
}

export interface Trade {
  ts: number;
  sz: number;
  px: number;
  side: 'buy' | 'sell';
}

export type Bias = 'BULLISH' | 'BEARISH' | 'NEUTRAL';
export type Direction = 'CALL' | 'PUT' | 'AGUARDAR' | 'NEUTRAL';
export type DeliveryPhase = 'ACCUMULATION' | 'MANIPULATION' | 'EXPANSION' | 'DISTRIBUTION' | 'REBALANCING' | 'REVERSAL';
export type MarketRegimeType = 'TRENDING' | 'RANGING' | 'COMPRESSION' | 'EXPANSION' | 'MANIPULATION';
export type ExecutionQuality = 'OPTIMAL' | 'GOOD' | 'WAIT' | 'AVOID';

export type SignalLifecycleStatus =
  | 'SEARCHING_CONFIRMATION'
  | 'ACTIVE_TRADE'
  | 'TARGET_1_HIT'
  | 'TARGET_2_HIT'
  | 'TARGET_3_HIT'
  | 'STOPPED_OUT'
  | 'INVALIDATED';

export interface HTFBias {
  d1: Bias;
  h4: Bias;
  h1: Bias;
  m15: Bias;
  m5: Bias;
  aligned: Bias;
  alignmentScore: number;
}

export interface WilliamsRResult {
  value: number;
  pattern: 'W' | 'M' | 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  signal: 'CALL' | 'PUT' | 'WAIT';
  confidence: number;
  desc: string;
}

export interface OrderBlock {
  top: number;
  bottom: number;
  type: 'BULL' | 'BEAR';
  bullVol: number;
  bearVol: number;
  bullPct: number;
  timestamp: number;
  broken: boolean;
}

export interface LiquidityZone {
  min: number;
  max: number;
  mid: number;
  vol: number;
  delta: number;
  strength: number;
}

export interface FVG {
  type: 'BULLISH' | 'BEARISH';
  top: number;
  bottom: number;
  mitigated: boolean;
}

export interface SMCAnalysis {
  fvgs: FVG[];
  choch: { direction: 'BULLISH' | 'BEARISH'; price: number } | null;
  bos: boolean;
  sweepDetected: boolean;
  sweepDir: 'SSL_SWEPT' | 'BSL_SWEPT' | null;
  bsl: number | null;
  ssl: number | null;
  eqh: number | null;
  eql: number | null;
}

export interface DeliveryModel {
  phase: DeliveryPhase;
  confidence: number;
  narrative: string;
  next: DeliveryPhase;
  target: number;
  invalidation: number;
}

export interface DeltaFlow {
  cvd: number;
  cvdSlope: 'UP' | 'DOWN' | 'FLAT';
  divergence: 'BULLISH_DIV' | 'BEARISH_DIV' | 'NEUTRAL';
  deltaStrength: number;
  buyVol: number;
  sellVol: number;
  history: number[];
}

export interface ManipulationAlert {
  detected: boolean;
  type: 'STOP_HUNT' | 'VELOCITY_SPIKE' | 'SPOOFING' | null;
  confidence: number;
  desc: string;
  recommendation: 'FADE' | 'WAIT' | 'FOLLOW';
  priceImpact: Bias;
}

export interface LiquidationCluster {
  priceLevel: number;
  side: 'LONG_LIQUIDATION' | 'SHORT_LIQUIDATION';
  intensity: 'HIGH' | 'MEDIUM' | 'LOW';
  distancePct: string;
  estimatedLiqSize: number;
}

export interface LiquidationHeatmap {
  clusters: LiquidationCluster[];
  magnetEffect: 'PULL_UP' | 'PULL_DOWN' | 'NEUTRAL';
  narrative: string;
  longLiqLevel: number;
  shortLiqLevel: number;
}

export interface WhaleEvent {
  amount: number;
  amountUsd: number;
  type: 'EXCHANGE_INFLOW' | 'EXCHANGE_OUTFLOW';
  timestamp: number;
  impact: Bias;
  reason: string;
}

export interface NewsItem {
  title: string;
  source: string;
  impact: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
  direction: Bias;
  confidenceModifier: number;
  timestamp: number;
}

export interface HistoricalMatch {
  id: string;
  period: string;
  year: number;
  similarity: number;
  phase: DeliveryPhase;
  outcome: 'BULLISH_CONTINUATION' | 'BEARISH_CONTINUATION' | 'BULL_TRAP' | 'BEAR_TRAP' | 'REVERSAL';
  returnPercent: number;
}

export interface ScenarioProjection {
  bullish: {
    prob: number;
    target1: number;
    target2: number;
    confirmation: number;
    invalidation: number;
    narr: string;
  };
  bearish: {
    prob: number;
    target1: number;
    target2: number;
    confirmation: number;
    invalidation: number;
    narr: string;
  };
  neutral: {
    prob: number;
    rangeHigh: number;
    rangeLow: number;
    narr: string;
  };
  keyDecisionLevel: number;
}

export interface InstitutionalFilterCheck {
  name: string;
  passed: boolean;
  reason: string;
}

export interface InstitutionalFilterAudit {
  candleClose: InstitutionalFilterCheck;
  htfBarrier: InstitutionalFilterCheck;
  antiChopCompression: InstitutionalFilterCheck;
  confluenceThreshold: InstitutionalFilterCheck;
  cvdFlowConfirmation: InstitutionalFilterCheck;
  riskRewardRatio: InstitutionalFilterCheck;
  overallPassed: boolean;
  whipsawsBlockedCount: number;
}

export interface ActiveTrade {
  id: string;
  symbol: string;
  dir: 'CALL' | 'PUT';
  entryPrice: number;
  slPrice: number;
  tp1Price: number;
  tp2Price: number;
  tp3Price: number;
  timestamp: number;
  candleTs: number;
  status: SignalLifecycleStatus;
  highestPrice: number;
  lowestPrice: number;
  pnlPercent: number;
}

export interface SignalAggregation {
  dir: Direction;
  confidence: number;
  callVotes: number;
  putVotes: number;
  reasons: string[];
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  tp3: number;
  htfBlocked: boolean;
  htfBonus: number;
  riskReward: number;
  status: SignalLifecycleStatus;
  tradeProgressPct: number;
  filters: InstitutionalFilterAudit;
  activeTrade?: ActiveTrade | null;
  statusMessage: string;
}

export interface AIChartReport {
  symbol: string;
  timeframe: string;
  bias: Bias;
  statusSummary: string;
  ifLossScenario: {
    keyLevel: string;
    target1: string;
    target2: string;
    implication: string;
  };
  ifBreakScenario: {
    keyLevel: string;
    target1: string;
    target2: string;
    implication: string;
  };
  currentMomentum: string;
  safestLongEntry: string;
  safestShortEntry: string;
  takeProfit: {
    tp1: string;
    tp2: string;
    tp3: string;
  };
  stopLoss: string;
  probability: {
    primaryPct: number;
    primaryNarrative: string;
    secondaryPct: number;
    secondaryNarrative: string;
  };
  trapsAndWarnings: string[];
  suggestedAlerts: string[];
  traderSpeech: string;
  isFallback?: boolean;
}

export interface NewsImpactEvent {
  id: string;
  titleEn: string;
  titlePt: string;
  summaryPt: string;
  source: string;
  timestamp: number;
  impactLevel: 'EXTREME' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'GEOPOLITICA_GUERRA' | 'MACRO_ECONOMIA' | 'REGULACAO' | 'ONCHAIN_BALEIAS' | 'CORTE_JUROS';
  affectedAssets: string[];
  volatilityWarning: boolean;
  tradingAction: 'PAUSAR_OPERACAO' | 'VOLATILIDADE_EXTREMA' | 'FAVORAVEL_ALTA' | 'FAVORAVEL_QUEDA' | 'NEUTRO';
}

export interface AgentVote {
  agentId: string;
  name: string;
  role: string;
  vote: 'CALL' | 'PUT' | 'AGUARDAR';
  confidence: number;
  status: 'APPROVED' | 'VETOED' | 'CAUTION';
  weight: number;
  rationale: string;
  keyMetric: string;
}

export interface MultiAgentConsensus {
  overallVerdict: 'CALL' | 'PUT' | 'AGUARDAR';
  consensusScore: number;
  approvedCount: number;
  vetoCount: number;
  dominantAgent: string;
  geopoliticalAlertActive: boolean;
  agents: AgentVote[];
  institutionalDirective: string;
}

export interface DataFeedStatus {
  id: string;
  name: string;
  endpoint: string;
  status: 'ONLINE' | 'LATENCY_OK' | 'CONNECTING' | 'ERROR';
  latencyMs: number;
  coverage: string;
  activeAssets: number;
  type: 'CRYPTO_DERIVATIVES' | 'CRYPTO_SPOT' | 'FOREX_INTERBANK' | 'MACRO_NEWS' | 'AI_REASONING';
  lastPing: number;
}
