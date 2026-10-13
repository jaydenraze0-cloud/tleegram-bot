import React, { useState } from 'react';
import { Bot, Send, Key, Clock, ShieldCheck, CheckCircle2, AlertTriangle, HelpCircle, Save, ExternalLink } from 'lucide-react';
import { AutomationConfig } from '../types';

interface AutomationSettingsProps {
  config: AutomationConfig;
  onSaveConfig: (updatedConfig: Partial<AutomationConfig>) => Promise<void>;
  onTestTelegram: (botToken: string, chatId: string) => Promise<{ success: boolean; error?: string }>;
}

export const AutomationSettings: React.FC<AutomationSettingsProps> = ({
  config,
  onSaveConfig,
  onTestTelegram,
}) => {
  const [botToken, setBotToken] = useState(config.botToken);
  const [chatId, setChatId] = useState(config.chatId);
  const [intervalMinutes, setIntervalMinutes] = useState(config.intervalMinutes);
  const [autoPostEnabled, setAutoPostEnabled] = useState(config.autoPostEnabled);
  const [toneStyle, setToneStyle] = useState(config.toneStyle);
  const [minimumUrgency, setMinimumUrgency] = useState(config.minimumUrgency);
  const [includeHashtags, setIncludeHashtags] = useState(config.includeHashtags);
  const [includeSourceLink, setIncludeSourceLink] = useState(config.includeSourceLink);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTest = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      setTestResult({
        success: false,
        message: 'Please provide both your Bot Token and Channel/Group Chat ID first.',
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
        message: 'Telegram handshake verified! A test message was sent to your group.',
      });
    } else {
      setTestResult({
        success: false,
        message: res.error || 'Connection failed. Verify bot token and ensure bot is an admin in the group.',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    await onSaveConfig({
      botToken: botToken.trim(),
      chatId: chatId.trim(),
      intervalMinutes,
      autoPostEnabled,
      toneStyle,
      minimumUrgency,
      includeHashtags,
      includeSourceLink,
    });

    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-sky-400" />
            Telegram Bot &amp; Automated Scheduler Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Link your Telegram channel or group to enable hands-off, automated broadcasting. FrontlineWire 
            will monitor all active conflict feeds and automatically publish original AI wire alerts at your configured intervals.
          </p>
        </div>

        {saveSuccess && (
          <div className="px-3 py-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Telegram Bot Credentials Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-400" />
              Telegram Channel Credentials
            </h3>
            <span className="text-xs font-mono text-slate-400">TELEGRAM BOT API</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Bot API Token
              </label>
              <input
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="e.g. 7123456789:AAHk..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Obtain this from @BotFather in Telegram.
              </span>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                Destination Chat / Channel ID
              </label>
              <input
                type="text"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. @my_conflict_channel or -10019827364"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Use your channel @username or group chat ID (ensure the bot is an Admin).
              </span>
            </div>
          </div>

          {/* Test Handshake Button & Result */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex-1">
              {testResult && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                      : 'bg-red-950/60 border border-red-500/40 text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || !botToken || !chatId}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-sky-400 hover:text-sky-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? 'Testing Handshake...' : 'Send Test Alert to Telegram'}</span>
            </button>
          </div>

          {/* Setup Guide Accordion */}
          <div className="mt-2 p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 text-xs text-slate-400 leading-relaxed">
            <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              Quick 3-Step Telegram Setup:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
              <li>Open Telegram, search for <strong>@BotFather</strong>, send <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-300">/newbot</code>, and copy the HTTP API token.</li>
              <li>Create or open your Telegram Channel/Group and add your bot as an <strong>Administrator</strong> (with &quot;Post Messages&quot; permission).</li>
              <li>Enter your Bot Token and Channel Username (e.g. <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-300">@my_war_channel</code>) above, then click &quot;Send Test Alert&quot;.</li>
            </ol>
          </div>
        </div>

        {/* Autonomous Scheduler Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              Autonomous Scheduling &amp; Dispatch Rules
            </h3>
            <span className="text-xs font-mono text-slate-400">CRON INTERVAL ENGINE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Master Auto-Post Switch */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="block font-semibold text-slate-300 mb-1">Autonomous Publishing</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  When enabled, the server continuously queries feeds and dispatches breaking news automatically.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="font-mono text-slate-400">
                  {autoPostEnabled ? 'ACTIVE' : 'PAUSED'}
                </span>
                <button
                  type="button"
                  onClick={() => setAutoPostEnabled(!autoPostEnabled)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    autoPostEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {autoPostEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </div>

            {/* Posting Interval */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="block font-semibold text-slate-300 mb-1">Posting Frequency</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  How often FrontlineWire scans feeds for new conflict stories.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-800/80">
                <select
                  value={intervalMinutes}
                  onChange={(e) => setIntervalMinutes(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none font-mono"
                >
                  <option value={1}>Every 1 Minute (Ultra Fast - Live Wire)</option>
                  <option value={2}>Every 2 Minutes</option>
                  <option value={5}>Every 5 Minutes (Fast Flash)</option>
                  <option value={15}>Every 15 Minutes (Standard)</option>
                  <option value={30}>Every 30 Minutes</option>
                  <option value={60}>Every 1 Hour</option>
                  <option value={120}>Every 2 Hours</option>
                </select>
              </div>
            </div>

            {/* AI Caption Tone */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="block font-semibold text-slate-300 mb-1">Gemini 3.8 Flash Persona</span>
                <p className="text-[11px] text-slate-400 leading-normal">
                  The journalistic tone used when drafting original wire captions.
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-800/80">
                <select
                  value={toneStyle}
                  onChange={(e) => setToneStyle(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="breaking_wire">Breaking News Wire Alert (Urgent)</option>
                  <option value="tactical_analysis">Tactical Military Analysis (In-Depth)</option>
                  <option value="concise_flash">Concise Flash Bulletin (Rapid)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Filter Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-300 block">Include Conflict Hashtags</span>
                <span className="text-[11px] text-slate-400">Appends #BreakingNews #WarUpdate #Geopolitics tags</span>
              </div>
              <input
                type="checkbox"
                checked={includeHashtags}
                onChange={(e) => setIncludeHashtags(e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div>
                <span className="font-semibold text-slate-300 block">Include Original Wire Link</span>
                <span className="text-[11px] text-slate-400">Adds attribution link back to the verified source</span>
              </div>
              <input
                type="checkbox"
                checked={includeSourceLink}
                onChange={(e) => setIncludeSourceLink(e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Configurations...' : 'Save & Apply All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
