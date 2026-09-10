import React from 'react';
import { ViewMode } from '../../types';
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
