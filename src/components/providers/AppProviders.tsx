import React, { ReactNode } from 'react';
import { LanguageProvider } from '../../context/LanguageContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { GamificationProvider } from '../../context/GamificationContext';
import { KudosProvider } from '../../context/KudosContext';
import { TaskProvider } from '../../context/TaskContext';
import { ChatProvider } from '../../context/ChatContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { NotepadProvider } from '../../context/NotepadContext';
import { VoiceAssistantProvider } from '../../context/VoiceAssistantContext';
import { FeatureProvider } from '../../context/FeatureContext';
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
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <GamificationProvider>
              <KudosProvider>
                <TaskProvider>
                  <FeatureProvider>
                    <ChatProvider>
                      <NotificationProvider>
                        <NotepadProvider>
                          <VoiceAssistantProvider>
                            {children}
                          </VoiceAssistantProvider>
                        </NotepadProvider>
                      </NotificationProvider>
                    </ChatProvider>
                  </FeatureProvider>
                </TaskProvider>
              </KudosProvider>
            </GamificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
};
