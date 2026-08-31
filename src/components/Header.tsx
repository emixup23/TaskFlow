import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Bell,
  Menu,
  Sun,
  Moon,
  Laptop,
  Check,
  PanelLeft,
  PanelLeftClose,
  Palette,
  Sliders,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { GamificationHeaderPill } from './GamificationHeaderPill';
import { Logo } from './Logo';
import { UserAvatar } from './UserAvatar';

interface HeaderProps {
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isSidebarOpen = true, onToggleSidebar }) => {
  const { currentUser, isAdmin } = useAuth();
  const {
    viewMode,
    setIsCreateModalOpen,
    openUserProfile,
    filters,
    setFilters,
    metricsVisibility,
    toggleMetric
  } = useTasks();
  const { theme, isDark, setTheme, toggleDarkMode, setIsThemeEditorOpen, themeConfig } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getViewTitle = () => {
    switch (viewMode) {
      case 'kanban':
        return 'Team Workflow';
      case 'tickets':
        return 'Ticket System & Helpdesk Queue';
      case 'list':
        return 'Task Inventory & Table';
      case 'timeline':
        return 'Milestones & Timeline';
      case 'graph':
        return 'Team Relationship & Dependency Graph';
      case 'chat':
        return 'Team Chat & Collaboration';
      case 'dashboard':
        return 'Executive Analytics';
      case 'users':
        return 'Team Directory & Access Management';
      case 'audit':
        return 'Activity & Security Audit Trail';
      case 'rewards':
        return 'Gamification & Rewards Hub';
      default:
        return 'Team Workflow';
    }
  };

  const getViewSubtitle = () => {
    switch (viewMode) {
      case 'kanban':
        return 'Workflow Board';
      case 'tickets':
        return 'Incident & Request Tracking';
      case 'list':
        return 'Table View';
      case 'timeline':
        return 'Deadlines';
      case 'graph':
        return 'Tasks, Tags & User Relationships';
      case 'chat':
        return 'Channels, Groups & Direct Messages';
      case 'dashboard':
        return 'Admin Only';
      case 'users':
        return 'User Profiles & Permissions';
      case 'audit':
        return 'Audit Logs';
      case 'rewards':
        return 'Leaderboard & XP';
      default:
        return 'Sprint Active';
    }
  };

  return (
    <header className="h-16 bg-[#121212] dark:bg-[#121212] border-b border-[#262626] px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 z-20 sticky top-0 transition-colors duration-200">
      
      {/* Left: Sidebar Toggle + (Brand if sidebar is hidden) + View Title & Badge */}
      <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            id="btn-toggle-sidebar"
            onClick={onToggleSidebar}
            className={`p-2 rounded transition-all cursor-pointer flex items-center justify-center ${
              !isSidebarOpen
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 hover:bg-blue-600/25 hover:text-white'
                : 'text-neutral-400 hover:text-white hover:bg-[#222222]'
            }`}
            title={isSidebarOpen ? 'Collapse sidebar (Ctrl+B)' : 'Expand sidebar (Ctrl+B)'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
          </button>
        )}

        {/* Brand logo shown in header when sidebar is collapsed */}
        {!isSidebarOpen && (
          <div className="hidden sm:flex items-center gap-2.5 pr-2.5 border-r border-[#262626] animate-in fade-in duration-150">
            <Logo className="w-7 h-7 rounded shadow-xs" />
            <span className="text-white font-bold text-sm tracking-tight">TaskFlow</span>
          </div>
        )}

        <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate tracking-tight">
          {getViewTitle()} 
        </h1>

        <span className="hidden sm:inline-flex text-xs bg-[#1e1e1e] text-neutral-300 px-2.5 py-1 rounded border border-[#333333] font-medium">
          {getViewSubtitle()}
        </span>
      </div>

      {/* Right Controls: Search, Theme Toggle, Notification Bell, Create Task Button */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        
        {/* Gamification Level & Streak Header Pill */}
        <GamificationHeaderPill />

        {/* Quick Search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            placeholder="Quick search..."
            className="w-44 lg:w-60 bg-[#1a1a1a] border border-[#333333] rounded px-4 py-1.5 text-xs sm:text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* KPI Metrics Strip Toggle Button */}
        <button
          type="button"
          id="btn-toggle-metrics-strip"
          onClick={() => toggleMetric('showMetricsBar')}
          title={metricsVisibility.showMetricsBar ? 'Hide KPI Metrics Strip' : 'Show KPI Metrics Strip'}
          className={`w-8 h-8 rounded flex items-center justify-center border transition-all cursor-pointer shadow-xs ${
            metricsVisibility.showMetricsBar
              ? 'bg-blue-600/20 border-blue-500/40 text-blue-400 hover:bg-blue-600/30'
              : 'bg-[#1a1a1a] border-[#333333] text-neutral-400 hover:text-white hover:bg-[#262626]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        {/* Theme Studio & Palette Button */}
        <button
          type="button"
          id="btn-open-theme-studio"
          onClick={() => setIsThemeEditorOpen(true)}
          title={`Theme Studio (Current: ${themeConfig.name || 'Custom'})`}
          className="w-8 h-8 rounded bg-[#1a1a1a] flex items-center justify-center text-neutral-300 hover:text-white border border-[#333333] hover:bg-[#262626] transition-all cursor-pointer shadow-xs relative group"
        >
          <Palette className="w-4 h-4 text-neutral-300 group-hover:text-blue-400 transition-colors" />
          <span
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-[#121212]"
            style={{ backgroundColor: themeConfig.primaryColor }}
          />
        </button>

        {/* Dark Mode / Theme Selector Button */}
        <div className="relative" ref={themeMenuRef}>
          <button
            type="button"
            id="btn-theme-toggle"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            title={`Current mode: ${theme} (click to switch)`}
            className="w-8 h-8 rounded bg-[#1a1a1a] flex items-center justify-center text-neutral-300 hover:text-white border border-[#333333] hover:bg-[#262626] transition-all cursor-pointer shadow-xs"
          >
            {isDark ? (
              <Moon className="w-4 h-4 text-blue-400 fill-blue-400/20" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            )}
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-[#181818] rounded shadow-xl border border-[#333333] py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Theme Preference
              </div>

              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#262626] transition-colors ${
                  theme === 'light'
                    ? 'text-blue-400 font-semibold bg-blue-950/40'
                    : 'text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Theme</span>
                </div>
                {theme === 'light' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#262626] transition-colors ${
                  theme === 'dark'
                    ? 'text-blue-400 font-semibold bg-blue-950/40'
                    : 'text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dark Theme</span>
                </div>
                {theme === 'dark' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('system');
                  setShowThemeMenu(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#262626] transition-colors ${
                  theme === 'system'
                    ? 'text-blue-400 font-semibold bg-blue-950/40'
                    : 'text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Laptop className="w-3.5 h-3.5 text-neutral-400" />
                  <span>System Default</span>
                </div>
                {theme === 'system' && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="my-1 border-t border-[#262626]" />

              {/* Open Theme Editor from Menu */}
              <button
                type="button"
                id="btn-menu-open-theme-editor"
                onClick={() => {
                  setShowThemeMenu(false);
                  setIsThemeEditorOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#262626] text-blue-400 font-medium transition-colors cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>Open Theme Studio...</span>
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded bg-[#1a1a1a] flex items-center justify-center text-neutral-400 hover:text-white border border-[#333333] cursor-pointer hover:bg-[#262626] transition-colors relative"
            title="Team Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-[#181818] rounded shadow-xl border border-[#333333] p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between border-b border-[#2b2b2b] pb-2">
                <span className="font-bold text-white">Team Notifications</span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded">
                  Live
                </span>
              </div>
              <div className="space-y-1.5 text-neutral-300">
                <div className="p-2 rounded bg-[#1f1f1f] border border-[#2b2b2b]">
                  <p className="font-semibold text-white">Sprint Milestone Q4</p>
                  <p className="text-[11px] text-neutral-400">3 tasks completed in QA Review.</p>
                </div>
                <div className="p-2 rounded bg-[#1f1f1f] border border-[#2b2b2b]">
                  <p className="font-semibold text-white">RBAC Enforcement Active</p>
                  <p className="text-[11px] text-neutral-400">
                    Logged in as <strong>{currentUser?.name}</strong> ({currentUser?.role}).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Task Action - Gated by RBAC privilege */}
        {(isAdmin || currentUser?.privileges?.canCreateTask !== false) && (
          <button
            type="button"
            id="btn-create-task"
            onClick={() => setIsCreateModalOpen(true)}
            title="Create new task (N)"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold px-3 sm:px-3.5 py-1.5 rounded transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline"></span>
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

    </header>
  );
};
