import React, { useEffect, useRef, useState } from 'react';
import { Candle, SMCAnalysis, LiquidityZone, OrderBlock, SignalAggregation } from '../types/terminal';

interface ChartCanvasProps {
  candles: Candle[];
  smc: SMCAnalysis;
  zones: { green: LiquidityZone[]; red: LiquidityZone[] };
  obs: OrderBlock[];
  signal: SignalAggregation;
  currentPrice: number;
  timeframe: string;
  symbol: string;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  candles,
  smc,
  zones,
  obs,
  signal,
  currentPrice,
  timeframe,
  symbol,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 300;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Number of visible candles
    const visibleCandles = candles.slice(-70);
    const n = visibleCandles.length;
    if (n === 0) return;

    const highs = visibleCandles.map((c) => c.high);
    const lows = visibleCandles.map((c) => c.low);
    const maxPrice = Math.max(...highs) * 1.002;
    const minPrice = Math.min(...lows) * 0.998;
    const priceRange = maxPrice - minPrice || 1;

    const paddingRight = 65;
    const chartW = width - paddingRight;
    const candleW = Math.max(3, chartW / n);

    const toY = (p: number) => height - 25 - ((p - minPrice) / priceRange) * (height - 45);

    // Grid lines & price axis
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#1a1a40';
    ctx.fillStyle = '#7070a0';
    ctx.font = '9px "Space Mono", monospace';

    const gridSteps = 5;
    for (let i = 0; i <= gridSteps; i++) {
      const y = 15 + (i / gridSteps) * (height - 45);
      const p = maxPrice - (i / gridSteps) * priceRange;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();

      ctx.fillText(p > 1000 ? p.toFixed(1) : p.toFixed(4), chartW + 6, y + 3);
    }

    // Overlaid Liquidity Zones
    zones.green.forEach((z) => {
      const y1 = toY(z.max);
      const y2 = toY(z.min);
      ctx.fillStyle = 'rgba(0, 230, 118, 0.06)';
      ctx.fillRect(0, y1, chartW, Math.max(2, y2 - y1));
      ctx.strokeStyle = 'rgba(0, 230, 118, 0.25)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y1, chartW, Math.max(2, y2 - y1));
    });

    zones.red.forEach((z) => {
      const y1 = toY(z.max);
      const y2 = toY(z.min);
      ctx.fillStyle = 'rgba(255, 23, 68, 0.06)';
      ctx.fillRect(0, y1, chartW, Math.max(2, y2 - y1));
      ctx.strokeStyle = 'rgba(255, 23, 68, 0.25)';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(0, y1, chartW, Math.max(2, y2 - y1));
    });

    // Unmitigated Fair Value Gaps (FVG)
    smc.fvgs.slice(-3).forEach((fvg) => {
      const yTop = toY(fvg.top);
      const yBot = toY(fvg.bottom);
      ctx.fillStyle = fvg.type === 'BULLISH' ? 'rgba(77, 208, 225, 0.08)' : 'rgba(206, 147, 216, 0.08)';
      ctx.fillRect(chartW * 0.4, yTop, chartW * 0.6, Math.max(2, yBot - yTop));
      ctx.strokeStyle = fvg.type === 'BULLISH' ? 'rgba(77, 208, 225, 0.4)' : 'rgba(206, 147, 216, 0.4)';
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(chartW * 0.4, yTop, chartW * 0.6, Math.max(2, yBot - yTop));
      ctx.setLineDash([]);
    });

    // BSL / SSL lines
    if (smc.bsl) {
      const y = toY(smc.bsl);
      ctx.strokeStyle = 'rgba(100, 181, 246, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();
      ctx.fillStyle = '#64b5f6';
      ctx.fillText(`BSL ${smc.bsl > 1000 ? smc.bsl.toFixed(1) : smc.bsl.toFixed(4)}`, 6, y - 3);
      ctx.setLineDash([]);
    }

    if (smc.ssl) {
      const y = toY(smc.ssl);
      ctx.strokeStyle = 'rgba(255, 138, 101, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartW, y);
      ctx.stroke();
      ctx.fillStyle = '#ff8a65';
      ctx.fillText(`SSL ${smc.ssl > 1000 ? smc.ssl.toFixed(1) : smc.ssl.toFixed(4)}`, 6, y + 11);
      ctx.setLineDash([]);
    }

    // Candlesticks
    visibleCandles.forEach((c, i) => {
      const x = i * candleW + candleW / 2;
      const isBull = c.close >= c.open;
      const color = isBull ? '#00e676' : '#ff1744';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      // Body
      const topY = toY(Math.max(c.open, c.close));
      const botY = toY(Math.min(c.open, c.close));
      const bodyH = Math.max(1.5, botY - topY);

      ctx.fillStyle = isBull ? '#00e676d0' : '#ff1744d0';
      ctx.fillRect(x - candleW * 0.36, topY, candleW * 0.72, bodyH);
    });

    // Current Price tracker line
    if (currentPrice) {
      const curY = toY(currentPrice);
      ctx.strokeStyle = '#ffd600';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(0, curY);
      ctx.lineTo(chartW, curY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Bubble badge
      ctx.fillStyle = '#ffd600';
      ctx.fillRect(chartW + 2, curY - 8, 60, 16);
      ctx.fillStyle = '#04040c';
      ctx.font = 'bold 9px "Space Mono", monospace';
      ctx.fillText(currentPrice > 1000 ? currentPrice.toFixed(1) : currentPrice.toFixed(4), chartW + 5, curY + 4);
    }
  }, [candles, smc, zones, obs, currentPrice, signal]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const visibleCandles = candles.slice(-70);
    const paddingRight = 65;
    const chartW = rect.width - paddingRight;
    const candleW = chartW / visibleCandles.length;
    const index = Math.floor(x / candleW);
    if (index >= 0 && index < visibleCandles.length) {
      setHoveredCandle(visibleCandles[index]);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCandle(null);
  };

  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden" ref={containerRef}>
      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ce93d8]" />
          <span className="font-['Syne'] text-[11px] font-bold text-[#7070a0] uppercase tracking-widest">
            GRÁFICO INSTITUCIONAL
          </span>
          <span className="text-[10px] font-mono text-[#c8c8e8] bg-[#07071a] px-1.5 py-0.5 rounded border border-[#252550]">
            {symbol.split('-')[0]} • {timeframe.toUpperCase()}
          </span>
        </div>

        {/* Tooltip display */}
        {hoveredCandle ? (
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-[#7070a0]">O:</span>
            <span className="text-[#c8c8e8]">{hoveredCandle.open}</span>
            <span className="text-[#7070a0]">H:</span>
            <span className="text-[#00e676]">{hoveredCandle.high}</span>
            <span className="text-[#7070a0]">L:</span>
            <span className="text-[#ff1744]">{hoveredCandle.low}</span>
            <span className="text-[#7070a0]">C:</span>
            <span className="text-[#c8c8e8]">{hoveredCandle.close}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#7070a0]">
            <span>{candles.length} velas</span>
            <span className="text-[#4dd0e1]">• SMC Live</span>
          </div>
        )}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="block cursor-crosshair w-full"
      />

      {/* Floating Signal Badge */}
      {signal.dir !== 'AGUARDAR' && signal.dir !== 'NEUTRAL' && (
        <div
          className={`absolute top-4 right-18 border px-2 py-0.5 rounded text-[10px] font-['Syne'] font-bold tracking-wider backdrop-blur-sm pointer-events-none shadow-lg ${
            signal.dir === 'CALL'
              ? 'bg-[#00e676]/10 text-[#00e676] border-[#00e676]/40'
              : 'bg-[#ff1744]/10 text-[#ff1744] border-[#ff1744]/40'
          }`}
        >
          {signal.dir} {signal.confidence}%
        </div>
      )}
    </div>
  );
};
