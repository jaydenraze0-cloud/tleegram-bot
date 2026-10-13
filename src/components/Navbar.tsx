import React from 'react';
import { Radio, RefreshCw, Send, ShieldAlert, Cpu } from 'lucide-react';

interface NavbarProps {
  activeTab: 'wire' | 'sources' | 'bot' | 'history';
  setActiveTab: (tab: 'wire' | 'sources' | 'bot' | 'history') => void;
  autoPostEnabled: boolean;
  onToggleAutoPost: () => void;
  onTriggerSync: () => void;
  isSyncing: boolean;
  unpostedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  autoPostEnabled,
  onToggleAutoPost,
  onTriggerSync,
  isSyncing,
  unpostedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 font-black">
            <Radio className="w-4 h-4" />
          </div>
          <button
            onClick={() => setActiveTab('wire')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-lg font-bold tracking-tight text-white uppercase font-sans">
              Frontline<span className="text-red-500">Wire</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-mono text-slate-400">
              WAR & GEOPOLITICS OSINT
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (single-line, concise) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('wire')}
            className={`whitespace-nowrap pb-1 transition-colors relative cursor-pointer ${
              activeTab === 'wire'
                ? 'text-white border-b-2 border-red-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Wire
            {unpostedCount > 0 && (
              <span className="ml-1.5 text-xs font-mono text-amber-400">
                ({unpostedCount})
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`whitespace-nowrap pb-1 transition-colors relative cursor-pointer ${
              activeTab === 'sources'
                ? 'text-white border-b-2 border-red-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sources & OSINT
          </button>

          <button
            onClick={() => setActiveTab('bot')}
            className={`whitespace-nowrap pb-1 transition-colors relative cursor-pointer ${
              activeTab === 'bot'
                ? 'text-white border-b-2 border-red-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Telegram Bot Config
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap pb-1 transition-colors relative cursor-pointer ${
              activeTab === 'history'
                ? 'text-white border-b-2 border-red-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Broadcast Audit Log
          </button>
        </nav>

        {/* Zone 3: Primary Action & Status */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleAutoPost}
            title={autoPostEnabled ? 'Auto-posting is currently active' : 'Auto-posting is paused'}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap border cursor-pointer ${
              autoPostEnabled
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Auto-Post: {autoPostEnabled ? 'Active' : 'Paused'}</span>
          </button>

          <button
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Ingesting...' : 'Sync Wire'}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="flex md:hidden items-center justify-around px-4 py-2 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400">
        <button
          onClick={() => setActiveTab('wire')}
          className={`py-1 ${activeTab === 'wire' ? 'text-red-400 font-semibold' : ''}`}
        >
          Live Wire
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`py-1 ${activeTab === 'sources' ? 'text-red-400 font-semibold' : ''}`}
        >
          Sources
        </button>
        <button
          onClick={() => setActiveTab('bot')}
          className={`py-1 ${activeTab === 'bot' ? 'text-red-400 font-semibold' : ''}`}
        >
          Telegram Bot
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-1 ${activeTab === 'history' ? 'text-red-400 font-semibold' : ''}`}
        >
          Audit Log
        </button>
      </div>
    </header>
  );
};
