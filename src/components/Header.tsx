import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Bell,
  Menu,
  PanelLeft,
  PanelLeftClose,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  Laptop,
  Palette,
  Users,
  KeyRound,
  History,
  Database,
  Trash2,
  RotateCcw,
  Check,
  ExternalLink,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { Logo } from './Logo';
import { UserAvatar } from './UserAvatar';
import { RemoveDemoDataModal } from './RemoveDemoDataModal';
import { NotificationDropdown } from './NotificationDropdown';
import { GamificationHeaderPill } from './GamificationHeaderPill';
import { SyncWithListerButton } from './SyncWithListerButton';

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen = true, onToggleSidebar }) => {
  const { currentUser, isAdmin } = useAuth();
  const {
    viewMode,
    setViewMode,
    setIsCreateModalOpen,
    openUserProfile,
    openSettings,
    resetDemoData,
    filters,
    setFilters,
    metricsVisibility,
    toggleMetric
  } = useTasks();
  const { theme, setTheme, setIsThemeEditorOpen, themeConfig } = useTheme();
  const { unreadCount } = useNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const [isSettingsDropdownOpen, setIsSettingsDropdownOpen] = useState(false);
  const [isRemoveDemoModalOpen, setIsRemoveDemoModalOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 sm:h-16 bg-[#121212] dark:bg-[#121212] border-b border-[#262626] px-2.5 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-20 sticky top-0 transition-colors duration-200">
      
      {/* Left: Sidebar Toggle, Brand & Quick Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 pr-2 sm:pr-3">
        {onToggleSidebar && (
          <button
            type="button"
            id="btn-toggle-sidebar"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            className={`h-9 px-2.5 sm:px-2 sm:h-8 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 active:scale-95 ${
              !isSidebarOpen
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50 hover:bg-blue-600/30 hover:text-white shadow-xs'
                : 'bg-[#1e1e1e] text-blue-400 hover:text-white hover:bg-[#282828] border border-blue-500/40'
            }`}
            title={isSidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
          >
            {isSidebarOpen ? (
              <>
                <PanelLeftClose className="w-5 h-5 text-blue-400" />
                <span className="text-[11px] font-bold hidden xs:inline sm:hidden text-neutral-300">Close</span>
              </>
            ) : (
              <>
                <PanelLeft className="w-5 h-5 text-blue-400" />
                <span className="text-[11px] font-bold hidden xs:inline sm:hidden text-neutral-300">Sidebar</span>
              </>
            )}
          </button>
        )}

        {/* Brand logo shown in header: always on mobile (< lg), and on desktop only when sidebar is collapsed */}
        <div
          className={`items-center gap-2 pr-2 border-r border-[#262626] animate-in fade-in duration-150 shrink-0 ${
            isSidebarOpen ? 'flex lg:hidden' : 'flex'
          }`}
        >
          <Logo className="w-7 h-7 drop-shadow-xs shrink-0" />
          <span className="font-bold text-sm text-white tracking-tight hidden xs:inline sm:hidden">TaskFlow</span>
        </div>

        {/* Quick Search */}
        <div className="relative hidden sm:block w-48 md:w-120 lg:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Quick search tasks..."
            className="w-full bg-[#1a1a1a] border border-[#333333] rounded pl-8.5 pr-7 py-1.5 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all h-8"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full hover:bg-neutral-800"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right Controls: Gamification Badge, Settings Dropdown, Notification Bell, Create Task Button, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Two-Way Lister Sync Button */}
        <SyncWithListerButton variant="header" />

        {/* Gamification Badge next to Settings Dropdown Menu */}
        <GamificationHeaderPill />

        {/* Settings Dropdown Menu */}
        <div className="relative" ref={settingsRef}>
          <button
            type="button"
            id="btn-header-settings"
            onClick={() => setIsSettingsDropdownOpen(!isSettingsDropdownOpen)}
            title="Settings & Workspace Tools"
            className={`h-8 px-2.5 rounded flex items-center gap-1.5 border text-xs font-medium transition-all cursor-pointer active:scale-95 group ${
              isSettingsDropdownOpen
                ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-blue-500/10'
                : 'bg-[#1a1a1a] hover:bg-[#262626] text-neutral-200 hover:text-white border-[#333333]'
            }`}
          >
            <Settings className={`w-4 h-4 text-blue-400 transition-transform duration-200 ${isSettingsDropdownOpen ? 'rotate-90' : 'group-hover:rotate-45'}`} />
            <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${isSettingsDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
          </button>

          {/* Mobile backdrop overlay */}
          {isSettingsDropdownOpen && (
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
              onClick={() => setIsSettingsDropdownOpen(false)}
              aria-hidden="true"
            />
          )}

          {isSettingsDropdownOpen && (
            <div className="fixed inset-x-3 top-16 mt-2 sm:mt-2 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:w-80 sm:max-w-xs bg-[#161616] rounded-xl shadow-2xl border border-[#2d2d2d] py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-[#262626] max-h-[calc(100vh-5.5rem)] sm:max-h-[85vh] overflow-y-auto">
              {/* Dropdown Header */}
              <div className="px-3.5 py-2.5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-xs tracking-tight flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-blue-400" />
                    <span>Settings &amp; Tools</span>
                  </h3>
                  <p className="text-[10px] text-neutral-400">Workspace controls &amp; system tools</p>
                </div>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Admin
                    </span>
                  )}
                  {/* Close button for mobile view */}
                  <button
                    type="button"
                    id="btn-close-settings-dropdown-mobile"
                    onClick={() => setIsSettingsDropdownOpen(false)}
                    className="sm:hidden p-1 text-neutral-400 hover:text-white rounded-md hover:bg-[#262626] transition-colors cursor-pointer"
                    title="Close settings menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Theme Mode & Studio Section */}
              <div className="px-3.5 py-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    <span>Theme Mode</span>
                  </span>
                  <span className="text-[10px] text-blue-400 font-semibold capitalize">{theme}</span>
                </div>

                {/* 3-segment switcher */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#1d1d1d] rounded-lg border border-[#2e2e2e]">
                  <button
                    type="button"
                    id="dropdown-theme-light"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-1.5 py-2 sm:py-1 px-2 rounded text-[11px] font-medium transition-all cursor-pointer active:scale-95 ${
                      theme === 'light'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-[#282828]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Light</span>
                  </button>
                  <button
                    type="button"
                    id="dropdown-theme-dark"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-1.5 py-2 sm:py-1 px-2 rounded text-[11px] font-medium transition-all cursor-pointer active:scale-95 ${
                      theme === 'dark'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-[#282828]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark</span>
                  </button>
                  <button
                    type="button"
                    id="dropdown-theme-system"
                    onClick={() => setTheme('system')}
                    className={`flex items-center justify-center gap-1.5 py-2 sm:py-1 px-2 rounded text-[11px] font-medium transition-all cursor-pointer active:scale-95 ${
                      theme === 'system'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-neutral-400 hover:text-white hover:bg-[#282828]'
                    }`}
                  >
                    <Laptop className="w-3.5 h-3.5" />
                    <span>System</span>
                  </button>
                </div>

                {/* Theme Studio Button */}
                <button
                  type="button"
                  id="dropdown-btn-open-theme-studio"
                  onClick={() => {
                    setIsSettingsDropdownOpen(false);
                    setIsThemeEditorOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#1c1c1c] hover:bg-[#242424] text-neutral-300 hover:text-white transition-colors border border-[#2b2b2b] cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Palette className="w-3.5 h-3.5 text-blue-400" />
                      <span
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full ring-1 ring-[#141414]"
                        style={{ backgroundColor: themeConfig?.primaryColor || '#3b82f6' }}
                      />
                    </div>
                    <span className="text-xs font-medium">Theme Studio &amp; Palette</span>
                  </div>
                  <span className="text-[10px] text-blue-400 group-hover:underline">Customize &rarr;</span>
                </button>
              </div>

              {/* Workspace Views & Admin (moved from sidebar) */}
              <div className="py-1">
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Workspace Administration
                </div>

                {/* Team */}
                <button
                  type="button"
                  id="dropdown-nav-team"
                  onClick={() => {
                    setIsSettingsDropdownOpen(false);
                    setViewMode('users');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-[#1f1f1f] transition-colors cursor-pointer group ${
                    viewMode === 'users' ? 'bg-blue-950/40 text-blue-300' : 'text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-white group-hover:text-blue-300 transition-colors">Team</p>
                      <p className="text-[10px] text-neutral-400 truncate">Members, roles &amp; profiles</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 group-hover:text-white transition-colors">&rarr;</span>
                </button>

                {/* Access Manager */}
                <button
                  type="button"
                  id="dropdown-nav-access"
                  onClick={() => {
                    setIsSettingsDropdownOpen(false);
                    setViewMode('access');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-[#1f1f1f] transition-colors cursor-pointer group ${
                    viewMode === 'access' ? 'bg-blue-950/40 text-blue-300' : 'text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-xs text-white group-hover:text-blue-300 transition-colors">Access Manager</p>
                        <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.2 rounded font-semibold uppercase">
                          RBAC
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 truncate">Permissions &amp; role security</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 group-hover:text-white transition-colors">&rarr;</span>
                </button>

                {/* Log & Audit */}
                <button
                  type="button"
                  id="dropdown-nav-audit"
                  onClick={() => {
                    setIsSettingsDropdownOpen(false);
                    setViewMode('audit');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-[#1f1f1f] transition-colors cursor-pointer group ${
                    viewMode === 'audit' ? 'bg-blue-950/40 text-blue-300' : 'text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-teal-950/60 border border-teal-500/30 flex items-center justify-center shrink-0">
                      <History className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-white group-hover:text-blue-300 transition-colors">Log &amp; Audit</p>
                      <p className="text-[10px] text-neutral-400 truncate">Security logs &amp; activity trail</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 group-hover:text-white transition-colors">&rarr;</span>
                </button>

                {/* Backup & Restore */}
                <button
                  type="button"
                  id="dropdown-nav-backup"
                  onClick={() => {
                    setIsSettingsDropdownOpen(false);
                    setViewMode('backup');
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-[#1f1f1f] transition-colors cursor-pointer group ${
                    viewMode === 'backup' ? 'bg-blue-950/40 text-blue-300' : 'text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center shrink-0">
                      <Database className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-white group-hover:text-blue-300 transition-colors">Backup &amp; Restore</p>
                      <p className="text-[10px] text-neutral-400 truncate">JSON snapshots &amp; recovery</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 group-hover:text-white transition-colors">&rarr;</span>
                </button>
              </div>

              {/* Data & Maintenance Section */}
              <div className="py-1">
                <div className="px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Data &amp; Maintenance
                </div>

                <button
                  type="button"
                  id="dropdown-btn-remove-demo-data"
                  onClick={() => {
                    setIsSettingsDropdownOpen(false);
                    setIsRemoveDemoModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-1.5 text-left hover:bg-rose-950/30 transition-colors cursor-pointer group text-rose-300 hover:text-rose-200"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-rose-950/50 border border-rose-800/40 flex items-center justify-center shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs truncate">Remove Demo Data</p>
                      <p className="text-[10px] text-rose-300/70 truncate">Wipe sample tasks &amp; mock projects</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-rose-400 font-semibold">Clean</span>
                </button>

                <button
                  type="button"
                  id="dropdown-btn-reset-demo"
                  onClick={() => {
                    setIsSettingsDropdownOpen(false);
                    resetDemoData();
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-1.5 text-left hover:bg-[#1f1f1f] transition-colors cursor-pointer group text-neutral-300 hover:text-white"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#1f1f1f] border border-[#333] flex items-center justify-center shrink-0">
                      <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs truncate">Reset Demo State</p>
                      <p className="text-[10px] text-neutral-400 truncate">Reload default factory demo data</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 group-hover:text-blue-400">Reload</span>
                </button>
              </div>

              {/* Full Settings Hub Button */}
              <div className="p-2 bg-[#121212]">
                <button
                  type="button"
                  id="dropdown-btn-open-full-settings"
                  onClick={() => {
                    setIsSettingsDropdownOpen(false);
                    openSettings('appearance');
                  }}
                  className="w-full flex items-center justify-between py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5" />
                    <span>Open All Settings Hub</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            id="btn-notifications-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-8 h-8 rounded flex items-center justify-center border transition-all relative cursor-pointer ${
              showNotifications
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                : 'bg-[#1a1a1a] text-neutral-400 hover:text-white border-[#333333] hover:bg-[#262626]'
            }`}
            title="Notifications & Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-[#121212] shadow-sm animate-in zoom-in duration-200">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationDropdown
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
          />
        </div>

        {/* Create Task Action - Gated by RBAC privilege */}
        {(isAdmin || currentUser?.privileges?.canCreateTask !== false) && (
          <button
            type="button"
            id="btn-create-task"
            onClick={() => setIsCreateModalOpen(true)}
            title="Create new task (N)"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold h-8 w-8 sm:w-auto px-2 sm:px-3.5 rounded transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {/* User Profile Avatar Quick Button */}
        {currentUser && (
          <button
            type="button"
            id="header-user-profile-btn"
            onClick={() => openUserProfile(currentUser)}
            className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-[#1f1f1f] border border-transparent hover:border-[#333] transition-all cursor-pointer group"
            title={`View Profile (${currentUser.name})`}
          >
            <UserAvatar
              user={currentUser}
              size="sm"
              showStatusIndicator
              className="ring-1 ring-blue-500/50 group-hover:ring-blue-400 shrink-0"
            />
          </button>
        )}

      </div>

      {/* Remove Demo Data Modal */}
      {isRemoveDemoModalOpen && (
        <RemoveDemoDataModal
          isOpen={isRemoveDemoModalOpen}
          onClose={() => setIsRemoveDemoModalOpen(false)}
        />
      )}
    </header>
  );
};
