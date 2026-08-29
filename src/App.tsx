import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TaskProvider, useTasks } from './context/TaskContext';
import { GamificationProvider } from './context/GamificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { MetricsStrip } from './components/MetricsStrip';
import { FilterBar } from './components/FilterBar';
import { KanbanBoard } from './components/KanbanBoard';
import { TableView } from './components/TableView';
import { TimelineView } from './components/TimelineView';
import { AdminDashboard } from './components/AdminDashboard';
import { AuditLogView } from './components/AuditLogView';
import { GamificationView } from './components/GamificationView';
import { UserManagementView } from './components/UserManagementView';
import { RelationshipGraphView } from './components/RelationshipGraphView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { StatusManagerModal } from './components/StatusManagerModal';
import { UserManagementModal } from './components/UserManagementModal';
import { ProjectModal } from './components/ProjectModal';
import { RewardsModal } from './components/RewardsModal';
import { LevelUpModal } from './components/LevelUpModal';
import { FloatingXpToast } from './components/FloatingXpToast';
import { ToastContainer } from './components/ToastContainer';
import { Loader2 } from 'lucide-react';

const WorkspaceContent: React.FC = () => {
  const { viewMode, isLoading } = useTasks();
  const { isLoading: isAuthLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    // Default open on desktop (>=1024px), closed on mobile
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskflow_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.innerWidth >= 1024;
    }
    return true;
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('taskflow_sidebar_open', String(next));
      return next;
    });
  };

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isAuthLoading || isLoading) {
    return (
      <div className="h-screen w-full bg-[#0d0d0d] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold text-neutral-300">Loading TaskFlow workspace...</p>
      </div>
    );
  }

  const showFilterBar = viewMode === 'kanban' || viewMode === 'list' || viewMode === 'timeline';

  return (
    <div className="flex h-screen w-full bg-[#0d0d0d] text-slate-100 font-sans overflow-hidden antialiased selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Sleek Dark Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => {
        setIsSidebarOpen(false);
        localStorage.setItem('taskflow_sidebar_open', 'false');
      }} />

      {/* Main Workspace Column */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#0d0d0d]">
        {/* Top Header */}
        <Header
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={toggleSidebar}
        />

        {/* Top KPI Metrics Strip */}
        <MetricsStrip />

        {/* Contextual Filter Bar */}
        {showFilterBar && <FilterBar />}

        {/* View Surface with smooth scrolling */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">
          {viewMode === 'kanban' && <KanbanBoard />}
          {viewMode === 'list' && <TableView />}
          {viewMode === 'timeline' && <TimelineView />}
          {viewMode === 'graph' && <RelationshipGraphView />}
          {viewMode === 'dashboard' && <AdminDashboard />}
          {viewMode === 'users' && <UserManagementView />}
          {viewMode === 'audit' && <AuditLogView />}
          {viewMode === 'rewards' && <GamificationView />}
        </div>
      </main>

      {/* Global Modals & Notifications */}
      <TaskDetailModal />
      <CreateTaskModal />
      <ProjectModal />
      <StatusManagerModal />
      <UserManagementModal />
      <RewardsModal />
      <LevelUpModal />
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
            <WorkspaceContent />
          </TaskProvider>
        </GamificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
