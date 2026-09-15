import React, { useState, useEffect, useRef } from 'react';
import { Note, NoteColor } from '../../types';
import { useNotepad } from '../../context/NotepadContext';
import { useAuth } from '../../context/AuthContext';
import { useTasks } from '../../context/TaskContext';
import { UserAvatar } from '../UserAvatar';
import {
  X,
  Lock,
  Globe,
  Users,
  Check,
  Bold,
  Italic,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Heading2,
  Tag,
  Link,
  ShieldCheck,
  Eye,
  Edit3,
  Folder,
  FolderPlus,
  Pen,
  Trash2
} from 'lucide-react';
import { NoteCanvas } from './NoteCanvas';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: Note | null;
  initialTab?: 'write' | 'canvas' | 'preview';
}

const COLOR_OPTIONS: { key: NoteColor; label: string; bg: string; ring: string }[] = [
  { key: 'amber', label: 'Warm Amber', bg: 'bg-amber-500', ring: 'ring-amber-400' },
  { key: 'blue', label: 'Sky Blue', bg: 'bg-blue-500', ring: 'ring-blue-400' },
  { key: 'emerald', label: 'Mint Emerald', bg: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { key: 'purple', label: 'Royal Purple', bg: 'bg-purple-500', ring: 'ring-purple-400' },
  { key: 'rose', label: 'Sunset Rose', bg: 'bg-rose-500', ring: 'ring-rose-400' },
  { key: 'slate', label: 'Neutral Slate', bg: 'bg-neutral-500', ring: 'ring-neutral-400' }
];

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  initialTab
}) => {
  const { createNote, updateNote, directories, selectedDirectoryId, setIsDirectoryModalOpen, setEditingDirectory } = useNotepad();
  const { currentUser, users } = useAuth();
  const { tasks } = useTasks();

  const [title, setTitle] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [canvasData, setCanvasData] = useState<string>('');
  const [color, setColor] = useState<NoteColor>('amber');
  const [directoryId, setDirectoryId] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [isSharedWithAll, setIsSharedWithAll] = useState<boolean>(true);
  const [sharedWithUserIds, setSharedWithUserIds] = useState<string[]>([]);
  const [allowCollaboration, setAllowCollaboration] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [linkedTaskId, setLinkedTaskId] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'write' | 'canvas' | 'preview'>('write');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showMemberPicker, setShowMemberPicker] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title || '');
      setContent(noteToEdit.content || '');
      setCanvasData(noteToEdit.canvasData || '');
      setColor(noteToEdit.color || 'amber');
      setDirectoryId(noteToEdit.directoryId || null);
      setIsPrivate(noteToEdit.isPrivate);
      setIsSharedWithAll(noteToEdit.isSharedWithAll !== false);
      setSharedWithUserIds(Array.isArray(noteToEdit.sharedWithUserIds) ? [...noteToEdit.sharedWithUserIds] : []);
      setAllowCollaboration(Boolean(noteToEdit.allowCollaboration));
      setTags(Array.isArray(noteToEdit.tags) ? [...noteToEdit.tags] : []);
      setLinkedTaskId(noteToEdit.linkedTaskId || '');
    } else {
      setTitle('');
      setContent('');
      setCanvasData('');
      setColor('amber');
      setDirectoryId(selectedDirectoryId && selectedDirectoryId !== 'unfiled' ? selectedDirectoryId : null);
      setIsPrivate(true);
      setIsSharedWithAll(true);
      setSharedWithUserIds([]);
      setAllowCollaboration(false);
      setTags([]);
      setLinkedTaskId('');
    }
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (noteToEdit?.canvasData && !noteToEdit?.content) {
      setActiveTab('canvas');
    } else {
      setActiveTab('write');
    }
    setTagInput('');
  }, [noteToEdit, isOpen, selectedDirectoryId, initialTab]);

  if (!isOpen) return null;

  const isAuthor = !noteToEdit || currentUser?.id === noteToEdit.authorId;
  const isAdmin = currentUser?.role === 'admin';
  const canModifyPrivacy = isAuthor || isAdmin;

  const availableUsers = users.filter((u) => u.id !== currentUser?.id);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const toggleUserSelection = (userId: string) => {
    setSharedWithUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previous = textarea.value;
    const selection = previous.substring(start, end);
    const replacement = `${before}${selection}${after}`;
    const nextValue = previous.substring(0, start) + replacement + previous.substring(end);
    setContent(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim() && !canvasData.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<Note> = {
        title: title.trim() || (canvasData.trim() ? 'Canvas Sketch' : 'Untitled Note'),
        content,
        canvasData: canvasData.trim() || undefined,
        color,
        directoryId: directoryId || null,
        tags,
        linkedTaskId: linkedTaskId || undefined,
        linkedTaskTitle: tasks.find((t) => t.id === linkedTaskId)?.title || undefined
      };

      if (canModifyPrivacy) {
        payload.isPrivate = isPrivate;
        payload.isSharedWithAll = !isPrivate ? isSharedWithAll : false;
        payload.sharedWithUserIds = !isPrivate && !isSharedWithAll ? sharedWithUserIds : [];
        payload.allowCollaboration = !isPrivate ? allowCollaboration : false;
      }

      if (noteToEdit) {
        await updateNote(noteToEdit.id, payload);
      } else {
        await createNote(payload);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick keyboard shortcut: Ctrl+Enter or Cmd+Enter to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      id="note-editor-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="note-editor-modal"
        onKeyDown={handleKeyDown}
        className="bg-[#181818] border border-neutral-800 rounded-2xl w-full md:w-[90vw] md:max-w-[90vw] lg:w-[90vw] lg:max-w-[90vw] xl:w-[90vw] xl:max-w-[90vw] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#1c1c1c]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                {noteToEdit ? 'Edit Note' : 'Create New Note'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                {isPrivate ? 'Private to your personal notepad' : 'Shared with workspace teammates'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Note Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              autoFocus
              className="w-full bg-transparent text-lg sm:text-xl font-semibold text-neutral-100 placeholder-neutral-500 focus:outline-none border-b border-neutral-800 focus:border-blue-500 pb-2 transition-colors"
            />
          </div>

          {/* Color & Privacy Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#131313] rounded-xl border border-neutral-800/80">
            {/* Palette Dots */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-400">Color:</span>
              <div className="flex items-center gap-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    title={c.label}
                    onClick={() => setColor(c.key)}
                    className={`w-5 h-5 rounded-full ${c.bg} transition-all cursor-pointer flex items-center justify-center ${
                      color === c.key ? `ring-2 ring-offset-2 ring-offset-[#131313] ${c.ring} scale-110` : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {color === c.key && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Segmented Switch */}
            {canModifyPrivacy && (
              <div className="flex items-center bg-[#1e1e1e] p-0.5 rounded-lg border border-neutral-700/60">
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    isPrivate
                      ? 'bg-amber-500 text-neutral-950 font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    !isPrivate
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  <span>Shared</span>
                </button>
              </div>
            )}
          </div>

          {/* Directory / Folder Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-[#131313] rounded-xl border border-neutral-800/80">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-neutral-300">Folder / Directory:</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={directoryId || ''}
                onChange={(e) => setDirectoryId(e.target.value ? e.target.value : null)}
                className="bg-[#1e1e1e] text-neutral-200 text-xs px-2.5 py-1.5 rounded-lg border border-neutral-700/70 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="">(No folder / Unfiled)</option>
                {directories.map((dir) => (
                  <option key={dir.id} value={dir.id}>
                    {dir.name} {dir.isPrivate ? '🔒' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setEditingDirectory(null);
                  setIsDirectoryModalOpen(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-400 hover:text-blue-300 px-2.5 py-1 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/50 rounded-lg transition-colors cursor-pointer"
                title="Create new directory"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>New Folder</span>
              </button>
            </div>
          </div>

          {/* Shared Options Dropdown if note is marked as Shared */}
          {!isPrivate && canModifyPrivacy && (
            <div className="p-3.5 bg-blue-950/20 border border-blue-800/40 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-200">Shared Audience</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSharedWithAll(true)}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      isSharedWithAll
                        ? 'bg-blue-600 text-white font-medium'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    All Team
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSharedWithAll(false);
                      setShowMemberPicker(true);
                    }}
                    className={`text-xs px-2 py-0.5 rounded transition-colors ${
                      !isSharedWithAll
                        ? 'bg-purple-600 text-white font-medium'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    Specific ({sharedWithUserIds.length})
                  </button>
                </div>
              </div>

              {!isSharedWithAll && (
                <div className="pt-2 border-t border-blue-900/40 space-y-2">
                  <p className="text-[11px] text-neutral-400">
                    Select teammates who will have access to this note:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {availableUsers.map((u) => {
                      const isSelected = sharedWithUserIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleUserSelection(u.id)}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-purple-950/70 border-purple-600 text-purple-200'
                              : 'bg-[#181818] border-neutral-700 text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <UserAvatar user={u} size="xs" />
                          <span>{u.name}</span>
                          {isSelected && <Check className="w-3 h-3 text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Allow teammates to edit this note</span>
                </div>
                <input
                  type="checkbox"
                  checked={allowCollaboration}
                  onChange={(e) => setAllowCollaboration(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Markdown Formatting Toolbar & Write/Preview Toggle */}
          <div className="border border-neutral-800 rounded-xl overflow-hidden bg-[#141414]">
            <div className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 border-b border-neutral-800 bg-[#1a1a1a] overflow-x-auto no-scrollbar">
              {/* Toolbar Buttons */}
              <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar shrink-0">
                <button
                  type="button"
                  title="Bold"
                  onClick={() => insertText('**', '**')}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Italic"
                  onClick={() => insertText('*', '*')}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Heading"
                  onClick={() => insertText('### ')}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  <Heading2 className="w-3.5 h-3.5" />
                </button>
                <span className="w-px h-4 bg-neutral-700 mx-0.5 sm:mx-1 shrink-0" />
                <button
                  type="button"
                  title="Checklist Item"
                  onClick={() => insertText('- [ ] ')}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Bullet List"
                  onClick={() => insertText('- ')}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Numbered List"
                  onClick={() => insertText('1. ')}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <span className="w-px h-4 bg-neutral-700 mx-0.5 sm:mx-1 shrink-0" />
                <button
                  type="button"
                  title="Code Block"
                  onClick={() => insertText('```\n', '\n```')}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Quote"
                  onClick={() => insertText('> ')}
                  className="w-7 h-7 rounded flex items-center justify-center text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Write, Canvas, and Preview Tabs */}
              <div className="flex items-center gap-1 bg-[#202020] p-0.5 rounded-lg border border-neutral-700">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'write' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Write</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('canvas')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'canvas' ? 'bg-blue-600 text-white' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Pen className="w-3 h-3" />
                  <span>Canvas</span>
                  {canvasData && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300 ring-2 ring-blue-500" title="Canvas attached" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    activeTab === 'preview' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
              </div>
            </div>

            {/* Canvas Attached Notification Banner when on Write Tab */}
            {activeTab === 'write' && canvasData && (
              <div className="px-4 py-2 bg-blue-950/30 border-b border-blue-900/40 flex items-center justify-between text-xs text-blue-300">
                <div className="flex items-center gap-2">
                  <Pen className="w-3.5 h-3.5 text-blue-400" />
                  <span>This note includes a canvas sketch drawing.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('canvas')}
                    className="text-[11px] text-blue-300 hover:text-white underline cursor-pointer"
                  >
                    Edit Canvas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanvasData('')}
                    className="text-[11px] text-rose-400 hover:text-rose-300 ml-2 cursor-pointer"
                    title="Remove canvas drawing from note"
                  >
                    Remove Canvas
                  </button>
                </div>
              </div>
            )}

            {/* Editor Area: Write / Canvas / Preview */}
            {activeTab === 'write' ? (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your note in markdown... Checklist (- [ ] item), bullet points, and formatted text are supported. You can also switch to the Canvas tab to draw or diagram!"
                rows={10}
                className="w-full p-4 bg-transparent text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none resize-y font-mono leading-relaxed"
              />
            ) : activeTab === 'canvas' ? (
              <div className="p-3 bg-[#111111]">
                <NoteCanvas
                  initialData={canvasData}
                  onChange={(val) => setCanvasData(val)}
                  minHeight={340}
                />
              </div>
            ) : (
              <div className="p-4 min-h-[220px] max-h-[380px] overflow-y-auto text-sm text-neutral-200 space-y-3 prose prose-invert max-w-none">
                {/* Markdown text preview */}
                {content.trim() ? (
                  content.split('\n').map((line, idx) => {
                    const checkMatch = line.match(/^(\s*[-*]\s*\[)([ xX])(\]\s*)(.*)$/);
                    if (checkMatch) {
                      const isChecked = checkMatch[2].toLowerCase() === 'x';
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                              isChecked
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'border-neutral-600 bg-neutral-800'
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className={isChecked ? 'line-through text-neutral-500' : 'text-neutral-300'}>
                            {checkMatch[4]}
                          </span>
                        </div>
                      );
                    }
                    if (line.startsWith('### ')) {
                      return <h4 key={idx} className="text-base font-bold text-neutral-100 mt-2">{line.replace('### ', '')}</h4>;
                    }
                    if (line.startsWith('## ')) {
                      return <h3 key={idx} className="text-lg font-bold text-neutral-100 mt-3">{line.replace('## ', '')}</h3>;
                    }
                    if (line.startsWith('# ')) {
                      return <h2 key={idx} className="text-xl font-bold text-neutral-100 mt-3">{line.replace('# ', '')}</h2>;
                    }
                    if (line.startsWith('> ')) {
                      return (
                        <blockquote key={idx} className="border-l-2 border-neutral-600 pl-3 italic text-neutral-400">
                          {line.replace('> ', '')}
                        </blockquote>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <li key={idx} className="list-disc ml-4 text-neutral-300 text-xs">
                          {line.replace('- ', '')}
                        </li>
                      );
                    }
                    return (
                      <p key={idx} className="text-xs text-neutral-300 min-h-[1em]">
                        {line}
                      </p>
                    );
                  })
                ) : !canvasData ? (
                  <p className="text-xs text-neutral-500 italic">No content to preview yet.</p>
                ) : null}

                {/* Canvas Drawing Preview */}
                {canvasData && (
                  <div className="mt-4 pt-3 border-t border-neutral-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-300">
                        <Pen className="w-3.5 h-3.5 text-blue-400" />
                        <span>Attached Canvas Sketch</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('canvas')}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                      >
                        Edit in Canvas
                      </button>
                    </div>
                    <div className="rounded-xl overflow-hidden border border-neutral-800 bg-[#141414] p-2 flex justify-center">
                      <img
                        src={canvasData}
                        alt="Canvas sketch"
                        className="max-h-72 w-full object-contain rounded-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tags & Task Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Tags Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                <span>Tags</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g. Architecture, Sprint14"
                  className="flex-1 px-3 py-1.5 bg-[#141414] border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-600"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-neutral-800 text-neutral-300 border border-neutral-700"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-red-400"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Link to Workspace Task */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5">
                <Link className="w-3 h-3" />
                <span>Link Task (Optional)</span>
              </label>
              <select
                value={linkedTaskId}
                onChange={(e) => setLinkedTaskId(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#141414] border border-neutral-800 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-neutral-600"
              >
                <option value="">-- No Linked Task --</option>
                {tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-800 bg-[#1a1a1a]">
          <div className="text-[11px] text-neutral-500">
            Press <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px] text-neutral-400">Ctrl+Enter</kbd> to save
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving || (!title.trim() && !content.trim())}
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : noteToEdit ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
