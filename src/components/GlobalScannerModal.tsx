import React, { useState, useEffect } from 'react';
import { Zap, X, ArrowUpRight, ArrowDownRight, RefreshCw, Check } from 'lucide-react';
import { fetchCandlesAPI } from '../services/marketData';
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
} from '../services/institutionalEngine';

interface ScannerResult {
  symbol: string;
  dir: 'CALL' | 'PUT' | 'AGUARDAR' | 'NEUTRAL';
  confidence: number;
  phase: string;
  price: number;
  sweep: boolean;
}

interface GlobalScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (asset: string) => void;
  lang: 'pt' | 'en';
}

const SCAN_ASSETS = [
  'BTC-USDT-SWAP',
  'ETH-USDT-SWAP',
  'SOL-USDT-SWAP',
  'XAU-USD',
  'EUR-USD',
  'GBP-USD',
  'USD-JPY',
  'BNB-USDT-SWAP',
  'XRP-USDT-SWAP',
  'DOGE-USDT-SWAP',
  'SUI-USDT-SWAP',
  'TAO-USDT-SWAP',
  'PEPE-USDT-SWAP',
  'WIF-USDT-SWAP',
  'AVAX-USDT-SWAP',
  'LINK-USDT-SWAP',
  'NEAR-USDT-SWAP',
  'INJ-USDT-SWAP',
];

export const GlobalScannerModal: React.FC<GlobalScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectAsset,
  lang,
}) => {
  const [results, setResults] = useState<ScannerResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);

  const runScan = async () => {
    setIsScanning(true);
    setScannedCount(0);
    const scanned: ScannerResult[] = [];

    for (let i = 0; i < SCAN_ASSETS.length; i++) {
      const sym = SCAN_ASSETS[i];
      try {
        const candles = await fetchCandlesAPI(sym, '5m', 40);
        if (candles.length >= 15) {
          const price = candles[candles.length - 1].close;
          const htf = calcHTFBias(candles, candles, candles, candles, candles);
          const williams = calcWilliamsR(candles);
          const obs = calcOrderBlocks(candles);
          const zones = calcLiquidityZones(candles);
          const delta = calcDeltaFlow([]);
          const smc = calcSMC(candles);
          const delivery = calcDeliveryModel(candles, delta);
          const manip = detectManipulation(candles, []);
          const sig = aggregateSignal({
            candles,
            htf,
            williams,
            obs,
            zones,
            delta,
            smc,
            delivery,
            manip,
          });

          scanned.push({
            symbol: sym,
            dir: sig.dir,
            confidence: sig.confidence,
            phase: delivery.phase,
            price,
            sweep: smc.sweepDetected,
          });
        }
      } catch (e) {}
      setScannedCount(i + 1);
    }

    scanned.sort((a, b) => b.confidence - a.confidence);
    setResults(scanned);
    setIsScanning(false);
  };

  useEffect(() => {
    if (isOpen && results.length === 0) {
      runScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#080818] border border-[#252550] rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#1a1a40] flex items-center justify-between bg-[#0b0b20]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#4dd0e1]" />
            <span className="font-['Syne'] text-sm font-bold text-[#c8c8e8]">
              {lang === 'pt' ? 'SCANNER GLOBAL DE OPORTUNIDADES' : 'GLOBAL OPPORTUNITY SCANNER'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7070a0] hover:text-[#c8c8e8] rounded transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Toolbar */}
        <div className="px-4 py-2 bg-[#07071a] border-b border-[#1a1a40] flex items-center justify-between">
          <div className="text-[11px] text-[#7070a0]">
            {isScanning
              ? `Varrendo mercado (${scannedCount}/${SCAN_ASSETS.length})...`
              : `${results.length} ativos analisados com algoritmo institucional`}
          </div>
          <button
            onClick={runScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#252550] text-[#4dd0e1] hover:bg-[#4dd0e1]/10 disabled:opacity-50 text-[10px]"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{lang === 'pt' ? 'RE-ESCANEAR' : 'RE-SCAN'}</span>
          </button>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {results.map((r, idx) => {
            const isCall = r.dir === 'CALL';
            const isPut = r.dir === 'PUT';
            const sym = r.symbol.split('-')[0];

            return (
              <div
                key={r.symbol}
                onClick={() => {
                  onSelectAsset(r.symbol);
                  onClose();
                }}
                className="bg-[#0b0b20] hover:bg-[#0e0e28] border border-[#1a1a40] hover:border-[#ce93d8] p-2.5 rounded flex items-center justify-between cursor-pointer transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#7070a0] font-bold w-5">{idx + 1}.</span>
                  <div>
                    <div className="font-['Syne'] text-xs font-bold text-[#c8c8e8] flex items-center gap-1.5">
                      <span>{sym}-USDT</span>
                      {r.sweep && (
                        <span className="text-[9px] px-1 bg-[#ffd600]/20 text-[#ffd600] rounded">
                          ⚡ SWEEP
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#7070a0]">
                      Preço: {r.price > 1000 ? r.price.toFixed(1) : r.price.toFixed(4)} • Fase: {r.phase}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div
                      className="font-['Syne'] text-sm font-extrabold"
                      style={{ color: isCall ? '#00e676' : isPut ? '#ff1744' : '#ffd600' }}
                    >
                      {r.dir} {r.confidence}%
                    </div>
                    <div className="text-[8px] text-[#7070a0]">Confluência</div>
                  </div>
                  <div className="text-[#7070a0]">
                    <ArrowUpRight className="w-4 h-4 text-[#ce93d8]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
