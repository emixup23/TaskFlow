import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  Shield,
  Sparkles,
  ChevronRight,
  UserCheck,
  X,
  Plus,
  Briefcase,
  FolderPlus,
  Settings,
  Crown,
  User as UserIcon,
  Camera,
  ExternalLink,
  LogOut,
  LogIn,
  StickyNote
} from 'lucide-react';
import {
  WorkflowIcon,
  DailyTasksIcon,
  TicketSystemIcon,
  BulkTasksIcon,
  TimelineIcon,
  GraphIcon,
  ChatIcon,
  MeetingsIcon,
  RewardsIcon,
  DashboardIcon,
  FormsIcon
} from './icons/SidebarIcons';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useChat } from '../context/ChatContext';
import { useLanguage } from '../context/LanguageContext';
import { useFeatures } from '../context/FeatureContext';
import { ViewMode, Project } from '../types';
import { Logo } from './Logo';
import { UserAvatar } from './UserAvatar';
import { getRoleTemplate } from '../utils/roleUtils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
  const { currentUser, users, switchUser, isAdmin, logout } = useAuth();
  const {
    viewMode,
    setViewMode,
    isSidebarOpen,
    setIsSidebarOpen,
    toggleSidebar,
    projects,
    activeProjectId,
    setActiveProjectId,
    setIsProjectModalOpen,
    setEditingProject,
    setIsCreateModalOpen,
    openUserProfile,
    tasks
  } = useTasks();
  const { totalUnreadCount } = useChat();
  const { t } = useLanguage();
  const { isFeatureVisible } = useFeatures();

  const isOpen = propIsOpen !== undefined ? propIsOpen : isSidebarOpen;
  const onClose = propOnClose || (() => setIsSidebarOpen(false));

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Accordion state for Projects section
  const [isProjectsExpanded, setIsProjectsExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('taskflow_sidebar_projects_expanded');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleProjectsAccordion = () => {
    setIsProjectsExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('taskflow_sidebar_projects_expanded', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const canManageProjects = isAdmin || Boolean(currentUser?.privileges?.canManageProjects);
  const canManageUsers = isAdmin || Boolean(currentUser?.privileges?.canManageUsers);
  const canManageRoles = isAdmin || Boolean(currentUser?.privileges?.canManageRoles);
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
    { mode: 'kanban', label: t('nav.workflow', 'Workflow'), icon: <WorkflowIcon className="w-4 h-4" />, colorDot: 'bg-blue-400', isAllowed: true },
    { mode: 'daily', label: t('nav.dailyTasks', 'Daily Tasks'), icon: <DailyTasksIcon className="w-4 h-4" />, colorDot: 'bg-teal-400', isAllowed: true },
    { mode: 'tickets', label: t('nav.tickets', 'Ticket System'), icon: <TicketSystemIcon className="w-4 h-4" />, colorDot: 'bg-amber-400', isAllowed: true },
    { mode: 'list', label: t('nav.bulkTasks', 'Bulk tasks'), icon: <BulkTasksIcon className="w-4 h-4" />, colorDot: 'bg-sky-400', isAllowed: isAdmin, adminBadge: true },
    { mode: 'timeline', label: t('nav.timeline', 'Timeline'), icon: <TimelineIcon className="w-4 h-4" />, colorDot: 'bg-amber-400', isAllowed: true },
    { mode: 'graph', label: t('nav.graph', 'Graph'), icon: <GraphIcon className="w-4 h-4" />, colorDot: 'bg-indigo-400', isAllowed: true },
    { mode: 'chat', label: t('nav.chat', 'Chat'), icon: <ChatIcon className="w-4 h-4" />, colorDot: 'bg-emerald-400', isAllowed: true, unreadCount: totalUnreadCount },
    { mode: 'meetings', label: t('nav.meetings', 'Meetings'), icon: <MeetingsIcon className="w-4 h-4" />, colorDot: 'bg-violet-400', isAllowed: true },
    { mode: 'forms', label: t('nav.forms', 'Forms'), icon: <FormsIcon className="w-4 h-4" />, colorDot: 'bg-indigo-400', isAllowed: true },
    { mode: 'notes', label: t('nav.notes', 'Notepad'), icon: <StickyNote className="w-4 h-4" />, colorDot: 'bg-amber-400', isAllowed: true },
    { mode: 'rewards', label: t('nav.rewards', 'Rewards'), icon: <RewardsIcon className="w-4 h-4" />, colorDot: 'bg-amber-400', isAllowed: true },
    { mode: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: <DashboardIcon className="w-4 h-4" />, colorDot: 'bg-blue-400', isAllowed: isAdmin || canManageUsers, adminBadge: true }
  ];

  const visibleNavItems = allNavItems.filter(
    (item) => item.isAllowed && isFeatureVisible(item.mode)
  );

  const handleNavClick = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const handleOpenNewProject = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.();
    }
  };

  const handleEditProject = (e: React.MouseEvent, proj: Project) => {
    e.stopPropagation();
    setEditingProject(proj);
    setIsProjectModalOpen(true);
  };

  const handleProjectSelect = (projId: string) => {
    setActiveProjectId(projId);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose?.();
    }
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
            ? 'w-[280px] max-w-[85vw] translate-x-0 opacity-100 shadow-2xl lg:shadow-none'
            : 'w-0 -translate-x-full lg:w-0 lg:translate-x-0 lg:border-r-0 overflow-hidden opacity-0 pointer-events-none'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#262626] gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Logo className="w-8 h-8 drop-shadow-md drop-shadow-amber-500/20 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-base tracking-tight truncate">TaskFlow</span>
                <span className="text-[9px] bg-blue-500/20 text-blue-300 border border-blue-400/30 px-1.5 py-0.2 rounded font-semibold uppercase shrink-0">
                  v3.0
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 tracking-wide font-medium truncate">Project Management Tool</p>
            </div>
          </div>

          {/* Collapse/Close Sidebar Button */}
        </div>

        {/* Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          
          {/* Main Workspace Views Section */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 py-1.5">
              {t('nav.workspaceViews', 'Workspace Views')}
            </div>

            {visibleNavItems.map((item) => {
              const isActive = viewMode === item.mode;

              return (
                <button
                  key={item.mode}
                  type="button"
                  id={`sidebar-nav-${item.mode}`}
                  onClick={() => handleNavClick(item.mode)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-all text-left cursor-pointer group ${
                    isActive
                      ? 'bg-[#1e1e1e] text-white shadow-xs font-semibold border border-[#333333]'
                      : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-4 h-4 shrink-0 transition-colors flex items-center justify-center ${
                        isActive ? 'text-white' : 'text-neutral-400 group-hover:text-neutral-200'
                      }`}
                    >
                      {item.icon}
                    </span>
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

          {/* Projects Section Accordion */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#181818] transition-colors group">
              <button
                type="button"
                id="sidebar-projects-accordion-trigger"
                onClick={toggleProjectsAccordion}
                className="flex-1 flex items-center gap-1.5 text-left cursor-pointer select-none py-0.5"
                title={isProjectsExpanded ? 'Collapse Projects' : 'Expand Projects'}
                aria-expanded={isProjectsExpanded}
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-transform duration-200 ${
                    isProjectsExpanded ? 'rotate-90 text-blue-400' : ''
                  }`}
                />
                <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-[10px] font-bold text-neutral-300 group-hover:text-white uppercase tracking-wider">
                  {t('nav.projects', 'Projects')} ({projects.length})
                </span>
                {!isProjectsExpanded && activeProjectId !== 'all' && (
                  (() => {
                    const activeProj = projects.find((p) => p.id === activeProjectId);
                    if (!activeProj) return null;
                    return (
                      <span className="ml-auto mr-1 flex items-center gap-1 text-[10px] text-blue-300 bg-blue-950/60 border border-blue-500/30 px-1.5 py-0.2 rounded max-w-[90px] truncate">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: activeProj.color || '#3B82F6' }}
                        />
                        <span className="truncate">{activeProj.name}</span>
                      </span>
                    );
                  })()
                )}
              </button>

              {canManageProjects && (
                <button
                  type="button"
                  id="sidebar-btn-add-project"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenNewProject();
                  }}
                  title="Create New Project (Admin / PM)"
                  className="p-1 rounded text-neutral-400 hover:text-blue-400 hover:bg-[#242424] transition-colors cursor-pointer flex items-center shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Accordion Content */}
            {isProjectsExpanded && (
              <div className="space-y-0.5 pl-1.5 border-l border-[#222222] ml-3 transition-all">
                {/* All Workspace Queue Item */}
                <button
                  type="button"
                  id="sidebar-project-all"
                  onClick={() => handleProjectSelect('all')}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-all text-left cursor-pointer ${
                    activeProjectId === 'all'
                      ? 'bg-blue-950/50 text-blue-300 font-semibold border border-blue-500/30'
                      : 'text-neutral-400 hover:bg-[#1a1a1a] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-neutral-400 shrink-0" />
                    <span className="truncate">{t('nav.allWorkspaceTasks', 'All Workspace Tasks')}</span>
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
                      onClick={() => handleProjectSelect(proj.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-all text-left cursor-pointer group ${
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
                        <span className="truncate max-w-[120px]" title={proj.name}>
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
            )}
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
                {(() => {
                  const tpl = getRoleTemplate(currentUser?.role);
                  return (
                    <div
                      className="text-[9px] font-bold uppercase tracking-wider truncate max-w-[140px]"
                      style={{ color: tpl.color }}
                      title={`${tpl.name} (${tpl.badge})`}
                    >
                      {tpl.name}
                    </div>
                  );
                })()}
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

              {/* Only Admin can switch active user accounts */}
              {isAdmin && (
                <>
                  <div className="px-1 py-1 flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Switch Active Account (RBAC)
                    </span>
                    <span className="text-[9px] text-blue-400 font-semibold">Admin Only</span>
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
                            {(() => {
                              const tpl = getRoleTemplate(u.role);
                              return (
                                <span
                                  className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 border"
                                  style={{
                                    backgroundColor: `${tpl.color}20`,
                                    color: tpl.color,
                                    borderColor: `${tpl.color}40`
                                  }}
                                  title={tpl.name}
                                >
                                  {tpl.badge || tpl.name}
                                </span>
                              );
                            })()}

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
                </>
              )}

              {/* Sign Out Button */}
              <div className="pt-2 mt-2 border-t border-[#262626]">
                <button
                  type="button"
                  id="sidebar-btn-signout"
                  onClick={async () => {
                    setIsUserDropdownOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 transition-colors cursor-pointer border border-rose-800/40"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="flex-1 text-left">{t('common.logout', 'Sign Out')} / Lock Session</span>
                </button>
              </div>
            </div>
          )}
        </div>



      </aside>
    </>
  );
};

