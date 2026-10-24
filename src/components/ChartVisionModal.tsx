import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Copy } from 'lucide-react';
import { analyzeChartWithAI } from '../services/marketData';
import { AIChartReport } from '../types/terminal';

interface ChartVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSymbol: string;
  currentTimeframe: string;
  currentPrice: number;
  technicalSummary: any;
  lang: 'pt' | 'en';
}

export const ChartVisionModal: React.FC<ChartVisionModalProps> = ({
  isOpen,
  onClose,
  currentSymbol,
  currentTimeframe,
  currentPrice,
  technicalSummary,
  lang,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<AIChartReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageMimeType(file.type || 'image/png');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setImageMimeType(blob.type || 'image/png');
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    }
  };

  const handleRunAnalysis = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let base64Pure: string | undefined = undefined;
      if (imagePreview) {
        base64Pure = imagePreview.split(',')[1];
      }

      const result = await analyzeChartWithAI({
        imageBase64: base64Pure,
        imageMimeType,
        symbol: currentSymbol,
        timeframe: currentTimeframe,
        technicalSummary: {
          price: currentPrice,
          ...technicalSummary,
        },
        userQuery: userQuery.trim() || undefined,
      });

      setReport(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao processar análise institucional');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.traderSpeech);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onPaste={handlePaste}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-[#080818] border border-[#252550] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 border-b border-[#1a1a40] flex items-center justify-between bg-[#0b0b20]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#ce93d8]" />
            <span className="font-['Syne'] text-sm font-bold text-[#c8c8e8]">
              {lang === 'pt' ? 'ANÁLISE INSTITUCIONAL DE GRÁFICO (IA VISION)' : 'AI INSTITUTIONAL CHART VISION'}
            </span>
            <span className="text-[10px] font-mono text-[#ce93d8] bg-[#ce93d8]/10 border border-[#ce93d8]/30 px-2 py-0.5 rounded">
              Gemini 3.8 Pro Trader
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#7070a0] hover:text-[#c8c8e8] rounded transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 font-mono text-xs text-[#c8c8e8]">
          {/* Instructions banner */}
          <div className="bg-[#0b0b20] border border-[#1a1a40] p-3 rounded text-[11px] text-[#7070a0] leading-relaxed flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#4dd0e1] flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[#c8c8e8] font-bold">
                {lang === 'pt' ? 'Como trader profissional:' : 'Like a pro trader:'}
              </span>{' '}
              {lang === 'pt'
                ? 'Cole uma captura de tela do gráfico (Ctrl+V) ou faça upload de imagem. A IA examinará timeframes, estrutura de topos/fundos, rejeição nas médias, liquidez, alvos e armadilhas.'
                : 'Paste a chart screenshot (Ctrl+V) or upload an image. The AI analyzes timeframe alignment, swing highs/lows, EMA rejections, liquidity pools, targets, and market traps.'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload & Preview Section */}
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[170px] ${
                  imagePreview
                    ? 'border-[#ce93d8]/60 bg-[#07071a]'
                    : 'border-[#252550] hover:border-[#ce93d8] bg-[#0b0b20]'
                }`}
              >
                {imagePreview ? (
                  <div className="relative w-full max-h-[160px] overflow-hidden rounded">
                    <img
                      src={imagePreview}
                      alt="Chart preview"
                      className="w-full h-full object-contain mx-auto"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[9px] text-[#00e676]">
                      Imagem Carregada
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-[#7070a0] mb-2" />
                    <p className="text-xs text-[#c8c8e8] font-medium">
                      Clique para escolher imagem ou <span className="text-[#ce93d8]">Cole (Ctrl+V)</span>
                    </p>
                    <p className="text-[10px] text-[#7070a0] mt-1">
                      Suporta PNG, JPG, WebP de qualquer gráfico (TradingView, Corretoras)
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {imagePreview && (
                <button
                  onClick={() => setImagePreview(null)}
                  className="text-[10px] text-[#ff1744] hover:underline"
                >
                  Remover imagem (usar dados do terminal)
                </button>
              )}

              {/* Optional user prompt */}
              <div>
                <label className="block text-[10px] text-[#7070a0] uppercase tracking-wider mb-1">
                  Pergunta ou foco específico (opcional):
                </label>
                <input
                  type="text"
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Ex: Verifique se 76.400 aguenta suporte ou se vale scalping..."
                  className="w-full bg-[#0b0b20] border border-[#252550] rounded px-3 py-2 text-xs text-[#c8c8e8] outline-none focus:border-[#ce93d8]"
                />
              </div>

              {/* Action Button */}
              <button
                onClick={handleRunAnalysis}
                disabled={isLoading}
                className="w-full py-2.5 rounded font-['Syne'] font-bold text-xs tracking-wider bg-gradient-to-r from-[#ce93d8] via-[#64b5f6] to-[#69f0ae] text-[#04040c] hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-[#04040c]" />
                    <span>PROCESSANDO LEITURA INSTITUCIONAL...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#04040c]" />
                    <span>ANALISAR COMO TRADER INSTITUCIONAL</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Report Results Panel */}
            <div className="bg-[#0b0b20] border border-[#1a1a40] rounded-lg p-3.5 flex flex-col justify-between min-h-[300px]">
              {report ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1a1a40]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00e676]" />
                      <span className="font-['Syne'] font-bold text-xs text-[#00e676]">
                        {report.bias} • {report.symbol} ({report.timeframe})
                      </span>
                    </div>
                    <button
                      onClick={handleCopyReport}
                      className="flex items-center gap-1 text-[10px] text-[#7070a0] hover:text-[#c8c8e8] border border-[#252550] px-2 py-0.5 rounded"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? 'Copiado!' : 'Copiar Análise'}</span>
                    </button>
                  </div>

                  {/* Formatted speech text */}
                  <div className="bg-[#07071a] p-3 rounded border border-[#1a1a40] text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto selection:bg-[#ce93d8]/30">
                    {report.traderSpeech}
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-[#07071a] p-2 rounded border border-[#1a1a40]">
                      <span className="text-[#7070a0]">Entrada Long:</span>
                      <div className="text-[#00e676] font-bold mt-0.5">{report.safestLongEntry}</div>
                    </div>
                    <div className="bg-[#07071a] p-2 rounded border border-[#1a1a40]">
                      <span className="text-[#7070a0]">Entrada Short:</span>
                      <div className="text-[#ff1744] font-bold mt-0.5">{report.safestShortEntry}</div>
                    </div>
                  </div>

                  {/* Alerts */}
                  {report.suggestedAlerts && report.suggestedAlerts.length > 0 && (
                    <div className="text-[10px] bg-[#ffd600]/5 border border-[#ffd600]/20 p-2 rounded text-[#ffd600]">
                      <span className="font-bold">Alertas Sugeridos: </span>
                      {report.suggestedAlerts.join(' | ')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center text-[#7070a0] py-12">
                  <Camera className="w-10 h-10 text-[#252550] mb-2" />
                  <p className="text-xs text-[#c8c8e8]">Aguardando envio do gráfico</p>
                  <p className="text-[10px] text-[#7070a0] max-w-xs mt-1">
                    Cole uma imagem ou clique no botão para a IA gerar o diagnóstico de mesa proprietária.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
