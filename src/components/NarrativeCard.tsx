import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

interface NarrativeCardProps {
  narrative: string;
  lang: 'pt' | 'en';
}

export const NarrativeCard: React.FC<NarrativeCardProps> = ({ narrative, lang }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0b0b20] border border-[#1a1a40] rounded p-3 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#ce93d8]" />
          <span className="font-['Syne'] text-[10px] font-bold text-[#7070a0] uppercase tracking-widest">
            {lang === 'pt' ? 'NARRATIVA INSTITUCIONAL' : 'INSTITUTIONAL NARRATIVE'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] font-mono text-[#7070a0] hover:text-[#c8c8e8] border border-[#252550] px-2 py-0.5 rounded transition-all bg-[#07071a]"
          title="Copiar texto da narrativa"
        >
          {copied ? <Check className="w-3 h-3 text-[#00e676]" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? (lang === 'pt' ? 'Copiado!' : 'Copied!') : (lang === 'pt' ? 'Copiar' : 'Copy')}</span>
        </button>
      </div>

      <div className="bg-[#07071a] border border-[#1a1a40] border-l-2 border-l-[#ce93d8] rounded p-3 font-mono text-xs text-[#c8c8e8] leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto selection:bg-[#ce93d8]/30">
        {narrative}
      </div>
    </div>
  );
};
