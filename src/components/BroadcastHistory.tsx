import React, { useState } from 'react';
import { History, CheckCircle, AlertTriangle, RefreshCw, Trash2, RotateCcw, ExternalLink, Eye } from 'lucide-react';
import { BroadcastLog } from '../types';

interface BroadcastHistoryProps {
  logs: BroadcastLog[];
  onClearHistory: () => Promise<void>;
  onResetCache: () => Promise<void>;
  onRetryPost: (log: BroadcastLog) => Promise<void>;
}

export const BroadcastHistory: React.FC<BroadcastHistoryProps> = ({
  logs,
  onClearHistory,
  onResetCache,
  onRetryPost,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SENT' | 'SIMULATED' | 'FAILED'>('ALL');
  const [previewLog, setPreviewLog] = useState<BroadcastLog | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'ALL') return true;
    return log.status === filter;
  });

  const handleResetCache = async () => {
    if (confirm('Reset deduplication cache? This will allow previously posted conflict news to be posted again.')) {
      setIsResetting(true);
      await onResetCache();
      setIsResetting(false);
    }
  };

  const handleClear = async () => {
    if (confirm('Clear all broadcast audit history?')) {
      await onClearHistory();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Audit Log Header & Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-red-500" />
            Telegram Broadcast Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Chronological record of all news wire alerts dispatched to Telegram. Every entry records the original headline, 
            the Gemini-synthesized caption, the destination chat ID, and the Telegram API delivery status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetCache}
            disabled={isResetting}
            className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Clear posted article hashes to allow re-posting"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Dedupe Cache</span>
          </button>

          <button
            onClick={handleClear}
            disabled={logs.length === 0}
            className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/80 rounded-lg transition-colors border border-red-500/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {(['ALL', 'SENT', 'SIMULATED', 'FAILED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === status
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {status === 'ALL'
              ? `All Logs (${logs.length})`
              : `${status} (${logs.filter((l) => l.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Audit Log Table / List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <History className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">No broadcasts recorded yet</p>
            <p className="mt-1 text-slate-400">
              When autonomous posting runs or when you click &quot;Post Wire&quot;, logs will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredLogs.map((log) => {
              const date = new Date(log.timestamp);
              const formattedDate = date.toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
              });
              const formattedTime = date.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-850 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 text-xs mb-1 font-mono">
                      <span
                        className={`font-semibold flex items-center gap-1 ${
                          log.status === 'SENT'
                            ? 'text-emerald-400'
                            : log.status === 'FAILED'
                            ? 'text-red-400'
                            : 'text-sky-400'
                        }`}
                      >
                        {log.status === 'SENT' ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : log.status === 'FAILED' ? (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                        )}
                        {log.status}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-400">
                        {formattedDate} {formattedTime}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-300">{log.chatId}</span>
                      {log.telegramMessageId && (
                        <>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-400">Msg #{log.telegramMessageId}</span>
                        </>
                      )}
                    </div>

                    <h4 className="text-sm font-semibold text-slate-100 truncate">
                      {log.title}
                    </h4>

                    {log.error && (
                      <p className="text-xs text-red-400 mt-1 font-mono">
                        Error: {log.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setPreviewLog(log)}
                      className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Caption</span>
                    </button>

                    {log.status === 'FAILED' && (
                      <button
                        onClick={() => onRetryPost(log)}
                        className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Caption Preview Modal */}
      {previewLog && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">
                Dispatched Telegram Caption
              </h3>
              <button
                onClick={() => setPreviewLog(null)}
                className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Target: {previewLog.chatId} · Status: {previewLog.status} · Time: {new Date(previewLog.timestamp).toLocaleString()}
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed select-text">
              {previewLog.caption}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewLog.caption);
                  alert('Copied caption to clipboard!');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Copy to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
