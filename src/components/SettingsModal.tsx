import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Palette,
  Sun,
  Moon,
  Laptop,
  Users,
  KeyRound,
  History,
  Database,
  Trash2,
  RotateCcw,
  Check,
  Shield,
  Download,
  Plus,
  ExternalLink,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Search,
  ChevronRight,
  Type,
  Square,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useTheme, FONT_FAMILY_MAP, RADIUS_MAP, PRESET_THEMES } from '../context/ThemeContext';
import { SettingsTab, FontFamilyOption, RadiusOption, User } from '../types';
import { UserAvatar } from './UserAvatar';
import { RemoveDemoDataModal } from './RemoveDemoDataModal';
import { formatDateTimeDDMMYYYYHHMM } from '../utils/dateUtils';

interface AccentColorItem {
  name: string;
  hex: string;
}

const POPULAR_ACCENTS: AccentColorItem[] = [
  { name: 'Electric Blue', hex: '#3b82f6' },
  { name: 'Sky Cyan', hex: '#0ea5e9' },
  { name: 'Indigo Violet', hex: '#6366f1' },
  { name: 'Neon Purple', hex: '#a855f7' },
  { name: 'Neon Pink', hex: '#ec4899' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Industrial Amber', hex: '#f59e0b' },
  { name: 'Cobalt Sapphire', hex: '#2563eb' },
  { name: 'Monochrome Slate', hex: '#64748b' }
];

export const SettingsModal: React.FC = () => {
  const { currentUser, users, isAdmin } = useAuth();
  const {
    isSettingsModalOpen,
    closeSettings,
    settingsTab,
    setSettingsTab,
    setViewMode,
    openUserProfile,
    setIsUserModalOpen,
    tasks,
    projects,
    activityLogs,
    resetDemoData,
    metricsVisibility,
    toggleMetric,
    addToast
  } = useTasks();

  const {
    theme,
    isDark,
    themeConfig,
    setTheme,
    setIsThemeEditorOpen,
    applyPreset,
    updateThemeConfig
  } = useTheme();

  // Local state for modals & search
  const [isRemoveDemoModalOpen, setIsRemoveDemoModalOpen] = useState(false);
  const [isResettingSeed, setIsResettingSeed] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsModalOpen && !isRemoveDemoModalOpen) {
        closeSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsModalOpen, isRemoveDemoModalOpen, closeSettings]);

  if (!isSettingsModalOpen) return null;

  const handleNavigateToView = (mode: 'users' | 'access' | 'audit' | 'backup') => {
    setViewMode(mode);
    closeSettings();
  };

  const handleOpenThemeStudio = () => {
    closeSettings();
    setIsThemeEditorOpen(true);
  };

  const handleOpenUserModal = () => {
    closeSettings();
    setIsUserModalOpen(true);
  };

  const handleConfirmResetSeed = async () => {
    if (!isAdmin) return;
    try {
      setIsResettingSeed(true);
      await resetDemoData();
      setShowResetConfirm(false);
      addToast('success', 'Workspace reset to initial factory seed successfully.');
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to reset workspace seed.');
    } finally {
      setIsResettingSeed(false);
    }
  };

  const handleExportLiveBackup = () => {
    try {
      const backupData = {
        metadata: {
          app: 'TaskFlow',
          version: '2.5.0',
          exportedAt: new Date().toISOString(),
          exportedBy: currentUser?.name || 'Admin',
          counts: {
            tasks: tasks.length,
            projects: projects.length,
            users: users.length,
            activityLogs: activityLogs.length
          }
        },
        data: {
          tasks,
          projects,
          users,
          activityLogs
        }
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `taskflow-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('success', 'Backup JSON file generated and downloaded.');
    } catch (e) {
      addToast('error', 'Failed to export backup JSON.');
    }
  };

  const handleExportAuditCsv = () => {
    try {
      const headers = ['Timestamp', 'Actor', 'Action', 'Details'];
      const rows = activityLogs.map((log) => [
        `"${log.timestamp}"`,
        `"${log.userName || log.userId || ''}"`,
        `"${log.action}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('success', 'Audit trail exported to CSV.');
    } catch {
      addToast('error', 'Failed to export audit CSV.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!teamSearch.trim()) return true;
    const q = teamSearch.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.role && u.role.toLowerCase().includes(q)) || (u.department && u.department.toLowerCase().includes(q));
  });

  const canManageUsers = isAdmin || Boolean(currentUser?.privileges?.canManageUsers);
  const canManageRoles = isAdmin || Boolean(currentUser?.privileges?.canManageRoles);
  const canViewAuditLogs = isAdmin || Boolean(currentUser?.privileges?.canViewAuditLogs);

  const TABS: {
    id: SettingsTab;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge?: string;
    isRestricted?: boolean;
  }[] = [
    {
      id: 'appearance',
      label: 'Appearance',
      sublabel: 'Theme Mode & Studio',
      icon: <Palette className="w-4 h-4" />
    },
    {
      id: 'team',
      label: 'Team Directory',
      sublabel: `${users.length} members & invites`,
      icon: <Users className="w-4 h-4" />
    },
    {
      id: 'access',
      label: 'Access Manager',
      sublabel: 'Roles & RBAC matrix',
      icon: <KeyRound className="w-4 h-4" />,
      badge: 'RBAC'
    },
    {
      id: 'audit',
      label: 'Log & Audit',
      sublabel: `${activityLogs.length} events logged`,
      icon: <History className="w-4 h-4" />
    },
    {
      id: 'backup',
      label: 'Backup & Restore',
      sublabel: 'Disaster recovery',
      icon: <Database className="w-4 h-4" />,
      badge: 'Admin'
    },
    {
      id: 'data',
      label: 'Workspace Data',
      sublabel: 'Demo data & factory reset',
      icon: <Trash2 className="w-4 h-4 text-rose-400" />,
      badge: 'Danger'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-5xl h-[88vh] max-h-[780px] bg-[#121212] border border-[#2a2a2a] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-200 animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-hub-title"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#262626] bg-[#141414] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="settings-hub-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Application Settings &amp; Administration
                </h2>
                <span className="text-[10px] bg-[#222] text-neutral-400 border border-[#333] px-2 py-0.5 rounded font-mono">
                  All-in-One Hub
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Manage theme modes, team directory, access permissions, audit trail, and workspace state.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-close-settings-modal"
            onClick={closeSettings}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#222] transition-colors cursor-pointer"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar Tabs + Active Content */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Tabs Sidebar */}
          <div className="w-full sm:w-64 border-b sm:border-b-0 sm:border-r border-[#262626] bg-[#0e0e0e] p-3 shrink-0 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-y-auto">
            <div className="hidden sm:block text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 py-1.5 mb-1">
              Settings Navigation
            </div>

            {TABS.map((tab) => {
              const isActive = settingsTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`settings-tab-btn-${tab.id}`}
                  onClick={() => setSettingsTab(tab.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-300 border border-blue-500/30 font-semibold shadow-xs'
                      : 'text-neutral-400 hover:bg-[#181818] hover:text-neutral-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={isActive ? 'text-blue-400' : 'text-neutral-400'}>
                      {tab.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-neutral-200">{tab.label}</div>
                      <div className="truncate text-[10px] text-neutral-400">{tab.sublabel}</div>
                    </div>
                  </div>

                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider shrink-0 ${
                        tab.badge === 'Danger'
                          ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                          : tab.badge === 'Admin'
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                          : 'bg-[#222] text-neutral-300 border border-[#333]'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Admin Badge at bottom of sidebar */}
            <div className="hidden sm:mt-auto sm:block p-3 rounded-xl bg-[#141414] border border-[#262626] text-xs text-neutral-400 space-y-1">
              <div className="flex items-center gap-1.5 text-neutral-300 font-semibold text-[11px]">
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Active User</span>
              </div>
              <p className="text-[11px] truncate text-white font-medium">{currentUser?.name}</p>
              <p className="text-[10px] text-neutral-400 capitalize">Role: {currentUser?.role}</p>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#121212] space-y-6">
            
            {/* 1. APPEARANCE TAB */}
            {settingsTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-400" />
                    <span>Theme Mode &amp; Appearance</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Customize your visual environment, light and dark themes, accent highlights, and typography.
                  </p>
                </div>

                {/* Theme Mode Selector Cards */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    Theme Mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Light Mode Card */}
                    <button
                      type="button"
                      id="btn-settings-theme-light"
                      onClick={() => setTheme('light')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        theme === 'light'
                          ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30'
                          : 'bg-[#181818] border-[#2a2a2a] hover:bg-[#202020]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                          <Sun className="w-4 h-4" />
                        </div>
                        {theme === 'light' && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Light Mode</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Clean, high-contrast day palette</div>
                      </div>
                    </button>

                    {/* Dark Mode Card */}
                    <button
                      type="button"
                      id="btn-settings-theme-dark"
                      onClick={() => setTheme('dark')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        theme === 'dark'
                          ? 'bg-blue-950/25 border-blue-500/60 ring-1 ring-blue-500/30'
                          : 'bg-[#181818] border-[#2a2a2a] hover:bg-[#202020]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400">
                          <Moon className="w-4 h-4" />
                        </div>
                        {theme === 'dark' && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Dark Mode</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Eye-friendly deep obsidian night canvas</div>
                      </div>
                    </button>

                    {/* System Mode Card */}
                    <button
                      type="button"
                      id="btn-settings-theme-system"
                      onClick={() => setTheme('system')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        theme === 'system'
                          ? 'bg-indigo-950/25 border-indigo-500/60 ring-1 ring-indigo-500/30'
                          : 'bg-[#181818] border-[#2a2a2a] hover:bg-[#202020]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="p-2 rounded-lg bg-neutral-700/30 text-neutral-300">
                          <Laptop className="w-4 h-4" />
                        </div>
                        {theme === 'system' && (
                          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">System Default</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">Syncs automatically with your OS preference</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Accent Color Swatches */}
                <div className="space-y-2.5 pt-2 border-t border-[#262626]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Primary Accent Color
                    </label>
                    <span className="text-[11px] font-mono text-neutral-400">{themeConfig.primaryColor}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {POPULAR_ACCENTS.map((item) => {
                      const isSelected = themeConfig.primaryColor?.toLowerCase() === item.hex.toLowerCase();
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => updateThemeConfig({ primaryColor: item.hex })}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-[#222] border-neutral-400 ring-1 ring-white/20'
                              : 'bg-[#181818] border-[#2a2a2a] hover:bg-[#202020]'
                          }`}
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-1 ring-black/40"
                            style={{ backgroundColor: item.hex }}
                          />
                          <span className="text-xs text-neutral-200 truncate">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Typography Font Family */}
                <div className="space-y-2.5 pt-2 border-t border-[#262626]">
                  <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Interface Typography</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(FONT_FAMILY_MAP) as FontFamilyOption[]).map((key) => {
                      const isSelected = themeConfig.fontFamily === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateThemeConfig({ fontFamily: key })}
                          className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-600/15 border-blue-500/50 text-blue-300 font-semibold'
                              : 'bg-[#181818] border-[#2a2a2a] text-neutral-300 hover:bg-[#202020]'
                          }`}
                        >
                          <span>{FONT_FAMILY_MAP[key].label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Launch Theme Studio Button */}
                <div className="pt-3 border-t border-[#262626] flex items-center justify-between bg-[#161616] p-4 rounded-xl border border-[#2a2a2a]">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      <span>Advanced Theme Studio</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Fine-tune border radii, contrast tokens, background saturation, and export theme JSONs.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="btn-settings-open-theme-studio"
                    onClick={handleOpenThemeStudio}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Launch Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. TEAM DIRECTORY TAB */}
            {settingsTab === 'team' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-400" />
                      <span>Team Directory &amp; Members</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Overview of registered organization members, their roles, and status indicators.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {canManageUsers && (
                      <button
                        type="button"
                        id="btn-settings-invite-member"
                        onClick={handleOpenUserModal}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Member</span>
                      </button>
                    )}

                    <button
                      type="button"
                      id="btn-settings-open-full-team-view"
                      onClick={() => handleNavigateToView('users')}
                      className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#2a2a2a] text-neutral-200 border border-[#333] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Full Directory View</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    placeholder="Search by name, email, or role..."
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Team Members List */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden divide-y divide-[#222]">
                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      No team members found matching &ldquo;{teamSearch}&rdquo;.
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-[#181818] transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar user={user} size="md" showStatusIndicator />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{user.name}</span>
                              {user.id === currentUser?.id && (
                                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-semibold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-neutral-400 truncate">{user.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] bg-[#222] text-neutral-300 border border-[#333] px-2 py-0.5 rounded capitalize font-medium">
                            {user.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              closeSettings();
                              openUserProfile(user);
                            }}
                            className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-[#262626] transition-colors text-xs font-medium cursor-pointer"
                            title="View Member Profile"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 3. ACCESS MANAGER TAB */}
            {settingsTab === 'access' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-indigo-400" />
                      <span>Access Manager &amp; RBAC Roles</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Role-based access control policies, privilege gates, and permission inheritance.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="btn-settings-open-access-view"
                    onClick={() => handleNavigateToView('access')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Full Access Manager View</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-[#161616] border border-[#262626] space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Enforced Privilege Categories</span>
                    </div>
                    <ul className="text-[11px] text-neutral-300 space-y-1.5 pl-4 list-disc">
                      <li><strong>Task &amp; Workflow:</strong> Creation, status transition, subtasks &amp; deletion gates.</li>
                      <li><strong>Governance:</strong> Member invite, role updates, and system settings access.</li>
                      <li><strong>Audit &amp; Logs:</strong> Compliance trail visibility and log export rights.</li>
                      <li><strong>Disaster Recovery:</strong> Backup snapshot generation and restoration controls.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-[#161616] border border-[#262626] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Current User Privileges</span>
                    </div>
                    <div className="text-[11px] text-neutral-300 space-y-1">
                      <p>Active Role: <strong className="text-white capitalize">{currentUser?.role}</strong></p>
                      <p>Can Manage Users: <strong>{canManageUsers ? 'Yes' : 'Restricted'}</strong></p>
                      <p>Can Manage Roles: <strong>{canManageRoles ? 'Yes' : 'Restricted'}</strong></p>
                      <p>Can View Audit Logs: <strong>{canViewAuditLogs ? 'Yes' : 'Restricted'}</strong></p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between gap-3">
                  <div className="text-xs text-neutral-300">
                    <strong className="text-indigo-300">Need to create custom roles or edit the permission matrix?</strong>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Open the full Access Manager view to create custom security tiers and inspect user counts per role.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleNavigateToView('access')}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    Open Matrix
                  </button>
                </div>
              </div>
            )}

            {/* 4. LOG & AUDIT TAB */}
            {settingsTab === 'audit' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <History className="w-4 h-4 text-emerald-400" />
                      <span>Security Trail &amp; System Logs</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Immutable record of logins, task modifications, role changes, and administrative actions.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-settings-export-audit"
                      onClick={handleExportAuditCsv}
                      className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#2a2a2a] text-neutral-200 border border-[#333] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      type="button"
                      id="btn-settings-open-audit-view"
                      onClick={() => handleNavigateToView('audit')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Full Audit Trail View</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Recent Logs List */}
                <div className="bg-[#141414] border border-[#262626] rounded-xl overflow-hidden divide-y divide-[#222]">
                  {activityLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="p-3 flex items-start justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white truncate">{log.userName || 'System'}</span>
                          <span className="text-[10px] font-mono bg-[#222] text-neutral-400 px-1.5 py-0.2 rounded">
                            {log.action}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-neutral-400 shrink-0 font-mono">
                        {formatDateTimeDDMMYYYYHHMM(log.timestamp)}
                      </span>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      No activity logs recorded yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. BACKUP & RESTORE TAB */}
            {settingsTab === 'backup' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Backup &amp; Disaster Recovery</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Export live workspace backups, manage system restore points, and protect critical data.
                    </p>
                  </div>

                  <button
                    type="button"
                    id="btn-settings-open-backup-view"
                    onClick={() => handleNavigateToView('backup')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <span>Open Recovery Center</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Live Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-[#161616] border border-[#262626] rounded-xl text-center">
                    <div className="text-lg font-bold text-blue-400 font-mono">{tasks.length}</div>
                    <div className="text-[11px] text-neutral-400">Active Tasks</div>
                  </div>
                  <div className="p-3.5 bg-[#161616] border border-[#262626] rounded-xl text-center">
                    <div className="text-lg font-bold text-emerald-400 font-mono">{projects.length}</div>
                    <div className="text-[11px] text-neutral-400">Total Projects</div>
                  </div>
                  <div className="p-3.5 bg-[#161616] border border-[#262626] rounded-xl text-center">
                    <div className="text-lg font-bold text-violet-400 font-mono">{users.length}</div>
                    <div className="text-[11px] text-neutral-400">Team Users</div>
                  </div>
                </div>

                {/* Instant Live Backup Download Card */}
                <div className="p-4 rounded-xl bg-[#161616] border border-[#2a2a2a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Download className="w-3.5 h-3.5 text-blue-400" />
                      <span>Download Live JSON Snapshot</span>
                    </h4>
                    <p className="text-[11px] text-neutral-400 mt-0.5 max-w-md">
                      Instantly bundles current tasks, projects, users, and audit records into an exportable JSON payload.
                    </p>
                  </div>
                  <button
                    type="button"
                    id="btn-settings-download-backup"
                    onClick={handleExportLiveBackup}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Backup</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6. WORKSPACE DATA TAB (Remove Demo Data & Reset Demo State) */}
            {settingsTab === 'data' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Workspace Data &amp; Demo State Controls</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Clear out pre-seeded demo records for clean production usage, or reset back to default initial seed.
                  </p>
                </div>

                {!isAdmin && (
                  <div className="p-3.5 bg-amber-950/30 border border-amber-800/40 rounded-xl flex items-center gap-2.5 text-amber-300 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Administrator privileges are required to clear or reset demo datasets.</span>
                  </div>
                )}

                {/* Option 1: Remove Demo Data */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#161616] border border-rose-900/40 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-400 shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Remove Demo Data</h4>
                        <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                          Permanently wipe all pre-seeded sample tasks, demo projects, scheduled meetings, mock chats, and logs.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#121212] border border-[#262626] rounded-xl p-3 text-[11px] text-neutral-300 space-y-1">
                    <div className="text-emerald-400 font-semibold">What is preserved:</div>
                    <p>Your current administrator account ({currentUser?.name}), column status definitions, and theme configurations will remain intact.</p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      id="btn-settings-trigger-remove-demo"
                      onClick={() => setIsRemoveDemoModalOpen(true)}
                      disabled={!isAdmin}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Demo Data...</span>
                    </button>
                  </div>
                </div>

                {/* Option 2: Reset Demo State (Reload Factory Seed) */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#161616] border border-blue-900/40 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 shrink-0">
                        <RotateCcw className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Reset Demo State (Factory Seed)</h4>
                        <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                          Restore the application to the original factory seed dataset with sample projects, kanban tasks, and demo users.
                        </p>
                      </div>
                    </div>
                  </div>

                  {showResetConfirm ? (
                    <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-700/60 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>Are you sure you want to reload the factory seed?</span>
                      </div>
                      <p className="text-[11px] text-neutral-300">
                        This will overwrite custom tasks and reload the initial demo workspace.
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowResetConfirm(false)}
                          disabled={isResettingSeed}
                          className="px-3 py-1.5 rounded-lg bg-[#222] hover:bg-[#2a2a2a] text-neutral-300 text-xs font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          id="btn-settings-confirm-reset-seed"
                          onClick={handleConfirmResetSeed}
                          disabled={isResettingSeed}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                        >
                          {isResettingSeed ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Resetting...</span>
                            </>
                          ) : (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Confirm Reset</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        id="btn-settings-trigger-reset-seed"
                        onClick={() => setShowResetConfirm(true)}
                        disabled={!isAdmin}
                        className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Demo State...</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Embedded Remove Demo Data Modal */}
      <RemoveDemoDataModal
        isOpen={isRemoveDemoModalOpen}
        onClose={() => setIsRemoveDemoModalOpen(false)}
      />
    </div>
  );
};
