import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe,
  Radio,
  RotateCcw,
  Sparkles,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { NewsSource } from '../types';
import { safeFetchJson } from '../utils/safeFetch';

interface SourceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSourcesUpdated: () => void;
}

const PRESET_SOURCES = [
  {
    name: '🇺🇦 Ukraine & Russia Frontline Wire',
    url: 'https://news.google.com/rss/search?q=(Ukraine+OR+Russia+OR+Putin+OR+Zelensky)+AND+(war+OR+frontline+OR+strike+OR+missile+OR+kursk)&hl=en-US&gl=US&ceid=US:en',
    category: 'Ukraine & Russia',
  },
  {
    name: '🇾🇪 Yemen & Red Sea Standoff (Houthis)',
    url: 'https://news.google.com/rss/search?q=(Yemen+OR+Houthi+OR+Houthis+OR+"Red+Sea")+AND+(missile+OR+strike+OR+ship+OR+drone)&hl=en-US&gl=US&ceid=US:en',
    category: 'Middle East & Yemen',
  },
  {
    name: '🇮🇷 Iran & Tehran Geopolitical Watch',
    url: 'https://news.google.com/rss/search?q=(Iran+OR+Tehran+OR+IRGC)+AND+(missile+OR+nuclear+OR+military+OR+drone+OR+strike)&hl=en-US&gl=US&ceid=US:en',
    category: 'Iran & Geopolitics',
  },
  {
    name: '🇺🇸 US War, Trump & Pentagon Wire',
    url: 'https://news.google.com/rss/search?q=(Trump+OR+Pentagon+OR+"US+military"+OR+CENTCOM)+AND+(war+OR+strike+OR+conflict+OR+defense+OR+putin)&hl=en-US&gl=US&ceid=US:en',
    category: 'US War & Trump',
  },
  {
    name: '🇵🇸 Middle East & Gaza Conflict Wire',
    url: 'https://news.google.com/rss/search?q=(Middle+East+OR+Gaza+OR+Israel+OR+Lebanon+OR+Hezbollah)+AND+(strike+OR+war+OR+idf+OR+airstrike)&hl=en-US&gl=US&ceid=US:en',
    category: 'Middle East & Yemen',
  },
  {
    name: '⚔️ The War Zone (TWZ Wire)',
    url: 'https://www.twz.com/feed',
    category: 'War & Conflict',
  },
  {
    name: '🛡️ FDD Long War Journal (Mideast/Yemen)',
    url: 'https://www.longwarjournal.org/feed',
    category: 'War & Conflict',
  },
  {
    name: '🚀 Airstrikes & Guided Missiles Wire',
    url: 'https://news.google.com/rss/search?q=(airstrike+OR+"missile+strike"+OR+"glide+bomb"+OR+"drone+strike")+AND+(military+OR+war)&hl=en-US&gl=US&ceid=US:en',
    category: 'Airstrikes & Air Defense',
  },
];

export const SourceManagerModal: React.FC<SourceManagerModalProps> = ({
  isOpen,
  onClose,
  onSourcesUpdated,
}) => {
  const [sources, setSources] = useState<NewsSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<string>('War & Conflict');
  
  const [isTestingUrl, setIsTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    resolvedUrl?: string;
    itemCount?: number;
    sampleTitle?: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch sources list from backend
  const loadSources = async () => {
    setIsLoading(true);
    const res = await safeFetchJson('/api/news/sources');
    setIsLoading(false);
    if (res.ok && res.data?.sources) {
      setSources(res.data.sources);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSources();
      setStatusMsg(null);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Test RSS feed URL or Website
  const handleTestFeed = async () => {
    if (!urlInput.trim()) {
      setTestResult({ success: false, message: 'Masukkan URL website, feed RSS, atau topik perang terlebih dahulu.' });
      return;
    }
    setIsTestingUrl(true);
    setTestResult(null);
    const res = await safeFetchJson('/api/news/sources/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlInput.trim() }),
    });
    setIsTestingUrl(false);

    if (res.ok && res.data?.success) {
      const data = res.data;
      setTestResult({
        success: true,
        resolvedUrl: data.resolvedUrl,
        message: `Feed Terverifikasi! "${data.title}" (${data.itemCount} artikel terdeteksi).`,
        itemCount: data.itemCount,
        sampleTitle: data.sampleTitle,
      });
      if (!nameInput.trim() && data.title) {
        setNameInput(data.title.replace(/ - Google News$/i, '').trim());
      }
      if (data.resolvedUrl && data.resolvedUrl !== urlInput.trim()) {
        setUrlInput(data.resolvedUrl);
      }
    } else {
      setTestResult({
        success: false,
        message: res.data?.error || res.error || 'Gagal membaca feed. Pastikan URL benar atau gunakan topik perang.',
      });
    }
  };

  // Add custom news website RSS
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !urlInput.trim()) {
      setStatusMsg({ text: 'Nama media dan URL feed/website wajib diisi.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    const res = await safeFetchJson('/api/news/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: nameInput.trim(),
        url: urlInput.trim(),
        category: categoryInput,
        type: 'rss',
      }),
    });
    setIsSubmitting(false);

    if (res.ok && res.data?.success) {
      setStatusMsg({ text: `Berhasil menambahkan website: "${nameInput}"!`, type: 'success' });
      setNameInput('');
      setUrlInput('');
      setTestResult(null);
      await loadSources();
      onSourcesUpdated();
    } else {
      setStatusMsg({ text: res.data?.error || res.error || 'Gagal menambahkan sumber.', type: 'error' });
    }
  };

  // Toggle source
  const handleToggleSource = async (id: string) => {
    const res = await safeFetchJson(`/api/news/sources/${id}/toggle`, { method: 'PATCH' });
    if (res.ok) {
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
      );
      onSourcesUpdated();
    }
  };

  // Delete source
  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`Hapus sumber website "${name}"?`)) return;
    const res = await safeFetchJson(`/api/news/sources/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setSources((prev) => prev.filter((s) => s.id !== id));
      setStatusMsg({ text: `Sumber "${name}" telah dihapus.`, type: 'success' });
      onSourcesUpdated();
    }
  };

  // Reset to default
  const handleResetToDefault = async () => {
    if (!confirm('Kembalikan semua sumber ke daftar default khusus perang & geopolitik?')) return;
    const res = await safeFetchJson('/api/news/sources/reset', { method: 'POST' });
    if (res.ok && res.data?.sources) {
      setSources(res.data.sources);
      setStatusMsg({ text: 'Daftar sumber telah di-reset ke default perang.', type: 'success' });
      onSourcesUpdated();
    }
  };

  // Apply preset
  const handleApplyPreset = (preset: typeof PRESET_SOURCES[0]) => {
    setNameInput(preset.name.replace(/^[\p{Emoji}\s]+/u, '').trim());
    setUrlInput(preset.url);
    setCategoryInput(preset.category);
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>Kelola &amp; Tambah Website Berita</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                  {sources.length} Feed Aktif
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Fokus Niche: <strong>War, Geopolitics, Ukraine, Middle East, Yaman, USA War, Trump, Putin, Iran</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Status Alert */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 shadow-sm ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/80 border border-red-500/50 text-red-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Form: Tambah Website Berita Baru */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-400" />
                <span>Tambah Website / Feed Baru</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">
                Auto-Discovery RSS Aktif
              </span>
            </div>

            <form onSubmit={handleAddSource} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Nama Media / Judul Feed
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Contoh: Ukraine War Wire / Al Jazeera"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-sky-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                    Kategori Niche
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 transition"
                  >
                    <option value="War & Conflict">⚔️ War &amp; Conflict (Frontline umum)</option>
                    <option value="Ukraine & Russia">🇺🇦 Ukraine &amp; Russia (Zelensky, Putin, Kursk)</option>
                    <option value="Middle East & Yemen">🇾🇪 Middle East &amp; Yemen (Gaza, Houthi, Red Sea)</option>
                    <option value="Iran & Geopolitics">🇮🇷 Iran &amp; Geopolitics (IRGC, Nuclear, Tehran)</option>
                    <option value="US War & Trump">🇺🇸 US War &amp; Trump (Pentagon, CENTCOM, Trump)</option>
                    <option value="Airstrikes & Air Defense">🚀 Airstrikes &amp; Air Defense (Rudal, Drone, Glide Bombs)</option>
                    <option value="Naval & Maritime">⚓ Naval &amp; Maritime (Kapal Induk, Selat Hormuz)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  URL Website, Feed RSS, atau Topik Perang
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="Masukkan URL website (contoh: twz.com, kyivindependent.com), URL RSS, atau topik"
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-sky-500 font-mono transition"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleTestFeed}
                      disabled={isTestingUrl || !urlInput.trim()}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-neutral-200 text-xs font-bold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                      title="Tes apakah feed RSS dapat dibaca"
                    >
                      {isTestingUrl ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                      ) : (
                        <Radio className="w-3.5 h-3.5 text-sky-400" />
                      )}
                      <span>Tes Feed</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !nameInput.trim() || !urlInput.trim()}
                      className="flex-1 sm:flex-none px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-extrabold rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                    >
                      {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>Tambahkan</span>
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-neutral-400 mt-1.5 flex items-center gap-1">
                  <span>💡 Tip: Anda bisa mengetik URL website langsung (sistem akan mencari feed RSS otomatis) atau kata kunci perang spesifik.</span>
                </div>
              </div>

              {/* Feed Test Status Box */}
              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs space-y-1 ${
                    testResult.success
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-950/60 text-red-300 border border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 font-semibold">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                  {testResult.sampleTitle && (
                    <div className="text-[11px] text-neutral-300 pl-6 line-clamp-1 italic font-mono">
                      Contoh berita: &quot;{testResult.sampleTitle}&quot;
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Quick Niche Presets */}
            <div className="pt-2.5 border-t border-neutral-900">
              <span className="text-[10px] text-neutral-400 block mb-1.5 font-bold uppercase tracking-wider">
                Preset Niche Perang Cepat (1-Klik untuk mengaktifkan):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_SOURCES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[10px] font-medium text-neutral-300 rounded-lg hover:text-white hover:border-neutral-700 transition cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Daftar Sumber Berita Terdaftar */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <span>Daftar Sumber Aktif di Radar</span>
                <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.2 rounded text-[10px]">
                  {sources.filter(s => s.enabled).length}/{sources.length} Aktif
                </span>
              </span>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[10px] text-neutral-400 hover:text-amber-300 transition cursor-pointer flex items-center gap-1 font-mono hover:underline"
                title="Reset kembali ke media perang bawaan"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset ke Standar Niche Perang</span>
              </button>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                <span>Memuat daftar sumber...</span>
              </div>
            ) : sources.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-400 bg-neutral-950 rounded-xl border border-neutral-800">
                Belum ada sumber berita terdaftar. Silakan tambahkan atau klik Reset ke Standar.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {sources.map((src) => (
                  <div
                    key={src.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                      src.enabled
                        ? 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                        : 'bg-neutral-950/40 border-neutral-900 opacity-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white truncate">{src.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-neutral-850 text-neutral-300 border border-neutral-800 shrink-0 font-bold">
                          {src.category}
                        </span>
                        {!src.isDefault && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-sky-950 text-sky-300 border border-sky-800/40 shrink-0 font-bold">
                            Custom
                          </span>
                        )}
                      </div>
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-neutral-400 hover:text-sky-300 font-mono truncate flex items-center gap-1 max-w-md"
                        title={src.url}
                      >
                        <span className="truncate">{src.url}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Toggle Enable/Disable */}
                      <button
                        type="button"
                        onClick={() => handleToggleSource(src.id)}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition cursor-pointer ${
                          src.enabled ? 'bg-emerald-600' : 'bg-neutral-800'
                        }`}
                        title={src.enabled ? 'Nonaktifkan sumber ini' : 'Aktifkan sumber ini'}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                            src.enabled ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>

                      {/* Delete Custom Source */}
                      {!src.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSource(src.id, src.name)}
                          className="p-1.5 text-neutral-400 hover:text-red-400 transition cursor-pointer hover:bg-neutral-900 rounded-lg"
                          title="Hapus website ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between text-xs">
          <span className="text-neutral-400 text-[11px] hidden sm:block">
            Semua artikel yang masuk otomatis difilter sesuai niche War, Ukraine, Yemen, Trump, Putin, Iran.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-neutral-200 text-black rounded-lg font-extrabold text-xs cursor-pointer transition shadow-sm ml-auto"
          >
            Tutup &amp; Terapkan
          </button>
        </div>
      </div>
    </div>
  );
};
