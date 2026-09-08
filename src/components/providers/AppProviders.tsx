import React, { ReactNode } from 'react';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { GamificationProvider } from '../../context/GamificationContext';
import { KudosProvider } from '../../context/KudosContext';
import { TaskProvider } from '../../context/TaskContext';
import { ChatProvider } from '../../context/ChatContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { ErrorBoundary } from '../common/ErrorBoundary';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Composes all global React context providers into a single, clean hierarchy.
 * Shields the whole application tree with a top-level ErrorBoundary.
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary fallbackTitle="Application Workspace Encountered an Error">
      <ThemeProvider>
        <AuthProvider>
          <GamificationProvider>
            <KudosProvider>
              <TaskProvider>
                <ChatProvider>
                  <NotificationProvider>
                    {children}
                  </NotificationProvider>
                </ChatProvider>
              </TaskProvider>
            </KudosProvider>
          </GamificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
