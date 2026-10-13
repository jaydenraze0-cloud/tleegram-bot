import React, { useState } from 'react';
import {
  Key,
  Bot,
  Send,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HelpCircle,
  X,
  Shield,
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => void;
  onTestTelegram: (botToken: string, chatId: string) => Promise<{ success: boolean; error?: string }>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onTestTelegram,
}) => {
  const [botToken, setBotToken] = useState(settings.botToken);
  const [chatId, setChatId] = useState(settings.chatId);
  const [handle, setHandle] = useState(settings.handle);
  const [hashtag, setHashtag] = useState(settings.hashtag);
  const [intervalMinutes, setIntervalMinutes] = useState(settings.intervalMinutes);
  const [logoDataUrl, setLogoDataUrl] = useState(settings.logoDataUrl);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setLogoDataUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTest = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setTestResult({
        success: false,
        message: 'Masukkan Bot Token dan Chat ID channel terlebih dahulu.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await onTestTelegram(botToken.trim(), chatId.trim());
    setIsTesting(false);

    if (res.success) {
      setTestResult({
        success: true,
        message: 'Koneksi berhasil! Pesan uji coba telah dikirim ke channel Telegram Anda.',
      });
    } else {
      setTestResult({
        success: false,
        message: res.error || 'Gagal terhubung. Pastikan bot sudah diangkat menjadi Admin di channel/grup.',
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      handle: handle.trim(),
      hashtag: hashtag.trim(),
      intervalMinutes,
      logoDataUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-white text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold">Pengaturan Telegram Bot &amp; Branding Logo</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5 pt-4">
          {/* SECTION 1: TELEGRAM BOT CREDENTIALS */}
          <div className="space-y-3">
            <h3 className="font-bold text-neutral-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-400" />
              <span>Kredensial Telegram Bot API</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="Contoh: 7123456789:AAHk..."
                  className="w-full bg-black border border-neutral-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-sky-400"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Dapatkan dari @BotFather di Telegram (/newbot).
                </span>
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Target Channel / Group ID
                </label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  placeholder="Contoh: @my_war_channel atau -100..."
                  className="w-full bg-black border border-neutral-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-sky-400"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Username channel (cth @StarkNewsChannel) dengan bot sebagai Admin.
                </span>
              </div>
            </div>

            {/* Test Handshake Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sky-400 border border-neutral-700 rounded-lg font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
                <span>{isTesting ? 'Menguji Koneksi...' : 'Kirim Uji Coba ke Telegram'}</span>
              </button>

              {testResult && (
                <div
                  className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                    testResult.success
                      ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/80 border border-red-500/50 text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: BRANDING & LOGO */}
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <h3 className="font-bold text-neutral-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-white" />
              <span>Logo &amp; Watermark Akun Anda</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Upload Logo Anda (PNG / JPG / SVG)
                </label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg font-bold flex items-center gap-2 cursor-pointer text-white">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih File Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  {logoDataUrl && (
                    <div className="w-10 h-10 rounded bg-black border border-neutral-700 p-1 flex items-center justify-center">
                      <img
                        src={logoDataUrl}
                        alt="Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Logo akan otomatis tampil di sudut kiri atas kanvas 1080x1080.
                </span>
              </div>

              <div>
                <label className="block text-neutral-400 font-semibold mb-1">
                  Handle Watermark (@NamaChannel)
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@Stark-News-x"
                  className="w-full bg-black border border-neutral-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-neutral-400 font-semibold mb-1">
                  Hashtag Default Caption
                </label>
                <input
                  type="text"
                  value={hashtag}
                  onChange={(e) => setHashtag(e.target.value)}
                  placeholder="#StarkNews #BreakingNews #ConflictUpdate"
                  className="w-full bg-black border border-neutral-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: AUTOMATION INTERVAL */}
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <h3 className="font-bold text-neutral-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              <span>Interval Posting Otomatis</span>
            </h3>

            <div>
              <label className="block text-neutral-400 font-semibold mb-1">
                Jadwal Pengecekan Berita &amp; Auto-Post
              </label>
              <select
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(parseInt(e.target.value, 10))}
                className="w-full bg-black border border-neutral-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-white"
              >
                <option value={1}>Setiap 1 Menit (Ultra Fast - Rekomendasi)</option>
                <option value={2}>Setiap 2 Menit</option>
                <option value={5}>Setiap 5 Menit</option>
                <option value={10}>Setiap 10 Menit</option>
                <option value={15}>Setiap 15 Menit</option>
                <option value={30}>Setiap 30 Menit</option>
                <option value={60}>Setiap 1 Jam</option>
              </select>

              {/* Anti-Double Post Cache Action */}
              <div className="pt-2 flex items-center justify-between bg-black/50 p-2.5 rounded-lg border border-neutral-800">
                <div>
                  <div className="font-bold text-neutral-300">Pencegahan Double Post (Anti-Double Post)</div>
                  <div className="text-[10px] text-neutral-500">
                    Semua berita yang telah dikirim ke Telegram otomatis disimpan agar tidak terkirim dua kali.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Bersihkan riwayat anti-double post? Artikel lama akan dapat diposting kembali.')) {
                      await fetch('/api/history/reset-cache', { method: 'POST' });
                      alert('Riwayat deduplikasi berhasil dibersihkan.');
                    }
                  }}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] font-bold transition whitespace-nowrap cursor-pointer"
                >
                  Reset Riwayat
                </button>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-white hover:bg-neutral-200 text-black rounded-lg font-black transition cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.4)]"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
