import React, { useEffect, useRef } from 'react';
import { DeltaFlow } from '../types/terminal';

interface CvdCardProps {
  delta: DeltaFlow;
  lang: 'pt' | 'en';
}

export const CvdCard: React.FC<CvdCardProps> = ({ delta, lang }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const buyVol = delta.buyVol || 50;
  const sellVol = delta.sellVol || 50;
  const total = buyVol + sellVol || 1;
  const buyPct = Math.round((buyVol / total) * 100);
  const sellPct = 100 - buyPct;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || delta.history.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.offsetWidth || 240;
    const h = 75;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const hist = delta.history;
    const min = Math.min(...hist, 0);
    const max = Math.max(...hist, 0);
    const range = max - min || 1;

    const toY = (val: number) => h - 8 - ((val - min) / range) * (h - 16);

    // Zero line
    const zeroY = toY(0);
    ctx.strokeStyle = '#ffffff20';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, zeroY);
    ctx.lineTo(w, zeroY);
    ctx.stroke();

    // Area fill
    const lastVal = hist[hist.length - 1];
    const isPositive = lastVal >= 0;
    const color = isPositive ? '#00e676' : '#ff1744';

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, isPositive ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 23, 68, 0.35)');
    grad.addColorStop(1, 'transparent');

    ctx.beginPath();
    hist.forEach((v, i) => {
      const x = (i / (hist.length - 1)) * w;
      const y = toY(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    hist.forEach((v, i) => {
      const x = (i / (hist.length - 1)) * w;
      const y = toY(v);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [delta]);

  const getSlopeColor = () => {
    if (delta.cvdSlope === 'UP') return '#00e676';
    if (delta.cvdSlope === 'DOWN') return '#ff1744';
    return '#ffd600';
  };

  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#ce93d8]" />
          <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
            DELTA FLOW / CVD
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-[#7070a0]">Tendência:</span>
          <span className="text-xs font-bold" style={{ color: getSlopeColor() }}>
            {delta.cvdSlope === 'UP' ? '↑ ALTA' : delta.cvdSlope === 'DOWN' ? '↓ BAIXA' : '→ LATERAL'}
          </span>
        </div>
      </div>

      {/* CVD Canvas */}
      <canvas ref={canvasRef} className="w-full h-[75px] block my-1" />

      {/* Quick stats row */}
      <div className="flex justify-between items-center text-[10px] font-mono mt-1 pt-1.5 border-t border-[#1a1a40]">
        <div>
          <span className="text-[#7070a0]">CVD Acumulado:</span>{' '}
          <span className="font-bold text-[#c8c8e8]">{delta.cvd > 0 ? `+${delta.cvd}` : delta.cvd}</span>
        </div>
        <div>
          <span className="text-[#7070a0]">Força Delta:</span>{' '}
          <span className="font-bold text-[#4dd0e1]">{delta.deltaStrength}%</span>
        </div>
      </div>

      {/* Big Players Ratio */}
      <div className="mt-2.5 pt-2 border-t border-[#1a1a40]">
        <div className="flex justify-between items-center text-[9px] font-mono mb-1">
          <span className="text-[#7070a0]">BIG PLAYERS (Últimas 20 velas)</span>
          <div className="flex gap-2">
            <span className="text-[#00e676] font-bold">COMPRA {buyPct}%</span>
            <span className="text-[#ff1744] font-bold">VENDA {sellPct}%</span>
          </div>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#1a1a40]">
          <div className="h-full bg-[#00e676]" style={{ width: `${buyPct}%` }} />
          <div className="h-full bg-[#ff1744]" style={{ width: `${sellPct}%` }} />
        </div>
      </div>
    </div>
  );
};
