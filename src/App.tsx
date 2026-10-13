import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { IntelligenceRadar } from './components/IntelligenceRadar';
import { SquareEditor } from './components/SquareEditor';
import { CaptionsPanel } from './components/CaptionsPanel';
import { SettingsModal } from './components/SettingsModal';
import { SourceManagerModal } from './components/SourceManagerModal';
import { NewsArticle, EditorConfig, AppSettings } from './types';
import { exportCanvasToPng } from './utils/exportImage';
import { safeFetchJson } from './utils/safeFetch';
import {
  toViralHook,
  generateAllViralVariations,
  extractViralHighlights,
} from './utils/headlineTransformer';
import {
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Radio,
  Layers,
  Sparkles,
} from 'lucide-react';

const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  headline: 'RUSSIAN FORCES STRIKE\nZAPORIZHZHIA WITH GLIDE BOMBS',
  highlightWords: ['ZAPORIZHZHIA', 'GLIDE', 'BOMBS'],
  autoHighlightLastLine: false,
  fontSize: 62,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  textAlign: 'left',
  headlineY: 78,
  headlineX: 48,
  textColor: '#FFFFFF',
  highlightBoxColor: '#FFFFFF',
  highlightTextColor: '#000000',
  glow: {
    color: '#FFFFFF',
    intensity: 22,
    spread: 36,
    toggles: {
      headline: true,
      highlightBox: true,
      logo: false,
      badge: true,
      footer: false,
    },
  },
  background: {
    imageUrl: '',
    zoom: 105,
    panX: 0,
    panY: 0,
    topGradientOpacity: 60,
    bottomGradientOpacity: 95,
    bottomGradientHeight: 85,
  },
  logo: {
    show: true,
    size: 58,
    margin: 40,
    position: 'top-left',
  },
  badge: {
    show: false,
    text: 'BREAKING',
  },
  divider: {
    show: true,
  },
  sourceLine: {
    show: false,
    text: 'TACTICAL OSINT WIRE',
  },
  handleFooter: {
    show: true,
    text: '@Stark-News-x',
  },
};

export default function App() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [editorConfig, setEditorConfig] = useState<EditorConfig>(DEFAULT_EDITOR_CONFIG);
  const [captionTelegram, setCaptionTelegram] = useState<string>(
    'Russian aerospace forces executed coordinated strikes utilizing guided glide bombs against key fortified targets near Zaporizhzhia, triggering local emergency readiness alerts. Stay tuned for updates. #StarkNews #BreakingNews'
  );

  const [activeView, setActiveView] = useState<'radar' | 'editor' | 'captions' | '3col'>('radar');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSourceManagerOpen, setIsSourceManagerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGeneratingHeadline, setIsGeneratingHeadline] = useState(false);
  const [isPostingTelegram, setIsPostingTelegram] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [refreshCountdown, setRefreshCountdown] = useState<number>(60); // 1 minute = 60 seconds
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [activeSearchTopic, setActiveSearchTopic] = useState<string | null>(null);
  const [candidatePhotos, setCandidatePhotos] = useState<string[]>([]);
  const [isSearchingPhoto, setIsSearchingPhoto] = useState(false);
  const [isAutoSyncPaused, setIsAutoSyncPaused] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('stark_news_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          autoPostEnabled: parsed.autoPostEnabled !== undefined ? parsed.autoPostEnabled : true,
          intervalMinutes: parsed.intervalMinutes ? Math.max(1, parsed.intervalMinutes) : 1,
        };
      } catch {
        // Fallback
      }
    }
    return {
      botToken: '',
      chatId: '',
      autoPostEnabled: true, // ZERO-CLICK AUTOPILOT ENABLED BY DEFAULT PER USER REQUEST
      intervalMinutes: 1, // 1 MINUTE SYNC PER USER REQUEST
      handle: '@Stark-News-x',
      logoDataUrl: '',
      hashtag: '#StarkNews #BreakingNews',
    };
  });

  // Autopilot Live Execution Phase State
  const [autopilotState, setAutopilotState] = useState<{
    phase: 'idle' | 'searching_photo' | 'synthesizing' | 'rendering_card' | 'posting' | 'completed';
    message: string;
    storyTitle?: string;
  }>({
    phase: 'idle',
    message: '⚡ Autopilot Siaga: Memantau radar & siap siaran otomatis...',
  });

  const isAutopilotBusyRef = useRef(false);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync settings with localStorage and server
  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      localStorage.setItem('stark_news_settings', JSON.stringify(merged));
      fetch('/api/automation/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      }).catch(console.error);
      return merged;
    });
  };

  // Synchronize initial settings from server config on boot
  useEffect(() => {
    safeFetchJson('/api/automation/status')
      .then((res) => {
        if (res.ok && res.data?.config) {
          const cfg = res.data.config;
          setSettings((prev) => ({
            ...prev,
            botToken: prev.botToken || cfg.botToken || '',
            chatId: prev.chatId || cfg.chatId || '',
            autoPostEnabled:
              prev.autoPostEnabled !== undefined
                ? prev.autoPostEnabled
                : cfg.autoPostEnabled ?? true,
            handle: prev.handle || cfg.handle || '@Stark-News-x',
            hashtag: prev.hashtag || cfg.hashtag || '#StarkNews #BreakingNews',
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Core Zero-Click Autopilot Automation Loop (Autonomous background worker)
  const executeAutopilotCycle = useCallback(
    async (sourceArticles?: NewsArticle[]) => {
      if (isAutopilotBusyRef.current) return;
      const targetArticles = sourceArticles || articles;
      if (!targetArticles || targetArticles.length === 0) return;

      // Find highest priority unposted candidate
      const candidate = targetArticles.find((a) => !a.isPosted);
      if (!candidate) {
        setAutopilotState({
          phase: 'idle',
          message: 'Semua berita pada radar telah disiarkan. Menunggu pembaruan berikutnya...',
        });
        return;
      }

      isAutopilotBusyRef.current = true;
      try {
        setSelectedArticle(candidate);

        // STEP 1: Automated Google & Internet Photo Search by entities
        setAutopilotState({
          phase: 'searching_photo',
          storyTitle: candidate.title,
          message: `[1/4] Mencari foto Google/Internet untuk: "${candidate.title.slice(0, 32)}..."`,
        });

        let chosenPhoto = candidate.imageUrl;
        const photoRes = await safeFetchJson('/api/news/search-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: candidate.title,
            snippet: candidate.snippet,
            category: candidate.category,
          }),
        });
        if (photoRes.ok && photoRes.data?.primaryPhoto) {
          chosenPhoto = photoRes.data.primaryPhoto;
        }

        if (chosenPhoto) {
          setEditorConfig((prev) => ({
            ...prev,
            background: { ...prev.background, imageUrl: chosenPhoto },
          }));
        }

        // STEP 2: Synthesize Smart Headline & Telegram Caption
        setAutopilotState({
          phase: 'synthesizing',
          storyTitle: candidate.title,
          message: `[2/4] Menyusun headline taktis & narasi Telegram...`,
        });

        // Clean authoritative caption template (no BREAKING ALERT)
        let finalCaption = `${candidate.title}\n\n${candidate.snippet}\n\n${settings.hashtag}`;
        const headRes = await safeFetchJson('/api/ai/smart-headline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: candidate.title,
            summary: candidate.snippet,
            source: candidate.source,
            style: 'viral',
            handle: settings.handle,
          }),
        });

        if (headRes.ok && headRes.data?.headline) {
          const rawHighlights = headRes.data.highlight_words || '';
          const highlightList = rawHighlights
            .split(/\s+/)
            .map((w: string) => w.replace(/[^\w\s-]/g, '').trim())
            .filter(Boolean);

          setEditorConfig((prev) => ({
            ...prev,
            headline: headRes.data.headline.toUpperCase(),
            highlightWords: highlightList.length > 0 ? highlightList : prev.highlightWords,
          }));
          if (headRes.data.caption_telegram) {
            finalCaption = headRes.data.caption_telegram;
            setCaptionTelegram(finalCaption);
          }
        }

        // STEP 3: Wait for DOM & image rendering, then snapshot 1080x1080 canvas
        setAutopilotState({
          phase: 'rendering_card',
          storyTitle: candidate.title,
          message: `[3/4] Merender kartu grafis 1080x1080 template taktis...`,
        });

        await new Promise((resolve) => setTimeout(resolve, 1500));

        const canvasElement = document.getElementById('stark-news-master-canvas');
        let pngDataUrl: string | null = null;
        if (canvasElement) {
          try {
            pngDataUrl = await exportCanvasToPng(canvasElement);
          } catch (renderErr) {
            console.warn('Canvas snapshot failed:', renderErr);
          }
        }

        // STEP 4: Automated Dispatch to Telegram (with Anti-Double Post guarantee)
        setAutopilotState({
          phase: 'posting',
          storyTitle: candidate.title,
          message: `[4/4] Menyiarkan foto kartu template & narasi ke Telegram...`,
        });

        const postRes = await safeFetchJson('/api/telegram/post-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caption: finalCaption,
            imageDataUrl: pngDataUrl,
            title: candidate.title,
            articleId: candidate.id,
            articleUrl: candidate.url,
            simulateOnly: !settings.botToken || !settings.chatId,
          }),
        });

        const postData = postRes.data || {};

        // Mark article as posted (Anti-Double Post permanent deduplication)
        const updatedCandidate = { ...candidate, isPosted: true };
        setSelectedArticle(updatedCandidate);
        setArticles((prev) =>
          prev.map((a) => (a.id === candidate.id ? { ...a, isPosted: true } : a))
        );

        setAutopilotState({
          phase: 'completed',
          storyTitle: candidate.title,
          message:
            postData.status === 'SENT'
              ? `✅ Siaran Sukses: Terkirim ke Telegram #${postData.log?.telegramMessageId || 'OK'}`
              : `✅ Siaran Tersimpan (Mode Simulasi Aktif - Masukkan Bot Token & Chat ID di Header)`,
        });

        showToast(
          postData.status === 'SENT'
            ? `⚡ Autopilot: Berhasil mengirim "${candidate.title.slice(0, 35)}..." ke Telegram!`
            : `⚡ Autopilot: Kartu grafis 1080p berhasil dirender & disimpan!`,
          'success'
        );
      } catch (loopErr: any) {
        console.error('Autopilot cycle error:', loopErr);
        setAutopilotState({
          phase: 'idle',
          message: 'Autopilot mengalami penyesuaian jaringan. Menunggu siklus berikutnya...',
        });
      } finally {
        setTimeout(() => {
          isAutopilotBusyRef.current = false;
        }, 3000);
      }
    },
    [articles, settings]
  );

  // Fetch news articles from server
  const fetchNews = useCallback(
    async (isManual: boolean = false) => {
      setIsSyncing(true);
      try {
        const res = await safeFetchJson('/api/news/fetch');
        const data = res.data || {};
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles);
          if (!selectedArticle) {
            const first = data.articles[0];
            setSelectedArticle(first);
            if (first.imageUrl) {
              setEditorConfig((prev) => ({
                ...prev,
                background: { ...prev.background, imageUrl: first.imageUrl! },
              }));
              setCandidatePhotos(
                first.candidatePhotos && first.candidatePhotos.length > 0
                  ? first.candidatePhotos
                  : [first.imageUrl]
              );
            } else {
              // Automatically query for a tailored high-res photo for the lead story if missing
              safeFetchJson('/api/news/search-photos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: first.title,
                  snippet: first.snippet,
                  category: first.category,
                }),
              }).then((photoRes) => {
                if (photoRes.ok && photoRes.data?.primaryPhoto) {
                  const p = photoRes.data.primaryPhoto;
                  const c = photoRes.data.candidatePhotos || [p];
                  setEditorConfig((prev) => ({
                    ...prev,
                    background: { ...prev.background, imageUrl: p },
                  }));
                  setCandidatePhotos(c);
                }
              });
            }
          }
          if (isManual) {
            showToast(`Radar disinkronkan (${data.articles.length} berita terbaru)`, 'success');
          }

          // Zero-Click Autopilot: Automatically start broadcasting new unposted news
          if (settings.autoPostEnabled) {
            setTimeout(() => {
              executeAutopilotCycle(data.articles);
            }, 2000);
          }
        }
      } catch (err: any) {
        console.error(err);
        showToast('Could not fetch live conflict wire', 'error');
      } finally {
        setIsSyncing(false);
        setRefreshCountdown((settings.intervalMinutes || 1) * 60); // 1 minute countdown
      }
    },
    [selectedArticle, settings.autoPostEnabled, settings.intervalMinutes, executeAutopilotCycle]
  );

  // Live Dynamic Google News Search Handler
  const handleSearchGoogle = useCallback(
    async (query: string) => {
      const cleanQ = query.trim();
      if (!cleanQ) return;
      setIsSearchingGoogle(true);
      try {
        const res = await safeFetchJson(`/api/news/search-google?q=${encodeURIComponent(cleanQ)}`);
        const data = res.data || {};
        if (data.articles && data.articles.length > 0) {
          setActiveSearchTopic(cleanQ);
          setArticles(data.articles);
          const first = data.articles[0];
          setSelectedArticle(first);
          if (first.imageUrl) {
            setEditorConfig((prev) => ({
              ...prev,
              background: { ...prev.background, imageUrl: first.imageUrl! },
            }));
            setCandidatePhotos(
              first.candidatePhotos && first.candidatePhotos.length > 0
                ? first.candidatePhotos
                : [first.imageUrl]
            );
          } else {
            safeFetchJson('/api/news/search-photos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: first.title,
                snippet: first.snippet,
                category: first.category,
              }),
            }).then((photoRes) => {
              if (photoRes.ok && photoRes.data?.primaryPhoto) {
                const p = photoRes.data.primaryPhoto;
                const c = photoRes.data.candidatePhotos || [p];
                setEditorConfig((prev) => ({
                  ...prev,
                  background: { ...prev.background, imageUrl: p },
                }));
                setCandidatePhotos(c);
              }
            });
          }
          showToast(`Ditemukan ${data.articles.length} berita Google News untuk "${cleanQ}"!`, 'success');

          // If autopilot enabled, execute on new Google News results
          if (settings.autoPostEnabled) {
            setTimeout(() => {
              executeAutopilotCycle(data.articles);
            }, 1500);
          }
        } else {
          showToast(`Tidak ditemukan berita Google News untuk "${cleanQ}"`, 'info');
        }
      } catch (err: any) {
        console.error('Google News search error:', err);
        showToast('Gagal memuat pencarian Google News', 'error');
      } finally {
        setIsSearchingGoogle(false);
      }
    },
    [settings.autoPostEnabled, executeAutopilotCycle]
  );

  const handleResetFeed = useCallback(() => {
    setActiveSearchTopic(null);
    fetchNews(true);
  }, [fetchNews]);

  // 1-minute Auto-refresh Interval Timer (Supports Pause / Resume)
  useEffect(() => {
    if (isAutoSyncPaused) return;

    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          // Timer reached 0: automatically refresh live wire
          fetchNews(false);
          return (settings.intervalMinutes || 1) * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchNews, isAutoSyncPaused]);

  // Master Unified Stop / Resume toggle for all app features (1-minute synchronized cycle)
  const handleToggleMasterStop = useCallback(() => {
    setIsAutoSyncPaused((prev) => {
      const willStop = !prev;
      handleUpdateSettings({
        autoPostEnabled: !willStop,
        intervalMinutes: 1, // Enforce strictly 1 minute for all features
      });

      if (willStop) {
        setAutopilotState({
          phase: 'idle',
          message: '🛑 Seluruh sistem di-STOP (Refresh 1 menit & Autopilot dijeda).',
        });
        showToast('🛑 Seluruh refresh aplikasi & siaran autopilot berhasil di-STOP!', 'info');
      } else {
        setRefreshCountdown(60); // Reset countdown exactly to 60s (1 minute)
        setAutopilotState({
          phase: 'idle',
          message: '⚡ Seluruh sistem AKTIF: Siklus refresh & autopilot 1 menit berjalan...',
        });
        showToast('▶ Seluruh fitur aplikasi aktif kembali (Refresh serentak setiap 1 menit)!', 'success');
        executeAutopilotCycle();
      }
      return willStop;
    });
  }, [handleUpdateSettings, executeAutopilotCycle]);

  // Generate smart headline & Telegram caption with Gemini / local viral synthesizer
  const generateSmartHeadline = async (
    storyToUse?: NewsArticle,
    style: 'viral' | 'impact' | 'tactical' | 'dramatic' | 'indo' | 'short' = 'viral'
  ) => {
    const story = storyToUse || selectedArticle;
    if (!story) return;

    setIsGeneratingHeadline(true);
    try {
      const res = await safeFetchJson('/api/ai/smart-headline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: story.title,
          summary: story.snippet,
          source: story.source,
          style,
          handle: settings.handle,
        }),
      });

      const data = res.data || {};
      if (data.headline) {
        const rawHighlights = data.highlight_words || '';
        const highlightList = rawHighlights
          .split(/\s+/)
          .map((w: string) => w.replace(/[^\w\s-]/g, '').trim())
          .filter(Boolean);

        setEditorConfig((prev) => ({
          ...prev,
          headline: data.headline.toUpperCase(),
          highlightWords: highlightList.length > 0 ? highlightList : prev.highlightWords,
        }));

        if (data.caption_telegram) {
          // Ensure clean caption without "🚨 BREAKING ALERT:"
          const cleanCap = data.caption_telegram.replace(/🚨\s*BREAKING\s*(ALERT:?)?\s*/i, '');
          setCaptionTelegram(cleanCap);
        }

        showToast(`Headline berhasil dimodifikasi (${style.toUpperCase()})`, 'success');
      }
    } catch {
      // Local client-side viral transformation fallback (never raw news title!)
      const allVariations = generateAllViralVariations(story.title);
      const chosen = allVariations[style] || allVariations.viral;
      const highlights = extractViralHighlights(chosen);

      setEditorConfig((prev) => ({
        ...prev,
        headline: chosen,
        highlightWords: highlights,
      }));
      setCaptionTelegram(`${story.title}\n\n${story.snippet}\n\n#StarkNews #DefenseWire`);
      showToast('Headline dimodifikasi secara lokal (format viral)', 'info');
    } finally {
      setIsGeneratingHeadline(false);
    }
  };

  const handleGenerateByStyle = async (
    style?: 'viral' | 'impact' | 'tactical' | 'dramatic' | 'indo' | 'short'
  ) => {
    await generateSmartHeadline(selectedArticle || undefined, style || 'viral');
  };

  // Story selection handler: Prioritizes original news cover; if missing, automatically searches real photos on the internet!
  const handleSelectArticle = (article: NewsArticle) => {
    setSelectedArticle(article);

    // IMMEDIATELY modify the headline to viral 2-line format (NEVER use raw news title!)
    const initialViral = toViralHook(article.title);
    const initialHighlights = extractViralHighlights(initialViral);
    setEditorConfig((prev) => ({
      ...prev,
      headline: initialViral,
      highlightWords: initialHighlights,
    }));
    // Clean initial caption without BREAKING ALERT
    setCaptionTelegram(`${article.title}\n\n${article.snippet}\n\n${settings.hashtag}`);

    if (article.imageUrl) {
      // Image is already resolved: apply to editor canvas
      setEditorConfig((prev) => ({
        ...prev,
        background: { ...prev.background, imageUrl: article.imageUrl! },
      }));
      setCandidatePhotos(article.candidatePhotos && article.candidatePhotos.length > 0 ? article.candidatePhotos : [article.imageUrl]);
      if (article.hasOriginalCover) {
        showToast(`Cover berita asli dimuat (${article.source})`, 'info');
      } else {
        showToast('Foto internet otomatis dimuat', 'info');
      }
    } else {
      // News feed does NOT have an image: automatically search real photos on the internet!
      setIsSearchingPhoto(true);
      safeFetchJson('/api/news/search-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          snippet: article.snippet,
          category: article.category,
        }),
      }).then((photoRes) => {
        setIsSearchingPhoto(false);
        if (photoRes.ok && photoRes.data?.primaryPhoto) {
          const foundUrl = photoRes.data.primaryPhoto;
          const foundCandidates = photoRes.data.candidatePhotos || [foundUrl];
          setEditorConfig((prev) => ({
            ...prev,
            background: { ...prev.background, imageUrl: foundUrl },
          }));
          setCandidatePhotos(foundCandidates);
          // Update article in radar state
          setArticles((prev) =>
            prev.map((a) =>
              a.id === article.id
                ? { ...a, imageUrl: foundUrl, candidatePhotos: foundCandidates, hasOriginalCover: false }
                : a
            )
          );
          setSelectedArticle((prev) =>
            prev?.id === article.id
              ? { ...prev, imageUrl: foundUrl, candidatePhotos: foundCandidates, hasOriginalCover: false }
              : prev
          );
          showToast('Feed tidak ada foto: Berhasil cari & pasang foto dari internet!', 'success');
        }
      });
    }

    generateSmartHeadline(article, 'viral');
  };

  // Step-by-Step Flow Navigation Handlers
  const handleProceedToEditor = (article?: NewsArticle) => {
    if (article) {
      handleSelectArticle(article);
    }
    setActiveView('editor');
  };

  const handleProceedToCaptions = () => {
    setActiveView('captions');
  };

  const handleBackToRadar = () => {
    setActiveView('radar');
  };

  // Publish to Telegram with 1080x1080 Photo
  const handlePostToTelegramWithPhoto = async (caption: string) => {
    const canvasElement = document.getElementById('stark-news-master-canvas');
    if (!canvasElement) {
      showToast('Canvas not found for export', 'error');
      return;
    }

    setIsPostingTelegram(true);
    try {
      const pngDataUrl = await exportCanvasToPng(canvasElement);

      const res = await safeFetchJson('/api/telegram/post-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption,
          imageDataUrl: pngDataUrl,
          title: editorConfig.headline,
          articleId: selectedArticle?.id,
          articleUrl: selectedArticle?.url,
          articleTitle: selectedArticle?.title,
          simulateOnly: !settings.botToken || !settings.chatId,
        }),
      });

      const data = res.data || {};

      if (res.ok && data.success) {
        if (selectedArticle) {
          const updated = { ...selectedArticle, isPosted: true };
          setSelectedArticle(updated);
          setArticles((prev) =>
            prev.map((a) => (a.id === selectedArticle.id ? { ...a, isPosted: true } : a))
          );
        }

        if (data.status === 'SENT') {
          showToast(
            `Foto & narasi berhasil disiarkan ke Telegram! (Msg #${data.log?.telegramMessageId || 'OK'})`,
            'success'
          );
        } else {
          showToast(
            'Siaran tersimpan dalam mode Simulasi (Anti-Double Post aktif: artikel ditandai POSTED)',
            'info'
          );
        }
      } else {
        showToast(data.error || res.error || 'Gagal mengirim foto ke Telegram', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Telegram export error: ' + err.message, 'error');
    } finally {
      setIsPostingTelegram(false);
    }
  };

  // Toggle article posted state manually (Anti-Double Post management)
  const handleToggleArticlePosted = async (article: NewsArticle) => {
    const nextStatus = !article.isPosted;
    try {
      const res = await safeFetchJson('/api/articles/toggle-posted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: article.url,
          title: article.title,
          isPosted: nextStatus,
        }),
      });
      const data = res.data || {};
      if (res.ok && data.success) {
        setArticles((prev) =>
          prev.map((a) => (a.id === article.id ? { ...a, isPosted: nextStatus } : a))
        );
        if (selectedArticle?.id === article.id) {
          setSelectedArticle((prev) => (prev ? { ...prev, isPosted: nextStatus } : null));
        }
        showToast(
          nextStatus ? 'Status: SUDAH DIPOSTING (Akan dilewati bot)' : 'Status: SIAP SIARAN',
          nextStatus ? 'success' : 'info'
        );
      }
    } catch (e: any) {
      showToast('Gagal mengubah status posting artikel', 'error');
    }
  };

  // Explicitly search the internet for matching photos and load candidate gallery
  const handleFindInternetPhotos = async (customQuery?: string) => {
    setIsSearchingPhoto(true);
    try {
      const q = customQuery?.trim();
      const payload = q
        ? { customQuery: q }
        : {
            title: selectedArticle?.title || '',
            snippet: selectedArticle?.snippet || '',
            category: selectedArticle?.category || '',
          };

      const res = await safeFetchJson('/api/news/search-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = res.data || {};
      if (res.ok && data.candidatePhotos && data.candidatePhotos.length > 0) {
        setCandidatePhotos(data.candidatePhotos);
        const currentUrl = editorConfig.background.imageUrl;
        const nextPhoto =
          data.candidatePhotos.find((p: string) => p !== currentUrl) ||
          data.primaryPhoto ||
          data.candidatePhotos[0];
        setEditorConfig((prev) => ({
          ...prev,
          background: { ...prev.background, imageUrl: nextPhoto },
        }));
        showToast(
          `Ditemukan ${data.candidatePhotos.length} foto asli di internet!`,
          'success'
        );
      } else {
        showToast('Tidak ada foto baru ditemukan di internet', 'info');
      }
    } catch (err: any) {
      showToast('Gagal memuat foto dari internet', 'error');
    } finally {
      setIsSearchingPhoto(false);
    }
  };

  // Test Telegram connection
  const handleTestTelegram = async (botToken: string, chatId: string) => {
    try {
      const res = await safeFetchJson('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken, chatId }),
      });
      return res.data || { success: false, error: res.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  // Toggle Auto-post
  const handleToggleAutoPost = async () => {
    const next = !settings.autoPostEnabled;
    handleUpdateSettings({ autoPostEnabled: next });
    showToast(
      next
        ? `Mode Autopilot aktif (Siaran otomatis setiap ${settings.intervalMinutes} menit)`
        : 'Mode Autopilot dijeda',
      next ? 'success' : 'info'
    );
    if (next) {
      executeAutopilotCycle();
    }
  };

  useEffect(() => {
    fetchNews(false);
  }, [fetchNews]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
          <div
            className={`px-4 py-3 rounded-xl border text-xs font-bold shadow-2xl flex items-center gap-2.5 max-w-md ${
              toast.type === 'success'
                ? 'bg-neutral-900 border-emerald-500/60 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-neutral-900 border-red-500/60 text-red-300'
                : 'bg-neutral-900 border-neutral-700 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <Header
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSourceManager={() => setIsSourceManagerOpen(true)}
        activeView={activeView}
        onChangeView={setActiveView}
        onTriggerSync={() => fetchNews(true)}
        isSyncing={isSyncing}
        onToggleAutoPost={handleToggleMasterStop}
        storiesCount={articles.length}
        refreshCountdown={refreshCountdown}
        isAutopilotRunning={autopilotState.phase !== 'idle' && autopilotState.phase !== 'completed'}
        isPaused={isAutoSyncPaused}
        onToggleMasterStop={handleToggleMasterStop}
      />

      {/* Clean Guided Step Bar (Anti-Pusing / Zero Clutter) */}
      <div className="bg-neutral-950/90 border-b border-neutral-800 px-4 py-2.5 text-xs">
        <div className="max-w-[1920px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Step Context & Calm Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center font-mono font-extrabold text-[11px] text-white">
                {activeView === 'radar' ? '1' : activeView === 'editor' ? '2' : activeView === 'captions' ? '3' : '✦'}
              </span>
              <div>
                <div className="font-extrabold text-white text-xs flex items-center gap-2">
                  <span>
                    {activeView === 'radar'
                      ? 'LANGKAH 1: PILIH BERITA PERANG'
                      : activeView === 'editor'
                      ? 'LANGKAH 2: DESAIN KARTU TAKTIS 1080P'
                      : activeView === 'captions'
                      ? 'LANGKAH 3: TINJAUAN & SIARKAN TELEGRAM'
                      : 'MODE STUDIO 3-KOLOM SEKALIGUS'}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500 hidden sm:inline">
                    {activeView === 'radar'
                      ? `(${articles.length} berita tersedia)`
                      : activeView === 'editor' && selectedArticle
                      ? `"${selectedArticle.title.slice(0, 36)}..."`
                      : ''}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400">
                  {isAutoSyncPaused ? (
                    <span className="text-amber-400 font-medium">
                      🛑 Sistem dihentikan (Gunakan saklar ON/OFF di kanan atas header untuk memulai).
                    </span>
                  ) : activeView === 'radar' ? (
                    'Klik berita mana saja di bawah, lalu klik "Desain Kartu" untuk membuat grafis taktis.'
                  ) : activeView === 'editor' ? (
                    'Sesuaikan foto, kotak sorotan kata kunci, dan tata letak sebelum disiarkan.'
                  ) : activeView === 'captions' ? (
                    'Periksa narasi kawat otomatis dan siarkan kartu 1080p langsung ke Telegram.'
                  ) : (
                    'Tampilan multi-kolom aktif. Pembaruan 1 menit berjalan tenang di latar belakang.'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0">
            {activeView === 'radar' && (
              <button
                onClick={() => handleProceedToEditor()}
                disabled={!selectedArticle}
                className="px-4 py-1.5 bg-white hover:bg-neutral-200 disabled:opacity-40 text-black text-xs font-extrabold rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-sm"
              >
                <span>Lanjut ke Desain Kartu</span>
                <ChevronRight className="w-4 h-4 text-black" />
              </button>
            )}

            {activeView === 'editor' && (
              <>
                <button
                  onClick={handleBackToRadar}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Pilih Berita Lain</span>
                </button>
                <button
                  onClick={handleProceedToCaptions}
                  className="px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-black text-xs font-black rounded-lg flex items-center gap-1.5 cursor-pointer transition shadow-[0_0_12px_rgba(14,165,233,0.3)]"
                >
                  <span>Lanjut ke Siaran Telegram</span>
                  <ChevronRight className="w-4 h-4 text-black" />
                </button>
              </>
            )}

            {activeView === 'captions' && (
              <>
                <button
                  onClick={() => setActiveView('editor')}
                  className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Edit Desain</span>
                </button>
                <button
                  onClick={handleBackToRadar}
                  className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition border border-neutral-700"
                >
                  <span>Selesai / Berita Baru</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {activeView === '3col' && (
              <button
                onClick={() => setActiveView('radar')}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-700 text-xs font-bold rounded-lg cursor-pointer transition"
              >
                Beralih ke Mode Bertahap
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 overflow-hidden">
        {/* Step-by-Step or 3-Column View */}
        <div
          className={`h-[calc(100vh-7.5rem)] grid gap-3 ${
            activeView === '3col' ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
          }`}
        >
          {/* Step 1: Intelligence Radar */}
          {(activeView === '3col' || activeView === 'radar') && (
            <div
              className={`${
                activeView === '3col'
                  ? 'lg:col-span-3'
                  : 'max-w-4xl mx-auto w-full'
              } h-full min-h-[500px] flex flex-col`}
            >
              <IntelligenceRadar
                articles={articles}
                selectedArticle={selectedArticle}
                onSelectArticle={handleSelectArticle}
                isSyncing={isSyncing}
                refreshCountdown={refreshCountdown}
                intervalMinutes={1}
                onForceRefresh={() => fetchNews(true)}
                onToggleArticlePosted={handleToggleArticlePosted}
                onSearchGoogle={handleSearchGoogle}
                isSearchingGoogle={isSearchingGoogle}
                activeSearchTopic={activeSearchTopic}
                onResetFeed={handleResetFeed}
                isAutoSyncPaused={isAutoSyncPaused}
                onToggleAutoSyncPause={handleToggleMasterStop}
                onOpenSourceManager={() => setIsSourceManagerOpen(true)}
                onProceedToEditor={handleProceedToEditor}
              />
            </div>
          )}

          {/* Step 2: 1080x1080 Studio Canvas (Always mounted for background export readiness) */}
          <div
            className={`${
              activeView === '3col'
                ? 'lg:col-span-6 h-full min-h-[500px]'
                : activeView === 'editor'
                ? 'h-full min-h-[500px] max-w-4xl mx-auto w-full flex flex-col'
                : 'absolute -left-[9999px] top-0 pointer-events-none opacity-0'
            }`}
          >
            <SquareEditor
              config={editorConfig}
              onChange={setEditorConfig}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onReset={() => setEditorConfig(DEFAULT_EDITOR_CONFIG)}
              onShowToast={showToast}
              storyImageUrl={selectedArticle?.imageUrl}
              onFindInternetPhoto={handleFindInternetPhotos}
              candidatePhotos={candidatePhotos}
              isSearchingPhoto={isSearchingPhoto}
              currentArticleTitle={selectedArticle?.title}
            />
          </div>

          {/* Step 3: Captions & Telegram Dispatch */}
          {(activeView === '3col' || activeView === 'captions') && (
            <div
              className={`${
                activeView === '3col'
                  ? 'lg:col-span-3'
                  : 'max-w-3xl mx-auto w-full'
              } h-full min-h-[500px] flex flex-col`}
            >
              <CaptionsPanel
                currentStory={selectedArticle}
                editorConfig={editorConfig}
                onChangeEditorConfig={setEditorConfig}
                captionTelegram={captionTelegram}
                onChangeCaptionTelegram={setCaptionTelegram}
                settings={settings}
                onPostToTelegramWithPhoto={handlePostToTelegramWithPhoto}
                isPostingTelegram={isPostingTelegram}
                onShowToast={showToast}
                onGenerateSmartHeadline={handleGenerateByStyle}
                isGeneratingHeadline={isGeneratingHeadline}
              />
            </div>
          )}
        </div>
      </main>

      {/* Settings Modal (Bot Token, Channel ID, Logo Upload) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleUpdateSettings}
        onTestTelegram={handleTestTelegram}
      />

      {/* Custom News Website RSS Source Manager Modal */}
      <SourceManagerModal
        isOpen={isSourceManagerOpen}
        onClose={() => setIsSourceManagerOpen(false)}
        onSourcesUpdated={() => fetchNews(true)}
      />
    </div>
  );
}
