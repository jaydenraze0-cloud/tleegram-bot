import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, Rss, Twitter, Search, Globe, AlertCircle, ArrowUpRight } from 'lucide-react';
import { NewsSource } from '../types';

interface SourcesManagerProps {
  sources: NewsSource[];
  onToggleSource: (id: string) => void;
  onDeleteSource: (id: string) => void;
  onAddSource: (newSource: {
    name: string;
    url: string;
    category: NewsSource['category'];
    type: NewsSource['type'];
  }) => Promise<boolean>;
}

export const SourcesManager: React.FC<SourcesManagerProps> = ({
  sources,
  onToggleSource,
  onDeleteSource,
  onAddSource,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<NewsSource['type']>('rss');
  const [category, setCategory] = useState<NewsSource['category']>('War & Conflict');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) {
      setFormError('Please provide both a source name and a valid feed URL or query.');
      return;
    }
    setFormError(null);
    setIsSubmitting(true);

    let processedUrl = url.trim();
    // If user enters an X handle, format it into Google News search topic for that handle
    if (type === 'x_osint' && !processedUrl.startsWith('http')) {
      const handle = processedUrl.replace('@', '');
      processedUrl = `https://news.google.com/rss/search?q=%22${handle}%22+OR+from%3A${handle}+war+conflict&hl=en-US&gl=US&ceid=US:en`;
    } else if (type === 'keyword_topic' && !processedUrl.startsWith('http')) {
      const query = encodeURIComponent(processedUrl);
      processedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    }

    const ok = await onAddSource({
      name: name.trim(),
      url: processedUrl,
      type,
      category,
    });

    setIsSubmitting(false);
    if (ok) {
      setName('');
      setUrl('');
      setIsAdding(false);
    }
  };

  const getSourceIcon = (srcType: NewsSource['type']) => {
    switch (srcType) {
      case 'x_osint':
        return <Twitter className="w-4 h-4 text-sky-400" />;
      case 'keyword_topic':
        return <Search className="w-4 h-4 text-amber-400" />;
      case 'rss':
      default:
        return <Rss className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner and Add Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">
            Intelligence Feed Sources &amp; OSINT Trackers
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Configure the RSS feeds, OSINT accounts, and war wire streams monitored by FrontlineWire. 
            The system periodically fetches breaking updates from enabled sources and dedupes stories automatically.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAdding ? 'Cancel' : 'Add Custom Source'}</span>
        </button>
      </div>

      {/* Add Custom Source Drawer */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900 border border-red-500/40 rounded-xl p-6 flex flex-col gap-4 shadow-xl ring-1 ring-red-500/20"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Plus className="w-4 h-4 text-red-500" />
              Add News or OSINT Stream
            </h3>
            <span className="text-xs font-mono text-slate-400">RSS / ATOM / X TRACKER</span>
          </div>

          {formError && (
            <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-lg text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Source Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. TWZ Conflict Desk, @WarMonitors, CENTCOM News"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Source Ingestion Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NewsSource['type'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value="rss">Standard RSS / Atom Feed</option>
                <option value="x_osint">X (Twitter) OSINT Account</option>
                <option value="keyword_topic">Custom War Keywords Topic</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-400 font-medium mb-1">
                {type === 'x_osint'
                  ? 'X Account Handle (e.g. @WarMonitors or @Osinttechnical)'
                  : type === 'keyword_topic'
                  ? 'Conflict Query Keywords (e.g. missile defense strikes gulf)'
                  : 'RSS Endpoint URL (e.g. https://domain.com/feed.xml)'}
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  type === 'x_osint'
                    ? '@Osinttechnical'
                    : type === 'keyword_topic'
                    ? 'hypersonic missile test OR airstrikes'
                    : 'https://feeds.example.com/defense.xml'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Conflict Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as NewsSource['category'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-red-500"
              >
                <option value="War & Conflict">War &amp; Conflict</option>
                <option value="Airstrikes & Air Defense">Airstrikes &amp; Air Defense</option>
                <option value="Geopolitics">Geopolitics</option>
                <option value="Naval & Maritime">Naval &amp; Maritime</option>
                <option value="Sanctions & Diplomacy">Sanctions &amp; Diplomacy</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Verifying & Saving...' : 'Save Source'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((src) => (
          <div
            key={src.id}
            className={`bg-slate-900 border rounded-xl p-4 transition-all flex flex-col justify-between ${
              src.enabled
                ? 'border-slate-800 hover:border-slate-700'
                : 'border-slate-800/40 opacity-60 bg-slate-950'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-950 border border-slate-800">
                    {getSourceIcon(src.type)}
                  </div>
                  <span className="font-mono text-slate-400 uppercase text-[11px]">
                    {src.type === 'x_osint' ? 'X / OSINT' : src.type === 'keyword_topic' ? 'Keyword Monitor' : 'RSS Wire'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleSource(src.id)}
                    className={`px-2 py-0.5 text-[11px] rounded transition-colors cursor-pointer ${
                      src.enabled
                        ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {src.enabled ? 'Active' : 'Disabled'}
                  </button>

                  {!src.isDefault && (
                    <button
                      onClick={() => onDeleteSource(src.id)}
                      className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Remove custom source"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <h4 className="text-sm font-semibold text-slate-200">{src.name}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-1 font-mono break-all">
                {src.url}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
              <span className="text-slate-300">{src.category}</span>
              {src.isDefault ? (
                <span className="text-slate-400">Verified Wire</span>
              ) : (
                <span className="text-amber-400">Custom Feed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
