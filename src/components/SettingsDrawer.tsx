import React, { useState, useEffect } from 'react';
import { X, Send, Save, Bell, Sliders, Check } from 'lucide-react';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  refreshInterval: number;
  onSelectInterval: (interval: number) => void;
  lang: 'pt' | 'en';
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  refreshInterval,
  onSelectInterval,
  lang,
}) => {
  const [tgToken, setTgToken] = useState('');
  const [tgChatId, setTgChatId] = useState('');
  const [minConf, setMinConf] = useState(70);
  const [alertSweep, setAlertSweep] = useState(true);
  const [alertWhale, setAlertWhale] = useState(true);
  const [alertManip, setAlertManip] = useState(true);
  const [tgActive, setTgActive] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('prisma_tg_token') || '';
    const chat = localStorage.getItem('prisma_tg_chatid') || '';
    setTgToken(token);
    setTgChatId(chat);
    if (token && chat) setTgActive(true);
  }, []);

  const handleSave = () => {
    localStorage.setItem('prisma_tg_token', tgToken);
    localStorage.setItem('prisma_tg_chatid', tgChatId);
    setTgActive(Boolean(tgToken && tgChatId));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleTestAlert = async () => {
    if (!tgToken || !tgChatId) {
      alert('Por favor, informe o Bot Token e Chat ID do Telegram');
      return;
    }
    try {
      const msg = `🟣 <b>PRISMA IA — TESTE DE ALERTA</b>\nTerminal Institucional conectado com sucesso!\nHorário: ${new Date().toLocaleTimeString()}`;
      await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChatId, text: msg, parse_mode: 'HTML' }),
      });
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    } catch (e) {
      alert('Falha ao enviar mensagem de teste. Verifique o token e chat ID.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-[#080818] border-l border-[#252550] h-full flex flex-col font-mono text-xs text-[#c8c8e8] shadow-2xl p-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1a1a40] mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#ce93d8]" />
            <span className="font-['Syne'] font-bold text-sm text-[#c8c8e8]">
              {lang === 'pt' ? 'CONFIGURAÇÕES & TELEGRAM' : 'SETTINGS & TELEGRAM'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-[#7070a0] hover:text-[#c8c8e8]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telegram Section */}
        <div className="space-y-3 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#7070a0] uppercase tracking-wider font-bold">
              BOT DO TELEGRAM
            </span>
            <span
              className={`text-[9px] px-2 py-0.5 rounded font-bold ${
                tgActive ? 'bg-[#00e676]/20 text-[#00e676]' : 'bg-[#ff1744]/20 text-[#ff1744]'
              }`}
            >
              {tgActive ? 'ATIVO' : 'DESCONECTADO'}
            </span>
          </div>

          <div>
            <label className="block text-[10px] text-[#7070a0] mb-1">Bot Token:</label>
            <input
              type="text"
              value={tgToken}
              onChange={(e) => setTgToken(e.target.value)}
              placeholder="Ex: 123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              className="w-full bg-[#0b0b20] border border-[#252550] rounded px-2.5 py-1.5 text-xs text-[#c8c8e8] outline-none focus:border-[#ce93d8]"
            />
          </div>

          <div>
            <label className="block text-[10px] text-[#7070a0] mb-1">Chat ID:</label>
            <input
              type="text"
              value={tgChatId}
              onChange={(e) => setTgChatId(e.target.value)}
              placeholder="Ex: -1001234567890 ou @seucanal"
              className="w-full bg-[#0b0b20] border border-[#252550] rounded px-2.5 py-1.5 text-xs text-[#c8c8e8] outline-none focus:border-[#ce93d8]"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] text-[#7070a0] mb-1">
              <span>Confiança Mínima para Alerta:</span>
              <span className="text-[#ce93d8] font-bold">{minConf}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={minConf}
              onChange={(e) => setMinConf(Number(e.target.value))}
              className="w-full accent-[#ce93d8]"
            />
          </div>

          {/* Alert Toggles */}
          <div className="space-y-1.5 pt-1">
            <label className="flex items-center justify-between text-[11px] cursor-pointer">
              <span className="text-[#c8c8e8]">Alertar Sweeps de Liquidez</span>
              <input
                type="checkbox"
                checked={alertSweep}
                onChange={(e) => setAlertSweep(e.target.checked)}
                className="accent-[#00e676]"
              />
            </label>
            <label className="flex items-center justify-between text-[11px] cursor-pointer">
              <span className="text-[#c8c8e8]">Alertar Movimentação Whale</span>
              <input
                type="checkbox"
                checked={alertWhale}
                onChange={(e) => setAlertWhale(e.target.checked)}
                className="accent-[#00e676]"
              />
            </label>
            <label className="flex items-center justify-between text-[11px] cursor-pointer">
              <span className="text-[#c8c8e8]">Alertar Manipulação e Trap</span>
              <input
                type="checkbox"
                checked={alertManip}
                onChange={(e) => setAlertManip(e.target.checked)}
                className="accent-[#00e676]"
              />
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 py-1.5 rounded bg-[#ce93d8]/20 border border-[#ce93d8] text-[#ce93d8] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#ce93d8]/30 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedNotice ? 'Salvo!' : 'Salvar Config'}</span>
            </button>
            <button
              onClick={handleTestAlert}
              className="px-3 py-1.5 rounded bg-[#0b0b20] border border-[#252550] text-[#4dd0e1] hover:border-[#4dd0e1] text-xs flex items-center gap-1.5 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testSent ? 'Enviado!' : 'Testar'}</span>
            </button>
          </div>
        </div>

        {/* Refresh Interval */}
        <div className="space-y-2 pt-3 border-t border-[#1a1a40]">
          <span className="text-[10px] text-[#7070a0] uppercase tracking-wider font-bold">
            INTERVALO DE ATUALIZAÇÃO
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {[5000, 10000, 30000, 60000].map((int) => (
              <button
                key={int}
                onClick={() => onSelectInterval(int)}
                className={`py-1.5 rounded text-center border text-[11px] transition-all ${
                  refreshInterval === int
                    ? 'border-[#00e676] bg-[#00e676]/15 text-[#00e676] font-bold'
                    : 'border-[#252550] bg-[#0b0b20] text-[#7070a0] hover:text-[#c8c8e8]'
                }`}
              >
                {int / 1000}s
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
