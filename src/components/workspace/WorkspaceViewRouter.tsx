import React from 'react';
import { ViewMode } from '../../types';
import { useFeatures } from '../../context/FeatureContext';
import { Eye, Sliders, ArrowRight } from 'lucide-react';
import { KanbanBoard } from '../KanbanBoard';
import { DailyTasksView } from '../DailyTasksView';
import { TicketSystemView } from '../TicketSystemView';
import { TableView } from '../TableView';
import { TimelineView } from '../TimelineView';
import { RelationshipGraphView } from '../RelationshipGraphView';
import { ChatView } from '../ChatView';
import { MeetingsView } from '../MeetingsView';
import { FormBuilderView } from '../FormBuilderView';
import { NotepadView } from '../NotepadView';
import { AdminDashboard } from '../AdminDashboard';
import { UserManagementView } from '../UserManagementView';
import { AccessManagerView } from '../AccessManagerView';
import { BackupRestoreView } from '../BackupRestoreView';
import { AuditLogView } from '../AuditLogView';
import { GamificationView } from '../GamificationView';
import { ProtectedRoute } from '../ProtectedRoute';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface WorkspaceViewRouterProps {
  viewMode: ViewMode;
}

/**
 * Dynamically routes and renders the active workspace view based on the current `viewMode`.
 * Protects administrative views with `ProtectedRoute` guards and shields each view with an `ErrorBoundary`.
 */
export const WorkspaceViewRouter: React.FC<WorkspaceViewRouterProps> = ({ viewMode }) => {
  const { isFeatureVisible, setFeatureVisible, openFeaturesModal } = useFeatures();

  const isCurrentViewVisible = isFeatureVisible(viewMode);

  if (!isCurrentViewVisible) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0d0d0d]">
        <div className="max-w-md p-6 bg-[#141414] border border-[#262626] rounded-2xl shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center text-neutral-400 mx-auto mb-3.5">
            <Sliders className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            This view is currently hidden
          </h2>
          <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
            You've hidden this feature in your App Features settings. You can re-enable it at any time or manage all feature visibility.
          </p>

          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              type="button"
              id="btn-enable-current-view"
              onClick={() => setFeatureVisible(viewMode, true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Unhide View</span>
            </button>

            <button
              type="button"
              id="btn-open-features-from-placeholder"
              onClick={openFeaturesModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#222] hover:bg-[#2b2b2b] text-neutral-200 text-xs font-medium border border-[#333] transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-neutral-400" />
              <span>Manage Features</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderViewContent = () => {
    switch (viewMode) {
      case 'kanban':
        return <KanbanBoard />;
      case 'daily':
        return <DailyTasksView />;
      case 'tickets':
        return <TicketSystemView />;
      case 'list':
        return (
          <ProtectedRoute requiredRole="admin" title="Bulk Tasks Workspace">
            <TableView />
          </ProtectedRoute>
        );
      case 'timeline':
        return <TimelineView />;
      case 'graph':
        return <RelationshipGraphView />;
      case 'chat':
        return <ChatView />;
      case 'meetings':
        return <MeetingsView />;
      case 'forms':
        return <FormBuilderView />;
      case 'notes':
        return <NotepadView />;
      case 'dashboard':
        return (
          <ProtectedRoute requiredRole="admin" title="Executive Analytics & Dashboard">
            <AdminDashboard />
          </ProtectedRoute>
        );
      case 'users':
        return (
          <ProtectedRoute requiredPrivilege="canManageUsers" title="Team Directory & Access Management">
            <UserManagementView />
          </ProtectedRoute>
        );
      case 'access':
        return (
          <ProtectedRoute requiredPrivilege="canManageRoles" title="Access Manager & System Roles">
            <AccessManagerView />
          </ProtectedRoute>
        );
      case 'backup':
        return (
          <ProtectedRoute requiredRole="admin" title="Backup & Disaster Recovery Center">
            <BackupRestoreView />
          </ProtectedRoute>
        );
      case 'audit':
        return (
          <ProtectedRoute requiredPrivilege="canViewAuditLogs" title="Activity & Security Audit Trail">
            <AuditLogView />
          </ProtectedRoute>
        );
      case 'rewards':
        return <GamificationView />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">
      <ErrorBoundary fallbackTitle={`Error rendering ${viewMode} view`}>
        {renderViewContent()}
      </ErrorBoundary>
    </div>
  );
};
