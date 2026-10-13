import React, { useState } from 'react';
import { Send, Sparkles, Copy, Check, ExternalLink, Bot, AlertTriangle, Eye, RefreshCw } from 'lucide-react';
import { NewsArticle } from '../types';

interface TelegramSimulatorProps {
  selectedArticle: NewsArticle | null;
  caption: string;
  isGeneratingCaption: boolean;
  onCaptionChange: (caption: string) => void;
  onGenerateCaption: (article: NewsArticle, tone: string) => void;
  onPostToTelegram: (article: NewsArticle, caption: string) => void;
  isPosting: boolean;
  botConfigured: boolean;
  channelName: string;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  selectedArticle,
  caption,
  isGeneratingCaption,
  onCaptionChange,
  onGenerateCaption,
  onPostToTelegram,
  isPosting,
  botConfigured,
  channelName,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTone, setActiveTone] = useState<'breaking_wire' | 'tactical_analysis' | 'concise_flash'>('breaking_wire');
  const [isEditing, setIsEditing] = useState(false);

  const handleCopy = () => {
    if (!caption) return;
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-full shadow-lg">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-sky-400"></div>
          <h3 className="text-sm font-semibold text-slate-200">
            Telegram Broadcast Console
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {botConfigured ? (
            <span className="text-emerald-400">Bot Active: {channelName || 'Configured'}</span>
          ) : (
            <span className="text-amber-400">Preview Mode (No Bot Token)</span>
          )}
        </span>
      </div>

      {selectedArticle ? (
        <div className="flex flex-col flex-1 mt-4 gap-4">
          {/* Article Context Mini Header */}
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="font-semibold text-red-400">{selectedArticle.category}</span>
              <span className="font-mono">{selectedArticle.source}</span>
            </div>
            <h4 className="text-sm font-medium text-slate-200 line-clamp-2">
              {selectedArticle.title}
            </h4>
          </div>

          {/* AI Generator Tone Selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-400">AI Tone:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => {
                  setActiveTone('breaking_wire');
                  onGenerateCaption(selectedArticle, 'breaking_wire');
                }}
                disabled={isGeneratingCaption}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeTone === 'breaking_wire'
                    ? 'bg-red-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Wire Alert
              </button>
              <button
                onClick={() => {
                  setActiveTone('tactical_analysis');
                  onGenerateCaption(selectedArticle, 'tactical_analysis');
                }}
                disabled={isGeneratingCaption}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeTone === 'tactical_analysis'
                    ? 'bg-red-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tactical
              </button>
              <button
                onClick={() => {
                  setActiveTone('concise_flash');
                  onGenerateCaption(selectedArticle, 'concise_flash');
                }}
                disabled={isGeneratingCaption}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  activeTone === 'concise_flash'
                    ? 'bg-red-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Flash
              </button>
            </div>
            <button
              onClick={() => onGenerateCaption(selectedArticle, activeTone)}
              disabled={isGeneratingCaption}
              className="p-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
              title="Regenerate with Gemini 3.8 Flash"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCaption ? 'animate-spin text-red-400' : ''}`} />
            </button>
          </div>

          {/* Telegram Channel Phone / Feed Bubble View */}
          <div className="flex-1 bg-slate-950 rounded-xl p-4 border border-slate-800 flex flex-col relative overflow-hidden">
            {/* Telegram Channel Simulated Header */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-800/80">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                FW
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-slate-100 truncate">
                    {channelName || 'FrontlineWire OSINT'}
                  </span>
                  <div className="w-3.5 h-3.5 rounded-full bg-sky-500 flex items-center justify-center text-slate-950 text-[9px] font-bold">
                    ✓
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Broadcast Channel · 24,810 subscribers
                </div>
              </div>
            </div>

            {/* Simulated Telegram Message Bubble */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700/60 shadow-sm relative flex-1 flex flex-col justify-between">
              {isGeneratingCaption ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Sparkles className="w-6 h-6 text-red-500 animate-pulse" />
                  <span className="text-xs font-mono">Synthesizing Wire Alert via Gemini 3.8 Flash...</span>
                </div>
              ) : isEditing ? (
                <textarea
                  value={caption}
                  onChange={(e) => onCaptionChange(e.target.value)}
                  className="w-full flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 resize-none focus:outline-none focus:border-sky-500"
                  rows={10}
                />
              ) : (
                <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text">
                  {caption || (
                    <span className="text-slate-500 italic">
                      Click &quot;Generate AI Caption&quot; to synthesize an original breaking news post.
                    </span>
                  )}
                </div>
              )}

              {/* Message metadata footer: views and timestamp */}
              <div className="flex items-center justify-end gap-3 text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-800/60 font-mono">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" /> 1.2k
                </span>
                <span>{formattedTime}</span>
              </div>
            </div>

            {/* Controls right under the bubble */}
            <div className="flex items-center justify-between pt-3 text-xs">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="text-slate-400 hover:text-slate-200 transition-colors underline cursor-pointer"
              >
                {isEditing ? 'Done Editing' : 'Edit Text'}
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPostToTelegram(selectedArticle, caption)}
              disabled={isPosting || !caption || isGeneratingCaption}
              className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${isPosting ? 'animate-bounce' : ''}`} />
              <span>
                {isPosting
                  ? 'Broadcasting to Telegram...'
                  : botConfigured
                  ? 'Send to Telegram Channel Now'
                  : 'Simulate Broadcast (No Bot Key)'}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
          <Bot className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-sm font-medium text-slate-400">No Story Selected</p>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Pick any breaking conflict article from the Live Wire feed to inspect or customize its AI Telegram caption.
          </p>
        </div>
      )}
    </div>
  );
};
