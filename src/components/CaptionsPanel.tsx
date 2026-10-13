import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Copy,
  Check,
  AlertCircle,
  Type,
  ExternalLink,
  MessageSquare,
  Wand2,
  AlignLeft,
  Flame,
  Zap,
  Shield,
  Trash2,
} from 'lucide-react';
import { NewsArticle, AppSettings, EditorConfig } from '../types';
import {
  balanceTwoLines,
  extractViralHighlights,
  generateAllViralVariations,
} from '../utils/headlineTransformer';

export type ViralHeadlineStyle = 'viral' | 'impact' | 'tactical' | 'dramatic' | 'indo' | 'short';

interface CaptionsPanelProps {
  currentStory: NewsArticle | null;
  editorConfig: EditorConfig;
  onChangeEditorConfig: (newConfig: EditorConfig) => void;
  captionTelegram: string;
  onChangeCaptionTelegram: (text: string) => void;
  settings: AppSettings;
  onPostToTelegramWithPhoto: (caption: string) => Promise<void>;
  onPostVideoToTelegram?: (caption: string) => Promise<void>;
  isPostingTelegram: boolean;
  isPostingVideo?: boolean;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
  onGenerateSmartHeadline: (style?: ViralHeadlineStyle) => Promise<void>;
  isGeneratingHeadline: boolean;
}

export const CaptionsPanel: React.FC<CaptionsPanelProps> = ({
  currentStory,
  editorConfig,
  onChangeEditorConfig,
  captionTelegram,
  onChangeCaptionTelegram,
  settings,
  onPostToTelegramWithPhoto,
  onPostVideoToTelegram,
  isPostingTelegram,
  isPostingVideo = false,
  onShowToast,
  onGenerateSmartHeadline,
  isGeneratingHeadline,
}) => {
  const [copied, setCopied] = useState(false);
  const [headlineStyle, setHeadlineStyle] = useState<ViralHeadlineStyle>('viral');

  const charCount = captionTelegram.length;
  const isOverLimit = charCount > 1024; // Telegram caption limit is 1024 chars for photos

  const handleCopyCaption = async () => {
    if (!captionTelegram) return;
    try {
      await navigator.clipboard.writeText(captionTelegram);
      setCopied(true);
      onShowToast('Caption disalin ke clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('Gagal menyalin', 'error');
    }
  };

  const toggleWordHighlight = (word: string) => {
    const clean = word.replace(/[^\w\s-]/g, '').trim().toLowerCase();
    const current = editorConfig.highlightWords || [];
    const exists = current.some((w) => w.toLowerCase() === clean);

    let next: string[];
    if (exists) {
      next = current.filter((w) => w.toLowerCase() !== clean);
    } else {
      next = [...current, word.replace(/[^\w\s-]/g, '').trim()];
    }

    onChangeEditorConfig({
      ...editorConfig,
      highlightWords: next,
    });
  };

  // Instant local template transformer
  const handleApplyLocalTemplate = (style: ViralHeadlineStyle) => {
    setHeadlineStyle(style);
    if (currentStory) {
      const vars = generateAllViralVariations(currentStory.title);
      const chosen = vars[style] || vars.viral;
      const highlights = extractViralHighlights(chosen);
      onChangeEditorConfig({
        ...editorConfig,
        headline: chosen,
        highlightWords: highlights,
      });
      onShowToast(`Template diterapkan: ${style.toUpperCase()}`, 'info');
    } else {
      onGenerateSmartHeadline(style);
    }
  };

  // Format current headline into 2 balanced lines
  const handleBalanceLines = () => {
    const balanced = balanceTwoLines(editorConfig.headline);
    onChangeEditorConfig({
      ...editorConfig,
      headline: balanced,
      highlightWords: extractViralHighlights(balanced),
    });
    onShowToast('Teks diseimbangkan menjadi 2 baris rapi', 'success');
  };

  // Clean away any leftover "BREAKING ALERT:" or "BREAKING:" prefix in caption
  const handleCleanAlertPrefix = () => {
    const cleaned = captionTelegram
      .replace(/🚨\s*BREAKING\s*(ALERT:?)?\s*/gi, '')
      .replace(/^BREAKING\s*(ALERT:?)?\s*/gi, '')
      .trim();
    onChangeCaptionTelegram(cleaned);
    onShowToast('Prefix "BREAKING ALERT" dibersihkan dari caption', 'success');
  };

  // Apply Explanatory English Narrative OSINT Formats (Zero generic filler)
  const handleApplyCaptionTemplate = (type: 'detailed' | 'tactical' | 'x_wire' | 'bullets') => {
    if (!currentStory) return;
    const cleanTitle = currentStory.title
      .replace(/\s*[-–—|]\s*(The Jerusalem Post|NPR|Middle East Eye|Small Wars Journal|U\.S\. Department of War|BBC|Al Jazeera|The Washington Post|The Guardian|Axios|WSJ|Wall Street Journal|Iran International|Seatrade Maritime News|Reuters|AP News|Fox News|CNN|Bloomberg|Financial Times|CNBC|Kyiv Independent|TASS|RT|Defense News|Stars and Stripes).*$/i, '')
      .replace(/^["'‘“]+|["'’”]+$/g, '')
      .replace(/^(Live Updates|BREAKING|REPORT|ALERT|WATCH|LATEST|EXCLUSIVE|JUST IN):\s*/i, '')
      .replace(/🚨\s*BREAKING\s*(ALERT:?)?\s*/gi, '')
      .trim();

    const snippet = currentStory.snippet ? currentStory.snippet.trim() : '';

    if (type === 'detailed') {
      // 1. Detailed Narrative English Briefing
      onChangeCaptionTelegram(
`SITUATION BRIEF | ${cleanTitle}

${snippet || cleanTitle}

STRATEGIC CONTEXT:
Operational assessments indicate shifting military readiness across the theater. Defense units and reconnaissance assets continue monitoring tactical developments as events unfold.

#OSINT #DefenseWire #Military #WarReport ${settings.handle}`
      );
      onShowToast('Format narasi lengkap bahasa Inggris diterapkan', 'info');
    } else if (type === 'tactical') {
      // 2. Tactical OSINT SitRep
      onChangeCaptionTelegram(
`TACTICAL SITREP | ${cleanTitle}

THEATER REPORT:
${snippet || cleanTitle}

ASSESSMENT:
Active kinetic or deployment activity observed. Tactical commands maintain heightened alert status.

#TacticalOSINT #DefenseUpdate #FrontlineWire ${settings.handle}`
      );
      onShowToast('Format Tactical SitRep diterapkan', 'info');
    } else if (type === 'x_wire') {
      // 3. X / Twitter Viral Wire
      onChangeCaptionTelegram(
`${cleanTitle}

${snippet.slice(0, 160)}${snippet.length > 160 ? '...' : ''}

Key developments underway across operational sectors.

#DefenseNews #OSINT ${settings.hashtag}`
      );
      onShowToast('Format X / Twitter Wire diterapkan', 'info');
    } else if (type === 'bullets') {
      // 4. Bullet Intel Points
      const parts = (snippet || cleanTitle).split('. ').filter(Boolean);
      const bullet1 = parts[0] || cleanTitle;
      const bullet2 = parts[1] || 'Tactical forces maintain defensive posture across the zone.';
      onChangeCaptionTelegram(
`INTEL BRIEFING: ${cleanTitle}

• ${bullet1.replace(/\.$/, '')}
• ${bullet2.replace(/\.$/, '')}
• Status: Active operational developments under evaluation.

#IntelBrief #MilitaryUpdate ${settings.handle}`
      );
      onShowToast('Format Poin Intelijen diterapkan', 'info');
    }
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-neutral-800 bg-neutral-950/80 backdrop-blur overflow-hidden shadow-2xl">
      {/* HEADER */}
      <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-black/40">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Step 3: Studio Headline &amp; Kawat Telegram</span>
          </h2>
          <p className="text-[11px] text-neutral-400">
            Modifikasi headline jadi viral &amp; siarkan foto 1080p ke kawat Telegram
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI &amp; Tactical Engine
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* SECTION 1: HEADLINE TEXT (CANVAS BANNER) */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Type className="w-3.5 h-3.5 text-amber-400" />
              <span>Headline Text (Canvas Banner)</span>
            </div>
            <button
              onClick={() => onGenerateSmartHeadline(headlineStyle)}
              disabled={isGeneratingHeadline || !currentStory}
              className="flex items-center gap-1 text-[11px] font-bold text-black bg-amber-400 hover:bg-amber-300 px-2 py-0.5 rounded transition cursor-pointer disabled:opacity-40 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
              title="Modifikasi otomatis dengan AI"
            >
              <Sparkles className={`w-3 h-3 ${isGeneratingHeadline ? 'animate-spin' : ''}`} />
              <span>{isGeneratingHeadline ? 'Memodifikasi...' : 'Modif Viral AI'}</span>
            </button>
          </div>

          <div className="text-[10px] text-neutral-400 bg-neutral-950 border border-neutral-800/80 rounded px-2.5 py-1 flex items-center justify-between">
            <span>✨ Headline dimodifikasi agar viral (bukan judul mentah berita)</span>
            <span className="text-neutral-500 font-mono">Format 2 Baris</span>
          </div>

          <textarea
            rows={2}
            value={editorConfig.headline}
            onChange={(e) =>
              onChangeEditorConfig({ ...editorConfig, headline: e.target.value.toUpperCase() })
            }
            placeholder="BARIS 1 (TEKAN ENTER UNTUK BARIS 2)&#10;BARIS 2"
            className="w-full rounded border border-neutral-800 bg-black p-2.5 text-xs font-bold text-white uppercase tracking-tight leading-tight focus:outline-none focus:border-white transition-colors"
          />

          {/* Headline Preset Template Buttons */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1">
                <Flame className="w-3 h-3 text-red-400" />
                <span>Pilih Template Modifikasi Viral:</span>
              </span>
              <button
                onClick={handleBalanceLines}
                className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800/60 hover:bg-neutral-800 px-1.5 py-0.5 rounded transition cursor-pointer"
                title="Seimbangkan kata menjadi 2 baris sama rata"
              >
                <AlignLeft className="w-3 h-3" />
                <span>Seimbangkan 2 Baris</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'viral', label: '🔥 Viral Hook', desc: 'Sensasional & Hook' },
                { id: 'impact', label: '⚡ Breaking Impact', desc: '2 Baris Tajam' },
                { id: 'tactical', label: '🎯 Tactical OSINT', desc: 'Laporan Militer' },
                { id: 'dramatic', label: '💥 Dramatic Alert', desc: 'Krisis & Genting' },
                { id: 'indo', label: '🇮🇩 Viral Indonesia', desc: 'Gaya Indo' },
                { id: 'short', label: '✂️ Ultra Short', desc: 'Ringkas 3 Kata' },
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleApplyLocalTemplate(tmpl.id as ViralHeadlineStyle)}
                  className={`px-2 py-1.5 rounded text-[10px] font-bold text-left transition cursor-pointer border ${
                    headlineStyle === tmpl.id
                      ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                      : 'bg-neutral-800/70 border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <div className="truncate">{tmpl.label}</div>
                  <div className="text-[9px] opacity-70 truncate font-normal">{tmpl.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Word Chips (Klik kata untuk aktifkan kotak putih sorotan) */}
          <div className="pt-2 border-t border-neutral-800/80">
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mb-1.5">
              <span>Klik kata untuk aktifkan kotak putih sorotan (highlight):</span>
              <button
                onClick={() => {
                  const autoHw = extractViralHighlights(editorConfig.headline);
                  onChangeEditorConfig({ ...editorConfig, highlightWords: autoHw });
                  onShowToast('Kata kunci disorot otomatis', 'info');
                }}
                className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <Wand2 className="w-2.5 h-2.5" />
                <span>Auto-Sorot</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {editorConfig.headline.split(/\s+/).filter(Boolean).map((w, idx) => {
                const clean = w.replace(/[^\w\s-]/g, '').trim().toLowerCase();
                const isHighlighted = (editorConfig.highlightWords || []).some(
                  (hw) => hw.toLowerCase() === clean
                );
                return (
                  <button
                    key={idx}
                    onClick={() => toggleWordHighlight(w)}
                    className={`px-2 py-0.5 rounded text-[11px] font-black uppercase transition cursor-pointer ${
                      isHighlighted
                        ? 'bg-white text-black shadow-[0_0_8px_#ffffff]'
                        : 'bg-neutral-800 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 2: TELEGRAM CAPTION (TANPA BREAKING ALERT) */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span>Telegram &amp; X Caption</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-neutral-400">
                {charCount} / 1024 chars
              </span>
              <button
                onClick={handleCopyCaption}
                className="p-1 text-neutral-400 hover:text-white rounded transition cursor-pointer"
                title="Salin caption"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Quick Caption Format Templates & Cleaner */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-neutral-500 font-mono">Format English:</span>
              <button
                onClick={() => handleApplyCaptionTemplate('detailed')}
                className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/40 text-sky-200 hover:text-white hover:bg-sky-900 cursor-pointer font-bold"
                title="Penjelasan Narasi Lengkap Bahasa Inggris (Bukan generic template)"
              >
                🛡️ Narasi Lengkap
              </button>
              <button
                onClick={() => handleApplyCaptionTemplate('tactical')}
                className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                title="Format Tactical OSINT SitRep"
              >
                🎯 Tactical
              </button>
              <button
                onClick={() => handleApplyCaptionTemplate('x_wire')}
                className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                title="Format X / Twitter Viral Post"
              >
                ⚡ X Wire
              </button>
              <button
                onClick={() => handleApplyCaptionTemplate('bullets')}
                className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 hover:text-white cursor-pointer"
                title="Poin-poin Intelijen Berita"
              >
                📋 Intel Poin
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onGenerateSmartHeadline(headlineStyle)}
                disabled={isGeneratingHeadline || !currentStory}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-black font-bold cursor-pointer disabled:opacity-40"
                title="Buat ulang narasi bahasa Inggris dengan AI"
              >
                <Sparkles className={`w-2.5 h-2.5 ${isGeneratingHeadline ? 'animate-spin' : ''}`} />
                <span>AI Narasi English</span>
              </button>

              {captionTelegram.includes('BREAKING') && (
                <button
                  onClick={handleCleanAlertPrefix}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-300 hover:text-white cursor-pointer"
                  title="Hapus tulisan BREAKING ALERT dari caption"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>Hapus BREAKING ALERT</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            rows={5}
            value={captionTelegram}
            onChange={(e) => onChangeCaptionTelegram(e.target.value)}
            placeholder="SITUATION BRIEF | Tactical escalation reported across maritime choke points... #OSINT #DefenseWire"
            className="w-full rounded border border-neutral-800 bg-black p-2.5 text-xs text-neutral-200 leading-relaxed focus:outline-none focus:border-white transition-colors font-mono"
          />

          {isOverLimit && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-400 bg-red-950/40 border border-red-500/30 rounded p-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Caption melebihi batas Telegram (1024 karakter). Mohon perpendek sedikit.</span>
            </div>
          )}

          {currentStory?.isPosted && (
            <div className="flex items-start gap-2 text-[11px] text-amber-300 bg-amber-950/50 border border-amber-500/40 rounded p-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Anti-Double Post:</span> Berita ini sudah disiarkan sebelumnya ke Telegram. Jika Anda menyiarkan lagi, kiriman akan terkirim ulang sebagai pembaruan kawat.
              </div>
            </div>
          )}

          {/* PUBLISH ACTIONS: SUPPORTS PHOTO BANNER & DIRECT VIDEO DISPATCH */}
          <div className="pt-2 space-y-2">
            {/* If current story has video */}
            {currentStory?.videoUrl && (
              <button
                onClick={() => onPostVideoToTelegram ? onPostVideoToTelegram(captionTelegram) : onPostToTelegramWithPhoto(captionTelegram)}
                disabled={isPostingVideo || isPostingTelegram || !captionTelegram}
                className="w-full py-2.5 px-4 font-black text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 bg-sky-500 hover:bg-sky-400 text-black shadow-[0_0_15px_rgba(14,165,233,0.4)]"
              >
                <Send className={`w-4 h-4 ${isPostingVideo ? 'animate-bounce' : ''}`} />
                <span>
                  {isPostingVideo
                    ? 'MENGIRIM VIDEO KE TELEGRAM...'
                    : 'SIARKAN VIDEO MP4 KE TELEGRAM'}
                </span>
              </button>
            )}

            {/* Always support 1080p Canvas Banner dispatch */}
            <button
              onClick={() => onPostToTelegramWithPhoto(captionTelegram)}
              disabled={isPostingTelegram || !captionTelegram}
              className={`w-full py-2.5 px-4 font-black text-xs rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 ${
                currentStory?.videoUrl
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                  : currentStory?.isPosted
                  ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
              }`}
            >
              <Send className={`w-4 h-4 ${isPostingTelegram ? 'animate-bounce' : ''}`} />
              <span>
                {isPostingTelegram
                  ? 'MENGIRIM FOTO 1080P KE TELEGRAM...'
                  : currentStory?.isPosted
                  ? 'KIRIM ULANG BANNER 1080P (UPDATE)'
                  : 'PUBLISH BANNER 1080P KE TELEGRAM'}
              </span>
            </button>
          </div>
        </div>

        {/* SECTION 3: SOURCE DETAILS */}
        {currentStory && (
          <div className="rounded-lg border border-neutral-800 bg-black p-3 space-y-1 text-neutral-400 text-[11px]">
            <div className="flex items-center justify-between text-neutral-300 font-semibold">
              <span>{currentStory.source}</span>
              <a
                href={currentStory.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-sky-400 hover:underline"
              >
                <span>Original Wire</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="line-clamp-2 text-neutral-400">{currentStory.snippet}</p>
          </div>
        )}
      </div>
    </div>
  );
};
