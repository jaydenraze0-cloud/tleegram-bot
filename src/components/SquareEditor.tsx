import React, { useRef, useState, useEffect } from 'react';
import {
  Download,
  Copy,
  RotateCcw,
  Type,
  Image as ImageIcon,
  Sparkles,
  Sliders,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Shield,
  Sun,
  Check,
  CheckCircle,
  Flame,
  Wand2,
} from 'lucide-react';
import { EditorConfig, AppSettings } from '../types';
import { getTextGlowStyle, getBoxGlowStyle, getDropShadowFilter } from '../utils/glow';
import { exportCanvasToBlob, exportCanvasToPng } from '../utils/exportImage';
import {
  balanceTwoLines,
  extractViralHighlights,
  generateAllViralVariations,
} from '../utils/headlineTransformer';

interface SquareEditorProps {
  config: EditorConfig;
  onChange: (newConfig: EditorConfig) => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onReset: () => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  storyImageUrl?: string;
  onFindInternetPhoto?: (query?: string) => void;
  candidatePhotos?: string[];
  isSearchingPhoto?: boolean;
  currentArticleTitle?: string;
}

type EditorTab = 'text' | 'highlight' | 'photo' | 'glow' | 'brand';

export const SquareEditor: React.FC<SquareEditorProps> = ({
  config,
  onChange,
  settings,
  onUpdateSettings,
  onReset,
  onShowToast,
  storyImageUrl,
  onFindInternetPhoto,
  candidatePhotos = [],
  isSearchingPhoto = false,
  currentArticleTitle,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>('text');
  const [internetSearchQuery, setInternetSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.48);

  const containerRef = useRef<HTMLDivElement>(null);
  const postRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Responsive scale computation
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth - 48;
        const height = containerRef.current.clientHeight - 48;
        const targetSize = Math.min(width, height, 540);
        setPreviewScale(Math.max(0.28, targetSize / 1080));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const toggleWordHighlight = (word: string) => {
    const cleanWord = word.replace(/[^\w\s-]/g, '').trim().toLowerCase();
    const current = config.highlightWords || [];
    const exists = current.some((w) => w.toLowerCase() === cleanWord);

    let next: string[];
    if (exists) {
      next = current.filter((w) => w.toLowerCase() !== cleanWord);
    } else {
      next = [...current, word.replace(/[^\w\s-]/g, '').trim()];
    }

    onChange({
      ...config,
      highlightWords: next,
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        onChange({
          ...config,
          background: {
            ...config.background,
            imageUrl: reader.result as string,
          },
        });
        onShowToast('Custom background photo loaded onto canvas', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        onUpdateSettings({ logoDataUrl: reader.result as string });
        onShowToast('Channel logo uploaded and saved!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadPng = async () => {
    if (!postRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await exportCanvasToPng(postRef.current);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `stark-news-1080p-${Date.now()}.png`;
      a.click();
      onShowToast('1080x1080 graphic card downloaded!', 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast('Failed to export image: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    if (!postRef.current) return;
    setIsCopying(true);
    try {
      const blob = await exportCanvasToBlob(postRef.current);
      if (navigator.clipboard && (window as any).ClipboardItem) {
        const item = new (window as any).ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        onShowToast('1080x1080 image copied to clipboard!', 'success');
        return;
      }
      onShowToast('Clipboard image write not supported in this browser.', 'info');
    } catch (err: any) {
      console.error(err);
      onShowToast('Failed to copy image to clipboard', 'error');
    } finally {
      setIsCopying(false);
    }
  };

  // Split headline into clean balanced lines (respects explicit \n or automatically balances into 2 lines)
  const splitHeadlineIntoLines = (text: string): string[] => {
    const clean = text.trim();
    if (!clean) return [];
    if (clean.includes('\n')) {
      const raw = clean.split('\n').map((l) => l.trim()).filter(Boolean);
      if (raw.length > 0) return raw;
    }
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length <= 3) {
      return [words.join(' ')];
    }
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  };

  // Group line words into tokens: consecutive highlighted words are grouped into 1 snug badge box
  interface LineToken {
    text: string;
    isHighlight: boolean;
    words: string[];
  }

  const parseLineTokens = (line: string): LineToken[] => {
    const rawWords = line.split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return [];

    const cleanHighSet = new Set(
      (config.highlightWords || []).map((w) => w.replace(/[^\w\s-]/g, '').trim().toLowerCase())
    );

    const tokens: LineToken[] = [];
    let currentGroup: { isHighlight: boolean; words: string[] } | null = null;

    for (const rawWord of rawWords) {
      // Clean trailing commas, colons, semicolons from display words for clean graphic look
      const word = rawWord.replace(/[,;:]+$/, '');
      const cleanWord = word.replace(/[^\w\s-]/g, '').trim().toLowerCase();
      const isHigh = cleanHighSet.has(cleanWord);

      if (currentGroup && currentGroup.isHighlight === isHigh) {
        currentGroup.words.push(word);
      } else {
        if (currentGroup) {
          tokens.push({
            text: currentGroup.words.join(' '),
            isHighlight: currentGroup.isHighlight,
            words: currentGroup.words,
          });
        }
        currentGroup = { isHighlight: isHigh, words: [word] };
      }
    }

    if (currentGroup) {
      tokens.push({
        text: currentGroup.words.join(' '),
        isHighlight: currentGroup.isHighlight,
        words: currentGroup.words,
      });
    }

    return tokens;
  };

  // Render tokens: structured 2-line layout with bold, prominent snug badge boxes for highlights
  const renderStyledHeadline = () => {
    const rawHeadline = config.headline.trim();
    if (!rawHeadline) return null;

    const lines = splitHeadlineIntoLines(rawHeadline);

    return (
      <div className="flex flex-col gap-3">
        {lines.map((line, lineIdx) => {
          const tokens = parseLineTokens(line);
          return (
            <div
              key={lineIdx}
              className="flex items-center flex-wrap"
              style={{
                justifyContent:
                  config.textAlign === 'center'
                    ? 'center'
                    : config.textAlign === 'right'
                    ? 'flex-end'
                    : 'flex-start',
                rowGap: '8px',
                columnGap: '4px',
              }}
            >
              {tokens.map((token, tIdx) => {
                if (token.isHighlight) {
                  return (
                    <span
                      key={tIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        token.words.forEach((w) => toggleWordHighlight(w));
                      }}
                      title="Klik untuk ubah sorotan"
                      style={{
                        backgroundColor: config.highlightBoxColor || '#FFFFFF',
                        color: config.highlightTextColor || '#000000',
                        lineHeight: '1.05',
                        paddingLeft: '18px',
                        paddingRight: '18px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        borderRadius: '6px',
                        margin: '0 6px',
                        boxShadow: '0 0 24px rgba(255, 255, 255, 0.95), 0 0 48px rgba(255, 255, 255, 0.5)',
                        ...getBoxGlowStyle(config.glow, config.glow?.toggles?.highlightBox),
                      }}
                      className="inline-flex items-center font-black tracking-tight uppercase whitespace-nowrap shadow-xl cursor-pointer select-none transition-transform active:scale-95"
                    >
                      {token.text}
                    </span>
                  );
                }

                return (
                  <span
                    key={tIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      token.words.forEach((w) => toggleWordHighlight(w));
                    }}
                    title="Klik untuk beri kotak putih"
                    style={{
                      color: config.textColor || '#FFFFFF',
                      lineHeight: '1.15',
                      margin: '0 6px',
                      ...getTextGlowStyle(config.glow, config.glow?.toggles?.headline),
                    }}
                    className="font-extrabold uppercase tracking-tight hover:opacity-90 cursor-pointer select-none"
                  >
                    {token.text}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Hidden File Inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {/* Canvas Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
            STUDIO CANVAS
          </span>
          <span className="font-mono text-neutral-500 text-[10px]">1080 × 1080 px</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <CheckCircle className="w-3 h-3" /> Auto-Rendered
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-2.5 py-1 text-[11px] text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition flex items-center gap-1 cursor-pointer"
            title="Reset to default layout"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden md:inline">Reset</span>
          </button>

          <button
            onClick={handleCopyImage}
            disabled={isCopying}
            className="px-2.5 py-1 text-[11px] text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Copy className="w-3 h-3" />
            <span>{isCopying ? 'Copying...' : 'Copy Image'}</span>
          </button>

          <button
            onClick={handleDownloadPng}
            disabled={isExporting}
            className="px-3 py-1 text-[11px] font-black text-black bg-white hover:bg-neutral-200 rounded transition shadow-[0_0_12px_rgba(255,255,255,0.4)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Download PNG'}</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center p-4 bg-neutral-950/80 overflow-hidden relative min-h-[420px]"
      >
        <div
          className="relative flex items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-black shadow-[0_0_40px_rgba(255,255,255,0.12)]"
          style={{
            width: `${1080 * previewScale}px`,
            height: `${1080 * previewScale}px`,
          }}
        >
          {/* THE 1080x1080 MASTER CANVAS */}
          <div
            ref={postRef}
            id="stark-news-master-canvas"
            className="absolute top-0 left-0 select-none overflow-hidden bg-black text-white"
            style={{
              width: '1080px',
              height: '1080px',
              transform: `scale(${previewScale})`,
              transformOrigin: 'top left',
              fontFamily: "'Plus Jakarta Sans', 'Montserrat', sans-serif",
            }}
          >
            {/* Layer 1: Background Image with Zoom and Pan */}
            {config.background.imageUrl && (
              <div
                className="absolute inset-0 overflow-hidden transition-transform duration-75"
                style={{
                  transform: `scale(${config.background.zoom / 100}) translate(${config.background.panX}px, ${config.background.panY}px)`,
                }}
              >
                <img
                  src={config.background.imageUrl}
                  alt="Background War News"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('/api/news/proxy-image') && config.background.imageUrl) {
                      target.src = `/api/news/proxy-image?url=${encodeURIComponent(config.background.imageUrl)}`;
                    }
                  }}
                />
              </div>
            )}

            {/* Layer 2: Soft Dark Top Gradient */}
            <div
              className="absolute inset-x-0 top-0 pointer-events-none"
              style={{
                height: '240px',
                background: `linear-gradient(to bottom, rgba(0,0,0,${config.background.topGradientOpacity / 100}) 0%, rgba(0,0,0,0) 100%)`,
              }}
            />

            {/* Layer 3: Solid Black Bottom Gradient */}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: `${Math.max(75, config.background.bottomGradientHeight)}%`,
                background: `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.7) 65%, rgba(0,0,0,0) 100%)`,
              }}
            />

            {/* Layer 4: Channel Custom Logo */}
            {config.logo.show && (
              <div
                className="absolute pointer-events-auto"
                style={{
                  top: `${config.logo.margin}px`,
                  left: config.logo.position === 'top-left' ? `${config.logo.margin}px` : 'auto',
                  right: config.logo.position === 'top-right' ? `${config.logo.margin}px` : 'auto',
                  ...getDropShadowFilter(config.glow, config.glow?.toggles?.logo),
                }}
              >
                {settings.logoDataUrl ? (
                  <img
                    src={settings.logoDataUrl}
                    alt="Channel Logo"
                    style={{
                      height: `${config.logo.size}px`,
                      width: 'auto',
                    }}
                    className="object-contain max-w-[200px]"
                  />
                ) : (
                  <div className="flex h-14 w-12 items-center justify-center rounded-xl border-2 border-white bg-black/85 font-black text-white text-xl shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    §
                  </div>
                )}
              </div>
            )}

            {/* Layer 5: Main Content Group (Anchored to Bottom to Prevent Any Bottom Overflow) */}
            <div
              className="absolute pointer-events-auto flex flex-col justify-end"
              style={{
                bottom: `${Math.max(48, Math.round((100 - config.headlineY) * 3.5))}px`,
                left: `${config.headlineX}px`,
                right: `${config.headlineX}px`,
                textAlign: config.textAlign,
              }}
            >
              {/* Thin Accent Divider Line */}
              {config.divider.show && (
                <div
                  className="mb-4 h-1.5 w-28 bg-white shadow-[0_0_16px_rgba(255,255,255,1)]"
                  style={{
                    margin:
                      config.textAlign === 'center'
                        ? '0 auto 16px auto'
                        : config.textAlign === 'right'
                        ? '0 0 16px auto'
                        : '0 0 16px 0',
                  }}
                />
              )}

              {/* Bold All-Caps 2-Line Structured Headline */}
              {(() => {
                const lines = splitHeadlineIntoLines(config.headline);
                const maxLineChars = lines.length > 0 ? Math.max(...lines.map((l) => l.length)) : config.headline.length;
                const baseSize = config.fontSize || 62;
                // Responsive font sizing based on longest line so it boldly fills the width
                const dynamicSize = maxLineChars <= 22
                  ? baseSize
                  : maxLineChars <= 28
                  ? Math.max(52, Math.round(baseSize * 0.92))
                  : maxLineChars <= 34
                  ? Math.max(48, Math.round(baseSize * 0.85))
                  : Math.max(44, Math.round(baseSize * 0.78));

                return (
                  <div
                    className="font-extrabold uppercase tracking-tight"
                    style={{
                      fontSize: `${dynamicSize}px`,
                      lineHeight: '1.15',
                      fontFamily: config.fontFamily || "'Plus Jakarta Sans', sans-serif",
                    }}
                    onDoubleClick={() => setIsInlineEditing(true)}
                  >
                    {isInlineEditing ? (
                      <textarea
                        autoFocus
                        value={config.headline}
                        onChange={(e) => onChange({ ...config, headline: e.target.value })}
                        onBlur={() => setIsInlineEditing(false)}
                        className="w-full bg-black/95 p-3 text-white border-2 border-white rounded outline-none shadow-[0_0_20px_#ffffff]"
                        style={{ fontSize: `${dynamicSize * 0.85}px`, minHeight: '120px' }}
                      />
                    ) : (
                      <div>{renderStyledHeadline()}</div>
                    )}
                  </div>
                );
              })()}

              {/* Source Line and Footer @Handle - Guaranteed Below Headline */}
              <div className="mt-4 flex items-center">
                {config.handleFooter.show && (
                  <span
                    className="font-bold tracking-wider font-mono text-white/90 select-none"
                    style={{
                      fontSize: '18px',
                      letterSpacing: '0.06em',
                      ...getTextGlowStyle(config.glow, config.glow?.toggles?.footer),
                    }}
                  >
                    {settings.handle || config.handleFooter.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Controls Tab Navigation */}
      <div className="flex border-t border-neutral-800 bg-neutral-900 px-3 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-bold tracking-wide transition whitespace-nowrap cursor-pointer ${
            activeTab === 'text'
              ? 'border-white text-white shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>TEXT & LAYOUT</span>
        </button>

        <button
          onClick={() => setActiveTab('highlight')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-bold tracking-wide transition whitespace-nowrap cursor-pointer ${
            activeTab === 'highlight'
              ? 'border-white text-white shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>HIGHLIGHT WORDS</span>
        </button>

        <button
          onClick={() => setActiveTab('photo')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-bold tracking-wide transition whitespace-nowrap cursor-pointer ${
            activeTab === 'photo'
              ? 'border-white text-white shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>PHOTO & GRADIENT</span>
        </button>

        <button
          onClick={() => setActiveTab('brand')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-bold tracking-wide transition whitespace-nowrap cursor-pointer ${
            activeTab === 'brand'
              ? 'border-white text-white shadow-[0_2px_8px_rgba(255,255,255,0.4)]'
              : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>LOGO & BRANDING</span>
        </button>
      </div>

      {/* Editor Tab Panels */}
      <div className="p-4 bg-neutral-950 border-t border-neutral-900 text-xs">
        {/* TAB 1: TEXT & LAYOUT */}
        {activeTab === 'text' && (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1 text-neutral-400">
                <span className="font-semibold text-neutral-300">Teks Judul Banner (Canvas 1080p)</span>
                <span className="text-[10px] text-amber-400 font-mono">✨ Format Viral 2 Baris</span>
              </div>
              <textarea
                rows={2}
                value={config.headline}
                onChange={(e) => onChange({ ...config, headline: e.target.value.toUpperCase() })}
                placeholder="BARIS 1&#10;BARIS 2"
                className="w-full bg-neutral-900 border border-neutral-800 rounded p-2 text-white font-mono text-xs focus:border-white focus:outline-none uppercase leading-snug"
              />

              {/* 1-Click Viral Template Buttons */}
              <div className="mt-2 space-y-1.5 bg-neutral-900/60 border border-neutral-800 rounded p-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-300 font-semibold flex items-center gap-1">
                    <Flame className="w-3 h-3 text-red-400" />
                    <span>Template Headline Viral:</span>
                  </span>
                  <button
                    onClick={() => {
                      const balanced = balanceTwoLines(config.headline);
                      onChange({ ...config, headline: balanced, highlightWords: extractViralHighlights(balanced) });
                      onShowToast('Teks diseimbangkan menjadi 2 baris rapi', 'success');
                    }}
                    className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800 px-2 py-0.5 rounded cursor-pointer"
                  >
                    <AlignLeft className="w-2.5 h-2.5" />
                    <span>Seimbangkan 2 Baris</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {[
                    { id: 'viral', label: '🔥 Viral Hook' },
                    { id: 'impact', label: '⚡ Breaking Impact' },
                    { id: 'tactical', label: '🎯 Tactical OSINT' },
                    { id: 'dramatic', label: '💥 Dramatic Alert' },
                    { id: 'indo', label: '🇮🇩 Viral Indo' },
                    { id: 'short', label: '✂️ Ultra Short' },
                  ].map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => {
                        const rawSource = currentArticleTitle || config.headline;
                        const vars = generateAllViralVariations(rawSource);
                        const chosen = (vars as Record<string, string>)[tmpl.id] || vars.viral;
                        onChange({
                          ...config,
                          headline: chosen,
                          highlightWords: extractViralHighlights(chosen),
                        });
                        onShowToast(`Template diterapkan: ${tmpl.label}`, 'info');
                      }}
                      className="px-2 py-1 rounded text-[10px] font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border border-neutral-700/60 truncate cursor-pointer transition text-left"
                    >
                      {tmpl.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between mb-1 text-neutral-400">
                  <span>Font Size</span>
                  <span className="font-mono text-white">{config.fontSize || 62}px</span>
                </div>
                <input
                  type="range"
                  min={44}
                  max={92}
                  value={config.fontSize || 62}
                  onChange={(e) => onChange({ ...config, fontSize: parseInt(e.target.value) })}
                  className="w-full accent-white"
                />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-neutral-400">
                <span>Vertical Position (Y)</span>
                <span className="font-mono text-white">{config.headlineY}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={85}
                value={config.headlineY}
                onChange={(e) => onChange({ ...config, headlineY: parseInt(e.target.value) })}
                className="w-full accent-white"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-neutral-400">
                <span>Alignment & Divider</span>
                <button
                  onClick={() =>
                    onChange({
                      ...config,
                      divider: { show: !config.divider.show },
                    })
                  }
                  className={`text-[10px] px-2 py-0.5 rounded cursor-pointer ${
                    config.divider.show ? 'bg-white text-black font-bold' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {config.divider.show ? 'Divider ON' : 'Divider OFF'}
                </button>
              </div>
              <div className="flex gap-1">
                {(['left', 'center', 'right'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => onChange({ ...config, textAlign: align })}
                    className={`flex-1 py-1 rounded capitalize cursor-pointer ${
                      config.textAlign === align
                        ? 'bg-white text-black font-bold'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {align}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* TAB 2: HIGHLIGHT WORDS */}
        {activeTab === 'highlight' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Click word chips below to toggle white contrast highlight boxes on the canvas:</span>
              <button
                onClick={() => onChange({ ...config, highlightWords: [] })}
                className="text-[10px] text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Clear Highlights
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 p-3 bg-neutral-900 rounded-lg border border-neutral-800">
              {config.headline.split(/\s+/).filter(Boolean).map((word, idx) => {
                const clean = word.replace(/[^\w\s-]/g, '').trim().toLowerCase();
                const isSelected = (config.highlightWords || []).some(
                  (hw) => hw.toLowerCase() === clean
                );
                return (
                  <button
                    key={idx}
                    onClick={() => toggleWordHighlight(word)}
                    className={`px-2.5 py-1 text-xs font-bold rounded transition cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black shadow-[0_0_8px_#ffffff]'
                        : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {word.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PHOTO & GRADIENT */}
        {activeTab === 'photo' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-neutral-400">Pilihan Foto Cover Berita</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold flex items-center justify-center gap-1 cursor-pointer text-xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                  {storyImageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...config,
                          background: { ...config.background, imageUrl: storyImageUrl },
                        })
                      }
                      className={`px-2.5 py-1.5 rounded text-xs font-bold cursor-pointer transition ${
                        config.background.imageUrl === storyImageUrl
                          ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                      }`}
                      title="Pakai foto asli dari feed berita"
                    >
                      Cover Asli Berita
                    </button>
                  )}
                  {onFindInternetPhoto && (
                    <button
                      type="button"
                      onClick={() => onFindInternetPhoto()}
                      disabled={isSearchingPhoto}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition shadow-md"
                      title="Cari foto otomatis di internet sesuai topik berita"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>{isSearchingPhoto ? 'Mencari di Internet...' : '🔍 Cari Otomatis di Internet'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Internet Image Search Input */}
              {onFindInternetPhoto && (
                <div className="bg-neutral-950/70 p-2.5 rounded-lg border border-neutral-800">
                  <div className="text-[11px] text-neutral-400 mb-1.5 font-medium flex items-center justify-between">
                    <span>Cari Foto Spesifik di Internet (Tanpa Stok Foto):</span>
                    <span className="text-[10px] text-sky-400">Bing & Wikimedia Live</span>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Contoh: Kharkiv strike, Houthi warship, F-16 fighter jet..."
                      value={internetSearchQuery}
                      onChange={(e) => setInternetSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onFindInternetPhoto(internetSearchQuery);
                        }
                      }}
                      className="flex-1 bg-neutral-900 border border-neutral-750 rounded px-2.5 py-1 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-sky-500 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => onFindInternetPhoto(internetSearchQuery)}
                      disabled={isSearchingPhoto}
                      className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-sky-300 hover:text-white rounded text-xs font-bold cursor-pointer transition whitespace-nowrap"
                    >
                      {isSearchingPhoto ? 'Mencari...' : 'Cari'}
                    </button>
                  </div>
                </div>
              )}

            <div>
              <div className="flex justify-between mb-1 text-neutral-400">
                <span>Photo Zoom</span>
                <span className="font-mono text-white">{config.background.zoom}%</span>
              </div>
              <input
                type="range"
                min={100}
                max={250}
                value={config.background.zoom}
                onChange={(e) =>
                  onChange({
                    ...config,
                    background: { ...config.background, zoom: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-white"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-neutral-400">
                <span>Bottom Dark Gradient</span>
                <span className="font-mono text-white">{config.background.bottomGradientOpacity}%</span>
              </div>
              <input
                type="range"
                min={30}
                max={100}
                value={config.background.bottomGradientOpacity}
                onChange={(e) =>
                  onChange({
                    ...config,
                    background: {
                      ...config.background,
                      bottomGradientOpacity: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full accent-white"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-neutral-400">
                <span>Gradient Height</span>
                <span className="font-mono text-white">{config.background.bottomGradientHeight}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={90}
                value={config.background.bottomGradientHeight}
                onChange={(e) =>
                  onChange({
                    ...config,
                    background: {
                      ...config.background,
                      bottomGradientHeight: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full accent-white"
              />
            </div>
          </div>

          {/* Real Internet Image Candidates Gallery */}
          {candidatePhotos && candidatePhotos.length > 0 && (
            <div className="pt-3 border-t border-neutral-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-neutral-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  <span>Foto Asli dari Internet ({candidatePhotos.length} Foto Ditemukan)</span>
                </span>
                <span className="text-[10px] text-sky-400 font-mono">Klik foto untuk jadikan cover</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {candidatePhotos.map((imgUrl, i) => {
                  const isCurrent = config.background.imageUrl === imgUrl;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...config,
                          background: { ...config.background, imageUrl: imgUrl },
                        })
                      }
                      className={`aspect-square rounded-lg overflow-hidden border-2 relative transition cursor-pointer group ${
                        isCurrent
                          ? 'border-sky-400 ring-2 ring-sky-400/40 shadow-lg'
                          : 'border-neutral-800 hover:border-neutral-500 opacity-80 hover:opacity-100'
                      }`}
                      title="Klik untuk jadikan cover page"
                    >
                      <img
                        src={imgUrl}
                        alt={`Google Candidate ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        crossOrigin="anonymous"
                      />
                      {isCurrent && (
                        <div className="absolute top-1 right-1 bg-sky-500 text-white rounded-full p-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

        {/* TAB 4: LOGO & BRANDING */}
        {activeTab === 'brand' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-neutral-400">Channel Logo</span>
              <button
                onClick={() => logoInputRef.current?.click()}
                className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Logo</span>
              </button>
            </div>

            <div>
              <div className="flex justify-between mb-1 text-neutral-400">
                <span>Logo Size</span>
                <span className="font-mono text-white">{config.logo.size}px</span>
              </div>
              <input
                type="range"
                min={32}
                max={110}
                value={config.logo.size}
                onChange={(e) =>
                  onChange({
                    ...config,
                    logo: { ...config.logo, size: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-white"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1 text-neutral-400">
                <span>Watermark Handle</span>
              </div>
              <input
                type="text"
                value={settings.handle}
                onChange={(e) => onUpdateSettings({ handle: e.target.value })}
                placeholder="@Stark-News-x"
                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
