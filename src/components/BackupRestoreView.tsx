import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  UploadCloud,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Shield,
  Clock,
  HardDrive,
  Layers,
  FileArchive,
  RefreshCw,
  Trash2,
  FileText,
  Users,
  MessageSquare,
  Video,
  Activity,
  Check,
  X,
  Eye,
  AlertCircle,
  FolderArchive,
  ArrowRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { api } from '../api/client';
import {
  BackupSnapshotSummary,
  BackupStats,
  BackupDataPayload,
  RestoreValidationResult,
  RestoreResult,
  RestoreOptions
} from '../types';
import { formatDateTimeDDMMYYYYHHMM } from '../utils/dateUtils';
import { UserAvatar } from './UserAvatar';

export const BackupRestoreView: React.FC = () => {
  const { currentUser, isAdmin } = useAuth();
  const { refreshData, addToast } = useTasks();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'create' | 'restore' | 'snapshots' | 'storage'>('create');

  // Server state
  const [snapshots, setSnapshots] = useState<BackupSnapshotSummary[]>([]);
  const [liveStats, setLiveStats] = useState<BackupStats | null>(null);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create Snapshot Form State
  const [snapshotName, setSnapshotName] = useState('');
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isDownloadingLive, setIsDownloadingLive] = useState(false);

  // Restore Upload & Validation State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedBackupData, setUploadedBackupData] = useState<BackupDataPayload | null>(null);
  const [validationResult, setValidationResult] = useState<RestoreValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgressStep, setRestoreProgressStep] = useState<string>('');
  const [restoreProgressPercent, setRestoreProgressPercent] = useState<number>(0);

  // Restore Options
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    mode: 'clean_overwrite',
    restoreUsers: true,
    restoreTasks: true,
    restoreFiles: true,
    restoreChat: true,
    restoreMeetings: true,
    restoreAuditLogs: true
  });

  // Modals & Confirmations
  const [selectedSnapshotForRestore, setSelectedSnapshotForRestore] = useState<BackupSnapshotSummary | null>(null);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<BackupSnapshotSummary | null>(null);
  const [restoreSuccessResult, setRestoreSuccessResult] = useState<RestoreResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch backups and live statistics
  const loadBackupsData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getBackups();
      setSnapshots(res.snapshots || []);
      setLiveStats(res.currentLiveStats || null);
      setLastBackupTime(res.lastBackupTimestamp || null);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to load backup data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadBackupsData();
    }
  }, [isAdmin]);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 1. Download live system backup directly as JSON
  const handleDownloadLiveBackup = async () => {
    try {
      setIsDownloadingLive(true);
      const blob = await api.downloadBackup('live');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `taskflow-live-backup-${today}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast('success', 'Full system backup downloaded successfully (including all attachments & data).');
      loadBackupsData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to download live backup.');
    } finally {
      setIsDownloadingLive(false);
    }
  };

  // 2. Download a specific snapshot from server
  const handleDownloadSnapshot = async (snap: BackupSnapshotSummary) => {
    try {
      const blob = await api.downloadBackup(snap.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskflow-snapshot-${snap.id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      addToast('success', `Downloaded snapshot "${snap.name}".`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to download snapshot.');
    }
  };

  // 3. Create named server snapshot
  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreatingSnapshot(true);
      const newBackup = await api.createBackup({
        name: snapshotName.trim() || undefined,
        description: snapshotDesc.trim() || undefined
      });

      addToast('success', `Created server snapshot "${newBackup.metadata.name}" with ${newBackup.metadata.stats.filesCount} attachments.`);
      setSnapshotName('');
      setSnapshotDesc('');
      await loadBackupsData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create server snapshot.');
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  // 4. Handle file selection for restore
  const handleFileSelect = (file: File) => {
    if (!file) return;
    setUploadedFileName(file.name);
    setIsValidating(true);
    setValidationResult(null);
    setUploadedBackupData(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setUploadedBackupData(parsed);

        // Run validation against server API
        const valRes = await api.validateBackup(parsed);
        setValidationResult(valRes);

        if (valRes.valid) {
          addToast('success', `Backup file "${file.name}" validated successfully.`);
        } else {
          addToast('error', `Backup validation failed with ${valRes.errors.length} error(s).`);
        }
      } catch (err: any) {
        setValidationResult({
          valid: false,
          checksumMatches: false,
          version: 'unknown',
          errors: ['Malformed JSON file: ' + (err.message || 'Could not parse JSON')],
          warnings: []
        });
        addToast('error', 'Failed to parse JSON file.');
      } finally {
        setIsValidating(false);
      }
    };
    reader.readAsText(file);
  };

  // 5. Execute Restore
  const handleExecuteRestore = async () => {
    try {
      setIsRestoring(true);
      setRestoreProgressPercent(15);
      setRestoreProgressStep('Verifying payload integrity and checksums...');

      await new Promise((r) => setTimeout(r, 400));
      setRestoreProgressPercent(40);
      setRestoreProgressStep('Restoring core entities (Users, Roles, Tasks, Meetings, Chat Channels)...');

      await new Promise((r) => setTimeout(r, 400));
      setRestoreProgressPercent(75);
      setRestoreProgressStep('Synchronizing Secure Binary File Storage & Attachments...');

      let res: RestoreResult;
      if (selectedSnapshotForRestore) {
        res = await api.restoreBackup({
          snapshotId: selectedSnapshotForRestore.id,
          options: restoreOptions
        });
      } else if (uploadedBackupData) {
        res = await api.restoreBackup({
          backupData: uploadedBackupData,
          options: restoreOptions
        });
      } else {
        throw new Error('No valid backup source selected.');
      }

      setRestoreProgressPercent(100);
      setRestoreProgressStep('Finalizing workspace and reindexing...');
      await new Promise((r) => setTimeout(r, 300));

      setRestoreSuccessResult(res);
      setIsConfirmRestoreOpen(false);
      setSelectedSnapshotForRestore(null);

      // Refresh task context and server data
      await refreshData();
      await loadBackupsData();

      addToast('success', 'Platform successfully restored from backup! All entities and attachments are active.');
    } catch (err: any) {
      addToast('error', err.message || 'Failed to restore platform.');
    } finally {
      setIsRestoring(false);
      setRestoreProgressPercent(0);
      setRestoreProgressStep('');
    }
  };

  // 6. Delete snapshot
  const handleDeleteSnapshot = async () => {
    if (!snapshotToDelete) return;
    try {
      await api.deleteBackupSnapshot(snapshotToDelete.id);
      addToast('success', `Deleted snapshot "${snapshotToDelete.name}".`);
      setSnapshotToDelete(null);
      await loadBackupsData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete snapshot.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-[#141414] rounded-xl border border-[#262626] max-w-lg mx-auto my-12 shadow-xs">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Administrator Access Required</h2>
        <p className="text-sm text-neutral-400 mt-1">
          The Backup &amp; Recovery Center is restricted exclusively to system administrators. Please switch to an Administrator account to manage platform backups and restore operations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] border border-[#262626] rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-400 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Backup &amp; Disaster Recovery Center</h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Admin Secure
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed max-w-2xl">
              Complete state backup and synchronized file preservation for all tasks, projects, meetings, team accounts, message histories, and uploaded binary attachments.
            </p>
          </div>
        </div>

        {/* Quick Refresh & Live Status */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <button
            type="button"
            id="btn-refresh-backups"
            onClick={loadBackupsData}
            disabled={isLoading}
            className="px-3 py-2 bg-[#1f1f1f] hover:bg-[#2a2a2a] text-xs font-semibold text-neutral-300 rounded-lg border border-[#333] transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Refresh system status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            id="btn-quick-download-live"
            onClick={handleDownloadLiveBackup}
            disabled={isDownloadingLive}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingLive ? 'Generating Backup...' : 'Export Live System'}</span>
          </button>
        </div>
      </div>

      {/* Live System State Metric Cards */}
      {liveStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-900/60">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{liveStats.tasksCount}</div>
              <div className="text-[11px] text-neutral-400">Live Tasks</div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-900/60">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{liveStats.usersCount}</div>
              <div className="text-[11px] text-neutral-400">Team Users</div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-violet-950/60 text-violet-400 border border-violet-900/60">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{liveStats.meetingsCount}</div>
              <div className="text-[11px] text-neutral-400">Meetings</div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{liveStats.chatMessagesCount}</div>
              <div className="text-[11px] text-neutral-400">Chat Messages</div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-900/60">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{liveStats.filesCount}</div>
              <div className="text-[11px] text-neutral-400">Uploaded Files ({formatBytes(liveStats.totalFilesSizeBytes)})</div>
            </div>
          </div>

          <div className="bg-[#141414] border border-[#262626] rounded-xl p-3.5 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-950/60 text-teal-400 border border-teal-900/60">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{liveStats.activityLogsCount}</div>
              <div className="text-[11px] text-neutral-400">Audit Entries</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#262626] gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          id="backup-tab-create"
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'create'
              ? 'border-emerald-500 text-emerald-400 bg-[#171717]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#141414]'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Create &amp; Export Backup</span>
        </button>

        <button
          type="button"
          id="backup-tab-restore"
          onClick={() => setActiveTab('restore')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'restore'
              ? 'border-blue-500 text-blue-400 bg-[#171717]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#141414]'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Restore System</span>
        </button>

        <button
          type="button"
          id="backup-tab-snapshots"
          onClick={() => setActiveTab('snapshots')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'snapshots'
              ? 'border-amber-500 text-amber-400 bg-[#171717]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#141414]'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          <span>Server Snapshots Vault ({snapshots.length})</span>
        </button>

        <button
          type="button"
          id="backup-tab-storage"
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-2 cursor-pointer border-b-2 ${
            activeTab === 'storage'
              ? 'border-purple-500 text-purple-400 bg-[#171717]'
              : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#141414]'
          }`}
        >
          <FileArchive className="w-3.5 h-3.5" />
          <span>Attachment Storage Sync</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CREATE & EXPORT BACKUP
          ========================================================================= */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Server Snapshot */}
          <div className="lg:col-span-7 bg-[#141414] border border-[#262626] rounded-xl p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-emerald-400" />
                <span>Create Instant Server Snapshot</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Save an internal server checkpoint to the snapshots repository for instant one-click rollbacks or disaster recovery.
              </p>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Snapshot Name (Optional)
                </label>
                <input
                  type="text"
                  id="input-snapshot-name"
                  placeholder="e.g. Pre-deployment Milestone 3 Snapshot"
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0d0d0d] border border-[#333] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Description / Release Notes
                </label>
                <textarea
                  id="input-snapshot-desc"
                  rows={3}
                  placeholder="Describe the state, release tag, or reason for this backup snapshot..."
                  value={snapshotDesc}
                  onChange={(e) => setSnapshotDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0d0d0d] border border-[#333] rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
              </div>

              <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded-lg text-xs text-neutral-300 space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Snapshot Inclusions Guarantee:</span>
                </div>
                <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-neutral-400 pl-4 list-disc">
                  <li>All Tasks &amp; Subtasks</li>
                  <li>Custom Kanban Statuses</li>
                  <li>Projects &amp; Milestones</li>
                  <li>Team Accounts &amp; Hashes</li>
                  <li>Meetings &amp; Agendas</li>
                  <li>Chat Channels &amp; DMs</li>
                  <li>Binary File Attachments (Base64)</li>
                  <li>Full Audit Logs &amp; XP</li>
                </ul>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  id="btn-submit-create-snapshot"
                  disabled={isCreatingSnapshot}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>{isCreatingSnapshot ? 'Creating Snapshot...' : 'Save Server Snapshot'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Direct File Download Card */}
          <div className="lg:col-span-5 bg-[#141414] border border-[#262626] rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/50 flex items-start gap-3">
                <Download className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-white">Full Portable Backup Package</h3>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Download an autonomous, single-file <span className="font-mono text-blue-300">.json</span> archive that contains the entirety of your workspace.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-neutral-300">
                <div className="flex items-center justify-between py-1.5 border-b border-[#222]">
                  <span className="text-neutral-400">Format:</span>
                  <span className="font-mono text-white">TaskFlow JSON v2.0</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#222]">
                  <span className="text-neutral-400">Embedded Attachments:</span>
                  <span className="font-semibold text-emerald-400">{liveStats?.filesCount || 0} Files Included</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#222]">
                  <span className="text-neutral-400">Payload Integrity:</span>
                  <span className="text-emerald-400 font-mono">SHA-256 Checksum</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#222]">
                  <span className="text-neutral-400">Last System Export:</span>
                  <span className="font-mono text-neutral-300">
                    {lastBackupTime ? formatDateTimeDDMMYYYYHHMM(lastBackupTime) : 'None recorded'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              id="btn-download-standalone-backup"
              onClick={handleDownloadLiveBackup}
              disabled={isDownloadingLive}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingLive ? 'Packaging Live Files...' : 'Download Live System Backup (.json)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: RESTORE SYSTEM
          ========================================================================= */}
      {activeTab === 'restore' && (
        <div className="space-y-6">
          {/* Warning Callout */}
          <div className="p-4 bg-amber-950/40 border border-amber-800/60 rounded-xl flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong className="text-amber-300 block mb-0.5">Administrative Restore Warning:</strong>
              Restoring from a backup will overwrite live platform entities with the data provided in the package. All uploaded binary files and attachments will be synchronized into the secure storage engine.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* File Upload & Inspection Area */}
            <div className="lg:col-span-7 bg-[#141414] border border-[#262626] rounded-xl p-5 sm:p-6 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-blue-400" />
                  <span>Upload &amp; Verify Backup File</span>
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Select or drag a <span className="font-mono text-neutral-300">.json</span> or <span className="font-mono text-neutral-300">.tfbackup</span> file to inspect and run validation.
                </p>
              </div>

              {/* Drag & Drop Box */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#333] hover:border-blue-500/70 bg-[#0d0d0d] hover:bg-[#121212] rounded-xl p-8 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.tfbackup"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <div className="text-sm font-bold text-white mb-1">
                  {uploadedFileName ? uploadedFileName : 'Click to select or drag & drop backup file'}
                </div>
                <p className="text-xs text-neutral-500">Supported format: JSON (TaskFlow v2.0 Backup)</p>
              </div>

              {/* Validation Inspection Card */}
              {isValidating && (
                <div className="p-4 bg-[#1a1a1a] border border-[#333] rounded-xl flex items-center justify-center gap-2 text-xs text-neutral-300">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Validating schema, entities, and SHA-256 integrity checksum...</span>
                </div>
              )}

              {validationResult && (
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    validationResult.valid
                      ? 'bg-emerald-950/30 border-emerald-800/60'
                      : 'bg-rose-950/40 border-rose-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {validationResult.valid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-400" />
                      )}
                      <span className="text-sm font-bold text-white">
                        {validationResult.valid ? 'Backup Valid & Ready for Restore' : 'Validation Errors Found'}
                      </span>
                    </div>

                    {validationResult.checksumMatches && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-mono font-bold">
                        SHA-256 Verified
                      </span>
                    )}
                  </div>

                  {/* Errors & Warnings */}
                  {validationResult.errors.length > 0 && (
                    <div className="space-y-1 text-xs text-rose-300 pl-2">
                      {validationResult.errors.map((err, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{err}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {validationResult.warnings.length > 0 && (
                    <div className="space-y-1 text-xs text-amber-300 pl-2">
                      {validationResult.warnings.map((warn, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{warn}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Preview Stats Grid */}
                  {validationResult.previewStats && (
                    <div className="pt-2 border-t border-[#333] grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                      <div className="p-2 bg-[#121212] rounded-lg">
                        <div className="font-bold text-white">{validationResult.previewStats.tasksCount}</div>
                        <div className="text-[10px] text-neutral-400">Tasks</div>
                      </div>
                      <div className="p-2 bg-[#121212] rounded-lg">
                        <div className="font-bold text-white">{validationResult.previewStats.usersCount}</div>
                        <div className="text-[10px] text-neutral-400">Users</div>
                      </div>
                      <div className="p-2 bg-[#121212] rounded-lg">
                        <div className="font-bold text-white">{validationResult.previewStats.meetingsCount}</div>
                        <div className="text-[10px] text-neutral-400">Meetings</div>
                      </div>
                      <div className="p-2 bg-[#121212] rounded-lg">
                        <div className="font-bold text-white">{validationResult.previewStats.chatMessagesCount}</div>
                        <div className="text-[10px] text-neutral-400">Messages</div>
                      </div>
                      <div className="p-2 bg-[#121212] rounded-lg">
                        <div className="font-bold text-white">{validationResult.previewStats.filesCount}</div>
                        <div className="text-[10px] text-neutral-400">Files</div>
                      </div>
                      <div className="p-2 bg-[#121212] rounded-lg">
                        <div className="font-bold text-emerald-400">
                          {formatBytes(validationResult.previewStats.totalFilesSizeBytes)}
                        </div>
                        <div className="text-[10px] text-neutral-400">Payload</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Restore Options & Action Card */}
            <div className="lg:col-span-5 bg-[#141414] border border-[#262626] rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-400" />
                  <span>Restore Configuration</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <label className="flex items-center justify-between p-2.5 bg-[#0f0f0f] border border-[#262626] rounded-lg cursor-pointer">
                    <span className="text-neutral-300 font-medium">Full Overwrite (Clean State)</span>
                    <input
                      type="radio"
                      name="restore_mode"
                      checked={restoreOptions.mode === 'clean_overwrite'}
                      onChange={() => setRestoreOptions({ ...restoreOptions, mode: 'clean_overwrite' })}
                      className="text-emerald-500 focus:ring-0"
                    />
                  </label>

                  <div className="p-3 bg-[#181818] border border-[#2a2a2a] rounded-lg space-y-2 text-neutral-300">
                    <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Included Modules:
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Tasks &amp; Statuses</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Accounts &amp; Hashes</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Uploaded File Binaries</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Meetings &amp; Chat History</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  id="btn-trigger-restore-uploaded"
                  disabled={!validationResult?.valid || isRestoring}
                  onClick={() => {
                    setSelectedSnapshotForRestore(null);
                    setIsConfirmRestoreOpen(true);
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Execute Platform Restore</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: SERVER SNAPSHOTS VAULT
          ========================================================================= */}
      {activeTab === 'snapshots' && (
        <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 border-b border-[#262626] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-amber-400" />
                <span>Saved Server Snapshots</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Snapshots stored on the server for immediate rollback without needing to upload local files.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>New Snapshot</span>
            </button>
          </div>

          <div className="divide-y divide-[#262626]">
            {snapshots.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">
                No saved snapshots found. Click &quot;New Snapshot&quot; to take a server checkpoint.
              </div>
            ) : (
              snapshots.map((snap) => {
                const isBaseline = snap.id === 'snapshot-baseline';
                return (
                  <div
                    key={snap.id}
                    className="p-4 sm:p-5 hover:bg-[#181818] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">{snap.name}</span>
                        {isBaseline && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                            Baseline Seed
                          </span>
                        )}
                        <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-[#222] text-neutral-300 border border-[#333]">
                          {formatBytes(snap.sizeBytes)}
                        </span>
                      </div>

                      {snap.description && (
                        <p className="text-xs text-neutral-400 line-clamp-1">{snap.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-[11px] text-neutral-400 pt-1">
                        <div className="flex items-center gap-1 font-mono text-neutral-300">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>{formatDateTimeDDMMYYYYHHMM(snap.timestamp)}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                          <span>By {snap.generatedBy?.userName || 'Administrator'}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-2 text-neutral-300 font-mono">
                          <span>{snap.stats.tasksCount} tasks</span>
                          <span>{snap.stats.filesCount} files ({formatBytes(snap.stats.totalFilesSizeBytes)})</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        id={`btn-restore-snap-${snap.id}`}
                        onClick={() => {
                          setSelectedSnapshotForRestore(snap);
                          setIsConfirmRestoreOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        type="button"
                        id={`btn-download-snap-${snap.id}`}
                        onClick={() => handleDownloadSnapshot(snap)}
                        className="p-1.5 bg-[#222] hover:bg-[#2d2d2d] text-neutral-300 hover:text-white rounded-lg border border-[#333] transition-colors cursor-pointer"
                        title="Download snapshot JSON file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {!isBaseline && (
                        <button
                          type="button"
                          id={`btn-delete-snap-${snap.id}`}
                          onClick={() => setSnapshotToDelete(snap)}
                          className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 rounded-lg border border-rose-800/40 transition-colors cursor-pointer"
                          title="Delete snapshot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ATTACHMENT STORAGE SYNC
          ========================================================================= */}
      {activeTab === 'storage' && (
        <div className="bg-[#141414] border border-[#262626] rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileArchive className="w-4 h-4 text-purple-400" />
                <span>Synchronized Binary File Store</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                All task attachments and meeting documents are encoded into backups using base64 payload synchronization, ensuring full file restorability without broken external references.
              </p>
            </div>
            <div className="px-3 py-1 bg-purple-950/60 border border-purple-800/60 text-purple-300 rounded-lg text-xs font-mono font-semibold">
              {liveStats?.filesCount || 0} Files Preserved ({formatBytes(liveStats?.totalFilesSizeBytes || 0)})
            </div>
          </div>

          <div className="p-4 bg-[#0e0e0e] border border-[#262626] rounded-xl space-y-3 text-xs text-neutral-300">
            <div className="font-semibold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Storage Architecture Integrity Rules:</span>
            </div>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              1. <strong>Synchronous Packaging</strong>: Backups embed full file payloads, MIME headers, and SHA-256 validation tokens directly inside the export data object.
            </p>
            <p className="text-neutral-400 leading-relaxed text-[11px]">
              2. <strong>Instant Hydration</strong>: Upon executing a restore, the server-side file store instantly registers all attachment IDs so download and view URLs (<span className="font-mono text-neutral-300">/api/attachments/:id/download</span>) remain fully functional immediately.
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRM RESTORE MODAL
          ========================================================================= */}
      {isConfirmRestoreOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#333] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm System Restore</h3>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  You are about to restore the platform from{' '}
                  <span className="font-bold text-white">
                    {selectedSnapshotForRestore ? `Snapshot "${selectedSnapshotForRestore.name}"` : `Uploaded File "${uploadedFileName}"`}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#0d0d0d] border border-[#262626] rounded-xl space-y-2 text-xs">
              <div className="font-semibold text-neutral-200">Summary of Restore Operation:</div>
              <ul className="text-[11px] text-neutral-400 space-y-1 list-disc pl-4">
                <li>Active task board, tickets, and subtasks will match the backup.</li>
                <li>Chat channels and direct message logs will be restored.</li>
                <li>All binary attachments and uploaded files will be re-indexed.</li>
                <li>An audit log entry will be created under your administrator identity.</li>
              </ul>
            </div>

            {/* Progress indicator during restore */}
            {isRestoring && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-300">
                  <span>{restoreProgressStep}</span>
                  <span className="font-mono font-bold text-emerald-400">{restoreProgressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${restoreProgressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => {
                  setIsConfirmRestoreOpen(false);
                  setSelectedSnapshotForRestore(null);
                }}
                className="px-4 py-2 bg-[#222] hover:bg-[#2a2a2a] text-xs font-semibold text-neutral-300 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                id="btn-confirm-execute-restore"
                disabled={isRestoring}
                onClick={handleExecuteRestore}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-md shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restoring Workspace...' : 'Yes, Overwrite & Restore'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE SNAPSHOT MODAL
          ========================================================================= */}
      {snapshotToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#333] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Delete Server Snapshot?</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Are you sure you want to delete the snapshot <span className="font-bold text-white">&quot;{snapshotToDelete.name}&quot;</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSnapshotToDelete(null)}
                className="px-4 py-2 bg-[#222] hover:bg-[#2a2a2a] text-xs font-semibold text-neutral-300 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-delete-snapshot"
                onClick={handleDeleteSnapshot}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Delete Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RESTORE SUCCESS CELEBRATION MODAL
          ========================================================================= */}
      {restoreSuccessResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-emerald-800/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shadow-lg">
              <Sparkles className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white">Platform Restored Successfully!</h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                All workspace state, user credentials, chat channels, and binary file attachments have been synchronized.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs p-3 bg-[#0f0f0f] border border-[#262626] rounded-xl">
              <div className="p-2">
                <div className="text-base font-bold text-white">{restoreSuccessResult.restoredStats.tasksCount}</div>
                <div className="text-[10px] text-neutral-400">Tasks Restored</div>
              </div>
              <div className="p-2">
                <div className="text-base font-bold text-white">{restoreSuccessResult.restoredStats.filesCount}</div>
                <div className="text-[10px] text-neutral-400">Files Synchronized</div>
              </div>
              <div className="p-2">
                <div className="text-base font-bold text-emerald-400">{restoreSuccessResult.restoredStats.usersCount}</div>
                <div className="text-[10px] text-neutral-400">Users Active</div>
              </div>
            </div>

            <button
              type="button"
              id="btn-close-restore-success"
              onClick={() => setRestoreSuccessResult(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
            >
              Continue Working in Workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
