import React, { useState } from 'react';
import {
  Search,
  Clock,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Globe,
  Sparkles,
  RotateCcw,
  Pause,
  Play,
  Plus,
} from 'lucide-react';
import { NewsArticle } from '../types';

interface IntelligenceRadarProps {
  articles: NewsArticle[];
  selectedArticle: NewsArticle | null;
  onSelectArticle: (article: NewsArticle) => void;
  isSyncing: boolean;
  refreshCountdown?: number;
  intervalMinutes?: number;
  onForceRefresh?: () => void;
  onToggleArticlePosted?: (article: NewsArticle) => void;
  onSearchGoogle?: (query: string) => Promise<void>;
  isSearchingGoogle?: boolean;
  activeSearchTopic?: string | null;
  onResetFeed?: () => void;
  isAutoSyncPaused?: boolean;
  onToggleAutoSyncPause?: () => void;
  onOpenSourceManager?: () => void;
  onProceedToEditor?: (article: NewsArticle) => void;
}

export const IntelligenceRadar: React.FC<IntelligenceRadarProps> = ({
  articles,
  selectedArticle,
  onSelectArticle,
  isSyncing,
  refreshCountdown = 60,
  intervalMinutes = 1,
  onForceRefresh,
  onToggleArticlePosted,
  onSearchGoogle,
  isSearchingGoogle = false,
  activeSearchTopic = null,
  onResetFeed,
  isAutoSyncPaused = false,
  onToggleAutoSyncPause,
  onOpenSourceManager,
  onProceedToEditor,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua Niche');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unposted' | 'posted'>('all');

  const categories = [
    'Semua Niche',
    '🇺🇦 Ukraine & Russia',
    '🇾🇪 Yemen & Red Sea',
    '🇮🇷 Iran & Middle East',
    '🇺🇸 Trump & US War',
    '🚀 Serangan Udara & Rudal',
    '⚔️ War & Conflict',
  ];

  const quickGoogleTopics = [
    'Ukraine Frontline',
    'Yemen Houthi Red Sea',
    'Iran Israel Conflict',
    'Trump Putin War',
    'Guided Glide Bombs',
    'CENTCOM Airstrikes',
  ];

  const unpostedCount = articles.filter((a) => !a.isPosted).length;
  const postedCount = articles.filter((a) => a.isPosted).length;

  const filteredArticles = articles.filter((art) => {
    const titleText = `${art.title} ${art.snippet}`.toLowerCase();
    const categoryText = art.category.toLowerCase();

    const matchesCat =
      selectedCategory === 'Semua Niche' ||
      selectedCategory === 'All Fronts' ||
      categoryText.includes(selectedCategory.toLowerCase()) ||
      (selectedCategory.includes('Ukraine') &&
        (titleText.includes('ukraine') ||
          titleText.includes('russia') ||
          titleText.includes('putin') ||
          titleText.includes('zelensky') ||
          titleText.includes('kursk') ||
          titleText.includes('kyiv') ||
          titleText.includes('zaporizhzhia') ||
          categoryText.includes('ukraine'))) ||
      (selectedCategory.includes('Yemen') &&
        (titleText.includes('yemen') ||
          titleText.includes('houthi') ||
          titleText.includes('houthis') ||
          titleText.includes('red sea') ||
          categoryText.includes('yemen'))) ||
      (selectedCategory.includes('Iran') &&
        (titleText.includes('iran') ||
          titleText.includes('tehran') ||
          titleText.includes('middle east') ||
          titleText.includes('gaza') ||
          titleText.includes('israel') ||
          titleText.includes('hezbollah') ||
          titleText.includes('lebanon') ||
          titleText.includes('irgc') ||
          categoryText.includes('iran') ||
          categoryText.includes('middle east'))) ||
      (selectedCategory.includes('Trump') &&
        (titleText.includes('trump') ||
          titleText.includes('pentagon') ||
          titleText.includes('us military') ||
          titleText.includes('centcom') ||
          categoryText.includes('us war') ||
          categoryText.includes('trump'))) ||
      (selectedCategory.includes('Serangan Udara') &&
        (titleText.includes('strike') ||
          titleText.includes('airstrike') ||
          titleText.includes('missile') ||
          titleText.includes('drone') ||
          titleText.includes('bomb') ||
          categoryText.includes('airstrikes'))) ||
      (selectedCategory.includes('War & Conflict') &&
        (titleText.includes('war') ||
          titleText.includes('conflict') ||
          titleText.includes('frontline') ||
          titleText.includes('troops')));

    const matchesSearch =
      searchQuery.trim() === '' ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.source.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unposted' && !art.isPosted) ||
      (statusFilter === 'posted' && art.isPosted);

    return matchesCat && matchesSearch && matchesStatus;
  });

  const timeAgo = (dateStr: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${Math.floor(diffHr / 24)}d ago`;
    } catch {
      return 'recent';
    }
  };

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleExecuteGoogleSearch = (queryToSearch: string) => {
    const target = queryToSearch.trim();
    if (!target) return;
    if (onSearchGoogle) {
      onSearchGoogle(target);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Radar Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="font-mono text-neutral-300 font-bold uppercase tracking-wider text-[11px]">
            INTELLIGENCE RADAR
          </span>
          <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
            Top {articles.length} Latest
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenSourceManager && (
            <button
              onClick={onOpenSourceManager}
              className="px-2 py-0.5 bg-sky-950/90 hover:bg-sky-900 border border-sky-500/50 text-sky-300 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
              title="Tambah website berita atau kelola feed RSS"
            >
              <Plus className="w-3 h-3 text-sky-400" />
              <span>+ Website RSS</span>
            </button>
          )}

          {onForceRefresh && (
            <button
              onClick={onForceRefresh}
              disabled={isSyncing || isSearchingGoogle}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer disabled:opacity-50 border border-neutral-700"
              title="Tarik berita perang terbaru langsung dari website media sekarang"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing || isSearchingGoogle ? 'animate-spin text-sky-400' : ''}`} />
              <span>Segarkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Google News Search Banner */}
      {activeSearchTopic && (
        <div className="px-3 py-1.5 bg-sky-950/80 border-b border-sky-800/60 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-sky-300">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            <span>
              Google News: <strong>&quot;{activeSearchTopic}&quot;</strong> ({articles.length} hasil)
            </span>
          </div>
          {onResetFeed && (
            <button
              onClick={onResetFeed}
              className="text-[10px] text-sky-400 hover:text-white flex items-center gap-1 cursor-pointer font-semibold underline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ke Feed Utama</span>
            </button>
          )}
        </div>
      )}

      {/* Anti-Double Post Status Filter Tabs */}
      <div className="px-3 pt-2 pb-1 bg-neutral-950 border-b border-neutral-850 flex items-center gap-1">
        <button
          onClick={() => setStatusFilter('all')}
          className={`flex-1 py-1 rounded text-[10px] font-bold text-center transition cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-neutral-800 text-white border border-neutral-700'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Semua ({articles.length})
        </button>

        <button
          onClick={() => setStatusFilter('unposted')}
          className={`flex-1 py-1 rounded text-[10px] font-bold text-center transition cursor-pointer flex items-center justify-center gap-1 ${
            statusFilter === 'unposted'
              ? 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
              : 'text-neutral-400 hover:text-amber-300'
          }`}
          title="Tampilkan hanya berita yang belum disiarkan ke Telegram"
        >
          <span>Siap Siar</span>
          <span className="bg-amber-500/20 px-1 rounded text-[9px] font-mono">{unpostedCount}</span>
        </button>

        <button
          onClick={() => setStatusFilter('posted')}
          className={`flex-1 py-1 rounded text-[10px] font-bold text-center transition cursor-pointer flex items-center justify-center gap-1 ${
            statusFilter === 'posted'
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
              : 'text-neutral-400 hover:text-emerald-300'
          }`}
          title="Berita yang sudah disiarkan (otomatis dilewati bot)"
        >
          <span>Telah Diposting</span>
          <span className="bg-emerald-500/20 px-1 rounded text-[9px] font-mono">{postedCount}</span>
        </button>
      </div>

      {/* Google News Live Search Bar & Topic Pills */}
      <div className="p-3 bg-neutral-950 border-b border-neutral-800 space-y-2">
        {/* Search input with direct "Cari di Google" execution */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExecuteGoogleSearch(searchQuery);
          }}
          className="flex items-center gap-1.5"
        >
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search breaking news on Google: Ukraine, airstrikes, drones..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            disabled={!searchQuery.trim() || isSearchingGoogle}
            className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shrink-0 shadow-sm"
            title="Search latest breaking conflict news directly on Google"
          >
            {isSearchingGoogle ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <span className="font-extrabold text-[10px] px-1 bg-white text-sky-700 rounded-xs">G</span>
            )}
            <span className="hidden sm:inline">Search Google</span>
            <span className="sm:hidden">Search</span>
          </button>
        </form>

        {/* Quick Google News Topic Chips */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[10px] text-neutral-500 shrink-0 font-mono">Google:</span>
          {quickGoogleTopics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => {
                setSearchQuery(topic);
                handleExecuteGoogleSearch(topic);
              }}
              disabled={isSearchingGoogle}
              className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-sky-500 transition cursor-pointer shrink-0 flex items-center gap-1"
            >
              <span className="text-sky-400 font-bold text-[9px]">G</span>
              <span>{topic}</span>
            </button>
          ))}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stories Scrollable Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredArticles.length === 0 ? (
          <div className="py-10 text-center text-neutral-400 text-xs px-4">
            <ShieldAlert className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
            <p className="font-bold text-neutral-300">Tidak ada berita yang cocok dengan filter</p>
            <p className="text-[11px] text-neutral-400 mt-1 max-w-xs mx-auto">
              Cari topik perang di Google News atau tambahkan website berita baru ke sistem tracking.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
              {searchQuery && (
                <button
                  onClick={() => handleExecuteGoogleSearch(searchQuery)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Cari &quot;{searchQuery}&quot; di Google</span>
                </button>
              )}
              {onOpenSourceManager && (
                <button
                  onClick={onOpenSourceManager}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                  <span>+ Tambah Website Berita</span>
                </button>
              )}
              {selectedCategory !== 'Semua Niche' && (
                <button
                  onClick={() => setSelectedCategory('Semua Niche')}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-medium transition cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredArticles.map((art, idx) => {
            const isSelected = selectedArticle?.id === art.id;
            const isFromGoogleNews =
              art.source.toLowerCase().includes('google news') ||
              art.sourceType === 'google_news';

            return (
              <div
                key={`${art.id}-${idx}`}
                onClick={() => onSelectArticle(art)}
                className={`p-3 rounded-lg border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-white bg-neutral-900 shadow-[0_0_15px_rgba(255,255,255,0.15)] ring-1 ring-white/20'
                    : art.isPosted
                    ? 'border-neutral-850 bg-neutral-950/60 opacity-80 hover:opacity-100 hover:border-neutral-700'
                    : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/80'
                }`}
              >
                {/* Meta tags strip */}
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-bold ${
                        art.urgency === 'BREAKING' ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      {art.urgency}
                    </span>
                    <span>·</span>
                    <span className="text-neutral-300">{art.category}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isFromGoogleNews && (
                      <span className="px-1.5 py-0.2 rounded bg-sky-950/80 border border-sky-500/40 text-sky-300 text-[9px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        Google News
                      </span>
                    )}
                    <span className="text-neutral-500">{timeAgo(art.publishedAt)}</span>
                  </div>
                </div>

                {/* Content Row: Headline + Thumbnail */}
                <div className="flex items-start gap-2.5">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-neutral-200">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      {art.snippet}
                    </p>
                  </div>

                  {art.imageUrl ? (
                    <div className="w-14 h-14 rounded overflow-hidden bg-neutral-800 shrink-0 border border-neutral-700 relative">
                      <img
                        src={art.imageUrl}
                        alt="Foto Berita"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('/api/news/proxy-image') && art.imageUrl) {
                            target.src = `/api/news/proxy-image?url=${encodeURIComponent(art.imageUrl)}`;
                          }
                        }}
                      />
                      <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] font-mono px-1 text-white">
                        {art.hasOriginalCover ? 'COVER' : 'WEB'}
                      </span>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded overflow-hidden bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center p-1 text-center shrink-0">
                      <Globe className="w-4 h-4 text-sky-400 mb-0.5" />
                      <span className="text-[8px] text-sky-400 font-mono">WEB FOTO</span>
                    </div>
                  )}
                </div>

                {/* Card Footer: Anti-Double Post Badge + Source + Studio action */}
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-neutral-800/60 text-[10px] font-mono">
                  <div className="flex items-center gap-1.5">
                    {/* Visual Anti-Double Post Status Badge */}
                    {art.isPosted ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleArticlePosted?.(art);
                        }}
                        className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-900"
                        title="Klik untuk ubah status jika ingin posting ulang"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>TELAH DIPOSTING</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleArticlePosted?.(art);
                        }}
                        className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1 cursor-pointer hover:bg-amber-900/60"
                        title="Klik untuk tandai sudah diposting"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>SIAP SIARAN</span>
                      </button>
                    )}
                    <span className="text-neutral-500 truncate max-w-[120px] hidden sm:inline" title={art.source}>
                      · {art.source}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectArticle(art);
                      onProceedToEditor?.(art);
                    }}
                    className="px-2.5 py-1 rounded bg-white hover:bg-neutral-200 text-black text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition shadow-xs"
                    title="Pilih berita ini dan langsung lanjut ke Langkah 2: Desain Kartu"
                  >
                    <span>Desain Kartu</span>
                    <ChevronRight className="w-3 h-3 text-black" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
