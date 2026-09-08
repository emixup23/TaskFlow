import React from 'react';
import { TaskDetailModal } from '../TaskDetailModal';
import { CreateTaskModal } from '../CreateTaskModal';
import { CreateMeetingModal } from '../CreateMeetingModal';
import { MeetingDetailModal } from '../MeetingDetailModal';
import { ProjectModal } from '../ProjectModal';
import { StatusManagerModal } from '../StatusManagerModal';
import { UserManagementModal } from '../UserManagementModal';
import { UserProfileModal } from '../UserProfileModal';
import { RewardsModal } from '../RewardsModal';
import { KudosModal } from '../KudosModal';
import { LevelUpModal } from '../LevelUpModal';
import { ThemeEditorModal } from '../ThemeEditorModal';
import { SettingsModal } from '../SettingsModal';
import { FloatingXpToast } from '../FloatingXpToast';
import { ToastContainer } from '../ToastContainer';
import { NotificationBannerToast } from '../NotificationBannerToast';

/**
 * Encapsulates all global modal dialogs and notification toasts in a single container.
 * Keeps root components clean and simplifies workspace layout architecture.
 */
export const GlobalModals: React.FC = () => {
  return (
    <>
      <TaskDetailModal />
      <CreateTaskModal />
      <CreateMeetingModal />
      <MeetingDetailModal />
      <ProjectModal />
      <StatusManagerModal />
      <UserManagementModal />
      <UserProfileModal />
      <RewardsModal />
      <KudosModal />
      <LevelUpModal />
      <ThemeEditorModal />
      <SettingsModal />
      <FloatingXpToast />
      <ToastContainer />
      <NotificationBannerToast />
    </>
  );
};
