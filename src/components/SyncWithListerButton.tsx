import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Clock, Settings2, ExternalLink, AlertCircle } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

interface SyncWithListerButtonProps {
  variant?: 'header' | 'toolbar' | 'compact';
  className?: string;
  showDetails?: boolean;
}

export const SyncWithListerButton: React.FC<SyncWithListerButtonProps> = ({
  variant = 'header',
  className = '',
  showDetails = false
}) => {
  const { isSyncingWithLister, lastListerSyncTime, syncWithLister, listerConfig, setListerConfig } = useTasks();
  const [showConfigPopover, setShowConfigPopover] = useState(false);
  const [tempUrl, setTempUrl] = useState(listerConfig.baseUrl);
  const [tempApiKey, setTempApiKey] = useState(listerConfig.apiKey);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempUrl(listerConfig.baseUrl);
    setTempApiKey(listerConfig.apiKey);
  }, [listerConfig]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowConfigPopover(false);
      }
    }
    if (showConfigPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showConfigPopover]);

  const handleSyncClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatusMessage(null);
    const result = await syncWithLister();
    if (result) {
      setStatusMessage(result.message);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setListerConfig({
      baseUrl: tempUrl.trim(),
      apiKey: tempApiKey.trim()
    });
    setShowConfigPopover(false);
  };

  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  if (variant === 'compact') {
    return (
      <div className="relative inline-flex items-center" ref={popoverRef}>
        <button
          type="button"
          id="sync-lister-btn-compact"
          onClick={handleSyncClick}
          disabled={isSyncingWithLister}
          title={`Sync (Last: ${formatLastSync(lastListerSyncTime)})`}
          className={`inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${className}`}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncingWithLister ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>
    );
  }

  if (variant === 'toolbar') {
    return (
      <div className="relative inline-flex items-center" ref={popoverRef}>
        <div className="inline-flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 shadow-sm">
          <button
            type="button"
            id="sync-lister-btn-toolbar"
            onClick={handleSyncClick}
            disabled={isSyncingWithLister}
            title="Trigger two-way task synchronization with Lister Task Manager"
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800 rounded-md transition-all focus:outline-none disabled:opacity-60 ${className}`}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncingWithLister ? 'animate-spin' : ''}`} />
            <span>{isSyncingWithLister ? 'Syncing...' : 'Sync'}</span>
            {lastListerSyncTime && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-400 border-l border-slate-700 pl-2">
                <Clock className="w-2.5 h-2.5" />
                {formatLastSync(lastListerSyncTime)}
              </span>
            )}
          </button>

          <button
            type="button"
            id="sync-lister-config-toggle-btn"
            onClick={(e) => {
              e.stopPropagation();
              setShowConfigPopover((prev) => !prev);
            }}
            title="Lister API Settings"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Configuration Popover */}
        {showConfigPopover && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-semibold text-slate-200">Lister Two-Way Sync</span>
              </div>
              <span className="text-[11px] text-slate-400">Last: {formatLastSync(lastListerSyncTime)}</span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">API Base URL</label>
                <input
                  type="url"
                  id="lister-sync-base-url-input"
                  value={tempUrl}
                  onChange={(e) => setTempUrl(e.target.value)}
                  placeholder="https://...run.app or dev server"
                  className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-md text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Leave default or set custom Lister endpoint.</p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Bearer API Key (Optional)</label>
                <input
                  type="password"
                  id="lister-sync-api-key-input"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Optional token"
                  className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-md text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  id="lister-sync-now-popover-btn"
                  onClick={handleSyncClick}
                  disabled={isSyncingWithLister}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingWithLister ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>

                <button
                  type="submit"
                  id="lister-save-config-btn"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[11px] font-medium transition-colors"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Default 'header' variant
  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      <button
        type="button"
        id="sync-with-lister-btn"
        onClick={handleSyncClick}
        disabled={isSyncingWithLister}
        title={`Sync tasks with Lister (Last: ${formatLastSync(lastListerSyncTime)})`}
        className={`inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-800 hover:text-white border border-slate-700/70 hover:border-indigo-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 shadow-sm ${className}`}
      >
        <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isSyncingWithLister ? 'animate-spin text-indigo-300' : ''}`} />
      </button>

      {/* Small options toggle on right click or dropdown */}
      <button
        type="button"
        id="sync-with-lister-settings-btn"
        onClick={(e) => {
          e.stopPropagation();
          setShowConfigPopover((prev) => !prev);
        }}
        title="Lister Synchronization Settings"
        className="p-1 text-slate-400 hover:text-slate-200 ml-0.5 rounded transition-colors"
      >
        <Settings2 className="w-3 h-3" />
      </button>

      {/* Configuration Popover */}
      {showConfigPopover && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 p-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-slate-100">Lister Task Manager Sync</span>
            </div>
            <span className="text-[10px] text-slate-400">{formatLastSync(lastListerSyncTime)}</span>
          </div>

          <div className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            Performs bidirectional last-write-wins synchronization over <code className="text-indigo-300 bg-slate-800 px-1 py-0.5 rounded">POST /api/sync</code>.
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">API Base URL</label>
              <input
                type="url"
                id="lister-header-base-url-input"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://...run.app or dev server"
                className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-md text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Authorization Bearer Token</label>
              <input
                type="password"
                id="lister-header-token-input"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Optional API token"
                className="w-full px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-md text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                id="lister-header-sync-now-btn"
                onClick={handleSyncClick}
                disabled={isSyncingWithLister}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncingWithLister ? 'animate-spin' : ''}`} />
                Sync Now
              </button>

              <button
                type="submit"
                id="lister-header-save-btn"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[11px] font-medium transition-colors"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
