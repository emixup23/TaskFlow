import React, { useState } from 'react';
import {
  Bell,
  Check,
  Trash2,
  CheckCheck,
  AtSign,
  CheckSquare,
  LifeBuoy,
  Briefcase,
  MessageSquare,
  MessageCircle,
  ExternalLink,
  Clock,
  Inbox,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useTasks } from '../context/TaskContext';
import { useChat } from '../context/ChatContext';
import { useLanguage } from '../context/LanguageContext';
import { NotificationItem, NotificationType } from '../types';
import { soundManager, playNotificationSound } from '../utils/sound';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'unread' | 'mentions' | 'assigned';

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    isLoading
  } = useNotifications();

  const { setSelectedTaskId, setViewMode, setFilters } = useTasks();
  const { setActiveChannelId } = useChat();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [isAudioEnabled, setIsAudioEnabled] = useState(soundManager.isSoundEnabled());

  if (!isOpen) return null;

  const toggleSound = () => {
    const next = !isAudioEnabled;
    soundManager.setSoundEnabled(next);
    setIsAudioEnabled(next);
    if (next) {
      playNotificationSound();
    }
  };

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'unread') return !notif.isRead;
    if (activeTab === 'mentions') return notif.type === 'mention';
    if (activeTab === 'assigned') {
      return (
        notif.type === 'task_assign' ||
        notif.type === 'ticket_assign' ||
        notif.type === 'project_assign'
      );
    }
    return true;
  });

  const handleNotificationClick = (notif: NotificationItem) => {
    // Mark as read
    if (!notif.isRead) {
      markAsRead(notif.id);
    }

    // Navigate to target entity
    if (notif.taskId) {
      setSelectedTaskId(notif.taskId);
      if (notif.type === 'ticket_assign') {
        setViewMode('tickets');
      }
    } else if (notif.channelId) {
      setActiveChannelId(notif.channelId);
      setViewMode('chat');
    } else if (notif.projectId) {
      setFilters((prev) => ({ ...prev, projectId: notif.projectId! }));
      setViewMode('kanban');
    }

    onClose();
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffSec < 60) return t('notifications.justNow', 'Just now');
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDays === 1) return t('common.yesterday', 'Yesterday');
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return t('notifications.recently', 'Recently');
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'mention':
        return {
          label: 'Mention',
          icon: AtSign,
          color: 'bg-purple-950/60 text-purple-300 border-purple-800/60'
        };
      case 'task_assign':
        return {
          label: 'Task Assigned',
          icon: CheckSquare,
          color: 'bg-blue-950/60 text-blue-300 border-blue-800/60'
        };
      case 'ticket_assign':
        return {
          label: 'Ticket Assigned',
          icon: LifeBuoy,
          color: 'bg-amber-950/60 text-amber-300 border-amber-800/60'
        };
      case 'project_assign':
        return {
          label: 'Project Assigned',
          icon: Briefcase,
          color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
        };
      case 'chat_dm':
        return {
          label: 'Direct Message',
          icon: MessageSquare,
          color: 'bg-sky-950/60 text-sky-300 border-sky-800/60'
        };
      case 'task_comment':
        return {
          label: 'Comment',
          icon: MessageCircle,
          color: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
        };
      default:
        return {
          label: 'Update',
          icon: Bell,
          color: 'bg-neutral-800 text-neutral-300 border-neutral-700'
        };
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden animate-in fade-in duration-150"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        id="notification-dropdown-panel"
        className="fixed inset-x-3 top-16 mt-2 sm:mt-2 sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:w-96 max-w-none sm:max-w-md bg-[#181818] rounded-xl shadow-2xl border border-[#333333] z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100vh-5.5rem)] sm:max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-3 border-b border-[#2b2b2b] bg-[#141414] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
                {t('header.notifications', 'Notifications')}
                {unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount} {t('common.new', 'new')}
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              id="btn-toggle-notification-sound"
              onClick={toggleSound}
              title={isAudioEnabled ? "Audio alerts enabled" : "Audio alerts muted"}
              className={`p-1.5 rounded transition-colors text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                isAudioEnabled
                  ? 'text-emerald-400 hover:bg-emerald-950/40 hover:text-emerald-300'
                  : 'text-neutral-500 hover:text-neutral-300 hover:bg-[#222222]'
              }`}
            >
              {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                id="btn-mark-all-read"
                onClick={() => markAllAsRead()}
                title="Mark all as read"
                className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-[#222222] rounded transition-colors text-[11px] font-medium flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('notifications.markAllAsRead', 'Mark all read')}</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                id="btn-clear-all-notifs"
                onClick={() => clearAll()}
                title="Clear all notifications"
                className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-[#222222] rounded transition-colors text-[11px] font-medium flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('common.clear', 'Clear')}</span>
              </button>
            )}

            {/* Mobile close button */}
            <button
              type="button"
              id="btn-close-notifications-mobile"
              onClick={onClose}
              className="sm:hidden p-1 text-neutral-400 hover:text-white rounded-md hover:bg-[#222222] transition-colors cursor-pointer"
              title="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#262626] bg-[#161616] text-[11px] overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'bg-[#262626] text-white font-semibold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {t('common.all', 'All')} ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'unread'
              ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {t('notifications.unread', 'Unread')} ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('mentions')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'mentions'
              ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {t('notifications.mentions', 'Mentions')} ({notifications.filter((n) => n.type === 'mention').length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assigned')}
          className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'assigned'
              ? 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/30'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {t('notifications.assigned', 'Assigned')} (
          {
            notifications.filter(
              (n) =>
                n.type === 'task_assign' ||
                n.type === 'ticket_assign' ||
                n.type === 'project_assign'
            ).length
          }
          )
        </button>
      </div>

      {/* List Container */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-[#222222]">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-neutral-400 flex flex-col items-center justify-center gap-2">
            <Inbox className="w-8 h-8 opacity-40 text-neutral-500" />
            <p className="text-xs font-medium text-neutral-300">{t('notifications.noNotifications', 'No notifications in this view')}</p>
            <p className="text-[11px] text-neutral-500 max-w-[200px]">
              You'll be alerted when assigned to tasks, tickets, projects, or mentioned in chat.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => {
            const badge = getTypeBadge(notif.type);
            const Icon = badge.icon;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3 transition-colors cursor-pointer group flex items-start gap-3 relative ${
                  notif.isRead
                    ? 'hover:bg-[#1f1f1f] bg-[#181818] opacity-80 hover:opacity-100'
                    : 'hover:bg-[#222222] bg-[#1c1c1c] border-l-2 border-blue-500'
                }`}
              >
                {/* Sender Avatar or Type Icon */}
                <div className="relative shrink-0 mt-0.5">
                  {notif.senderAvatar ? (
                    <img
                      src={notif.senderAvatar}
                      alt={notif.senderName || 'Sender'}
                      className="w-8 h-8 rounded-full object-cover border border-[#333333]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#262626] border border-[#333333] flex items-center justify-center text-neutral-300 font-semibold text-xs">
                      {notif.senderName ? notif.senderName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-[#181818] flex items-center justify-center ${badge.color}`}
                  >
                    <Icon className="w-2.5 h-2.5" />
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.2 rounded border ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-neutral-100 group-hover:text-blue-300 transition-colors truncate">
                    {notif.title}
                  </h4>

                  <p className="text-[11px] text-neutral-300 line-clamp-2 mt-0.5 leading-relaxed break-words">
                    {notif.message}
                  </p>

                  {/* Target item indicator if applicable */}
                  {(notif.taskTitle || notif.projectName || notif.channelName) && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-neutral-400 bg-[#222222] px-2 py-0.5 rounded w-fit max-w-full truncate border border-[#2d2d2d]">
                      <ExternalLink className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                      <span className="truncate">
                        {notif.taskTitle
                          ? `Task: ${notif.taskTitle}`
                          : notif.projectName
                          ? `Project: ${notif.projectName}`
                          : `#${notif.channelName}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick actions on hover */}
                <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!notif.isRead && (
                    <button
                      type="button"
                      title="Mark as read"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                      }}
                      className="p-1 rounded bg-[#262626] hover:bg-[#333333] text-neutral-300 hover:text-blue-400 cursor-pointer transition-colors"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="p-1 rounded bg-[#262626] hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-[#262626] bg-[#141414] text-center">
        <span className="text-[10px] text-neutral-400">
          Real-time alerts for mentions and assignments
        </span>
      </div>
    </div>
    </>
  );
};
