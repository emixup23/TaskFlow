import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  AtSign,
  CheckSquare,
  LifeBuoy,
  Briefcase,
  MessageSquare,
  X,
  ExternalLink
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useTasks } from '../context/TaskContext';
import { useChat } from '../context/ChatContext';
import { NotificationItem } from '../types';

export const NotificationBannerToast: React.FC = () => {
  const { notifications, markAsRead } = useNotifications();
  const { setSelectedTaskId, setViewMode, setFilters } = useTasks();
  const { setActiveChannelId } = useChat();

  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialMountRef = useRef(true);

  useEffect(() => {
    if (initialMountRef.current) {
      notifications.forEach((n) => seenIdsRef.current.add(n.id));
      initialMountRef.current = false;
      return;
    }

    // Find the latest unseen unread notification
    const newestUnseen = notifications.find(
      (n) => !n.isRead && !seenIdsRef.current.has(n.id)
    );

    if (newestUnseen) {
      seenIdsRef.current.add(newestUnseen.id);
      setActiveToast(newestUnseen);

      const timer = setTimeout(() => {
        setActiveToast((current) => (current?.id === newestUnseen.id ? null : current));
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [notifications]);

  if (!activeToast) return null;

  const getIcon = () => {
    switch (activeToast.type) {
      case 'mention':
        return <AtSign className="w-4 h-4 text-purple-400" />;
      case 'task_assign':
        return <CheckSquare className="w-4 h-4 text-blue-400" />;
      case 'ticket_assign':
        return <LifeBuoy className="w-4 h-4 text-amber-400" />;
      case 'project_assign':
        return <Briefcase className="w-4 h-4 text-emerald-400" />;
      case 'chat_dm':
        return <MessageSquare className="w-4 h-4 text-sky-400" />;
      default:
        return <Bell className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleOpen = () => {
    markAsRead(activeToast.id);
    if (activeToast.taskId) {
      setSelectedTaskId(activeToast.taskId);
      if (activeToast.type === 'ticket_assign') {
        setViewMode('tickets');
      }
    } else if (activeToast.channelId) {
      setActiveChannelId(activeToast.channelId);
      setViewMode('chat');
    } else if (activeToast.projectId) {
      setFilters((prev) => ({ ...prev, projectId: activeToast.projectId! }));
      setViewMode('kanban');
    }
    setActiveToast(null);
  };

  return (
    <div className="fixed top-20 right-5 z-50 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        <motion.div
          key={activeToast.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="pointer-events-auto bg-[#181818]/95 backdrop-blur-md border border-blue-500/40 rounded-lg p-3.5 shadow-2xl text-white flex items-start gap-3 shadow-black/60"
        >
          <div className="w-8 h-8 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center shrink-0 mt-0.5">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                {activeToast.type.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-neutral-400">Just now</span>
            </div>
            <p className="text-xs font-semibold text-neutral-100 truncate mt-0.5">
              {activeToast.title}
            </p>
            <p className="text-[11px] text-neutral-300 line-clamp-2 mt-0.5 leading-relaxed">
              {activeToast.message}
            </p>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpen}
                className="text-[11px] font-semibold bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  markAsRead(activeToast.id);
                  setActiveToast(null);
                }}
                className="text-[11px] font-medium text-neutral-400 hover:text-white px-2 py-1 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveToast(null)}
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
