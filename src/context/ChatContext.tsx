import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChatChannel, ChatMessage, ChatMessageAttachment, VoiceNoteData, Task } from '../types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { playChatMessageSound, playMessageSentSound } from '../utils/sound';

interface ChatContextType {
  channels: ChatChannel[];
  activeChannelId: string | null;
  activeChannel: ChatChannel | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isMessagesLoading: boolean;
  messagesError: string | null;
  totalUnreadCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  channelCategoryFilter: 'all' | 'channels' | 'direct';
  setChannelCategoryFilter: (filter: 'all' | 'channels' | 'direct') => void;
  setActiveChannelId: (id: string | null) => void;
  refreshChannels: () => Promise<void>;
  refreshMessages: (channelId?: string, silent?: boolean) => Promise<void>;
  sendMessage: (data: {
    content?: string;
    replyToId?: string;
    attachments?: ChatMessageAttachment[];
    voiceNote?: VoiceNoteData;
    linkedTaskId?: string;
    mentions?: string[];
  }) => Promise<ChatMessage | null>;
  editMessage: (messageId: string, content: string) => Promise<boolean>;
  deleteMessage: (messageId: string) => Promise<boolean>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  togglePinMessage: (messageId: string) => Promise<void>;
  createChannel: (data: {
    name: string;
    description?: string;
    topic?: string;
    type?: 'channel' | 'group_dm';
    isPrivate?: boolean;
    memberIds?: string[];
    color?: string;
  }) => Promise<ChatChannel | null>;
  updateChannel: (id: string, data: Partial<ChatChannel>) => Promise<ChatChannel | null>;
  deleteChannel: (id: string) => Promise<boolean>;
  startDirectChat: (targetUserId: string) => Promise<ChatChannel | null>;
  markAsRead: (channelId: string) => Promise<void>;
  pendingTaskShare: Task | null;
  setPendingTaskShare: (task: Task | null) => void;
  isCreateChannelModalOpen: boolean;
  setIsCreateChannelModalOpen: (open: boolean) => void;
  isChannelDetailsOpen: boolean;
  setIsChannelDetailsOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { awardXP } = useGamification();

  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [channelCategoryFilter, setChannelCategoryFilter] = useState<'all' | 'channels' | 'direct'>('all');
  const [pendingTaskShare, setPendingTaskShare] = useState<Task | null>(null);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState<boolean>(false);
  const [isChannelDetailsOpen, setIsChannelDetailsOpen] = useState<boolean>(false);

  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const initialChannelLoadedRef = useRef<Record<string, boolean>>({});
  const lastUnreadCountRef = useRef<number>(0);

  // Load Channels
  const refreshChannels = useCallback(async () => {
    try {
      const fetched = await api.getChatChannels();
      setChannels(fetched);

      // Auto-select first channel or general if none active
      setActiveChannelId((prev) => {
        if (prev && fetched.some((c) => c.id === prev)) {
          return prev;
        }
        const general = fetched.find((c) => c.id === 'chan-general');
        return general ? general.id : fetched[0]?.id || null;
      });
    } catch (err) {
      console.error('Failed to load chat channels:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (currentUser) {
      refreshChannels();
    }
  }, [currentUser, refreshChannels]);

  // Load messages whenever active channel changes
  const refreshMessages = useCallback(
    async (channelIdOverride?: string, silent: boolean = false) => {
      const targetId = channelIdOverride || activeChannelId;
      if (!targetId) {
        setMessages([]);
        setMessagesError(null);
        return;
      }

      if (!silent) {
        setIsMessagesLoading(true);
      }
      setMessagesError(null);
      try {
        const msgs = await api.getChatMessages(targetId);

        // Check if new incoming messages arrived from other teammates
        if (initialChannelLoadedRef.current[targetId]) {
          const newIncoming = msgs.filter(
            (m) => m.senderId !== currentUser?.id && !knownMessageIdsRef.current.has(m.id)
          );
          if (newIncoming.length > 0) {
            playChatMessageSound();
          }
        }

        msgs.forEach((m) => knownMessageIdsRef.current.add(m.id));
        initialChannelLoadedRef.current[targetId] = true;

        setMessages(msgs);

        // Mark channel as read only if it has unread messages
        setChannels((prev) => {
          const target = prev.find((c) => c.id === targetId);
          if (target && (target.unreadCount || 0) > 0) {
            api.markChannelAsRead(targetId).catch(() => {});
            return prev.map((c) => (c.id === targetId ? { ...c, unreadCount: 0 } : c));
          }
          return prev;
        });
      } catch (err: any) {
        if (!silent) {
          console.warn('Initial fetch for channel messages failed, attempting automatic recovery...', err);
          try {
            // Automatic retry with backoff for resilience against transient hiccups
            await new Promise((resolve) => setTimeout(resolve, 600));
            const retryMsgs = await api.getChatMessages(targetId);
            setMessages(retryMsgs);
            setMessagesError(null);
            setChannels((prev) => {
              const target = prev.find((c) => c.id === targetId);
              if (target && (target.unreadCount || 0) > 0) {
                api.markChannelAsRead(targetId).catch(() => {});
                return prev.map((c) => (c.id === targetId ? { ...c, unreadCount: 0 } : c));
              }
              return prev;
            });
          } catch (retryErr: any) {
            console.error('Failed to fetch channel messages after retry:', retryErr);
            setMessagesError(retryErr?.message || 'Failed to load messages');
          }
        }
      } finally {
        if (!silent) {
          setIsMessagesLoading(false);
        }
      }
    },
    [activeChannelId, currentUser]
  );

  useEffect(() => {
    if (activeChannelId) {
      refreshMessages(activeChannelId);
    }
  }, [activeChannelId, refreshMessages]);

  // Periodic polling for incoming team chat messages & channel updates
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      try {
        const fetchedChannels = await api.getChatChannels();
        setChannels(fetchedChannels);

        // Detect if any other channel received unread messages
        const currentTotalUnread = fetchedChannels.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        if (currentTotalUnread > lastUnreadCountRef.current) {
          playChatMessageSound();
        }
        lastUnreadCountRef.current = currentTotalUnread;

        // Silently poll current channel messages
        if (activeChannelId) {
          refreshMessages(activeChannelId, true);
        }
      } catch {
        // Ignore background polling errors
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser, activeChannelId, refreshMessages]);

  // Active channel object
  const activeChannel = useMemo(() => {
    return channels.find((c) => c.id === activeChannelId) || null;
  }, [channels, activeChannelId]);

  // Total unread count
  const totalUnreadCount = useMemo(() => {
    return channels.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [channels]);

  // Send message
  const sendMessage = useCallback(
    async (data: {
      content?: string;
      replyToId?: string;
      attachments?: ChatMessageAttachment[];
      voiceNote?: VoiceNoteData;
      linkedTaskId?: string;
      mentions?: string[];
    }): Promise<ChatMessage | null> => {
      if (!activeChannelId) return null;
      try {
        const newMsg = await api.sendChatMessage(activeChannelId, data);
        knownMessageIdsRef.current.add(newMsg.id);
        setMessages((prev) => [...prev, newMsg]);

        // Play subtle acoustic sent confirmation
        playMessageSentSound();

        // Award gamification XP for chatting / collaborating!
        awardXP(15, 'Collaborated in Team Chat');

        // Update lastMessage on channel
        setChannels((prev) =>
          prev.map((c) =>
            c.id === activeChannelId
              ? {
                  ...c,
                  updatedAt: newMsg.createdAt,
                  lastMessage: {
                    id: newMsg.id,
                    senderName: newMsg.senderName,
                    content: newMsg.voiceNote
                      ? '🎤 Voice message'
                      : newMsg.content || '📎 Attachment',
                    createdAt: newMsg.createdAt
                  }
                }
              : c
          )
        );

        return newMsg;
      } catch (err) {
        console.error('Failed to send chat message:', err);
        return null;
      }
    },
    [activeChannelId, awardXP]
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, content: string): Promise<boolean> => {
      if (!activeChannelId) return false;
      try {
        const updated = await api.editChatMessage(activeChannelId, messageId, content);
        setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
        return true;
      } catch (err) {
        console.error('Failed to edit chat message:', err);
        return false;
      }
    },
    [activeChannelId]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      if (!activeChannelId) return false;
      try {
        await api.deleteChatMessage(activeChannelId, messageId);
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        return true;
      } catch (err) {
        console.error('Failed to delete message:', err);
        return false;
      }
    },
    [activeChannelId]
  );

  // Toggle emoji reaction
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string): Promise<void> => {
      if (!activeChannelId) return;
      try {
        const updated = await api.toggleMessageReaction(activeChannelId, messageId, emoji);
        setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
      } catch (err) {
        console.error('Failed to toggle reaction:', err);
      }
    },
    [activeChannelId]
  );

  // Toggle pin message
  const togglePinMessage = useCallback(
    async (messageId: string): Promise<void> => {
      if (!activeChannelId) return;
      try {
        const res = await api.togglePinMessage(activeChannelId, messageId);
        setMessages((prev) => prev.map((m) => (m.id === messageId ? res.message : m)));
        setChannels((prev) =>
          prev.map((c) =>
            c.id === activeChannelId ? { ...c, pinnedMessageIds: res.pinnedMessageIds } : c
          )
        );
      } catch (err) {
        console.error('Failed to toggle pin:', err);
      }
    },
    [activeChannelId]
  );

  // Create Channel / Group
  const createChannel = useCallback(
    async (data: {
      name: string;
      description?: string;
      topic?: string;
      type?: 'channel' | 'group_dm';
      isPrivate?: boolean;
      memberIds?: string[];
      color?: string;
    }): Promise<ChatChannel | null> => {
      try {
        const created = await api.createChatChannel(data);
        setChannels((prev) => [created, ...prev]);
        setActiveChannelId(created.id);
        awardXP(30, `Created Channel #${created.name}`);
        return created;
      } catch (err) {
        console.error('Failed to create channel:', err);
        throw err;
      }
    },
    [awardXP]
  );

  // Update Channel
  const updateChannel = useCallback(
    async (id: string, data: Partial<ChatChannel>): Promise<ChatChannel | null> => {
      try {
        const updated = await api.updateChatChannel(id, data);
        setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
        return updated;
      } catch (err) {
        console.error('Failed to update channel:', err);
        throw err;
      }
    },
    []
  );

  // Delete Channel
  const deleteChannel = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await api.deleteChatChannel(id);
        setChannels((prev) => prev.filter((c) => c.id !== id));
        if (activeChannelId === id) {
          const fallback = channels.find((c) => c.id !== id);
          setActiveChannelId(fallback ? fallback.id : null);
        }
        return true;
      } catch (err) {
        console.error('Failed to delete channel:', err);
        throw err;
      }
    },
    [activeChannelId, channels]
  );

  // Start direct chat with user
  const startDirectChat = useCallback(
    async (targetUserId: string): Promise<ChatChannel | null> => {
      try {
        const dm = await api.startDirectChat(targetUserId);
        setChannels((prev) => {
          if (prev.some((c) => c.id === dm.id)) {
            return prev.map((c) => (c.id === dm.id ? { ...c, ...dm } : c));
          }
          return [dm, ...prev];
        });
        setActiveChannelId(dm.id);
        return dm;
      } catch (err) {
        console.error('Failed to start direct message:', err);
        return null;
      }
    },
    []
  );

  // Mark channel as read
  const markAsRead = useCallback(async (channelId: string) => {
    try {
      await api.markChannelAsRead(channelId);
      setChannels((prev) =>
        prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to mark channel as read:', err);
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        channels,
        activeChannelId,
        activeChannel,
        messages,
        isLoading,
        isMessagesLoading,
        messagesError,
        totalUnreadCount,
        searchQuery,
        setSearchQuery,
        channelCategoryFilter,
        setChannelCategoryFilter,
        setActiveChannelId,
        refreshChannels,
        refreshMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        togglePinMessage,
        createChannel,
        updateChannel,
        deleteChannel,
        startDirectChat,
        markAsRead,
        pendingTaskShare,
        setPendingTaskShare,
        isCreateChannelModalOpen,
        setIsCreateChannelModalOpen,
        isChannelDetailsOpen,
        setIsChannelDetailsOpen
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
