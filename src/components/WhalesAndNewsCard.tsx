import React from 'react';
import { WhaleEvent, NewsItem } from '../types/terminal';
import { ShieldAlert, Newspaper, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface WhalesAndNewsCardProps {
  whales: WhaleEvent[];
  news: NewsItem[];
  lang: 'pt' | 'en';
}

export const WhalesAndNewsCard: React.FC<WhalesAndNewsCardProps> = ({ whales, news, lang }) => {
  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Whales */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#64b5f6]" />
            <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
              WHALE TRACKER (FLUXO INSTITUCIONAL)
            </span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {whales.map((w, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-1.5 bg-[#07071a] border border-[#1a1a40] rounded text-[10px] font-mono"
              >
                <div className="flex items-center gap-1.5">
                  {w.impact === 'BULLISH' ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#00e676]" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-[#ff1744]" />
                  )}
                  <span className="text-[#c8c8e8] line-clamp-1">{w.reason}</span>
                </div>
                <span
                  className="font-bold whitespace-nowrap pl-2"
                  style={{ color: w.impact === 'BULLISH' ? '#00e676' : '#ff1744' }}
                >
                  ${(w.amountUsd / 1e6).toFixed(2)}M
                </span>
              </div>
            ))}

            {whales.length === 0 && (
              <div className="text-[10px] font-mono text-[#7070a0] text-center py-4">
                Monitorando blocos de grandes ordens...
              </div>
            )}
          </div>
        </div>

        {/* Live News */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Newspaper className="w-3.5 h-3.5 text-[#ce93d8]" />
            <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
              NOTÍCIAS & SENTIMENTO MACRO
            </span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {news.slice(0, 5).map((n, i) => {
              const impactCls =
                n.impact === 'EXTREME'
                  ? 'text-[#ff1744] bg-[#ff1744]/15 border-[#ff1744]/40'
                  : n.impact === 'HIGH'
                  ? 'text-[#ff8a65] bg-[#ff8a65]/15 border-[#ff8a65]/40'
                  : 'text-[#ffd600] bg-[#ffd600]/15 border-[#ffd600]/40';

              return (
                <div
                  key={i}
                  className="p-1.5 bg-[#07071a] border border-[#1a1a40] rounded text-[10px] font-mono"
                >
                  <div className="text-[#c8c8e8] line-clamp-1 leading-snug font-medium mb-1">
                    {n.title}
                  </div>
                  <div className="flex items-center justify-between text-[8px] text-[#7070a0]">
                    <span className="font-bold text-[#ce93d8]">{n.source}</span>
                    <span className={`px-1.5 py-0.2 rounded border font-bold ${impactCls}`}>
                      {n.impact} • {n.direction}
                    </span>
                  </div>
                </div>
              );
            })}

            {news.length === 0 && (
              <div className="text-[10px] font-mono text-[#7070a0] text-center py-4">
                Atualizando notícias institucionais...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
