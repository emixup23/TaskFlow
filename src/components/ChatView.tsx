import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { ChatMessage, ChatMessageAttachment, Priority, VoiceNoteData } from '../types';
import { UserAvatar } from './UserAvatar';
import { CreateChannelModal } from './CreateChannelModal';
import { NewDirectMessageModal } from './NewDirectMessageModal';
import { VoiceMessagePlayer } from './chat/VoiceMessagePlayer';
import { VoiceMessageRecorder } from './chat/VoiceMessageRecorder';
import {
  Hash,
  Lock,
  Users,
  Plus,
  Search,
  Pin,
  Smile,
  Paperclip,
  Send,
  Mic,
  MoreVertical,
  Reply,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  X,
  FileText,
  Image as ImageIcon,
  Download,
  Link as LinkIcon,
  AtSign,
  AlertCircle,
  Copy,
  MessageSquare,
  MessageSquarePlus,
  User as UserIcon,
  Sparkles,
  Bold,
  Italic,
  Code,
  List,
  Eye,
  Volume2,
  VolumeX
} from 'lucide-react';
import { FileViewerModal, FileViewerItem } from './FileViewerModal';
import { soundManager, playChatMessageSound } from '../utils/sound';


const POPULAR_EMOJIS = [
  '🌍', '💨', '⛄', '☔', '🔥', '🌪️', '☀️', '🌧️', '❄️', '🐉',
  '🐲', '🐮', '🐜', '🐞', '🐌', '🦋', '🐛', '🐈', '🦦', '🦝',
  '🐇', '🍎', '🍉', '🍓', '🥕', '🌶️', '🏆', '🥇', '🥈', '🥉',
  '🏅', '🎖️', '🎫', '🎯', '⚽', '🚗', '🦯', '🚜', '🛴', '🚀',
  '🌅', '📸', '☎️', '📺', '🖱️', '💾', '❤️', '☢️', '🇹🇳', '🇨🇮',
  '🇫🇷', '🇮🇹', '🇺🇲', '🇭🇲', '🇦🇺', '🇪🇸', '😀', '😄', '😁', '😅',
  '😂', '🤣', '😇', '😊', '🙂', '😍', '😘', '🥰', '😗', '😋',
  '😝', '😛', '😭', '😐', '🤫', '🤔', '😴', '😰', '😥', '😱',
  '🥵', '😳', '🤯', '🤬', '😡', '🤕', '🤑', '🤒', '😷', '🤧',
  '🤮', '🤢', '🤐', '😵‍', '😵', '😮‍', '🤤', '😪', '👾', '☠️',
  '👽', '🥱', '💀', '👻', '💩', '🤡', '👺', '👹', '😈', '🎃',
  '🤖', '😺', '😸', '😹', '😻', '😿', '😾', '👆', '👌', '👈',
  '👉', '🤜', '🤛', '✊', '👊', '👎', '👍', '🤝', '👏', '🦻',
  '👃', '👀', '🧠', '👤', '🗣️', '👴', '👵', '👨‍🦽‍', '🧑‍', '👨‍🦼',
  '👩‍❤️‍💋‍👨', '🧶', '🧤', '🕴', '🕺', '💃', '🤳', '💅', '🧚', '🧜‍',
  '🧞‍', '🧟‍', '🧛‍'
];

const isOnlyEmojis = (str: string) => {
  const trimmed = str.trim();
  if (!trimmed || trimmed.length > 20) return false;
  return /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji_Modifier}|\u200d|\ufe0f|\s)+$/u.test(trimmed);
};
export const ChatView: React.FC = () => {
  const {
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
    refreshMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    togglePinMessage,
    startDirectChat,
    setIsCreateChannelModalOpen,
    isChannelDetailsOpen,
    setIsChannelDetailsOpen,
    pendingTaskShare,
    setPendingTaskShare
  } = useChat();

  const { users, currentUser } = useAuth();
  const { tasks, setSelectedTaskId } = useTasks();

  // Local Chat Composer State
  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [stagedTask, setStagedTask] = useState<{ id: string; title: string; priority: Priority; statusName?: string } | null>(null);

  // Pick up pending task share if navigated from task modal
  useEffect(() => {
    if (pendingTaskShare) {
      setStagedTask({
        id: pendingTaskShare.id,
        title: pendingTaskShare.title,
        priority: pendingTaskShare.priority
      });
      setPendingTaskShare(null);
      textareaRef.current?.focus();
    }
  }, [pendingTaskShare, setPendingTaskShare]);
  const [stagedAttachments, setStagedAttachments] = useState<ChatMessageAttachment[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);
  const [isMentionPickerOpen, setIsMentionPickerOpen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [channelSearchTerm, setChannelSearchTerm] = useState('');
  const [activeMessageActionId, setActiveMessageActionId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isNewDmModalOpen, setIsNewDmModalOpen] = useState(false);
  const [viewerFile, setViewerFile] = useState<FileViewerItem | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isChatAudioEnabled, setIsChatAudioEnabled] = useState(soundManager.isChatSoundEnabled());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerContainerRef = useRef<HTMLDivElement>(null);
  const taskPickerContainerRef = useRef<HTMLDivElement>(null);
  const mentionPickerContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  // Close emoji picker, task picker, and mention picker when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (emojiPickerContainerRef.current && !emojiPickerContainerRef.current.contains(target)) {
        setIsEmojiPickerOpen(false);
      }
      if (taskPickerContainerRef.current && !taskPickerContainerRef.current.contains(target)) {
        setIsTaskPickerOpen(false);
      }
      if (mentionPickerContainerRef.current && !mentionPickerContainerRef.current.contains(target)) {
        setIsMentionPickerOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEmojiPickerOpen(false);
        setIsTaskPickerOpen(false);
        setIsMentionPickerOpen(false);
      }
    };

    if (isEmojiPickerOpen || isTaskPickerOpen || isMentionPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isEmojiPickerOpen, isTaskPickerOpen, isMentionPickerOpen]);

  // Filter channels in sidebar
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      // Category filter
      if (channelCategoryFilter === 'channels' && c.type !== 'channel') return false;
      if (channelCategoryFilter === 'direct' && c.type !== 'direct' && c.type !== 'group_dm') return false;

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.displayName && c.displayName.toLowerCase().includes(q)) ||
        (c.topic && c.topic.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    });
  }, [channels, channelCategoryFilter, searchQuery]);

  // Separate channels into standard channels, group DMs, and direct messages
  const publicAndPrivateChannels = filteredChannels.filter((c) => c.type === 'channel');
  const groupDmChannels = filteredChannels.filter((c) => c.type === 'group_dm');
  const directMessageChannels = filteredChannels.filter((c) => c.type === 'direct');

  // Filter messages in current channel (search within channel or pinned only)
  const filteredMessages = useMemo(() => {
    let result = messages;
    if (showPinnedOnly) {
      result = result.filter((m) => m.isPinned);
    }
    if (channelSearchTerm.trim()) {
      const term = channelSearchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.content.toLowerCase().includes(term) ||
          m.senderName.toLowerCase().includes(term) ||
          (m.linkedTaskTitle && m.linkedTaskTitle.toLowerCase().includes(term))
      );
    }
    return result;
  }, [messages, showPinnedOnly, channelSearchTerm]);

  // Format message timestamps
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDateHeader = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Today';
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  // Group messages by Date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: ChatMessage[] }[] = [];
    let currentDate = '';
    let currentGroup: ChatMessage[] = [];

    filteredMessages.forEach((msg) => {
      const dateStr = formatDateHeader(msg.createdAt);
      if (dateStr !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, items: currentGroup });
        }
        currentDate = dateStr;
        currentGroup = [msg];
      } else {
        currentGroup.push(msg);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, items: currentGroup });
    }

    return groups;
  }, [filteredMessages]);

  // Handle Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = messageInput.trim();
    if (!clean && stagedAttachments.length === 0 && !stagedTask) return;

    // Detect user mentions in text (@Name)
    const mentions: string[] = [];
    users.forEach((u) => {
      if (clean.includes(`@${u.name}`)) {
        mentions.push(u.id);
      }
    });

    await sendMessage({
      content: clean,
      replyToId: replyingTo?.id,
      attachments: stagedAttachments.length > 0 ? stagedAttachments : undefined,
      linkedTaskId: stagedTask?.id,
      mentions: mentions.length > 0 ? mentions : undefined
    });

    setMessageInput('');
    setReplyingTo(null);
    setStagedTask(null);
    setStagedAttachments([]);
    setIsEmojiPickerOpen(false);
    setIsTaskPickerOpen(false);
    setIsMentionPickerOpen(false);
  };

  // Handle Send Voice Message
  const handleSendVoiceMessage = async (voiceNote: VoiceNoteData, textCaption?: string) => {
    // Detect mentions if caption is provided
    const mentions: string[] = [];
    if (textCaption) {
      users.forEach((u) => {
        if (textCaption.includes(`@${u.name}`)) {
          mentions.push(u.id);
        }
      });
    }

    await sendMessage({
      content: textCaption || undefined,
      voiceNote,
      replyToId: replyingTo?.id,
      linkedTaskId: stagedTask?.id,
      mentions: mentions.length > 0 ? mentions : undefined
    });

    setIsRecordingVoice(false);
    setReplyingTo(null);
    setStagedTask(null);
  };

  // Handle File Attachment Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const MAX_SIZE = 1024 * 1024; // 1024 KB

    if (file.size > MAX_SIZE) {
      alert(`File size exceeds 1024 KB limit (${(file.size / 1024).toFixed(1)} KB). Please choose a smaller file.`);
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type || (ext === 'pdf' ? 'application/pdf' : ext === 'csv' ? 'text/csv' : ext === 'txt' ? 'text/plain' : 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const rawBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const newAtt: ChatMessageAttachment = {
        id: `att-${Date.now()}`,
        name: file.name,
        size: file.size,
        type: mimeType,
        url: dataUrl,
        downloadUrl: dataUrl,
        base64Data: rawBase64
      };
      setStagedAttachments((prev) => [...prev, newAtt]);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Text formatting helpers
  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    if (!textareaRef.current) return;
    const { selectionStart, selectionEnd, value } = textareaRef.current;
    const selected = value.substring(selectionStart, selectionEnd);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const nextVal = value.substring(0, selectionStart) + replacement + value.substring(selectionEnd);
    setMessageInput(nextVal);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        selectionStart + prefix.length,
        selectionStart + prefix.length + (selected ? selected.length : 4)
      );
    }, 10);
  };

  // Copy message text
  const handleCopyMessage = (msg: ChatMessage) => {
    navigator.clipboard.writeText(msg.content);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Start direct message from roster
  const handleStartDm = async (targetUserId: string) => {
    await startDirectChat(targetUserId);
  };

  const getPriorityBadge = (priority?: Priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-500/20 text-red-400 rounded">Urgent</span>;
      case 'high':
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-400 rounded">High</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400 rounded">Medium</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-neutral-700/50 text-neutral-400 rounded">Low</span>;
    }
  };

  return (
    <div id="view-chat-collaboration" className="flex-1 flex h-full overflow-hidden bg-[#0d0d0d]">
      {/* ------------------------------------------------------------- */}
      {/* LEFT SIDEBAR: Channels, Groups & Direct Messages Roster       */}
      {/* ------------------------------------------------------------- */}
      <aside className={`w-full md:w-72 bg-[#121212] border-r border-[#262626] flex flex-col shrink-0 ${
        activeChannelId ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Top Header */}
        <div className="p-3.5 border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-neutral-100">Team Chat</h2>
            {totalUnreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                {totalUnreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="btn-open-new-direct-message"
              onClick={() => setIsNewDmModalOpen(true)}
              className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-[#222222] rounded-md transition-colors cursor-pointer"
              title="Start New Direct Message"
            >
              <MessageSquarePlus className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-create-chat-channel"
              onClick={() => setIsCreateChannelModalOpen(true)}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#222222] rounded-md transition-colors cursor-pointer"
              title="Create Channel or Group"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Channel Search */}
        <div className="p-2.5 border-b border-[#1f1f1f]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-[#181818] border border-[#262626] rounded-md pl-8 pr-2.5 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 mt-2">
            <button
              type="button"
              onClick={() => setChannelCategoryFilter('all')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                channelCategoryFilter === 'all'
                  ? 'bg-[#262626] text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setChannelCategoryFilter('channels')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                channelCategoryFilter === 'channels'
                  ? 'bg-[#262626] text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Channels
            </button>
            <button
              type="button"
              onClick={() => setChannelCategoryFilter('direct')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                channelCategoryFilter === 'direct'
                  ? 'bg-[#262626] text-white font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Direct Messages
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
          {/* Public & Private Channels */}
          {(channelCategoryFilter === 'all' || channelCategoryFilter === 'channels') && (
            <div>
              <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <span>Channels</span>
                <span className="text-[10px] text-neutral-500">{publicAndPrivateChannels.length}</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {publicAndPrivateChannels.map((c) => {
                  const isActive = c.id === activeChannelId;
                  const hasUnread = (c.unreadCount || 0) > 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
                          : hasUnread
                          ? 'text-white font-medium bg-[#1a1a1a]'
                          : 'text-neutral-300 hover:bg-[#1a1a1a] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {c.isPrivate ? (
                          <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        ) : (
                          <Hash className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        )}
                        <span className="truncate">{c.name}</span>
                      </div>
                      {hasUnread && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-600 text-white rounded-full shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Group DMs */}
          {(channelCategoryFilter === 'all' || channelCategoryFilter === 'direct') && groupDmChannels.length > 0 && (
            <div>
              <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <span>Group Chats</span>
                <span className="text-[10px] text-neutral-500">{groupDmChannels.length}</span>
              </div>
              <div className="space-y-0.5 mt-1">
                {groupDmChannels.map((c) => {
                  const isActive = c.id === activeChannelId;
                  const hasUnread = (c.unreadCount || 0) > 0;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
                          : hasUnread
                          ? 'text-white font-medium bg-[#1a1a1a]'
                          : 'text-neutral-300 hover:bg-[#1a1a1a] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{c.name}</span>
                      </div>
                      {hasUnread && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-600 text-white rounded-full shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Direct Messages */}
          {(channelCategoryFilter === 'all' || channelCategoryFilter === 'direct') && (
            <div>
              <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Direct Messages</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-neutral-500">{directMessageChannels.length}</span>
                  <button
                    type="button"
                    id="btn-add-direct-message"
                    onClick={() => setIsNewDmModalOpen(true)}
                    className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-[#222] rounded transition-colors cursor-pointer"
                    title="Start new Direct Message"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="space-y-0.5 mt-1">
                {directMessageChannels.map((c) => {
                  const isActive = c.id === activeChannelId;
                  const hasUnread = (c.unreadCount || 0) > 0;
                  const otherUserId = c.memberIds.find((id) => id !== currentUser?.id) || c.memberIds[0];
                  const otherUser = users.find((u) => u.id === otherUserId);

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveChannelId(c.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-all cursor-pointer ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20'
                          : hasUnread
                          ? 'text-white font-medium bg-[#1a1a1a]'
                          : 'text-neutral-300 hover:bg-[#1a1a1a] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          <UserAvatar
                            name={otherUser?.name || c.displayName || 'User'}
                            avatar={otherUser?.avatar}
                            size="xs"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-[#121212]" />
                        </div>
                        <div className="min-w-0">
                          <span className="truncate block font-medium">
                            {otherUser?.name || c.displayName || c.name}
                          </span>
                        </div>
                      </div>
                      {hasUnread && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold bg-blue-600 text-white rounded-full shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Member Quick-Start List */}
          {channelCategoryFilter === 'direct' && directMessageChannels.length === 0 && (
            <div className="p-3 text-center text-neutral-500">
              <p>No direct messages yet.</p>
              <button
                type="button"
                id="btn-empty-start-dm"
                onClick={() => setIsNewDmModalOpen(true)}
                className="mt-2 w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-4 h-4" />
                <span>Start Direct Message</span>
              </button>
              <p className="mt-2 text-[11px]">Or select a team member below:</p>
              <div className="mt-2 space-y-1">
                {users
                  .filter((u) => u.id !== currentUser?.id)
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleStartDm(u.id)}
                      className="w-full flex items-center gap-2 p-1.5 bg-[#181818] hover:bg-[#202020] text-neutral-200 rounded-md transition-colors cursor-pointer"
                    >
                      <UserAvatar name={u.name} avatar={u.avatar} size="xs" />
                      <span className="truncate text-xs">{u.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* CENTER STAGE: Active Chat Room Feed & Composer               */}
      {/* ------------------------------------------------------------- */}
      <section className={`flex-1 flex flex-col min-w-0 h-full bg-[#0d0d0d] ${
        activeChannelId ? 'flex' : 'hidden md:flex'
      }`}>
        {activeChannel ? (
          <>
            {/* Top Room Banner */}
            <div className="h-14 px-3 sm:px-6 border-b border-[#262626] bg-[#121212] flex items-center justify-between gap-2 sm:gap-4 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setActiveChannelId('')}
                  className="md:hidden p-1.5 -ml-1 text-neutral-400 hover:text-white rounded-md hover:bg-[#202020] transition-colors cursor-pointer shrink-0"
                  title="Back to conversations list"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: activeChannel.color || '#3B82F6' }}
                >
                  {activeChannel.type === 'direct' ? (
                    <UserAvatar name={activeChannel.displayName || activeChannel.name} size="xs" />
                  ) : activeChannel.type === 'group_dm' ? (
                    <Users className="w-4 h-4" />
                  ) : activeChannel.isPrivate ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Hash className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm font-semibold text-neutral-100 truncate">
                      {activeChannel.displayName || activeChannel.name}
                    </h1>
                    {activeChannel.isPrivate && (
                      <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium">
                        Private
                      </span>
                    )}
                  </div>
                  {activeChannel.topic && (
                    <p className="text-[11px] text-neutral-400 truncate max-w-md hidden sm:block">
                      {activeChannel.topic}
                    </p>
                  )}
                </div>
              </div>

              {/* Room Quick Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Pinned Filter Toggle */}
                {activeChannel.pinnedMessageIds && activeChannel.pinnedMessageIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPinnedOnly((prev) => !prev)}
                    className={`px-2 py-1 text-xs rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                      showPinnedOnly
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-neutral-400 hover:text-white hover:bg-[#202020]'
                    }`}
                    title="View Pinned Messages"
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline font-medium">
                      {activeChannel.pinnedMessageIds.length} Pinned
                    </span>
                  </button>
                )}

                {/* Channel Search Input */}
                <div className="relative hidden md:block">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={channelSearchTerm}
                    onChange={(e) => setChannelSearchTerm(e.target.value)}
                    placeholder="Search in chat..."
                    className="w-36 lg:w-44 bg-[#181818] border border-[#262626] rounded-md pl-7 pr-2 py-1 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />
                  {channelSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setChannelSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Sound Alert Toggle / Test */}
                <button
                  type="button"
                  id="btn-toggle-chat-sound"
                  onClick={() => {
                    const next = !isChatAudioEnabled;
                    soundManager.setChatSoundEnabled(next);
                    setIsChatAudioEnabled(next);
                    if (next) {
                      playChatMessageSound();
                    }
                  }}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    isChatAudioEnabled
                      ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-[#202020]'
                  }`}
                  title={
                    isChatAudioEnabled
                      ? 'Chat audio alerts enabled (Click to mute or test acoustic pop)'
                      : 'Chat audio alerts muted (Click to enable)'
                  }
                >
                  {isChatAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                {/* Info Panel Toggle */}
                <button
                  type="button"
                  onClick={() => setIsChannelDetailsOpen(!isChannelDetailsOpen)}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    isChannelDetailsOpen
                      ? 'bg-blue-600/15 text-blue-400'
                      : 'text-neutral-400 hover:text-white hover:bg-[#202020]'
                  }`}
                  title="Channel Info & Members"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pinned filter active notice */}
            {showPinnedOnly && (
              <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-1.5 flex items-center justify-between text-xs text-amber-300">
                <div className="flex items-center gap-2">
                  <Pin className="w-3.5 h-3.5" />
                  <span>{filteredMessages.length} pinned message(s)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinnedOnly(false)}
                  className="text-amber-400 hover:text-amber-200 underline font-medium cursor-pointer"
                >
                  Show All Messages
                </button>
              </div>
            )}

            {/* Message Feed Canvas */}
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-6 space-y-4 sm:space-y-6">
              {isMessagesLoading ? (
                <div className="flex items-center justify-center h-48 text-neutral-400 text-xs gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading messages...</span>
                </div>
              ) : messagesError ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-neutral-400 gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-neutral-200">Unable to load messages</h3>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                      {messagesError}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => refreshMessages()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <span>Retry</span>
                  </button>
                </div>
              ) : groupedMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center text-neutral-400">
                  <div className="w-12 h-12 rounded-full bg-[#181818] flex items-center justify-center mb-3 text-neutral-500">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-200">No messages yet</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                    This is the beginning of the #{activeChannel.name} conversation. Send a message or link a task to collaborate!
                  </p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.date} className="space-y-4">
                    {/* Date Divider */}
                    <div className="relative flex items-center justify-center my-4">
                      <div className="border-t border-[#262626] w-full" />
                      <span className="bg-[#181818] border border-[#262626] text-neutral-400 text-[11px] font-medium px-3 py-0.5 rounded-full z-10 shrink-0">
                        {group.date}
                      </span>
                    </div>

                    {/* Messages in Group */}
                    {group.items.map((msg) => {
                      const isSelf = msg.senderId === currentUser?.id;
                      const isEditing = editingMessageId === msg.id;
                      const isActionActive = activeMessageActionId === msg.id;

                      return (
                        <div
                          key={msg.id}
                          onMouseEnter={() => setActiveMessageActionId(msg.id)}
                          onMouseLeave={() => setActiveMessageActionId(null)}
                          className={`group relative flex gap-3 p-2.5 rounded-xl transition-colors ${
                            msg.isPinned ? 'bg-amber-950/10 border border-amber-800/20' : 'hover:bg-[#141414]'
                          }`}
                        >
                          {/* Sender Avatar */}
                          <div className="shrink-0 mt-0.5">
                            <UserAvatar name={msg.senderName} avatar={msg.senderAvatar} size="sm" />
                          </div>

                          {/* Message Content Body */}
                          <div className="flex-1 min-w-0">
                            {/* Author & Timestamp Bar */}
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-neutral-200">{msg.senderName}</span>
                              {msg.senderRole === 'admin' && (
                                <span className="text-[9px] font-bold bg-blue-600/20 text-blue-400 px-1.5 py-0.2 rounded uppercase tracking-wider">
                                  Admin
                                </span>
                              )}
                              <span className="text-[10px] text-neutral-500">{formatTime(msg.createdAt)}</span>
                              {msg.isEdited && (
                                <span className="text-[10px] text-neutral-500 italic">(edited)</span>
                              )}
                              {msg.isPinned && (
                                <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium bg-amber-500/10 px-1.5 py-0.2 rounded">
                                  <Pin className="w-2.5 h-2.5" /> Pinned
                                </span>
                              )}
                            </div>

                            {/* Reply Quote Preview */}
                            {msg.replyTo && (
                              <div className="mb-2 pl-2.5 border-l-2 border-blue-500/50 text-[11px] text-neutral-400 bg-[#181818]/60 p-1.5 rounded-r">
                                <span className="font-medium text-neutral-300">Replying to {msg.replyTo.senderName}:</span>
                                <p className="truncate text-neutral-400">{msg.replyTo.content}</p>
                              </div>
                            )}

                            {/* Linked Task Card */}
                            {msg.linkedTaskId && (
                              <div className="mb-2 p-2.5 bg-[#161616] border border-[#2a2a2a] rounded-lg max-w-md flex items-center justify-between gap-3 shadow-xs">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-mono text-neutral-400">#{msg.linkedTaskId}</span>
                                    {getPriorityBadge(msg.linkedTaskPriority)}
                                    {msg.linkedTaskStatusName && (
                                      <span
                                        className="text-[10px] font-medium px-1.5 py-0.2 rounded"
                                        style={{
                                          backgroundColor: `${msg.linkedTaskStatusColor || '#3B82F6'}20`,
                                          color: msg.linkedTaskStatusColor || '#3B82F6'
                                        }}
                                      >
                                        {msg.linkedTaskStatusName}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-xs font-semibold text-neutral-100 truncate">
                                    {msg.linkedTaskTitle || 'Task item'}
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSelectedTaskId(msg.linkedTaskId!)}
                                  className="px-2.5 py-1 text-xs font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-md transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                                >
                                  <span>View Task</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            {/* Message Text Editing Mode */}
                            {isEditing ? (
                              <div className="mt-1 space-y-2">
                                <textarea
                                  rows={2}
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full bg-[#181818] border border-blue-500 rounded-lg p-2 text-xs text-neutral-100 focus:outline-none"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      if (editingText.trim()) {
                                        await editMessage(msg.id, editingText.trim());
                                        setEditingMessageId(null);
                                      }
                                    }}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-500 cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingMessageId(null)}
                                    className="px-3 py-1 bg-[#262626] text-neutral-300 text-xs rounded hover:bg-[#333] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                {/* Voice Note Player */}
                                {msg.voiceNote && (
                                  <VoiceMessagePlayer
                                    voiceNote={msg.voiceNote}
                                    isSelf={msg.senderId === currentUser?.id}
                                  />
                                )}

                                {/* Standard or Big Emoji Message Text */}
                                {msg.content && (!msg.voiceNote || msg.content !== '🎤 Voice message') && (
                                  isOnlyEmojis(msg.content) ? (
                                    <p className="text-3xl sm:text-4xl py-1 select-none leading-relaxed break-words">
                                      {msg.content}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-neutral-200 leading-relaxed break-words whitespace-pre-wrap">
                                      {msg.content}
                                    </p>
                                  )
                                )}
                              </>
                            )}

                            {/* Attachments Display */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {msg.attachments.map((att) => {
                                  const isImage = att.type.startsWith('image/');
                                  const isPdf = att.name.toLowerCase().endsWith('.pdf') || att.type === 'application/pdf';
                                  const isCsv = att.name.toLowerCase().endsWith('.csv') || att.type === 'text/csv';
                                  return (
                                    <div
                                      key={att.id}
                                      className="p-2 bg-[#181818] border border-[#2a2a2a] rounded-lg max-w-xs flex items-center gap-2.5"
                                    >
                                      {isImage ? (
                                        <img
                                          src={att.url}
                                          alt={att.name}
                                          onClick={() => setViewerFile(att)}
                                          className="w-10 h-10 object-cover rounded border border-[#333] cursor-pointer hover:opacity-80 transition-opacity"
                                        />
                                      ) : isPdf ? (
                                        <div
                                          onClick={() => setViewerFile(att)}
                                          className="w-10 h-10 bg-rose-950/60 border border-rose-800/80 rounded flex flex-col items-center justify-center text-rose-400 shrink-0 cursor-pointer hover:bg-rose-900/60 transition-colors"
                                          title="View PDF"
                                        >
                                          <FileText className="w-4 h-4" />
                                          <span className="text-[7px] font-bold uppercase">PDF</span>
                                        </div>
                                      ) : isCsv ? (
                                        <div
                                          onClick={() => setViewerFile(att)}
                                          className="w-10 h-10 bg-emerald-950/60 border border-emerald-800/80 rounded flex flex-col items-center justify-center text-emerald-400 shrink-0 cursor-pointer hover:bg-emerald-900/60 transition-colors"
                                          title="View CSV"
                                        >
                                          <FileText className="w-4 h-4" />
                                          <span className="text-[7px] font-bold uppercase">CSV</span>
                                        </div>
                                      ) : (
                                        <div
                                          onClick={() => setViewerFile(att)}
                                          className="w-10 h-10 bg-[#242424] rounded flex items-center justify-center text-blue-400 shrink-0 cursor-pointer hover:bg-[#2e2e2e] transition-colors"
                                          title="View file"
                                        >
                                          <FileText className="w-5 h-5" />
                                        </div>
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <p
                                          onClick={() => setViewerFile(att)}
                                          className="text-xs font-medium text-neutral-200 truncate cursor-pointer hover:text-blue-400 transition-colors"
                                          title={`View ${att.name} in app`}
                                        >
                                          {att.name}
                                        </p>
                                        <p className="text-[10px] text-neutral-500">{(att.size / 1024).toFixed(1)} KB</p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => setViewerFile(att)}
                                          className="p-1 text-neutral-400 hover:text-blue-400 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                                          title="View content inside app"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                        {att.downloadUrl && (
                                          <a
                                            href={att.downloadUrl}
                                            download={att.name}
                                            className="p-1 text-neutral-400 hover:text-white hover:bg-[#262626] rounded transition-colors"
                                            title="Download"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Emoji Reactions Bar */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {Object.entries(msg.reactions).map(([emoji, userIdsList]) => {
                                  const userIds = (Array.isArray(userIdsList) ? userIdsList : []) as string[];
                                  const hasReacted = userIds.includes(currentUser?.id || '');
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => toggleReaction(msg.id, emoji)}
                                      className={`px-2.5 py-1 text-xs rounded-full border flex items-center gap-1.5 transition-all cursor-pointer ${
                                        hasReacted
                                          ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-semibold'
                                          : 'bg-[#181818] border-[#262626] text-neutral-300 hover:bg-[#222]'
                                      }`}
                                      title={userIds.join(', ')}
                                    >
                                      <span className="text-base leading-none">{emoji}</span>
                                      <span className="text-[11px] font-medium">{userIds.length}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Hover Action Toolbar */}
                          <div
                            className={`absolute top-2 right-2 flex items-center gap-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-0.5 shadow-lg transition-opacity ${
                              isActionActive ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                            }`}
                          >
                            {/* Quick emoji reacts */}
                            <button
                              type="button"
                              onClick={() => toggleReaction(msg.id, '👍')}
                              className="p-1 hover:bg-[#262626] rounded text-base hover:scale-125 transition-transform cursor-pointer"
                              title="React 👍"
                            >
                              👍
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleReaction(msg.id, '❤️')}
                              className="p-1 hover:bg-[#262626] rounded text-base hover:scale-125 transition-transform cursor-pointer"
                              title="React ❤️"
                            >
                              ❤️
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleReaction(msg.id, '🚀')}
                              className="p-1 hover:bg-[#262626] rounded text-base hover:scale-125 transition-transform cursor-pointer"
                              title="React 🚀"
                            >
                              🚀
                            </button>

                            <div className="w-[1px] h-3.5 bg-[#333] mx-0.5" />

                            {/* Reply */}
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingTo(msg);
                                textareaRef.current?.focus();
                              }}
                              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#262626] rounded transition-colors cursor-pointer"
                              title="Reply"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>

                            {/* Pin */}
                            <button
                              type="button"
                              onClick={() => togglePinMessage(msg.id)}
                              className={`p-1.5 rounded transition-colors cursor-pointer ${
                                msg.isPinned
                                  ? 'text-amber-400 hover:bg-amber-500/20'
                                  : 'text-neutral-400 hover:text-white hover:bg-[#262626]'
                              }`}
                              title={msg.isPinned ? 'Unpin message' : 'Pin message'}
                            >
                              <Pin className="w-3.5 h-3.5" />
                            </button>

                            {/* Copy */}
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg)}
                              className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#262626] rounded transition-colors cursor-pointer"
                              title="Copy text"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Edit (if author or admin) */}
                            {(isSelf || currentUser?.role === 'admin') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditingText(msg.content);
                                }}
                                className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#262626] rounded transition-colors cursor-pointer"
                                title="Edit message"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete (if author or admin) */}
                            {(isSelf || currentUser?.role === 'admin') && (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm('Delete this message?')) {
                                    await deleteMessage(msg.id);
                                  }
                                }}
                                className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-[#262626] rounded transition-colors cursor-pointer"
                                title="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ------------------------------------------------------------- */}
            {/* BOTTOM: Message Composer Bar                                  */}
            {/* ------------------------------------------------------------- */}
            <div className="p-2 sm:p-4 bg-[#121212] border-t border-[#262626]">
              {/* Replying banner */}
              {replyingTo && (
                <div className="mb-2 px-3 py-1.5 bg-[#181818] border-l-2 border-blue-500 rounded flex items-center justify-between text-xs text-neutral-300">
                  <div className="flex items-center gap-2 truncate">
                    <Reply className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Replying to <strong className="text-white">{replyingTo.senderName}</strong>:</span>
                    <span className="text-neutral-400 truncate">{replyingTo.content}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Linked Task Banner */}
              {stagedTask && (
                <div className="mb-2 px-3 py-1.5 bg-[#181818] border border-blue-500/30 rounded-lg flex items-center justify-between text-xs text-neutral-200">
                  <div className="flex items-center gap-2 truncate">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>Attaching Task: <strong className="text-white">#{stagedTask.id} {stagedTask.title}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStagedTask(null)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Staged Attachments */}
              {stagedAttachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {stagedAttachments.map((att, idx) => (
                    <div
                      key={att.id}
                      className="px-2.5 py-1 bg-[#181818] border border-[#2a2a2a] rounded-md flex items-center gap-2 text-xs text-neutral-200"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                      <span className="truncate max-w-[140px]">{att.name}</span>
                      <button
                        type="button"
                        onClick={() => setStagedAttachments((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-neutral-400 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Main Composer or Voice Recorder */}
              {isRecordingVoice ? (
                <VoiceMessageRecorder
                  onClose={() => setIsRecordingVoice(false)}
                  onSendVoice={handleSendVoiceMessage}
                />
              ) : (
                <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl focus-within:border-blue-500 transition-colors">
                  <textarea
                    ref={textareaRef}
                    rows={2}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={`Message #${activeChannel.name}...`}
                    className="w-full bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none resize-none"
                  />

                  {/* Composer Toolbar */}
                  <div className="px-3 py-2 border-t border-[#222222] flex items-center justify-between gap-2">
                    {/* Left: Formatting & Media Actions */}
                    <div className="flex items-center gap-1">
                      {/* Secondary markdown formatting hidden on mobile to avoid horizontal squishing */}
                      <span className="hidden sm:inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => wrapSelection('**')}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#262626] rounded transition-colors cursor-pointer"
                          title="Bold"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => wrapSelection('*')}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#262626] rounded transition-colors cursor-pointer"
                          title="Italic"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => wrapSelection('`')}
                          className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#262626] rounded transition-colors cursor-pointer"
                          title="Code snippet"
                        >
                          <Code className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-[1px] h-3.5 bg-[#2a2a2a] mx-1" />
                      </span>

                      {/* Emoji Popover Button */}
                      <div ref={emojiPickerContainerRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isEmojiPickerOpen ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-400 hover:text-white hover:bg-[#262626]'
                          }`}
                          title="Add emoji"
                        >
                          <Smile className="w-4 h-4" />
                        </button>

                        {isEmojiPickerOpen && (
                          <div className="absolute bottom-full left-0 mb-2 p-3 bg-[#181818] border border-[#2a2a2a] rounded-2xl shadow-2xl z-30 w-[calc(100vw-2rem)] max-w-xs sm:w-96 max-h-72 overflow-y-auto scrollbar-thin">
                            <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5">
                              {POPULAR_EMOJIS.map((em, idx) => (
                                <button
                                  key={`emoji-${idx}-${em}`}
                                  type="button"
                                  onClick={() => {
                                    setMessageInput((prev) => prev + em);
                                    setIsEmojiPickerOpen(false);
                                    textareaRef.current?.focus();
                                  }}
                                  className="h-10 w-10 flex items-center justify-center hover:bg-[#262626] hover:scale-125 rounded-xl text-2xl transition-all cursor-pointer select-none"
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* File Attachment */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.csv,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#262626] rounded transition-colors cursor-pointer"
                        title="Attach file (PDF, TXT, CSV, PNG, JPG up to 1024 KB)"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      {/* Voice Message Quick Toolbar Button */}
                      <button
                        type="button"
                        id="btn-record-voice-toolbar"
                        onClick={() => setIsRecordingVoice(true)}
                        className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded transition-colors cursor-pointer"
                        title="Record Voice Message"
                      >
                        <Mic className="w-4 h-4" />
                      </button>

                      {/* Link Task Dropdown */}
                      <div ref={taskPickerContainerRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setIsTaskPickerOpen(!isTaskPickerOpen)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isTaskPickerOpen ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-400 hover:text-white hover:bg-[#262626]'
                          }`}
                          title="Share / Link a Task"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>

                        {isTaskPickerOpen && (
                          <div className="absolute bottom-full left-0 mb-2 p-2 bg-[#181818] border border-[#2a2a2a] rounded-xl shadow-xl z-30 w-64 max-h-48 overflow-y-auto space-y-1">
                            <p className="text-[11px] font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider">
                              Select Task to Share
                            </p>
                            {tasks.map((t) => (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => {
                                  setStagedTask({ id: t.id, title: t.title, priority: t.priority });
                                  setIsTaskPickerOpen(false);
                                }}
                                className="w-full text-left p-1.5 hover:bg-[#262626] rounded text-xs text-neutral-200 truncate transition-colors cursor-pointer"
                              >
                                <span className="font-mono text-blue-400">#{t.id}</span> {t.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Mention User Dropdown */}
                      <div ref={mentionPickerContainerRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setIsMentionPickerOpen(!isMentionPickerOpen)}
                          className={`p-1.5 rounded transition-colors cursor-pointer ${
                            isMentionPickerOpen ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-400 hover:text-white hover:bg-[#262626]'
                          }`}
                          title="Mention user (@)"
                        >
                          <AtSign className="w-4 h-4" />
                        </button>

                        {isMentionPickerOpen && (
                          <div className="absolute bottom-full left-0 mb-2 p-2 bg-[#181818] border border-[#2a2a2a] rounded-xl shadow-xl z-30 w-56 max-h-48 overflow-y-auto space-y-1">
                            <p className="text-[11px] font-semibold text-neutral-400 px-2 py-1 uppercase tracking-wider">
                              Mention Team Member
                            </p>
                            {users.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  setMessageInput((prev) => `${prev}@${u.name} `);
                                  setIsMentionPickerOpen(false);
                                  textareaRef.current?.focus();
                                }}
                                className="w-full flex items-center gap-2 p-1.5 hover:bg-[#262626] rounded text-xs text-neutral-200 transition-colors cursor-pointer"
                              >
                                <UserAvatar name={u.name} avatar={u.avatar} size="xs" />
                                <span className="truncate">{u.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Voice Quick Action & Send Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="btn-voice-message-record-action"
                        onClick={() => setIsRecordingVoice(true)}
                        className="px-2.5 py-1.5 bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 hover:text-rose-300 border border-rose-800/40 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer shadow-sm shadow-rose-950/30"
                        title="Record Voice Message"
                      >
                        <Mic className="w-3.5 h-3.5 text-rose-400" />
                        <span className="hidden sm:inline text-[11px]">Voice</span>
                      </button>

                      <button
                        type="button"
                        id="btn-send-chat-message"
                        onClick={() => handleSendMessage()}
                        disabled={!messageInput.trim() && stagedAttachments.length === 0 && !stagedTask}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Send</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-neutral-400">
            <MessageSquare className="w-10 h-10 text-neutral-600 mb-3" />
            <h3 className="text-base font-semibold text-neutral-200">No conversation selected</h3>
            <p className="text-xs text-neutral-500 mt-1">Choose a channel or direct message from the sidebar to chat.</p>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* RIGHT SIDEBAR: Channel Info, Roster & Attachments Drawer      */}
      {/* ------------------------------------------------------------- */}
      {isChannelDetailsOpen && activeChannel && (
        <aside className="w-72 bg-[#121212] border-l border-[#262626] flex flex-col shrink-0 text-xs">
          {/* Drawer Header */}
          <div className="p-4 border-b border-[#262626] flex items-center justify-between">
            <h3 className="font-semibold text-neutral-100">Channel Details</h3>
            <button
              type="button"
              onClick={() => setIsChannelDetailsOpen(false)}
              className="p-1 text-neutral-400 hover:text-white hover:bg-[#202020] rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* About Card */}
            <div>
              <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">About</h4>
              <div className="p-3 bg-[#181818] border border-[#262626] rounded-lg space-y-2">
                <div>
                  <span className="text-[10px] text-neutral-500 block">Channel Name</span>
                  <span className="font-medium text-neutral-200">#{activeChannel.name}</span>
                </div>
                {activeChannel.topic && (
                  <div>
                    <span className="text-[10px] text-neutral-500 block">Topic</span>
                    <span className="text-neutral-300">{activeChannel.topic}</span>
                  </div>
                )}
                {activeChannel.description && (
                  <div>
                    <span className="text-[10px] text-neutral-500 block">Description</span>
                    <span className="text-neutral-300">{activeChannel.description}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Members Roster */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Members ({activeChannel.memberIds.length})
                </h4>
              </div>
              <div className="space-y-1">
                {activeChannel.memberIds.map((memberId) => {
                  const u = users.find((user) => user.id === memberId);
                  if (!u) return null;
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-2 bg-[#181818] border border-[#222] rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar name={u.name} avatar={u.avatar} size="xs" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-neutral-200 truncate">{u.name}</span>
                            {isSelf && <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1 rounded">You</span>}
                          </div>
                          <p className="text-[10px] text-neutral-500 truncate">{u.title}</p>
                        </div>
                      </div>
                      {!isSelf && (
                        <button
                          type="button"
                          onClick={() => handleStartDm(u.id)}
                          className="px-2 py-1 text-[10px] font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded transition-colors cursor-pointer"
                          title="Direct Message"
                        >
                          Message
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pinned Messages Summary */}
            {activeChannel.pinnedMessageIds && activeChannel.pinnedMessageIds.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Pinned Messages ({activeChannel.pinnedMessageIds.length})
                </h4>
                <div className="space-y-2">
                  {messages
                    .filter((m) => activeChannel.pinnedMessageIds?.includes(m.id))
                    .map((pm) => (
                      <div key={pm.id} className="p-2.5 bg-amber-950/20 border border-amber-800/30 rounded-lg">
                        <div className="flex items-center gap-1.5 mb-1">
                          <UserAvatar name={pm.senderName} avatar={pm.senderAvatar} size="xs" />
                          <span className="text-xs font-semibold text-neutral-200">{pm.senderName}</span>
                        </div>
                        <p className="text-xs text-neutral-300 line-clamp-2">{pm.content}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Global Create Channel Modal */}
      <CreateChannelModal />

      {/* Global New Direct Message Modal */}
      <NewDirectMessageModal
        isOpen={isNewDmModalOpen}
        onClose={() => setIsNewDmModalOpen(false)}
      />

      {/* In-App File Viewer Modal */}
      <FileViewerModal
        isOpen={Boolean(viewerFile)}
        file={viewerFile}
        onClose={() => setViewerFile(null)}
      />
    </div>
  );
};
