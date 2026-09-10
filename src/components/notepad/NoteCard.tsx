import React, { useState } from 'react';
import { Note, NoteColor } from '../../types';
import { useNotepad } from '../../context/NotepadContext';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { UserAvatar } from '../UserAvatar';
import {
  Pin,
  Lock,
  Globe,
  Users,
  Edit2,
  Trash2,
  Share2,
  MoreVertical,
  MessageSquare,
  Check,
  Tag,
  Clock,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onShare: (note: Note) => void;
  onSelect?: (note: Note) => void;
  isSelected?: boolean;
  showPalette?: boolean;
  showTags?: boolean;
  showSharingStats?: boolean;
}

const COLOR_STYLES: Record<
  NoteColor,
  {
    border: string;
    bgHover: string;
    pillBg: string;
    pillText: string;
    accentBar: string;
  }
> = {
  amber: {
    border: 'border-amber-500/30 hover:border-amber-500/60',
    bgHover: 'hover:bg-amber-950/10',
    pillBg: 'bg-amber-950/50',
    pillText: 'text-amber-300',
    accentBar: 'bg-amber-400'
  },
  blue: {
    border: 'border-blue-500/30 hover:border-blue-500/60',
    bgHover: 'hover:bg-blue-950/10',
    pillBg: 'bg-blue-950/50',
    pillText: 'text-blue-300',
    accentBar: 'bg-blue-400'
  },
  emerald: {
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    bgHover: 'hover:bg-emerald-950/10',
    pillBg: 'bg-emerald-950/50',
    pillText: 'text-emerald-300',
    accentBar: 'bg-emerald-400'
  },
  purple: {
    border: 'border-purple-500/30 hover:border-purple-500/60',
    bgHover: 'hover:bg-purple-950/10',
    pillBg: 'bg-purple-950/50',
    pillText: 'text-purple-300',
    accentBar: 'bg-purple-400'
  },
  rose: {
    border: 'border-rose-500/30 hover:border-rose-500/60',
    bgHover: 'hover:bg-rose-950/10',
    pillBg: 'bg-rose-950/50',
    pillText: 'text-rose-300',
    accentBar: 'bg-rose-400'
  },
  slate: {
    border: 'border-neutral-700 hover:border-neutral-600',
    bgHover: 'hover:bg-neutral-800/40',
    pillBg: 'bg-neutral-800',
    pillText: 'text-neutral-300',
    accentBar: 'bg-neutral-500'
  }
};

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onShare,
  onSelect,
  isSelected = false,
  showPalette = true,
  showTags = true,
  showSharingStats = true
}) => {
  const { togglePinNote, deleteNote, updateNote } = useNotepad();
  const { currentUser } = useAuth();
  const { sendMessage, channels, activeChannelId } = useChat();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [sharedToChatSuccess, setSharedToChatSuccess] = useState<boolean>(false);

  const isAuthor = currentUser?.id === note.authorId;
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isAuthor || (Boolean(note.allowCollaboration) && !note.isPrivate) || isAdmin;
  const canDelete = isAuthor || isAdmin;

  const colorConfig = COLOR_STYLES[note.color || 'amber'] || COLOR_STYLES.amber;

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePinNote(note.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDelete) return;
    if (window.confirm(`Are you sure you want to delete "${note.title}"?`)) {
      setIsDeleting(true);
      try {
        await deleteNote(note.id);
      } catch (err) {
        setIsDeleting(false);
      }
    }
  };

  const handleShareToChat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const targetChanId = activeChannelId || channels[0]?.id;
      if (!targetChanId) return;

      const snippet = note.content.length > 280 ? `${note.content.substring(0, 280)}...` : note.content;
      const messageContent = `📝 **Shared Note: ${note.title}**\n\n${snippet}\n\n*Shared from Notepad Space by ${currentUser?.name || 'teammate'}*`;

      await sendMessage(messageContent, targetChanId);
      setSharedToChatSuccess(true);
      setTimeout(() => setSharedToChatSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to share note to chat:', err);
    }
  };

  // Toggle checklist item in content
  const handleToggleChecklist = async (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return;

    let itemCounter = 0;
    const lines = note.content.split('\n');
    const newLines = lines.map((line) => {
      const checkMatch = line.match(/^(\s*[-*]\s*\[)([ xX])(\]\s*.*)$/);
      if (checkMatch) {
        if (itemCounter === index) {
          const newStatus = checkMatch[2].toLowerCase() === 'x' ? ' ' : 'x';
          line = `${checkMatch[1]}${newStatus}${checkMatch[3]}`;
        }
        itemCounter++;
      }
      return line;
    });

    try {
      await updateNote(note.id, { content: newLines.join('\n') });
    } catch (err) {
      console.error('Failed to toggle checklist line:', err);
    }
  };

  // Extract checklist items for interactive previews
  const checklistLines = note.content
    .split('\n')
    .map((line) => line.match(/^(\s*[-*]\s*\[)([ xX])(\]\s*)(.*)$/))
    .filter(Boolean) as RegExpMatchArray[];

  const plainTextContent = note.content
    .replace(/^#+\s+/gm, '')
    .replace(/[-*]\s+\[[ xX]\]\s+/g, '')
    .replace(/[*_`~>]/g, '')
    .trim();

  const cardBorderClass = showPalette
    ? colorConfig.border
    : 'border-neutral-800/80 hover:border-neutral-700';
  const cardBgHoverClass = showPalette
    ? colorConfig.bgHover
    : 'hover:bg-[#1b1b1b]';

  return (
    <div
      id={`note-card-${note.id}`}
      onClick={() => onSelect?.(note)}
      className={`group relative bg-[#181818] rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${cardBorderClass} ${cardBgHoverClass} ${
        isSelected ? 'ring-2 ring-blue-500 bg-[#202020]' : ''
      } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
    >
      {/* Top Color Accent Line */}
      {showPalette && <div className={`h-1 w-full ${colorConfig.accentBar}`} />}

      {/* Card Header */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          {/* Privacy & Scope Badges or Simplified Indicator */}
          {showSharingStats ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {note.isPrivate ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40">
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">
                  {note.isSharedWithAll !== false ? (
                    <>
                      <Globe className="w-3 h-3" />
                      <span>Shared with Team</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3" />
                      <span>Shared ({note.sharedWithUserIds?.length || 0})</span>
                    </>
                  )}
                </span>
              )}

              {note.allowCollaboration && !note.isPrivate && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/30">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Collab</span>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 py-0.5">
              {note.isPrivate ? (
                <span title="Private note" className="text-amber-400/90 p-0.5">
                  <Lock className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span
                  title={note.isSharedWithAll !== false ? 'Shared with Team' : `Shared with ${note.sharedWithUserIds?.length || 0} members`}
                  className="text-blue-400/80 p-0.5"
                >
                  <Globe className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          )}

          {/* Quick Pin & Menu Buttons */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              title={note.isPinned ? 'Unpin note' : 'Pin note to top'}
              aria-label={note.isPinned ? 'Unpin note' : 'Pin note to top'}
              onClick={handleTogglePin}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                note.isPinned
                  ? 'text-amber-400 bg-amber-950/40 hover:bg-amber-900/50'
                  : 'text-neutral-500 hover:text-neutral-300 opacity-60 hover:opacity-100 hover:bg-neutral-800'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              title="Share / Privacy settings"
              aria-label="Share note"
              onClick={(e) => {
                e.stopPropagation();
                onShare(note);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              title="Edit note"
              aria-label="Edit note"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(note);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Note Title */}
        <h3 className="text-sm font-semibold text-neutral-100 line-clamp-1 group-hover:text-white transition-colors">
          {note.title || 'Untitled Note'}
        </h3>

        {/* Checklist preview or plain text snippet */}
        <div className="mt-2.5 flex-1 text-xs text-neutral-400 space-y-1.5">
          {checklistLines.length > 0 ? (
            <div className="space-y-1 my-1">
              {checklistLines.slice(0, 3).map((item, idx) => {
                const isChecked = item[2].toLowerCase() === 'x';
                return (
                  <div
                    key={idx}
                    onClick={(e) => handleToggleChecklist(idx, e)}
                    className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors cursor-pointer select-none"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                        isChecked
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'border-neutral-600 bg-neutral-800 hover:border-neutral-500'
                      }`}
                    >
                      {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span
                      className={`truncate text-xs ${
                        isChecked ? 'line-through text-neutral-500' : 'text-neutral-300'
                      }`}
                    >
                      {item[4]}
                    </span>
                  </div>
                );
              })}
              {checklistLines.length > 3 && (
                <p className="text-[11px] text-neutral-500 italic pl-5">
                  +{checklistLines.length - 3} more items
                </p>
              )}
            </div>
          ) : (
            <p className="line-clamp-4 text-xs text-neutral-400 leading-relaxed font-normal">
              {plainTextContent || <span className="italic text-neutral-600">No additional content</span>}
            </p>
          )}
        </div>

        {/* Tags */}
        {showTags && Array.isArray(note.tags) && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-800/80 text-neutral-300 border border-neutral-700/50"
              >
                #{tag}
              </span>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] text-neutral-500 self-center">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 border-t border-neutral-800/60 bg-[#161616] flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 bg-neutral-700">
            {note.authorAvatar ? (
              <img
                src={note.authorAvatar}
                alt={note.authorName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-semibold text-neutral-300">
                {note.authorName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <span className="truncate text-neutral-300 text-[11px] font-medium">
            {isAuthor ? 'You' : note.authorName}
          </span>
          <span className="text-neutral-600 text-[10px]">•</span>
          <span className="text-neutral-500 text-[11px] shrink-0">
            {formatRelativeTime(note.updatedAt || note.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {sharedToChatSuccess ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
              <Check className="w-3 h-3" />
              <span>Sent!</span>
            </span>
          ) : (
            <button
              type="button"
              title="Share snippet to team chat"
              onClick={handleShareToChat}
              className="p-1 rounded text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              title="Delete note"
              onClick={handleDelete}
              className="p-1 rounded text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
