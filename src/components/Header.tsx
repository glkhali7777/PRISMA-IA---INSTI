import React from 'react';
import { Activity, Camera, Sliders, Zap, Globe, ChevronDown, Database } from 'lucide-react';

interface HeaderProps {
  currentAsset: string;
  onOpenAssetDirectory: () => void;
  onOpenDataSources: () => void;
  currentTimeframe: string;
  onSelectTimeframe: (tf: string) => void;
  price: number;
  priceChange: number;
  lastUpdated: string;
  isLoading: boolean;
  onOpenScanner: () => void;
  onOpenVision: () => void;
  onOpenSettings: () => void;
  lang: 'pt' | 'en';
  onToggleLang: (lang: 'pt' | 'en') => void;
}

const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', '1D'];

export const Header: React.FC<HeaderProps> = ({
  currentAsset,
  onOpenAssetDirectory,
  onOpenDataSources,
  currentTimeframe,
  onSelectTimeframe,
  price,
  priceChange,
  lastUpdated,
  isLoading,
  onOpenScanner,
  onOpenVision,
  onOpenSettings,
  lang,
  onToggleLang,
}) => {
  // Format display label
  const getDisplaySymbol = () => {
    if (currentAsset === 'XAU-USD') return 'XAU/USD (OURO)';
    if (currentAsset === 'XAG-USD') return 'XAG/USD (PRATA)';
    if (currentAsset.includes('-USD') && !currentAsset.includes('USDT')) {
      return currentAsset.replace('-', '/');
    }
    const clean = currentAsset.replace('-SWAP', '').replace('-', '/');
    return clean;
  };

  const isForex = currentAsset.includes('-USD') && !currentAsset.includes('USDT');
  const isMetal = currentAsset === 'XAU-USD' || currentAsset === 'XAG-USD';

  return (
    <header className="sticky top-0 z-40 bg-[#04040c]/95 backdrop-blur-md border-b border-[#252550] px-4 py-2.5 flex items-center gap-3 flex-wrap shadow-lg shadow-black/40">
      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="font-['Syne',sans-serif] text-xl font-extrabold tracking-wider bg-gradient-to-r from-[#ce93d8] via-[#64b5f6] to-[#69f0ae] bg-clip-text text-transparent select-none">
          PRISMA IA
        </div>
        <span className="hidden sm:inline-block text-[10px] font-mono text-[#7070a0] tracking-widest border border-[#252550] px-1.5 py-0.5 rounded bg-[#0b0b20]">
          INSTITUCIONAL v3.0
        </span>
      </div>

      {/* Live status dot */}
      <div
        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
          isLoading
            ? 'bg-[#ffd600] shadow-[0_0_8px_#ffd600] animate-pulse'
            : 'bg-[#00e676] shadow-[0_0_8px_#00e676]'
        }`}
        title={isLoading ? 'Sincronizando feed de mercado...' : 'Conexão ativa'}
      />

      {/* Interactive Asset Selector Button */}
      <button
        onClick={onOpenAssetDirectory}
        className="flex items-center gap-2 bg-[#0b0b20] hover:bg-[#0e0e28] border border-[#252550] hover:border-[#ce93d8] text-[#c8c8e8] font-['Space_Mono'] text-xs rounded px-3 py-1.5 cursor-pointer transition-all shadow-sm group"
        title="Abrir Catálogo de Ativos (Cripto, Forex, Metais)"
      >
        <Globe className="w-3.5 h-3.5 text-[#ce93d8] group-hover:scale-110 transition-transform" />
        <span className="font-['Syne'] font-bold text-white tracking-wide">
          {getDisplaySymbol()}
        </span>
        <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#252550] text-[#4dd0e1] font-bold hidden md:inline">
          {isMetal ? 'METAIS' : isForex ? 'FOREX' : 'CRIPTO'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#7070a0]" />
      </button>

      {/* Timeframe Buttons */}
      <div className="flex items-center gap-1 bg-[#07071a] p-0.5 rounded border border-[#1a1a40] overflow-x-auto">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onSelectTimeframe(tf)}
            className={`px-2 py-1 text-[11px] font-mono rounded transition-all ${
              currentTimeframe === tf
                ? 'bg-[#ce93d8]/20 text-[#ce93d8] border border-[#ce93d8]/50 font-bold shadow-sm'
                : 'text-[#7070a0] hover:text-[#c8c8e8] hover:bg-[#1a1a40]/40'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Live Price Ticker */}
      <div className="flex items-baseline gap-2 pl-1 border-l border-[#252550]">
        <span className="font-['Syne'] text-base font-bold text-[#00e676] tracking-tight">
          {price
            ? price > 500
              ? price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
              : price > 1
              ? price.toFixed(4)
              : price.toFixed(5)
            : '--'}
        </span>
        <span
          className={`text-[11px] font-mono font-medium ${
            priceChange >= 0 ? 'text-[#00e676]' : 'text-[#ff1744]'
          }`}
        >
          {priceChange >= 0 ? '+' : ''}
          {priceChange ? priceChange.toFixed(2) : '0.00'}%
        </span>
      </div>

      <div className="flex-1" />

      {/* Refresh info */}
      <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-[#7070a0] font-mono">
        <Activity className="w-3 h-3 text-[#4dd0e1]" />
        <span>{lang === 'pt' ? 'Att:' : 'Upd:'} {lastUpdated || '--'}</span>
      </div>

      {/* Action Buttons */}
      <button
        onClick={onOpenDataSources}
        className="flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1.5 rounded border border-[#00e676]/40 text-[#00e676] hover:bg-[#00e676]/10 transition-all shadow-[0_0_8px_rgba(0,230,118,0.15)]"
        title="Fontes de Dados & Latência em Tempo Real"
      >
        <Database className="w-3.5 h-3.5" />
        <span className="hidden md:inline">{lang === 'pt' ? 'FONTES DADOS' : 'DATA FEEDS'}</span>
      </button>

      <button
        onClick={onOpenScanner}
        className="flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded border border-[#4dd0e1]/60 text-[#4dd0e1] hover:bg-[#4dd0e1]/10 transition-all shadow-[0_0_10px_rgba(77,208,225,0.15)]"
      >
        <Zap className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">SCANNER</span>
      </button>

      <button
        onClick={onOpenVision}
        className="flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded border border-[#ce93d8]/60 text-[#ce93d8] hover:bg-[#ce93d8]/10 transition-all shadow-[0_0_10px_rgba(206,147,216,0.15)]"
      >
        <Camera className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{lang === 'pt' ? 'IA GRÁFICO' : 'AI CHART'}</span>
      </button>

      <button
        onClick={onOpenSettings}
        className="p-1.5 rounded border border-[#252550] text-[#7070a0] hover:text-[#c8c8e8] hover:border-[#ce93d8] transition-all bg-[#0b0b20]"
        title={lang === 'pt' ? 'Configurações' : 'Settings'}
      >
        <Sliders className="w-3.5 h-3.5" />
      </button>

      {/* Language Toggle */}
      <div className="flex items-center border border-[#252550] rounded bg-[#0b0b20] overflow-hidden text-[10px] font-mono">
        <button
          onClick={() => onToggleLang('pt')}
          className={`px-2 py-1 transition-all ${
            lang === 'pt' ? 'bg-[#ce93d8]/20 text-[#ce93d8] font-bold' : 'text-[#7070a0] hover:text-[#c8c8e8]'
          }`}
        >
          PT
        </button>
        <button
          onClick={() => onToggleLang('en')}
          className={`px-2 py-1 transition-all ${
            lang === 'en' ? 'bg-[#ce93d8]/20 text-[#ce93d8] font-bold' : 'text-[#7070a0] hover:text-[#c8c8e8]'
          }`}
        >
          EN
        </button>
      </div>
    </header>
  );
};
