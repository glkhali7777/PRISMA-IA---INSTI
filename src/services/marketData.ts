import { Candle, Trade, AIChartReport } from '../types/terminal';

export async function fetchCandlesAPI(instId: string, bar: string, limit = 150): Promise<Candle[]> {
  try {
    const res = await fetch(`/api/crypto/candles?instId=${encodeURIComponent(instId)}&bar=${encodeURIComponent(bar)}&limit=${limit}`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Proxy candle fetch failed, falling back to direct exchange API', err);
  }

  // Direct OKX fetch fallback from client
  try {
    const okxRes = await fetch(`https://www.okx.com/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`);
    const okxJson = await okxRes.json();
    if (okxJson.data && Array.isArray(okxJson.data)) {
      return okxJson.data.reverse().map((c: string[]) => ({
        ts: +c[0],
        open: +c[1],
        high: +c[2],
        low: +c[3],
        close: +c[4],
        vol: +c[5],
      }));
    }
  } catch (err) {}

  // Direct Binance fetch fallback
  try {
    const bSymbol = instId.replace('-USDT-SWAP', 'USDT').replace('-', '');
    const bInterval = bar.toLowerCase();
    const bRes = await fetch(`https://fapi.binance.com/fapi/v1/klines?symbol=${bSymbol}&interval=${bInterval}&limit=${limit}`);
    const bJson = await bRes.json();
    if (Array.isArray(bJson)) {
      return bJson.map((c: any[]) => ({
        ts: +c[0],
        open: +c[1],
        high: +c[2],
        low: +c[3],
        close: +c[4],
        vol: +c[5],
      }));
    }
  } catch (err) {}

  return [];
}

export async function fetchTickerAPI(instId: string) {
  try {
    const res = await fetch(`/api/crypto/ticker?instId=${encodeURIComponent(instId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {}

  // Direct OKX fallback
  try {
    const r = await fetch(`https://www.okx.com/api/v5/market/ticker?instId=${instId}`);
    const j = await r.json();
    if (j.data?.[0]) {
      return {
        last: +j.data[0].last,
        open24h: +j.data[0].open24h,
        high24h: +j.data[0].high24h,
        low24h: +j.data[0].low24h,
        vol24h: +j.data[0].volCcy24h || +j.data[0].vol24h,
      };
    }
  } catch (err) {}

  return null;
}

export async function fetchTradesAPI(instId: string, limit = 80): Promise<Trade[]> {
  try {
    const res = await fetch(`/api/crypto/trades?instId=${encodeURIComponent(instId)}&limit=${limit}`);
    if (res.ok) {
      const j = await res.json();
      if (j.data && Array.isArray(j.data)) return j.data;
    }
  } catch (err) {}

  try {
    const r = await fetch(`https://www.okx.com/api/v5/market/trades?instId=${instId}&limit=${limit}`);
    const j = await r.json();
    if (j.data && Array.isArray(j.data)) return j.data;
  } catch (err) {}

  return [];
}

export async function fetchFundingAPI(instId: string) {
  try {
    const res = await fetch(`/api/crypto/funding?instId=${encodeURIComponent(instId)}`);
    if (res.ok) return await res.json();
  } catch (err) {}

  try {
    const r = await fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`);
    const j = await r.json();
    if (j.data?.[0]) {
      return { fundingRate: +j.data[0].fundingRate, openInterest: 0 };
    }
  } catch (err) {}

  return { fundingRate: 0.0001, openInterest: 0 };
}

export async function fetchNewsAPI() {
  try {
    const res = await fetch('/api/crypto/news');
    if (res.ok) {
      const j = await res.json();
      return j.data || [];
    }
  } catch (err) {}

  try {
    const r = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN&limit=15');
    const j = await r.json();
    return j.Data || [];
  } catch (err) {}

  return [];
}

export async function analyzeChartWithAI(payload: {
  imageBase64?: string;
  imageMimeType?: string;
  symbol: string;
  timeframe: string;
  technicalSummary?: any;
  userQuery?: string;
}): Promise<AIChartReport> {
  const res = await fetch('/api/ai/analyze-chart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`AI analysis server response: ${res.statusText}`);
  }

  const json = await res.json();
  if (json.success && json.analysis) {
    return json.analysis;
  }
  throw new Error('Invalid response structure from AI analysis');
}
