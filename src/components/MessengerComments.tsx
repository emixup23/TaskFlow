import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  Smile,
  AtSign,
  Trash2,
  Copy,
  Check,
  Reply,
  MessageSquare,
  Search,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { Comment, Task, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { UserAvatar } from './UserAvatar';

interface MessengerCommentsProps {
  task: Task;
  canEdit?: boolean;
}

// Preset Quick Reaction Emojis
const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '🔥', '🚀', '🎉', '💡', '👏'];

// Categorized Emojis for the Full Picker
const EMOJI_CATEGORIES = [
  {
    name: 'Frequent',
    icon: '⚡',
    emojis: ['👍', '❤️', '🔥', '🚀', '🎉', '😂', '💡', '👏', '🙌', '💯', '✨', '👀', '✅', '⚡']
  },
  {
    name: 'Smileys & Gestures',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉',
      '😊', '😇', '🥰', '😍', '🤩', '😘', '😋', '😎', '🥳', '😏',
      '🤔', '🤫', '🫡', '🤝', '🙌', '👏', '👍', '👎', '👊', '✌️',
      '👌', '🤙', '👋', '💪', '🙏', '❤️', '💖', '🔥', '💯', '✨'
    ]
  },
  {
    name: 'Work & Tech',
    icon: '💻',
    emojis: [
      '💻', '🖥️', '⌨️', '📱', '⚙️', '🔧', '🔨', '📊', '📈', '📋',
      '📁', '📂', '🔒', '🔑', '💡', '📝', '📌', '📎', '🗓️', '📅',
      '⏱️', '⏳', '🔍', '📦', '🚀', '🛡️', '🏷️', '📚', '🧪', '🛠️'
    ]
  },
  {
    name: 'Status & Symbols',
    icon: '🎯',
    emojis: [
      '✅', '❌', '⚠️', '🚨', '🛑', '🎯', '🏆', '⭐', '🌟', '💥',
      '🎉', '🎊', '🔔', '📣', '💬', '💭', '💙', '💜', '💚', '💛',
      '🧡', '🖤', '🤍', '⚡', '🌈', '☀️', '☕', '🍕', '🍻', '🎈'
    ]
  }
];

export const MessengerComments: React.FC<MessengerCommentsProps> = ({ task, canEdit = true }) => {
  const { currentUser, isAdmin, users } = useAuth();
  const { addComment, deleteComment, toggleCommentReaction, addToast } = useTasks();

  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCategory, setActiveEmojiCategory] = useState(0);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [copiedCommentId, setCopiedCommentId] = useState<string | null>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionCursorPos, setMentionCursorPos] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const mentionMenuRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages container
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [task.id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [task.comments?.length]);

  // Close emoji picker and mention menu on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        !emojiButtonRef.current?.contains(target)
      ) {
        setShowEmojiPicker(false);
      }
      if (mentionMenuRef.current && !mentionMenuRef.current.contains(target)) {
        setMentionQuery(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEmojiPicker(false);
        setMentionQuery(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter users for @mention autocomplete
  const mentionableUsers = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    const list: (User | { id: string; name: string; email: string; avatar: string; title: string; isSpecial?: boolean })[] = [];

    // Special system mentions
    if ('everyone'.includes(q) || 'all'.includes(q) || 'team'.includes(q) || q === '') {
      list.push({
        id: 'mention-all',
        name: 'everyone',
        email: 'Notify all task assignees',
        avatar: '',
        title: 'Notify all task members',
        isSpecial: true
      });
    }

    users.forEach((u) => {
      if (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q)
      ) {
        list.push(u);
      }
    });

    return list;
  }, [mentionQuery, users]);

  // Handle textarea change and check for @mention triggers
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    setCommentText(val);

    // Look backward from cursor for '@'
    const textBeforeCursor = val.slice(0, pos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_-]*)$/);

    if (match) {
      setMentionQuery(match[1]);
      setMentionCursorPos(pos - match[0].length);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  };

  // Insert selected mention into textarea
  const insertMention = (user: { name: string; id: string; isSpecial?: boolean }) => {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBeforeCursor = commentText.slice(0, pos);
    const textAfterCursor = commentText.slice(pos);

    const mentionPrefixIndex = textBeforeCursor.lastIndexOf('@');
    if (mentionPrefixIndex !== -1) {
      const mentionText = user.isSpecial ? `@everyone ` : `@${user.name} `;
      const newText = textBeforeCursor.slice(0, mentionPrefixIndex) + mentionText + textAfterCursor;
      setCommentText(newText);
      setMentionQuery(null);

      setTimeout(() => {
        if (textareaRef.current) {
          const newPos = mentionPrefixIndex + mentionText.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newPos, newPos);
        }
      }, 0);
    }
  };

  // Insert emoji into textarea
  const insertEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setCommentText((prev) => prev + emoji);
      return;
    }
    const pos = textareaRef.current.selectionStart;
    const before = commentText.slice(0, pos);
    const after = commentText.slice(pos);
    const newText = before + emoji + after;
    setCommentText(newText);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(pos + emoji.length, pos + emoji.length);
      }
    }, 0);
  };

  // Handle keyboard navigation in textarea (for mentions and Cmd+Enter send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (mentionQuery !== null && mentionableUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % mentionableUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + mentionableUsers.length) % mentionableUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = mentionableUsers[mentionIndex];
        if (selected) {
          insertMention(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    // Send comment with Enter (unless Shift is pressed)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Submit comment
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!commentText.trim()) return;

    // Detect mentioned users
    const mentionedNames: string[] = [];
    const mentionRegex = /@([a-zA-Z0-9_ -]+?)(?=\s|$|[.,!?])/g;
    let match;
    while ((match = mentionRegex.exec(commentText)) !== null) {
      mentionedNames.push(match[1].trim());
    }

    const mentions = users
      .filter((u) => mentionedNames.some((m) => m.toLowerCase() === u.name.toLowerCase()))
      .map((u) => u.id);

    const textToPost = commentText;
    setCommentText('');
    setShowEmojiPicker(false);
    setMentionQuery(null);

    await addComment(task.id, textToPost, mentions);
    setTimeout(() => scrollToBottom(true), 100);
  };

  // Copy comment text
  const handleCopyComment = (comment: Comment) => {
    navigator.clipboard.writeText(comment.content);
    setCopiedCommentId(comment.id);
    addToast('info', 'Comment text copied');
    setTimeout(() => setCopiedCommentId(null), 2000);
  };

  // Reply to author
  const handleReplyTo = (comment: Comment) => {
    const mentionTag = `@${comment.userName} `;
    setCommentText((prev) => {
      if (prev.includes(mentionTag)) return prev;
      return `${mentionTag}${prev}`;
    });
    textareaRef.current?.focus();
  };

  // Helper to format date in friendly Messenger format
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return `Today at ${timeStr}`;
    if (isYesterday) return `Yesterday at ${timeStr}`;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  // Check if string is only 1-3 emojis (for large display)
  const isOnlyEmojis = (str: string) => {
    const trimmed = str.trim();
    if (!trimmed || trimmed.length > 10) return false;
    const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\s)+$/u;
    return emojiRegex.test(trimmed) && trimmed.replace(/\s+/g, '').length <= 6;
  };

  // Render text with interactive formatted mentions and links
  const renderMessageContent = (content: string, isOutgoing: boolean) => {
    // Split by mention pattern @UserName or @everyone
    const parts = content.split(/(@[a-zA-Z0-9_\s.-]+?(?=\s|$|[.,!?]))/g);

    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        const rawName = part.substring(1).trim();
        const isSelf = currentUser && (rawName.toLowerCase() === currentUser.name.toLowerCase());
        const isAll = rawName.toLowerCase() === 'everyone' || rawName.toLowerCase() === 'all' || rawName.toLowerCase() === 'team';

        return (
          <span
            key={idx}
            className={`inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded text-[11px] mx-0.5 transition-colors cursor-pointer ${
              isOutgoing
                ? 'bg-blue-800 text-blue-100 ring-1 ring-blue-400/40 hover:bg-blue-700'
                : isSelf
                ? 'bg-blue-500/25 text-blue-300 ring-1 ring-blue-500/50 hover:bg-blue-500/35 font-bold'
                : isAll
                ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40 hover:bg-amber-500/30'
                : 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30 hover:bg-blue-500/30'
            }`}
            title={`Mention: ${rawName}`}
          >
            <AtSign className="w-2.5 h-2.5 opacity-80" />
            {rawName}
          </span>
        );
      }
      return part;
    });
  };

  // Filtered emojis for picker search
  const displayedEmojis = useMemo(() => {
    if (!emojiSearch.trim()) {
      return EMOJI_CATEGORIES[activeEmojiCategory].emojis;
    }
    const q = emojiSearch.toLowerCase();
    const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
    return Array.from(new Set(all));
  }, [emojiSearch, activeEmojiCategory]);

  return (
    <div className="flex flex-col h-[520px] bg-[#111111] rounded-lg border border-[#262626] overflow-hidden">
      
      {/* Messenger Header Bar */}
      <div className="px-4 py-2.5 bg-[#161616] border-b border-[#262626] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#161616]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white">Task Discussion</h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#242424] text-neutral-400 border border-[#333333] font-mono">
                {task.comments?.length || 0}
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              Mention teammates with <span className="text-blue-400 font-semibold">@name</span> • React with emojis
            </p>
          </div>
        </div>

        {/* Participant Avatars */}
        <div className="flex items-center -space-x-1.5 overflow-hidden">
          {task.assigneeIds.map((uid) => {
            const u = users.find((user) => user.id === uid);
            if (!u) return null;
            return (
              <div key={uid} title={u.name} className="ring-2 ring-[#161616] rounded-full">
                <UserAvatar user={u} size="xs" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin bg-radial from-[#141414] to-[#0e0e0e]">
        {task.comments && task.comments.length > 0 ? (
          task.comments.map((comment, index) => {
            const isOutgoing = comment.userId === currentUser?.id;
            const commentUser = users.find((u) => u.id === comment.userId);
            const isBigEmoji = isOnlyEmojis(comment.content);
            const reactionsMap: Record<string, string[]> = comment.reactions || {};
            const reactionEntries: [string, string[]][] = Object.entries(reactionsMap).filter(([_, uids]) => Array.isArray(uids) && uids.length > 0);
            const canDelete = isAdmin || comment.userId === currentUser?.id;

            return (
              <div
                key={comment.id || index}
                id={`comment-item-${comment.id}`}
                className={`group flex flex-col ${isOutgoing ? 'items-end' : 'items-start'} transition-all`}
              >
                {/* Incoming Message User Header */}
                {!isOutgoing && (
                  <div className="flex items-center gap-2 mb-1 pl-1">
                    <UserAvatar
                      user={commentUser}
                      avatar={comment.userAvatar}
                      name={comment.userName}
                      id={comment.userId}
                      size="xs"
                      className="rounded-full ring-1 ring-[#333333]"
                    />
                    <span className="text-xs font-bold text-neutral-300">{comment.userName}</span>
                    {commentUser?.title && (
                      <span className="text-[10px] text-neutral-500 hidden sm:inline">• {commentUser.title}</span>
                    )}
                    <span className="text-[10px] text-neutral-500">{formatMessageTime(comment.createdAt)}</span>
                  </div>
                )}

                {/* Message Bubble + Action Hover Bar Container */}
                <div className={`relative flex items-end gap-1.5 max-w-[88%] sm:max-w-[78%] ${isOutgoing ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* The Chat Bubble */}
                  <div
                    className={`relative rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-sm transition-all ${
                      isBigEmoji
                        ? 'bg-transparent text-4xl py-1 px-1 shadow-none'
                        : isOutgoing
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-[#1f1f1f] text-neutral-100 border border-[#2e2e2e] rounded-bl-xs'
                    }`}
                  >
                    {isBigEmoji ? (
                      <span className="text-3xl leading-none">{comment.content}</span>
                    ) : (
                      <div className="whitespace-pre-wrap">{renderMessageContent(comment.content, isOutgoing)}</div>
                    )}

                    {/* Reactions Pill Display below bubble */}
                    {reactionEntries.length > 0 && (
                      <div
                        className={`flex flex-wrap gap-1 mt-1.5 pt-1 border-t ${
                          isOutgoing ? 'border-blue-500/40 justify-end' : 'border-[#2e2e2e] justify-start'
                        }`}
                      >
                        {reactionEntries.map(([emoji, userIds]) => {
                          const hasReacted = currentUser && userIds.includes(currentUser.id);
                          const reactingNames = userIds
                            .map((uid) => (uid === currentUser?.id ? 'You' : users.find((u) => u.id === uid)?.name || 'Team member'))
                            .join(', ');

                          return (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => toggleCommentReaction(task.id, comment.id, emoji)}
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border font-medium transition-transform active:scale-95 cursor-pointer ${
                                hasReacted
                                  ? isOutgoing
                                    ? 'bg-blue-800 border-blue-400 text-white shadow-xs'
                                    : 'bg-blue-950/80 border-blue-600 text-blue-300 shadow-xs'
                                  : isOutgoing
                                  ? 'bg-blue-700/60 border-blue-500/40 text-blue-100 hover:bg-blue-700'
                                  : 'bg-[#181818] border-[#333333] text-neutral-400 hover:text-white hover:bg-[#242424]'
                              }`}
                              title={`Reacted by: ${reactingNames}`}
                            >
                              <span className="text-sm leading-none">{emoji}</span>
                              <span className="font-semibold text-[10px]">{userIds.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Messenger Hover Action Bar */}
                  <div
                    className={`opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center gap-1 bg-[#1c1c1c] border border-[#333333] rounded-full p-1 shadow-lg shrink-0 z-10 ${
                      isOutgoing ? 'mb-1' : 'mb-1'
                    }`}
                  >
                    {/* Quick Reactions Bar */}
                    <div className="flex items-center gap-0.5 pr-1 border-r border-[#2b2b2b]">
                      {['👍', '❤️', '🔥', '🎉'].map((emoji) => {
                        const hasReacted = currentUser && comment.reactions?.[emoji]?.includes(currentUser.id);
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleCommentReaction(task.id, comment.id, emoji)}
                            className={`p-1 hover:scale-125 transition-transform text-base rounded hover:bg-[#282828] cursor-pointer ${
                              hasReacted ? 'bg-blue-950/60 ring-1 ring-blue-500' : ''
                            }`}
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>

                    {/* Reply / Mention Author */}
                    <button
                      type="button"
                      onClick={() => handleReplyTo(comment)}
                      className="p-1 text-neutral-400 hover:text-white hover:bg-[#282828] rounded-full transition-colors cursor-pointer"
                      title={`Reply to ${comment.userName}`}
                    >
                      <Reply className="w-3 h-3" />
                    </button>

                    {/* Copy text */}
                    <button
                      type="button"
                      onClick={() => handleCopyComment(comment)}
                      className="p-1 text-neutral-400 hover:text-white hover:bg-[#282828] rounded-full transition-colors cursor-pointer"
                      title="Copy comment text"
                    >
                      {copiedCommentId === comment.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>

                    {/* Delete Comment */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete this comment?')) {
                            deleteComment(task.id, comment.id);
                          }
                        }}
                        className="p-1 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Outgoing Message Timestamp & Status */}
                {isOutgoing && (
                  <div className="flex items-center gap-1.5 mt-1 pr-1 text-[10px] text-neutral-500">
                    <span>{formatMessageTime(comment.createdAt)}</span>
                    <span>•</span>
                    <span className="text-blue-400 font-medium">Sent</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-neutral-500 space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#181818] border border-[#2b2b2b] flex items-center justify-center text-neutral-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-300">No messages yet</h4>
            <p className="text-xs text-neutral-500 max-w-xs">
              Start the discussion! Type a comment below, tag a colleague with <strong className="text-neutral-400">@</strong>, or share project updates.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Mention Autocomplete Dropdown */}
      {mentionQuery !== null && mentionableUsers.length > 0 && (
        <div
          ref={mentionMenuRef}
          id="mention-autocomplete-menu"
          className="mx-3 mb-1 bg-[#1a1a1a] rounded-lg shadow-2xl border border-[#333333] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto"
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase text-neutral-400 tracking-wider flex items-center justify-between border-b border-[#2b2b2b] mb-1">
            <span>Mention Team Member</span>
            <span className="text-neutral-500">↑↓ to navigate • Enter to select</span>
          </div>

          <div className="space-y-0.5">
            {mentionableUsers.map((u, idx) => (
              <button
                key={u.id}
                type="button"
                onClick={() => insertMention(u)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded text-left transition-colors cursor-pointer ${
                  idx === mentionIndex ? 'bg-blue-600 text-white' : 'hover:bg-[#262626] text-neutral-200'
                }`}
              >
                {u.isSpecial ? (
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-300 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                ) : (
                  <UserAvatar
                    user={u as User}
                    avatar={u.avatar}
                    name={u.name}
                    id={u.id}
                    size="xs"
                    className="shrink-0"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate">{u.name}</span>
                    {u.isSpecial && (
                      <span className="text-[9px] bg-amber-900/60 text-amber-200 px-1 rounded">ALL</span>
                    )}
                  </div>
                  <p className={`text-[10px] truncate ${idx === mentionIndex ? 'text-blue-100' : 'text-neutral-400'}`}>
                    {u.title || u.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          ref={emojiPickerRef}
          id="messenger-emoji-picker"
          className="mx-3 mb-2 bg-[#181818] rounded-xl shadow-2xl border border-[#333333] p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-[#2b2b2b]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={emojiSearch}
                onChange={(e) => setEmojiSearch(e.target.value)}
                placeholder="Search emojis..."
                className="w-full pl-8 pr-3 py-1 text-xs bg-[#222222] border border-[#333333] rounded-md text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 text-neutral-400 hover:text-white hover:bg-[#282828] rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Tabs */}
          {!emojiSearch && (
            <div className="flex items-center gap-1 py-1.5 border-b border-[#282828] overflow-x-auto">
              {EMOJI_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setActiveEmojiCategory(idx)}
                  className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                    activeEmojiCategory === idx
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-neutral-400 hover:text-white hover:bg-[#262626]'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="text-[11px]">{cat.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Emoji Grid */}
          <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 p-1 max-h-56 overflow-y-auto scrollbar-thin mt-1">
            {displayedEmojis.map((emoji, idx) => (
              <button
                key={`${emoji}-${idx}`}
                type="button"
                onClick={() => {
                  insertEmoji(emoji);
                }}
                className="h-10 w-10 flex items-center justify-center text-2xl rounded-lg hover:bg-[#282828] hover:scale-125 transition-all cursor-pointer select-none"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Quick Reaction Bar Footer */}
          <div className="pt-2 border-t border-[#2b2b2b] flex items-center justify-between text-xs text-neutral-400">
            <span className="font-medium text-[11px]">Quick:</span>
            <div className="flex items-center gap-1.5">
              {QUICK_REACTION_EMOJIS.slice(0, 6).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => insertEmoji(e)}
                  className="hover:scale-125 transition-transform p-1 cursor-pointer text-lg"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messenger Input Footer Bar */}
      {canEdit ? (
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-[#161616] border-t border-[#262626] shrink-0 space-y-2"
        >
          {/* Quick Emoji Reaction Pill Strip */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] text-neutral-400 font-medium">Quick emojis:</span>
              {['👍', '❤️', '🔥', '🚀', '🎉', '💡'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="px-2.5 py-1 rounded-lg text-base bg-[#202020] hover:bg-[#2b2b2b] border border-[#303030] hover:scale-125 transition-all cursor-pointer select-none"
                  title={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="text-[10px] text-neutral-500 shrink-0 hidden sm:block">
              Press <kbd className="px-1 py-0.5 bg-[#222222] border border-[#333333] rounded text-neutral-300 font-mono text-[9px]">Enter</kbd> to send
            </div>
          </div>

          {/* Input Control Container */}
          <div className="flex items-end gap-2 bg-[#1f1f1f] border border-[#333333] focus-within:border-blue-500 rounded-xl p-1.5 transition-all">
            
            {/* Action Buttons (Emoji & Mention) */}
            <div className="flex items-center gap-0.5 pl-1 pb-1">
              {/* Emoji Picker Toggle Button */}
              <button
                ref={emojiButtonRef}
                type="button"
                id="btn-comment-emoji-picker"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  showEmojiPicker ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-amber-400 hover:bg-[#2a2a2a]'
                }`}
                title="Insert emoji"
              >
                <Smile className="w-4 h-4" />
              </button>

              {/* Mention @ Button */}
              <button
                type="button"
                id="btn-comment-mention"
                onClick={() => {
                  setMentionQuery('');
                  textareaRef.current?.focus();
                  setCommentText((prev) => prev + '@');
                }}
                className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer"
                title="Mention teammate (@)"
              >
                <AtSign className="w-4 h-4" />
              </button>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              id="comment-input-textarea"
              rows={2}
              value={commentText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (@ to mention, 😊 for emoji)"
              className="flex-1 bg-transparent text-xs text-white placeholder:text-neutral-500 resize-none outline-none py-1.5 px-2 max-h-32 min-h-[36px]"
            />

            {/* Send Button */}
            <button
              type="submit"
              id="btn-comment-send"
              disabled={!commentText.trim()}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-lg transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer mb-0.5"
              title="Send message"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-[#161616] border-t border-[#262626] text-center text-xs text-neutral-500 flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          <span>You must be assigned to this task or an Admin to join the discussion.</span>
        </div>
      )}

    </div>
  );
};
