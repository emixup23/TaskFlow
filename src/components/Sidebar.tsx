import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  Ticket,
  Table as TableIcon,
  Calendar,
  BarChart3,
  History,
  Trophy,
  Sliders,
  Users,
  Shield,
  RotateCcw,
  Sparkles,
  ChevronRight,
  UserCheck,
  X,
  Plus,
  Moon,
  Sun,
  Laptop,
  PanelLeftClose,
  Network,
  Briefcase,
  FolderPlus,
  Settings,
  Crown,
  Palette,
  MessageSquare,
  User as UserIcon,
  Camera,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useTheme } from '../context/ThemeContext';
import { useChat } from '../context/ChatContext';
import { ViewMode, Project } from '../types';
import { Logo } from './Logo';
import { UserAvatar } from './UserAvatar';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const { currentUser, users, switchUser, isAdmin } = useAuth();
  const {
    viewMode,
    setViewMode,
    projects,
    activeProjectId,
    setActiveProjectId,
    setIsProjectModalOpen,
    setEditingProject,
    setIsCreateModalOpen,
    setIsStatusManagerOpen,
    setIsUserModalOpen,
    openUserProfile,
    resetDemoData,
    tasks
  } = useTasks();
  const { theme, setTheme, isDark, toggleDarkMode, setIsThemeEditorOpen, themeConfig } = useTheme();
  const { totalUnreadCount } = useChat();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const canManageProjects = isAdmin || Boolean(currentUser?.privileges?.canManageProjects);
  const canManageUsers = isAdmin || Boolean(currentUser?.privileges?.canManageUsers);
  const canManageStatuses = isAdmin || Boolean(currentUser?.privileges?.canManageStatuses);
  const canViewAuditLogs = isAdmin || Boolean(currentUser?.privileges?.canViewAuditLogs);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter navigation items strictly based on user permissions
  const allNavItems: {
    mode: ViewMode;
    label: string;
    icon: React.ReactNode;
    colorDot: string;
    isAllowed: boolean;
    adminBadge?: boolean;
    unreadCount?: number;
  }[] = [
    { mode: 'kanban', label: 'Workflow', icon: <LayoutGrid className="w-4 h-4" />, colorDot: 'bg-blue-400', isAllowed: true },
    { mode: 'tickets', label: 'Ticket System', icon: <Ticket className="w-4 h-4" />, colorDot: 'bg-amber-400', isAllowed: true },
    { mode: 'list', label: 'Table List', icon: <TableIcon className="w-4 h-4" />, colorDot: 'bg-sky-400', isAllowed: true },
    { mode: 'timeline', label: 'Timeline', icon: <Calendar className="w-4 h-4" />, colorDot: 'bg-amber-400', isAllowed: true },
    { mode: 'graph', label: 'Graph', icon: <Network className="w-4 h-4" />, colorDot: 'bg-indigo-400', isAllowed: true },
    { mode: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" />, colorDot: 'bg-emerald-400', isAllowed: true, unreadCount: totalUnreadCount },
    { mode: 'rewards', label: 'Rewards', icon: <Trophy className="w-4 h-4" />, colorDot: 'bg-amber-400', isAllowed: true },
    { mode: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" />, colorDot: 'bg-blue-400', isAllowed: isAdmin || canManageUsers, adminBadge: true },
    { mode: 'users', label: 'Team', icon: <Users className="w-4 h-4" />, colorDot: 'bg-emerald-400', isAllowed: isAdmin || canManageUsers, adminBadge: true },
    { mode: 'audit', label: 'Log & Audit', icon: <History className="w-4 h-4" />, colorDot: 'bg-emerald-400', isAllowed: canViewAuditLogs }
  ];

  const visibleNavItems = allNavItems.filter((item) => item.isAllowed);

  const handleNavClick = (mode: ViewMode) => {
    setViewMode(mode);
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  const handleOpenNewProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  const handleEditProject = (e: React.MouseEvent, proj: Project) => {
    e.stopPropagation();
    setEditingProject(proj);
    setIsProjectModalOpen(true);
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 bg-[#0d0d0d] text-neutral-300 flex flex-col shrink-0 border-r border-[#262626] transition-all duration-200 ease-in-out ${
          isOpen
            ? 'w-[270px] translate-x-0 opacity-100'
            : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0 lg:border-r-0 overflow-hidden opacity-0 pointer-events-none'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#262626] gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Logo className="w-8 h-8 rounded shadow-md shadow-blue-600/20 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-base tracking-tight truncate">TaskFlow</span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1.5 py-0.2 rounded font-semibold uppercase shrink-0">
                  v2.5
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 tracking-wide font-medium truncate">Project Management Tool</p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              id="btn-sidebar-close-toggle"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-[#222222] transition-colors shrink-0 cursor-pointer"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="w-4 h-4 hidden lg:block" />
              <X className="w-4 h-4 lg:hidden" />
            </button>
          )}
        </div>

        {/* Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          
          {/* Main Workspace Views Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 py-1.5">
              Workspace Views
            </div>

            {visibleNavItems.map((item) => {
              const isActive = viewMode === item.mode;

              return (
                <button
                  key={item.mode}
                  type="button"
                  id={`sidebar-nav-${item.mode}`}
                  onClick={() => handleNavClick(item.mode)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#1e1e1e] text-white shadow-xs font-semibold border border-[#333333]'
                      : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-1.5 h-1.5 rounded shrink-0 transition-colors ${
                        isActive ? item.colorDot : 'bg-neutral-600'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.unreadCount !== undefined && item.unreadCount > 0 && (
                      <span className="text-[10px] bg-blue-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                        {item.unreadCount}
                      </span>
                    )}

                    {item.adminBadge && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-semibold uppercase">
                        Admin
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Projects Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-blue-400" />
                <span>Projects ({projects.length})</span>
              </span>

              {canManageProjects && (
                <button
                  type="button"
                  id="sidebar-btn-add-project"
                  onClick={handleOpenNewProject}
                  title="Create New Project (Admin / PM)"
                  className="p-1 rounded text-neutral-400 hover:text-blue-400 hover:bg-[#222222] transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* All Workspace Queue Item */}
            <button
              type="button"
              id="sidebar-project-all"
              onClick={() => setActiveProjectId('all')}
              className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-all text-left cursor-pointer ${
                activeProjectId === 'all'
                  ? 'bg-blue-950/50 text-blue-300 font-semibold border border-blue-500/30'
                  : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-neutral-400 shrink-0" />
                <span className="truncate">All Workspace Tasks</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 font-mono text-neutral-400">
                {tasks.length}
              </span>
            </button>

            {/* Individual Projects List */}
            {projects.map((proj) => {
              const isActive = activeProjectId === proj.id;
              const projTasksCount = tasks.filter((t) => t.projectId === proj.id).length;
              const owner = users.find((u) => u.id === proj.ownerId);
              const canEditThisProj = isAdmin || proj.ownerId === currentUser?.id || canManageProjects;

              return (
                <div
                  key={proj.id}
                  id={`sidebar-project-${proj.id}`}
                  onClick={() => setActiveProjectId(proj.id)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-all text-left cursor-pointer group ${
                    isActive
                      ? 'bg-[#1c1f26] text-white font-semibold border border-blue-500/40'
                      : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: proj.color || '#3B82F6' }}
                    />
                    <span className="truncate max-w-[130px]" title={proj.name}>
                      {proj.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {owner && (
                      <img
                        src={owner.avatar}
                        alt={owner.name}
                        title={`Owner: ${owner.name}`}
                        className="w-4 h-4 rounded-full object-cover ring-1 ring-white/20"
                      />
                    )}

                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 font-mono text-neutral-400">
                      {projTasksCount}
                    </span>

                    {canEditThisProj && (
                      <button
                        type="button"
                        onClick={(e) => handleEditProject(e, proj)}
                        title="Manage Project Settings & Members"
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-white hover:bg-[#2b2b2b] transition-opacity cursor-pointer"
                      >
                        <Settings className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Management & Governance Section - strictly hidden if user lacks privileges */}
          {(canManageUsers || canManageStatuses || isAdmin) && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 py-1.5">
                Management & Controls
              </div>

              {canManageUsers && (
                <button
                  type="button"
                  id="sidebar-btn-team"
                  onClick={() => {
                    setIsUserModalOpen(true);
                    if (onClose) onClose();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-400 hover:bg-[#1a1a1a] hover:text-white rounded text-xs font-medium transition-colors text-left cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded shrink-0" />
                  <span>Team Directory & RBAC</span>
                </button>
              )}

              {canManageStatuses && (
                <button
                  type="button"
                  id="sidebar-btn-workflow"
                  onClick={() => {
                    setIsStatusManagerOpen(true);
                    if (onClose) onClose();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-400 hover:bg-[#1a1a1a] hover:text-white rounded text-xs font-medium transition-colors text-left cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded shrink-0" />
                  <span>Workflow & Columns</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  id="sidebar-btn-reset-data"
                  onClick={() => {
                    if (window.confirm('Reset all tasks, columns, and audit history to initial demo state?')) {
                      resetDemoData();
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-neutral-400 hover:bg-[#1a1a1a] hover:text-amber-300 rounded text-xs font-medium transition-colors text-left cursor-pointer"
                >
                  <div className="w-1.5 h-1.5 bg-amber-400 rounded shrink-0" />
                  <span>Reset Demo State</span>
                </button>
              )}
            </div>
          )}

          {/* Theme Preference Pill in Sidebar */}
          <div className="p-2.5 bg-[#141414] rounded border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1">
              <span>Theme Mode</span>
              <span className="text-blue-400 capitalize">{theme}</span>
            </div>

            <div className="grid grid-cols-3 gap-1 bg-[#0d0d0d] p-1 rounded border border-[#262626]">
              <button
                type="button"
                onClick={() => setTheme('light')}
                title="Light Theme"
                className={`py-1 rounded flex items-center justify-center transition-all cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#262626] text-amber-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                title="Dark Theme"
                className={`py-1 rounded flex items-center justify-center transition-all cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-[#262626] text-blue-400 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                title="System Theme"
                className={`py-1 rounded flex items-center justify-center transition-all cursor-pointer ${
                  theme === 'system'
                    ? 'bg-[#262626] text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Launch Theme Studio */}
            <button
              type="button"
              id="sidebar-btn-open-theme-editor"
              onClick={() => {
                setIsThemeEditorOpen(true);
                if (window.innerWidth < 1024 && onClose) onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#0d0d0d] hover:bg-[#1f1f1f] border border-[#262626] rounded text-xs font-medium text-neutral-300 hover:text-white transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-12 transition-transform" />
                <span>Theme Studio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                />
                <span className="text-[10px] text-neutral-500 font-mono truncate max-w-[65px]">
                  {themeConfig.name || 'Custom'}
                </span>
              </div>
            </button>
          </div>

          {/* Quick Stats Pill inside Sidebar */}
          <div className="p-3 bg-[#141414] rounded border border-[#262626] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Total Workload</span>
              <span className="font-bold text-white">{tasks.length} tasks</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-400">Active Engineers</span>
              <span className="font-bold text-blue-300">{users.length} members</span>
            </div>
          </div>

        </div>

        {/* User Switcher / Profile Card at Bottom */}
        <div className="p-3.5 border-t border-[#262626] relative" ref={dropdownRef}>
          <div
            id="sidebar-user-profile-button"
            className="bg-[#141414] hover:bg-[#1a1a1a] rounded-lg p-2.5 flex items-center justify-between gap-2 transition-all border border-[#262626] group"
          >
            <button
              type="button"
              id="sidebar-user-avatar-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (currentUser) openUserProfile(currentUser);
              }}
              className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
              title="Open My Profile & Avatar Settings"
            >
              <div className="relative group/avatar">
                <UserAvatar
                  user={currentUser || undefined}
                  size="md"
                  className="ring-1 ring-blue-500/60 shrink-0 group-hover/avatar:ring-blue-400"
                />
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate group-hover:text-blue-200 transition-colors flex items-center gap-1.5">
                  <span>{currentUser?.name}</span>
                </div>
                <div className={`text-[9px] font-bold uppercase tracking-wider ${
                  isAdmin ? 'text-blue-400' : 'text-emerald-400'
                }`}>
                  {currentUser?.role === 'admin' ? 'Administrator' : 'Basic User'}
                </div>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                id="sidebar-btn-open-my-profile"
                onClick={() => {
                  if (currentUser) openUserProfile(currentUser);
                }}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#252525] transition-colors cursor-pointer"
                title="View Profile & Avatar"
              >
                <UserIcon className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                id="sidebar-btn-toggle-user-dropdown"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#252525] transition-colors cursor-pointer"
                title="Switch User (Test RBAC)"
              >
                <ChevronRight className={`w-4 h-4 text-neutral-400 group-hover:text-white transition-transform ${
                  isUserDropdownOpen ? 'rotate-90 text-blue-400' : ''
                }`} />
              </button>
            </div>
          </div>

          {/* Interactive User Switcher & Profile Popover */}
          {isUserDropdownOpen && (
            <div className="absolute bottom-full left-3.5 right-3.5 mb-2 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              
              {/* My Profile Quick Action Buttons */}
              <div className="space-y-1 pb-2 border-b border-[#262626] mb-2">
                <button
                  type="button"
                  id="popover-btn-view-profile"
                  onClick={() => {
                    if (currentUser) openUserProfile(currentUser, false);
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-[#1c1c1c] hover:bg-[#242424] text-xs font-semibold text-white transition-colors cursor-pointer border border-[#2e2e2e]"
                >
                  <UserIcon className="w-4 h-4 text-blue-400" />
                  <span className="flex-1 text-left">View My Profile</span>
                </button>

                <button
                  type="button"
                  id="popover-btn-customize-avatar"
                  onClick={() => {
                    if (currentUser) openUserProfile(currentUser, true);
                    setIsUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-blue-950/40 hover:bg-blue-900/50 text-xs font-semibold text-blue-300 transition-colors cursor-pointer border border-blue-600/30"
                >
                  <Camera className="w-4 h-4 text-blue-400" />
                  <span className="flex-1 text-left">Customize Avatar & Bio</span>
                </button>
              </div>

              <div className="px-1 py-1 flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  Switch Active Account (RBAC)
                </span>
                <span className="text-[9px] text-blue-400 font-semibold">Live Sandbox</span>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  const isUserAdmin = u.role === 'admin';

                  return (
                    <div
                      key={u.id}
                      className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-all ${
                        isCurrent
                          ? 'bg-blue-950/60 border border-blue-500/40 text-white'
                          : 'hover:bg-[#1f1f1f] text-neutral-300 border border-transparent'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          switchUser(u.id);
                          setIsUserDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 min-w-0 flex-1 text-left cursor-pointer py-0.5"
                      >
                        <UserAvatar user={u} size="sm" className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{u.name}</p>
                          <p className="text-[10px] text-neutral-400 truncate">{u.title || u.department || 'Member'}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                            isUserAdmin
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {isUserAdmin ? 'Admin' : 'User'}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openUserProfile(u);
                            setIsUserDropdownOpen(false);
                          }}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#282828] transition-colors cursor-pointer"
                          title={`View ${u.name}'s Profile`}
                        >
                          <UserIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </aside>
    </>
  );
};

