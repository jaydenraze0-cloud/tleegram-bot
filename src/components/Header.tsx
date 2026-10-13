import React from 'react';
import {
  Radio,
  Layers,
  Sparkles,
  Columns3,
  Bot,
  Globe,
  CheckCircle,
  ChevronRight,
  Video,
} from 'lucide-react';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  activeView: 'radar' | 'telegram_wires' | 'editor' | 'captions' | '3col';
  onChangeView: (view: 'radar' | 'telegram_wires' | 'editor' | 'captions' | '3col') => void;
  onTriggerSync: () => void;
  isSyncing: boolean;
  onToggleAutoPost: () => void;
  storiesCount: number;
  telegramWiresCount?: number;
  refreshCountdown?: number;
  isAutopilotRunning?: boolean;
  onOpenSourceManager?: () => void;
  isPaused?: boolean;
  onToggleMasterStop?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onOpenSettings,
  activeView,
  onChangeView,
  storiesCount,
  telegramWiresCount = 0,
  refreshCountdown = 60,
  isSyncing = false,
  onOpenSourceManager,
  isPaused = false,
  onToggleMasterStop,
}) => {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur border-b border-neutral-800 text-white">
      <div className="max-w-[1920px] mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/20 flex items-center justify-center font-black text-white text-sm shadow-[0_0_10px_rgba(255,255,255,0.2)]">
            §
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-white uppercase text-sm font-sans">
                FRONTLINE-WIRE
              </span>
              <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
                DEFENSE
              </span>
            </div>
            <div className="text-[10px] font-mono text-neutral-400 hidden sm:block">
              TACTICAL OSINT &amp; WIRE STUDIO
            </div>
          </div>
        </div>

        {/* Mode Bertahap (Radar -> Telegram Wires -> Editor -> Captions) */}
        <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 text-xs">
          <button
            onClick={() => onChangeView('radar')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'radar'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Langkah 1: Pilih Berita dari Radar Perang (RSS Feeds)"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>1. Radar RSS</span>
            <span className="text-[10px] font-mono opacity-80">({storiesCount})</span>
          </button>

          <button
            onClick={() => onChangeView('telegram_wires')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'telegram_wires'
                ? 'bg-sky-500 text-black shadow-sm font-black'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Kawat Telegram Video & Intel OSINT dari @ClashReport"
          >
            <Video className="w-3.5 h-3.5" />
            <span>Kawat Telegram</span>
            <span className="text-[10px] font-mono bg-black/40 px-1.5 py-0.2 rounded font-bold">
              @ClashReport
            </span>
          </button>

          <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0 hidden sm:block" />

          <button
            onClick={() => onChangeView('editor')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'editor'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Langkah 2: Desain & Pratinjau Kartu Gambar 1080p"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Desain Kartu</span>
          </button>

          <ChevronRight className="w-3 h-3 text-neutral-600 shrink-0 hidden sm:block" />

          <button
            onClick={() => onChangeView('captions')}
            className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'captions'
                ? 'bg-emerald-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
            title="Langkah 3: Review Caption & Siarkan ke Telegram"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Siaran Telegram</span>
          </button>

          <button
            onClick={() => onChangeView(activeView === '3col' ? 'radar' : '3col')}
            className={`hidden xl:flex px-2.5 py-1.5 rounded-lg font-medium transition items-center gap-1 cursor-pointer border ${
              activeView === '3col'
                ? 'bg-neutral-800 text-white border-neutral-700'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
            title="Beralih ke mode multi-kolom sekaligus (layar lebar)"
          >
            <Columns3 className="w-3 h-3" />
            <span className="text-[11px]">3-Kolom</span>
          </button>
        </div>

        {/* Controls: Satu Saklar Master ON/OFF Utama + Utility */}
        <div className="flex items-center gap-2 shrink-0">
          {/* SATU SAKLAR MASTER ON / OFF TUNGGAL */}
          <button
            onClick={onToggleMasterStop}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition flex items-center gap-2 cursor-pointer shadow-sm ${
              !isPaused
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)] hover:bg-emerald-900'
                : 'bg-amber-950/90 border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:bg-amber-900'
            }`}
            title={
              !isPaused
                ? 'Sistem berjalan otomatis (Refresh & Siaran 1 Menit). Klik untuk STOP.'
                : 'Sistem di-STOP. Klik untuk RESUME (Mulai siklus 1 menit).'
            }
          >
            {!isPaused ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="font-extrabold hidden sm:inline">SISTEM: AKTIF</span>
                <span className="font-mono text-[10px] text-emerald-300 bg-emerald-900/60 px-1.5 py-0.2 rounded">
                  {isSyncing ? 'Syncing...' : `${formatTime(refreshCountdown)}`}
                </span>
                <span className="text-[9px] bg-red-600 hover:bg-red-500 text-white px-1.5 py-0.2 rounded font-sans uppercase tracking-wider font-extrabold ml-0.5">
                  STOP
                </span>
              </>
            ) : (
              <>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                <span className="font-extrabold">SISTEM: STOPPED</span>
                <span className="text-[9px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.2 rounded font-sans uppercase tracking-wider font-extrabold ml-0.5">
                  ▶ RESUME
                </span>
              </>
            )}
          </button>

          {/* Website RSS Manager */}
          {onOpenSourceManager && (
            <button
              onClick={onOpenSourceManager}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              title="Kelola & Tambah Website Berita RSS yang ingin ditracking"
            >
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden md:inline">Website RSS</span>
            </button>
          )}

          {/* Telegram Bot Setup */}
          <button
            onClick={onOpenSettings}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
              settings.botToken && settings.chatId
                ? 'bg-neutral-900 border-neutral-700 text-slate-200 hover:bg-neutral-800'
                : 'bg-amber-950/80 border-amber-500/60 text-amber-300 animate-pulse'
            }`}
            title={settings.botToken && settings.chatId ? `Telegram terhubung (${settings.chatId})` : 'Klik untuk hubungkan bot Telegram'}
          >
            <Bot className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden lg:inline">
              {settings.botToken && settings.chatId ? 'Telegram Siap' : 'Hubungkan Bot'}
            </span>
            {settings.botToken && settings.chatId && (
              <CheckCircle className="w-3 h-3 text-emerald-400 hidden sm:inline" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
