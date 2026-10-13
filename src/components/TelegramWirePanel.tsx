import React, { useState } from 'react';
import {
  Video,
  Play,
  Send,
  Layers,
  Copy,
  ExternalLink,
  RefreshCw,
  Check,
  AlertCircle,
  Shield,
  Sparkles,
  Flame,
  Radio,
  Filter,
} from 'lucide-react';
import { TelegramWireItem, AppSettings, NewsArticle } from '../types';

interface TelegramWirePanelProps {
  wires: TelegramWireItem[];
  isLoading: boolean;
  onRefreshWires: () => Promise<void>;
  onSelectWireForStudio: (wire: TelegramWireItem) => void;
  onPostVideoToTelegram: (wire: TelegramWireItem, customCaption?: string) => Promise<void>;
  isPostingVideo: boolean;
  settings: AppSettings;
  onShowToast: (message: string, type?: 'info' | 'success' | 'error') => void;
}

export const TelegramWirePanel: React.FC<TelegramWirePanelProps> = ({
  wires,
  isLoading,
  onRefreshWires,
  onSelectWireForStudio,
  onPostVideoToTelegram,
  isPostingVideo,
  settings,
  onShowToast,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'video_only' | 'niche_only'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedVideoToPost, setSelectedVideoToPost] = useState<TelegramWireItem | null>(null);
  const [postModalCaption, setPostModalCaption] = useState<string>('');

  const filteredWires = wires.filter((w) => {
    if (filterMode === 'video_only') return w.hasVideo;
    if (filterMode === 'niche_only') return w.nicheRelevant;
    return true;
  });

  const videoCount = wires.filter((w) => w.hasVideo).length;

  const handleCopyCaption = async (wire: TelegramWireItem) => {
    try {
      await navigator.clipboard.writeText(wire.captionEnglish || wire.text);
      setCopiedId(wire.id);
      onShowToast('Caption Bahasa Inggris disalin ke clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      onShowToast('Gagal menyalin', 'error');
    }
  };

  const openPostModal = (wire: TelegramWireItem) => {
    setSelectedVideoToPost(wire);
    setPostModalCaption(wire.captionEnglish || wire.text);
  };

  const handleConfirmPostVideo = async () => {
    if (!selectedVideoToPost) return;
    await onPostVideoToTelegram(selectedVideoToPost, postModalCaption);
    setSelectedVideoToPost(null);
  };

  return (
    <div className="flex flex-col h-full rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-2xl">
      {/* HEADER SECTION */}
      <div className="p-3.5 border-b border-neutral-800 bg-black/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <span>Telegram Source Wires:</span>
                <span className="text-sky-400 font-mono">@ClashReport</span>
              </h2>
              <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] px-2 py-0.2 rounded font-mono font-bold">
                MILITARY OSINT
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
              <span>Pantauan video &amp; kawat perang real-time dari Clash Report</span>
              <span>•</span>
              <a
                href="https://t.me/ClashReport"
                target="_blank"
                rel="noreferrer"
                className="text-sky-400 hover:underline flex items-center gap-0.5"
              >
                <span>t.me/ClashReport</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>
        </div>

        {/* CONTROLS & REFRESH */}
        <div className="flex items-center gap-2">
          {/* FILTER BUTTONS */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded font-bold transition cursor-pointer text-[11px] ${
                filterMode === 'all'
                  ? 'bg-neutral-800 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Semua ({wires.length})
            </button>
            <button
              onClick={() => setFilterMode('video_only')}
              className={`px-2.5 py-1 rounded font-bold transition cursor-pointer text-[11px] flex items-center gap-1 ${
                filterMode === 'video_only'
                  ? 'bg-sky-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Video className="w-3 h-3 text-sky-300" />
              <span>Video ({videoCount})</span>
            </button>
            <button
              onClick={() => setFilterMode('niche_only')}
              className={`px-2.5 py-1 rounded font-bold transition cursor-pointer text-[11px] flex items-center gap-1 ${
                filterMode === 'niche_only'
                  ? 'bg-red-600 text-white'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3 text-red-300" />
              <span>Niche Perang</span>
            </button>
          </div>

          <button
            onClick={() => onRefreshWires()}
            disabled={isLoading}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            title="Perbarui kawat dari Telegram Clash Report"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* WIRE FEED LIST */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {isLoading && wires.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-3">
            <RefreshCw className="w-8 h-8 text-sky-400 animate-spin" />
            <div className="text-sm font-bold text-white">Memuat Kawat Telegram @ClashReport...</div>
            <div className="text-xs text-neutral-500">
              Mengambil kawat tempur, video, dan narasi berita militer terbaru
            </div>
          </div>
        ) : filteredWires.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-2">
            <AlertCircle className="w-8 h-8 text-neutral-600" />
            <div className="text-sm font-bold text-white">Tidak Ada Kawat yang Sesuai Filter</div>
            <div className="text-xs text-neutral-500">
              Coba ganti filter ke &quot;Semua&quot; atau klik Refresh untuk memuat ulang.
            </div>
          </div>
        ) : (
          filteredWires.map((wire) => (
            <div
              key={wire.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                wire.isPosted
                  ? 'border-neutral-800 bg-neutral-950/70 opacity-90'
                  : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
              }`}
            >
              {/* TOP INFO BAR */}
              <div className="px-3.5 py-2 bg-black/40 border-b border-neutral-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sky-400 font-mono">
                    {wire.channel}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    #{wire.id.split('/')[1] || wire.id}
                  </span>
                  {wire.hasVideo && (
                    <span className="flex items-center gap-1 bg-red-950/60 text-red-300 border border-red-500/40 text-[10px] font-bold px-2 py-0.2 rounded font-mono">
                      <Video className="w-2.5 h-2.5 text-red-400" />
                      <span>VIDEO TEMPURS</span>
                    </span>
                  )}
                  {wire.nicheRelevant && (
                    <span className="bg-amber-950/50 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.2 rounded font-mono">
                      WAR NICHE
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {wire.isPosted && (
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.2 rounded font-mono font-bold">
                      ✓ POSTED
                    </span>
                  )}
                  <span className="text-[11px] text-neutral-500 font-mono">
                    {wire.publishedAt ? new Date(wire.publishedAt).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
              </div>

              {/* CARD BODY: MEDIA (VIDEO OR PHOTO) + CONTENT */}
              <div className="p-3.5 space-y-3">
                {/* VIDEO PLAYER (IF POST CONTAINS VIDEO) */}
                {wire.hasVideo && wire.videoUrl && (
                  <div className="rounded-lg overflow-hidden border border-neutral-800 bg-black aspect-video max-h-[380px] w-full relative group">
                    <video
                      src={wire.videoUrl}
                      poster={wire.mediaUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain bg-black"
                    />
                  </div>
                )}

                {/* PHOTO PREVIEW (IF ONLY PHOTO OR NO DIRECT VIDEO URL) */}
                {!wire.videoUrl && wire.mediaUrl && (
                  <div className="rounded-lg overflow-hidden border border-neutral-800 bg-black max-h-[300px] w-full flex items-center justify-center">
                    <img
                      src={wire.mediaUrl}
                      alt="Telegram media wire"
                      className="w-full max-h-[300px] object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* ORIGINAL TELEGRAM WIRE TEXT */}
                <div className="text-xs text-neutral-200 whitespace-pre-line leading-relaxed font-sans bg-black/30 p-2.5 rounded border border-neutral-800/60">
                  {wire.text}
                </div>

                {/* EXPLANATORY ENGLISH OSINT CAPTION PREVIEW */}
                <div className="rounded-lg bg-neutral-950 border border-neutral-800 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-sky-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                      <span>Penjelasan Lengkap (English Narrative Caption):</span>
                    </span>
                    <button
                      onClick={() => handleCopyCaption(wire)}
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 bg-neutral-800/80 hover:bg-neutral-800 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      {copiedId === wire.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin English</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed font-mono whitespace-pre-line">
                    {wire.captionEnglish}
                  </p>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/80">
                  <div className="flex items-center gap-2">
                    <a
                      href={wire.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition"
                    >
                      <span>Buka di Telegram</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* BUTTON 1: LOAD INTO CANVAS STUDIO */}
                    <button
                      onClick={() => onSelectWireForStudio(wire)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-neutral-700"
                      title="Muat kawat ini ke Studio untuk buat Banner Gambar 1080p"
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>Buat Banner 1080p</span>
                    </button>

                    {/* BUTTON 2: DIRECT POST VIDEO TO TELEGRAM */}
                    {wire.hasVideo && wire.videoUrl && (
                      <button
                        onClick={() => openPostModal(wire)}
                        disabled={isPostingVideo}
                        className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_12px_rgba(14,165,233,0.3)] disabled:opacity-40"
                        title="Siarkan video ini beserta caption bahasa Inggris ke Telegram"
                      >
                        <Send className="w-3.5 h-3.5 text-black" />
                        <span>Siarkan Video ke Telegram</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* POST VIDEO MODAL CONFIRMATION */}
      {selectedVideoToPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl max-w-lg w-full p-4 space-y-3.5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Video className="w-4 h-4 text-sky-400" />
                <span>Siarkan Berita Video ke Telegram</span>
              </div>
              <button
                onClick={() => setSelectedVideoToPost(null)}
                className="text-neutral-500 hover:text-white text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="text-[11px] text-neutral-400">
                Video dari <span className="text-sky-400 font-bold">{selectedVideoToPost.channel}</span> akan dikirim ke channel Telegram Anda:
              </div>

              {selectedVideoToPost.videoUrl && (
                <div className="rounded-lg overflow-hidden border border-neutral-800 max-h-48 bg-black">
                  <video
                    src={selectedVideoToPost.videoUrl}
                    controls
                    className="w-full max-h-48 object-contain"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] text-neutral-300 font-bold mb-1">
                  Telegram Caption (Penjelasan Bahasa Inggris Lengkap):
                </label>
                <textarea
                  rows={5}
                  value={postModalCaption}
                  onChange={(e) => setPostModalCaption(e.target.value)}
                  className="w-full rounded border border-neutral-800 bg-black p-2.5 text-xs text-white leading-relaxed focus:outline-none focus:border-white font-mono"
                />
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>Maksimum 1024 karakter untuk video</span>
                  <span>{postModalCaption.length} / 1024</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 flex items-center justify-between">
                <span>Target Channel:</span>
                <span className="font-mono text-sky-400 font-bold">
                  {settings.chatId || '@StarkNewsChannel (Simulasi)'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setSelectedVideoToPost(null)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmPostVideo}
                disabled={isPostingVideo || !postModalCaption}
                className="px-4 py-1.5 text-xs font-black rounded-lg bg-sky-500 hover:bg-sky-400 text-black flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-[0_0_12px_rgba(14,165,233,0.4)]"
              >
                <Send className={`w-3.5 h-3.5 ${isPostingVideo ? 'animate-bounce' : ''}`} />
                <span>{isPostingVideo ? 'MENGIRIM VIDEO...' : 'KIRIM VIDEO KE TELEGRAM'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
