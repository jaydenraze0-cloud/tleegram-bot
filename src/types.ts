import { GlowConfig } from './utils/glow';

export interface BackgroundConfig {
  imageUrl: string;
  zoom: number; // 100 - 250%
  panX: number; // -300 to 300px
  panY: number; // -300 to 300px
  topGradientOpacity: number; // 0 - 100%
  bottomGradientOpacity: number; // 0 - 100%
  bottomGradientHeight: number; // 30 - 90%
}

export interface LogoConfig {
  show: boolean;
  size: number; // 32 - 120px
  margin: number; // 20 - 80px
  position: 'top-left' | 'top-right';
}

export interface EditorConfig {
  headline: string;
  highlightWords: string[];
  autoHighlightLastLine: boolean;
  fontSize: number; // 36 - 84px
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right';
  headlineY: number; // 40 - 85%
  headlineX: number; // 24 - 80px
  textColor: string;
  highlightBoxColor: string;
  highlightTextColor: string;
  glow: GlowConfig;
  background: BackgroundConfig;
  logo: LogoConfig;
  badge: {
    show: boolean;
    text: string;
  };
  divider: {
    show: boolean;
  };
  sourceLine: {
    show: boolean;
    text: string;
  };
  handleFooter: {
    show: boolean;
    text: string;
  };
}

export interface AppSettings {
  botToken: string;
  chatId: string;
  autoPostEnabled: boolean;
  intervalMinutes: number;
  handle: string;
  logoDataUrl: string;
  hashtag: string;
}

export interface AutomationConfig {
  autoPostEnabled: boolean;
  intervalMinutes: number;
  botToken: string;
  chatId: string;
  toneStyle: 'breaking_wire' | 'tactical_analysis' | 'concise_flash' | 'stark_photo_template';
  minimumUrgency: 'ALL' | 'MEDIUM_PLUS' | 'BREAKING_ONLY';
  includeHashtags: boolean;
  includeSourceLink: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalPosted: number;
}

export interface NewsSource {
  id: string;
  name: string;
  type: 'rss' | 'x_osint' | 'keyword_topic';
  url: string;
  category: string;
  enabled: boolean;
  isDefault?: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  snippet: string;
  source: string;
  sourceType: string;
  url: string;
  publishedAt: string;
  category: string;
  urgency: 'HIGH' | 'MEDIUM' | 'BREAKING';
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  hasOriginalCover?: boolean;
  candidatePhotos?: string[];
  photoKeywords?: string;
  isPosted?: boolean;
  postedAt?: string;
  caption?: string;
}

export interface TelegramWireItem {
  id: string; // e.g. ClashReport/100793
  channel: string; // @ClashReport
  channelTitle: string; // Clash Report
  url: string; // https://t.me/ClashReport/100793
  text: string;
  hasVideo: boolean;
  videoUrl?: string;
  mediaUrl?: string; // thumbnail or image preview
  publishedAt: string;
  headline: string; // 2-line viral banner headline
  captionEnglish: string; // comprehensive English explanatory OSINT caption
  nicheRelevant: boolean;
  isPosted?: boolean;
}

export interface BroadcastLog {
  id: string;
  articleId?: string;
  title: string;
  caption: string;
  chatId: string;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  timestamp: string;
  telegramMessageId?: number;
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: 'image' | 'video';
  error?: string;
}

