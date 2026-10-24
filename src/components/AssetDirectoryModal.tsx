import React, { useState, useMemo } from 'react';
import { Search, X, Check, Globe, Sparkles, TrendingUp, DollarSign, Layers, Cpu, Flame, ShieldAlert, BarChart3 } from 'lucide-react';
import { ASSET_CATALOG, AssetInfo, TOTAL_ASSETS_COUNT } from '../data/assetsCatalog';

interface AssetDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAsset: string;
  onSelectAsset: (assetId: string) => void;
  lang: 'pt' | 'en';
}

export const AssetDirectoryModal: React.FC<AssetDirectoryModalProps> = ({
  isOpen,
  onClose,
  currentAsset,
  onSelectAsset,
  lang,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customSymbol, setCustomSymbol] = useState('');

  const categories = useMemo(() => [
    { id: 'all', label: lang === 'pt' ? 'Todos os Ativos' : 'All Assets', icon: Layers, count: TOTAL_ASSETS_COUNT },
    { id: 'crypto_major', label: lang === 'pt' ? 'Majors & L1' : 'Majors & L1', icon: TrendingUp },
    { id: 'crypto_ai', label: lang === 'pt' ? 'IA & DePIN' : 'AI & DePIN', icon: Cpu },
    { id: 'crypto_alt', label: lang === 'pt' ? 'DeFi & Rollups' : 'DeFi & Rollups', icon: Sparkles },
    { id: 'crypto_meme', label: lang === 'pt' ? 'Memecoins' : 'Memecoins', icon: Flame },
    { id: 'forex', label: lang === 'pt' ? 'Forex & BRL' : 'Forex & Currencies', icon: Globe },
    { id: 'metals', label: lang === 'pt' ? 'Metais & Energia' : 'Metals & Energy', icon: DollarSign },
    { id: 'indices', label: lang === 'pt' ? 'Índices Globais' : 'Global Indices', icon: BarChart3 },
  ], [lang]);

  const filteredAssets = useMemo(() => {
    return ASSET_CATALOG.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.badge && asset.badge.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || asset.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymbol.trim()) return;
    let formatted = customSymbol.trim().toUpperCase();
    if (!formatted.includes('-') && !formatted.includes('/')) {
      formatted = `${formatted}-USDT-SWAP`;
    }
    onSelectAsset(formatted);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#07071a] border border-[#2a2a60] w-full max-w-4xl max-h-[90vh] rounded-xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1a1a40] flex items-center justify-between bg-[#0b0b24]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00e676] animate-pulse"></span>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wider flex items-center gap-2">
                {lang === 'pt' ? 'CATÁLOGO DE ATIVOS INSTITUCIONAIS' : 'INSTITUTIONAL ASSET DIRECTORY'}
              </h2>
              <span className="px-2 py-0.5 text-[10px] rounded bg-[#ce93d8]/20 text-[#ce93d8] border border-[#ce93d8]/40 font-mono">
                {TOTAL_ASSETS_COUNT}+ {lang === 'pt' ? 'ATIVOS AO VIVO' : 'LIVE ASSETS'}
              </span>
            </div>
            <p className="text-[11px] text-[#7070a0] mt-1">
              {lang === 'pt'
                ? 'Criptomoedas (Majors, Altcoins, IA, Memecoins), Forex mundial com cotações interbancárias reais, Ouro, Prata, Petróleo e Índices.'
                : 'Select from 340+ verified institutional crypto derivatives, interbank forex pairs, commodities and global indices.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#141432] text-[#8080a0] hover:text-white hover:bg-[#1a1a44] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar and Custom Symbol input */}
        <div className="p-3 sm:p-4 border-b border-[#1a1a40] bg-[#090920] flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7070a0]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'pt' ? 'Pesquise por nome, símbolo, moeda (ex: BTC, PEPE, EUR/USD, Real, Ouro)...' : 'Search by name, symbol (e.g. BTC, EUR/USD, Gold)...'}
              className="w-full bg-[#04040c] border border-[#1e1e48] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#505080] focus:outline-none focus:border-[#ce93d8] transition-colors"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#7070a0] hover:text-white"
              >
                Limpar
              </button>
            )}
          </div>

          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="text"
              value={customSymbol}
              onChange={(e) => setCustomSymbol(e.target.value)}
              placeholder={lang === 'pt' ? 'Outro ticker (ex: FART-USDT-SWAP)' : 'Custom ticker'}
              className="w-40 sm:w-48 bg-[#04040c] border border-[#1e1e48] rounded-lg px-3 py-2 text-xs text-white placeholder-[#505080] focus:outline-none focus:border-[#00e676]"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-[#ce93d8]/20 hover:bg-[#ce93d8]/30 border border-[#ce93d8]/40 rounded-lg text-xs font-bold text-white transition-all whitespace-nowrap"
            >
              {lang === 'pt' ? 'Carregar' : 'Load'}
            </button>
          </form>
        </div>

        {/* Categories Tab Selector */}
        <div className="px-3 sm:px-4 py-2 border-b border-[#1a1a40] bg-[#07071a] flex gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#ce93d8] text-black font-bold shadow-lg shadow-[#ce93d8]/20'
                    : 'bg-[#0f0f2d] text-[#8080b0] hover:text-white hover:bg-[#15153a] border border-[#1e1e44]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
                {cat.count && (
                  <span className={`text-[10px] px-1 py-0.2 rounded ${isSelected ? 'bg-black/20 text-black' : 'bg-white/10 text-white/70'}`}>
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Asset List Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[#606090]">
              <p className="text-sm font-mono mb-2">
                {lang === 'pt' ? 'Nenhum ativo encontrado para esta busca.' : 'No assets found.'}
              </p>
              <p className="text-xs">
                {lang === 'pt' ? 'Você pode digitar qualquer ticker perpétuo ou spot na barra "Outro ticker" acima!' : 'You can enter any custom symbol in the input above.'}
              </p>
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isSelected = currentAsset === asset.id;
              return (
                <button
                  key={asset.id}
                  onClick={() => {
                    onSelectAsset(asset.id);
                    onClose();
                  }}
                  className={`p-3 rounded-lg border text-left flex items-center justify-between group transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#14143a] border-[#00e676] shadow-lg shadow-[#00e676]/10'
                      : 'bg-[#0a0a22]/70 hover:bg-[#121236] border-[#1a1a44] hover:border-[#3a3a70]'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-xs text-white group-hover:text-[#ce93d8] transition-colors truncate">
                        {asset.symbol}
                      </span>
                      {asset.badge && (
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded ${
                          asset.market === 'FOREX'
                            ? 'bg-[#4dd0e1]/10 text-[#4dd0e1] border border-[#4dd0e1]/30'
                            : asset.market === 'METAIS'
                            ? 'bg-[#ffd54f]/10 text-[#ffd54f] border border-[#ffd54f]/30'
                            : asset.market === 'ÍNDICES'
                            ? 'bg-[#b388ff]/10 text-[#b388ff] border border-[#b388ff]/30'
                            : 'bg-[#ce93d8]/10 text-[#ce93d8] border border-[#ce93d8]/30'
                        }`}>
                          {asset.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#7070a0] truncate mt-0.5">
                      {asset.name}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#101030] text-[#707090] border border-[#1c1c44]">
                      {asset.market}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#00e676]/20 border border-[#00e676] text-[#00e676] flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[#1a1a40] bg-[#090920] flex items-center justify-between text-[11px] text-[#606090] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e676]"></span>
            <span>
              {lang === 'pt' ? 'Mostrando ' : 'Showing '}
              <strong className="text-white">{filteredAssets.length}</strong>
              {lang === 'pt' ? ' ativos catalogados de ' : ' assets of '}
              <strong className="text-[#ce93d8]">{TOTAL_ASSETS_COUNT}+</strong>
            </span>
          </div>
          <div className="text-[10px] text-[#50507a]">
            {lang === 'pt' ? 'Feed Institucional OKX V5 + Binance Futures + Câmbio Interbancário Global' : 'Institutional Feeds: OKX V5 + Binance + Global FX'}
          </div>
        </div>

      </div>
    </div>
  );
};
