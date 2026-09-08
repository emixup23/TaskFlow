import React from 'react';
import { useAuth } from './context/AuthContext';
import { useTasks } from './context/TaskContext';
import { useTheme } from './context/ThemeContext';
import { AppProviders } from './components/providers/AppProviders';
import { WorkspaceLayout } from './components/workspace/WorkspaceLayout';
import { WorkspaceViewRouter } from './components/workspace/WorkspaceViewRouter';
import { GlobalModals } from './components/modals/GlobalModals';
import { LoginView } from './components/LoginView';
import { ToastContainer } from './components/ToastContainer';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { Loader2 } from 'lucide-react';

const WorkspaceContent: React.FC = () => {
  const { viewMode, isLoading, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useTasks();
  const { isLoading: isAuthLoading, isAuthenticated, currentUser } = useAuth();
  const { setIsThemeEditorOpen } = useTheme();

  // Encapsulated keyboard shortcuts (Ctrl+B: Sidebar, Ctrl+Shift+T: Theme Studio)
  useGlobalKeyboardShortcuts({
    onToggleSidebar: toggleSidebar,
    onToggleThemeEditor: () => setIsThemeEditorOpen((prev) => !prev)
  });

  // Global initial loading state
  if (isAuthLoading || isLoading) {
    return (
      <div className="h-screen w-full bg-[#0d0d0d] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold text-neutral-300">Loading TaskFlow workspace...</p>
      </div>
    );
  }

  // Authentication Gate: Render secure login/registration view if unauthenticated
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
    <>
      <WorkspaceLayout
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        showFilterBar={showFilterBar}
      >
        <WorkspaceViewRouter viewMode={viewMode} />
      </WorkspaceLayout>

      <GlobalModals />
    </>
  );
};

export default function App() {
  return (
    <AppProviders>
      <WorkspaceContent />
    </AppProviders>
  );
}
