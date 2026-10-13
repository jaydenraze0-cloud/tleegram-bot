import React, { useState } from 'react';
import { Search, ExternalLink, Sparkles, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { NewsArticle } from '../types';

interface LiveFeedViewProps {
  articles: NewsArticle[];
  selectedArticle: NewsArticle | null;
  onSelectArticle: (article: NewsArticle) => void;
  onGenerateCaption: (article: NewsArticle) => void;
  onDirectPost: (article: NewsArticle) => void;
  isGeneratingId: string | null;
  isPostingId: string | null;
}

export const LiveFeedView: React.FC<LiveFeedViewProps> = ({
  articles,
  selectedArticle,
  onSelectArticle,
  onGenerateCaption,
  onDirectPost,
  isGeneratingId,
  isPostingId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUnposted, setFilterUnposted] = useState<boolean>(false);

  const categories = [
    'All',
    'War & Conflict',
    'Airstrikes & Air Defense',
    'Geopolitics',
    'Naval & Maritime',
    'Sanctions & Diplomacy',
  ];

  const filteredArticles = articles.filter((art) => {
    const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.snippet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnposted = !filterUnposted || !art.isPosted;
    return matchesCategory && matchesSearch && matchesUnposted;
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

  return (
    <div className="flex flex-col gap-4">
      {/* Search & Category Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Segmented Tabs (Functional Buttons) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input & Unposted Toggle */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter conflict keywords..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
            />
          </div>

          <button
            onClick={() => setFilterUnposted(!filterUnposted)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
              filterUnposted
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 font-medium'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {filterUnposted ? 'Unposted Only' : 'All Stories'}
          </button>
        </div>
      </div>

      {/* Articles Feed */}
      <div className="flex flex-col gap-3">
        {filteredArticles.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No conflict articles found</p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your category filter, keyword search, or click &quot;Sync Wire&quot; to fetch fresh updates.
            </p>
          </div>
        ) : (
          filteredArticles.map((art, idx) => {
            const isSelected = selectedArticle?.id === art.id;
            const isGeneratingThis = isGeneratingId === art.id;
            const isPostingThis = isPostingId === art.id;

            return (
              <div
                key={`${art.id}-${idx}`}
                onClick={() => onSelectArticle(art)}
                className={`bg-slate-900 border rounded-xl p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-red-500/80 bg-slate-900/90 shadow-md ring-1 ring-red-500/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col gap-2">
                  {/* Clean unboxed metadata with typographic separators (Zero-Pill discipline) */}
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={art.urgency === 'BREAKING' ? 'text-red-400 font-bold' : 'text-amber-400 font-medium'}>
                        {art.urgency}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300 font-medium">{art.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{art.source}</span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        {timeAgo(art.publishedAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {art.isPosted ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-sans">
                          <CheckCircle2 className="w-3 h-3" /> Posted to Telegram
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-sans">
                          Ready for dispatch
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm sm:text-base font-semibold text-slate-100 group-hover:text-red-400 transition-colors">
                    {art.title}
                  </h3>

                  {/* Snippet */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {art.snippet}
                  </p>

                  {/* Card Action Row */}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-slate-800/80 text-xs">
                    <a
                      href={art.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Original Wire</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectArticle(art);
                          onGenerateCaption(art);
                        }}
                        disabled={isGeneratingThis}
                        className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className={`w-3 h-3 text-red-400 ${isGeneratingThis ? 'animate-spin' : ''}`} />
                        <span>{isGeneratingThis ? 'Writing...' : 'Generate Caption'}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectArticle(art);
                          onDirectPost(art);
                        }}
                        disabled={isPostingThis}
                        className="px-2.5 py-1 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{isPostingThis ? 'Posting...' : 'Post Wire'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
