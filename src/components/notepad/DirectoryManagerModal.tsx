import React, { useState, useEffect } from 'react';
import { useNotepad } from '../../context/NotepadContext';
import { DirectoryColor, NoteDirectory } from '../../types';
import {
  X,
  Folder,
  FolderPlus,
  Lock,
  Globe,
  Tag,
  Bookmark,
  Star,
  Archive,
  Code,
  Briefcase,
  Book,
  Check
} from 'lucide-react';

interface DirectoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  directoryToEdit?: NoteDirectory | null;
}

const DIRECTORY_COLORS: { key: DirectoryColor; label: string; bg: string; border: string }[] = [
  { key: 'blue', label: 'Blue', bg: 'bg-blue-500', border: 'border-blue-400' },
  { key: 'amber', label: 'Amber', bg: 'bg-amber-500', border: 'border-amber-400' },
  { key: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', border: 'border-emerald-400' },
  { key: 'purple', label: 'Purple', bg: 'bg-purple-500', border: 'border-purple-400' },
  { key: 'rose', label: 'Rose', bg: 'bg-rose-500', border: 'border-rose-400' },
  { key: 'teal', label: 'Teal', bg: 'bg-teal-500', border: 'border-teal-400' },
  { key: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', border: 'border-indigo-400' },
  { key: 'slate', label: 'Slate', bg: 'bg-neutral-500', border: 'border-neutral-400' }
];

const DIRECTORY_ICONS = [
  { key: 'folder', label: 'Folder', Icon: Folder },
  { key: 'briefcase', label: 'Work', Icon: Briefcase },
  { key: 'code', label: 'Code', Icon: Code },
  { key: 'book', label: 'Docs', Icon: Book },
  { key: 'star', label: 'Starred', Icon: Star },
  { key: 'bookmark', label: 'Bookmark', Icon: Bookmark },
  { key: 'archive', label: 'Archive', Icon: Archive },
  { key: 'tag', label: 'Tag', Icon: Tag }
];

export const DirectoryManagerModal: React.FC<DirectoryManagerModalProps> = ({
  isOpen,
  onClose,
  directoryToEdit
}) => {
  const { createDirectory, updateDirectory, setSelectedDirectoryId } = useNotepad();

  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [color, setColor] = useState<DirectoryColor>('blue');
  const [icon, setIcon] = useState<string>('folder');
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (directoryToEdit) {
      setName(directoryToEdit.name || '');
      setDescription(directoryToEdit.description || '');
      setColor(directoryToEdit.color || 'blue');
      setIcon(directoryToEdit.icon || 'folder');
      setIsPrivate(Boolean(directoryToEdit.isPrivate));
    } else {
      setName('');
      setDescription('');
      setColor('blue');
      setIcon('folder');
      setIsPrivate(false);
    }
    setValidationError(null);
  }, [directoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setValidationError('Please enter a directory name.');
      return;
    }

    setIsSaving(true);
    setValidationError(null);
    try {
      if (directoryToEdit) {
        await updateDirectory(directoryToEdit.id, {
          name: trimmed,
          description: description.trim(),
          color,
          icon,
          isPrivate
        });
      } else {
        const created = await createDirectory({
          name: trimmed,
          description: description.trim(),
          color,
          icon,
          isPrivate
        });
        setSelectedDirectoryId(created.id);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save directory:', err);
      setValidationError(err?.message || 'Failed to save directory.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="directory-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="directory-manager-modal"
        className="bg-[#181818] border border-neutral-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-[#1c1c1c]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                {directoryToEdit ? 'Edit Directory' : 'New Note Directory'}
              </h2>
              <p className="text-[11px] text-neutral-400">
                Organize your notes into folders with custom icons and colors
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {validationError && (
            <div className="p-2.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg">
              {validationError}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Directory Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Architecture, Sprint Planning, Ideas"
              autoFocus
              className="w-full px-3.5 py-2 bg-[#121212] border border-neutral-800 rounded-xl text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Description <span className="text-neutral-500 text-[11px]">(Optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what goes into this directory..."
              rows={2}
              className="w-full px-3.5 py-2 bg-[#121212] border border-neutral-800 rounded-xl text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Accent Color
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {DIRECTORY_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.key)}
                  className={`w-6 h-6 rounded-full ${c.bg} transition-all cursor-pointer flex items-center justify-center ${
                    color === c.key
                      ? `ring-2 ring-offset-2 ring-offset-[#181818] ring-white scale-110`
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {color === c.key && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Directory Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {DIRECTORY_ICONS.map(({ key, label, Icon: IconCmp }) => {
                const isSelected = icon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setIcon(key)}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-[#121212] border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <IconCmp className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visibility / Privacy Switch */}
          <div className="pt-2 border-t border-neutral-800/80">
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Directory Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  !isPrivate
                    ? 'bg-blue-950/30 border-blue-500 text-blue-300'
                    : 'bg-[#121212] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Globe className="w-4 h-4 text-blue-400" />
                <div className="text-left">
                  <div className="font-semibold text-neutral-200">Shared</div>
                  <div className="text-[10px] text-neutral-400">Team workspace</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  isPrivate
                    ? 'bg-amber-950/30 border-amber-500 text-amber-300'
                    : 'bg-[#121212] border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <div className="font-semibold text-neutral-200">Private</div>
                  <div className="text-[10px] text-neutral-400">Only you can see</div>
                </div>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? 'Saving...' : directoryToEdit ? 'Save Changes' : 'Create Directory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
