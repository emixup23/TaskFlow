import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPrivileges, UserRole } from '../types';
import { AccessDeniedView } from './AccessDeniedView';
import { LoginView } from './LoginView';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPrivilege?: keyof UserPrivileges;
  requiredRole?: UserRole;
  title?: string;
  description?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPrivilege,
  requiredRole,
  title,
  description
}) => {
  const { isAuthenticated, currentUser, isAdmin, hasPrivilege, hasRole } = useAuth();

  if (!isAuthenticated || !currentUser) {
    return <LoginView />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <AccessDeniedView
        title={title || 'Administrator Access Required'}
        description={
          description ||
          `This module is restricted to ${requiredRole.toUpperCase()} accounts. You are currently authenticated as ${currentUser.name} (${currentUser.role}).`
        }
        requiredRole={requiredRole}
      />
    );
  }

  if (requiredPrivilege && !isAdmin && !hasPrivilege(requiredPrivilege)) {
    return (
      <AccessDeniedView
        title={title || 'Insufficient Permissions'}
        description={
          description ||
          `Your account role (${currentUser.role}) does not have the '${requiredPrivilege}' permission granted.`
        }
        requiredPrivilege={requiredPrivilege}
      />
    );
  }

  return <>{children}</>;
};
