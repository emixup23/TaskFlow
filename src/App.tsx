import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { GamificationProvider } from './context/GamificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { ChatProvider } from './context/ChatContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricsStrip } from './components/MetricsStrip';
import { FilterBar } from './components/FilterBar';
import { KanbanBoard } from './components/KanbanBoard';
import { TicketSystemView } from './components/TicketSystemView';
import { TableView } from './components/TableView';
import { TimelineView } from './components/TimelineView';
import { AdminDashboard } from './components/AdminDashboard';
import { AuditLogView } from './components/AuditLogView';
import { GamificationView } from './components/GamificationView';
import { UserManagementView } from './components/UserManagementView';
import { RelationshipGraphView } from './components/RelationshipGraphView';
import { ChatView } from './components/ChatView';
import { MeetingsView } from './components/MeetingsView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { CreateMeetingModal } from './components/CreateMeetingModal';
import { MeetingDetailModal } from './components/MeetingDetailModal';
import { StatusManagerModal } from './components/StatusManagerModal';
import { UserManagementModal } from './components/UserManagementModal';
import { UserProfileModal } from './components/UserProfileModal';
import { ProjectModal } from './components/ProjectModal';
import { RewardsModal } from './components/RewardsModal';
import { LevelUpModal } from './components/LevelUpModal';
import { ThemeEditorModal } from './components/ThemeEditorModal';
import { FloatingXpToast } from './components/FloatingXpToast';
import { ToastContainer } from './components/ToastContainer';
import { LoginView } from './components/LoginView';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

const WorkspaceContent: React.FC = () => {
  const { viewMode, isLoading, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useTasks();
  const { isLoading: isAuthLoading, isAuthenticated, currentUser } = useAuth();
  const { setIsThemeEditorOpen } = useTheme();

  // Keyboard shortcuts (Ctrl+B / Cmd+B for Sidebar, Ctrl+Shift+T / Cmd+Shift+T for Theme Studio)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }

      if ((e.ctrlKey || e.metaKey) && (e.shiftKey || e.altKey) && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setIsThemeEditorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSidebar, setIsThemeEditorOpen]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="h-screen w-full bg-[#0d0d0d] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold text-neutral-300">Loading TaskFlow workspace...</p>
      </div>
    );
  }

  // Authentication Gate: Render clean, secure login/registration view if not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const showFilterBar = viewMode === 'kanban' || viewMode === 'list' || viewMode === 'timeline';

  return (
    <div className="flex h-screen w-full bg-[#0d0d0d] text-slate-100 font-sans overflow-hidden antialiased selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Sleek Dark Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Workspace Column */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0d0d0d]">
        {/* Top Header */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        {/* Top KPI Metrics Strip */}
        {viewMode !== 'chat' && <MetricsStrip />}

        {/* Contextual Filter Bar */}
        {showFilterBar && <FilterBar />}

        {/* View Surface with smooth scrolling */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">
          {viewMode === 'kanban' && <KanbanBoard />}
          {viewMode === 'tickets' && <TicketSystemView />}
          {viewMode === 'list' && <TableView />}
          {viewMode === 'timeline' && <TimelineView />}
          {viewMode === 'graph' && <RelationshipGraphView />}
          {viewMode === 'chat' && <ChatView />}
          {viewMode === 'meetings' && <MeetingsView />}
          {viewMode === 'dashboard' && (
            <ProtectedRoute requiredRole="admin" title="Executive Analytics & Dashboard">
              <AdminDashboard />
            </ProtectedRoute>
          )}
          {viewMode === 'users' && (
            <ProtectedRoute requiredPrivilege="canManageUsers" title="Team Directory & Access Management">
              <UserManagementView />
            </ProtectedRoute>
          )}
          {viewMode === 'backup' && (
            <ProtectedRoute requiredRole="admin" title="Backup & Disaster Recovery Center">
              <BackupRestoreView />
            </ProtectedRoute>
          )}
          {viewMode === 'audit' && (
            <ProtectedRoute requiredPrivilege="canViewAuditLogs" title="Activity & Security Audit Trail">
              <AuditLogView />
            </ProtectedRoute>
          )}
          {viewMode === 'rewards' && <GamificationView />}
        </div>
      </main>

      {/* Global Modals & Notifications */}
      <TaskDetailModal />
      <CreateTaskModal />
      <CreateMeetingModal />
      <MeetingDetailModal />
      <ProjectModal />
      <StatusManagerModal />
      <UserManagementModal />
      <UserProfileModal />
      <RewardsModal />
      <LevelUpModal />
      <ThemeEditorModal />
      <FloatingXpToast />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <GamificationProvider>
          <TaskProvider>
            <ChatProvider>
              <WorkspaceContent />
            </ChatProvider>
          </TaskProvider>
        </GamificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
