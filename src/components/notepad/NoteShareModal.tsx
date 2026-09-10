import React, { useState, useEffect } from 'react';
import { Note } from '../../types';
import { useNotepad } from '../../context/NotepadContext';
import { useAuth } from '../../context/AuthContext';
import { UserAvatar } from '../UserAvatar';
import {
  X,
  Lock,
  Globe,
  Users,
  Check,
  Share2,
  Copy,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface NoteShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
}

export const NoteShareModal: React.FC<NoteShareModalProps> = ({
  isOpen,
  onClose,
  note
}) => {
  const { shareNote } = useNotepad();
  const { currentUser, users } = useAuth();

  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [isSharedWithAll, setIsSharedWithAll] = useState<boolean>(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [allowCollaboration, setAllowCollaboration] = useState<boolean>(false);
  const [searchMember, setSearchMember] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (note) {
      setIsPrivate(note.isPrivate);
      setIsSharedWithAll(note.isSharedWithAll !== false);
      setSelectedUserIds(Array.isArray(note.sharedWithUserIds) ? [...note.sharedWithUserIds] : []);
      setAllowCollaboration(Boolean(note.allowCollaboration));
      setCopied(false);
    }
  }, [note, isOpen]);

  if (!isOpen || !note) return null;

  const isAuthor = currentUser?.id === note.authorId;
  const isAdmin = currentUser?.role === 'admin';
  const canModifySharing = isAuthor || isAdmin;

  // Filter other users (exclude author)
  const availableUsers = users.filter((u) => u.id !== note.authorId);
  const filteredUsers = availableUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchMember.toLowerCase()) ||
      u.email.toLowerCase().includes(searchMember.toLowerCase()) ||
      (u.role && u.role.toLowerCase().includes(searchMember.toLowerCase()))
  );

  const toggleUserSelection = (userId: string) => {
    if (!canModifySharing) return;
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    if (!canModifySharing) return;
    setIsSaving(true);
    try {
      await shareNote(note.id, {
        isPrivate,
        isSharedWithAll: !isPrivate ? isSharedWithAll : false,
        sharedWithUserIds: !isPrivate && !isSharedWithAll ? selectedUserIds : [],
        allowCollaboration: !isPrivate ? allowCollaboration : false
      });
      onClose();
    } catch (err) {
      console.error('Failed to update note sharing:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopySummary = () => {
    const text = `📝 Note: "${note.title}"\n\n${note.content.slice(0, 300)}${
      note.content.length > 300 ? '...' : ''
    }`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="note-share-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="note-share-modal"
        className="bg-[#181818] border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-neutral-800/80 bg-[#1e1e1e]">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isPrivate
                  ? 'bg-amber-950/50 text-amber-400 border border-amber-800/40'
                  : 'bg-blue-950/50 text-blue-400 border border-blue-800/40'
              }`}
            >
              {isPrivate ? <Lock className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-neutral-100">Note Privacy & Sharing</h2>
              <p className="text-xs text-neutral-400 truncate max-w-[220px] sm:max-w-[280px]">
                {note.title || 'Untitled Note'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-note-share-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[80vh] overflow-y-auto">
          {!canModifySharing && (
            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl flex items-center gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Only the author (<strong>{note.authorName}</strong>) or an administrator can adjust sharing settings.
              </span>
            </div>
          )}

          {/* Privacy Toggle Cards */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Visibility Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Private Option */}
              <button
                type="button"
                disabled={!canModifySharing}
                onClick={() => setIsPrivate(true)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                  isPrivate
                    ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/40'
                    : 'bg-[#141414] border-neutral-800 hover:border-neutral-700 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className={`w-4 h-4 ${isPrivate ? 'text-amber-400' : 'text-neutral-400'}`} />
                    <span className="text-sm font-semibold text-neutral-200">Keep Private</span>
                  </div>
                  {isPrivate && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Only you can view and edit this note. Hidden from all team members.
                </p>
              </button>

              {/* Shared Option */}
              <button
                type="button"
                disabled={!canModifySharing}
                onClick={() => setIsPrivate(false)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-2 ${
                  !isPrivate
                    ? 'bg-blue-950/20 border-blue-500/60 ring-1 ring-blue-500/40'
                    : 'bg-[#141414] border-neutral-800 hover:border-neutral-700 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className={`w-4 h-4 ${!isPrivate ? 'text-blue-400' : 'text-neutral-400'}`} />
                    <span className="text-sm font-semibold text-neutral-200">Share Note</span>
                  </div>
                  {!isPrivate && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Make accessible to the whole team or selected team members.
                </p>
              </button>
            </div>
          </div>

          {/* Shared Options (Only visible if not private) */}
          {!isPrivate && (
            <div className="space-y-4 pt-2 border-t border-neutral-800 animate-fade-in">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Sharing Scope
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSharedWithAll
                        ? 'bg-[#202020] border-blue-500/50'
                        : 'bg-[#141414] border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shareScope"
                      checked={isSharedWithAll}
                      disabled={!canModifySharing}
                      onChange={() => setIsSharedWithAll(true)}
                      className="mt-0.5 accent-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-semibold text-neutral-200">
                          Workspace Team (Everyone)
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Any authenticated user in the workspace can read this note in their shared notepad.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      !isSharedWithAll
                        ? 'bg-[#202020] border-blue-500/50'
                        : 'bg-[#141414] border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="shareScope"
                      checked={!isSharedWithAll}
                      disabled={!canModifySharing}
                      onChange={() => setIsSharedWithAll(false)}
                      className="mt-0.5 accent-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-semibold text-neutral-200">
                          Specific Team Members
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Only selected teammates will receive this note in their shared space.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Specific Member Picker */}
              {!isSharedWithAll && (
                <div className="space-y-3 p-3 bg-[#141414] rounded-xl border border-neutral-800 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-300">
                      Select Members ({selectedUserIds.length} selected)
                    </span>
                    <span className="text-xs text-neutral-400">
                      {availableUsers.length} available
                    </span>
                  </div>

                  <input
                    type="text"
                    value={searchMember}
                    onChange={(e) => setSearchMember(e.target.value)}
                    placeholder="Search teammate by name or email..."
                    className="w-full px-3 py-1.5 bg-[#1e1e1e] border border-neutral-700 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  />

                  <div className="max-h-44 overflow-y-auto space-y-1 pr-1">
                    {filteredUsers.length === 0 ? (
                      <p className="text-xs text-neutral-500 py-3 text-center">No teammates found.</p>
                    ) : (
                      filteredUsers.map((u) => {
                        const isSelected = selectedUserIds.includes(u.id);
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleUserSelection(u.id)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-blue-950/40 border border-blue-800/40 text-blue-200'
                                : 'hover:bg-neutral-800/60 text-neutral-300 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar user={u} size="sm" />
                              <div className="truncate">
                                <p className="text-xs font-medium text-neutral-200 truncate">{u.name}</p>
                                <p className="text-[11px] text-neutral-400 truncate">{u.email}</p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center border ${
                                isSelected
                                  ? 'bg-blue-600 border-blue-500 text-white'
                                  : 'border-neutral-700 bg-neutral-800'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Collaboration Toggle */}
              <div className="p-3 bg-[#141414] rounded-xl border border-neutral-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-neutral-200">Allow Teammates to Edit</p>
                    <p className="text-[11px] text-neutral-400">
                      Permit shared recipients to modify content collaboratively
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCollaboration}
                    disabled={!canModifySharing}
                    onChange={(e) => setAllowCollaboration(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          )}

          {/* Quick Copy Snippet */}
          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between gap-3">
            <span className="text-xs text-neutral-400">Need to share text snippet quickly?</span>
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#262626] hover:bg-[#303030] text-neutral-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 bg-[#1b1b1b]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {canModifySharing && (
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save Sharing Settings'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
