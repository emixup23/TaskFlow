import React, { useState, useEffect } from 'react';
import { useNotepad, NoteFilterTab } from '../context/NotepadContext';
import { useAuth } from '../context/AuthContext';
import { NoteCard } from './notepad/NoteCard';
import { NoteEditorModal } from './notepad/NoteEditorModal';
import { NoteShareModal } from './notepad/NoteShareModal';
import { UserAvatar } from './UserAvatar';
import { Note, NoteColor } from '../types';
import {
  StickyNote,
  Lock,
  Globe,
  Users,
  User,
  Share2,
  Plus,
  Search,
  Pin,
  LayoutGrid,
  Columns,
  Tag,
  Filter,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Copy,
  Clock,
  ShieldCheck,
  AlertCircle,
  Palette,
  Eye,
  EyeOff,
  SlidersHorizontal,
  ChevronLeft
} from 'lucide-react';

export interface NotepadDisplayOptions {
  showPalette: boolean;
  showTags: boolean;
  showSharingStats: boolean;
}

const STORAGE_KEY = 'taskflow_notepad_display_opts';

const COLOR_PALETTES: { key: string; label: string; dot: string }[] = [
  { key: 'all', label: 'All Colors', dot: 'bg-neutral-400' },
  { key: 'amber', label: 'Amber', dot: 'bg-amber-400' },
  { key: 'blue', label: 'Blue', dot: 'bg-blue-400' },
  { key: 'emerald', label: 'Emerald', dot: 'bg-emerald-400' },
  { key: 'purple', label: 'Purple', dot: 'bg-purple-400' },
  { key: 'rose', label: 'Rose', dot: 'bg-rose-400' },
  { key: 'slate', label: 'Slate', dot: 'bg-neutral-500' }
];

export const NotepadView: React.FC = () => {
  const {
    filteredNotes,
    isLoading,
    error,
    activeFilter,
    setActiveFilter,
    selectedColor,
    setSelectedColor,
    searchQuery,
    setSearchQuery,
    selectedTag,
    setSelectedTag,
    selectedNoteId,
    setSelectedNoteId,
    selectedNote,
    isEditorOpen,
    setIsEditorOpen,
    editingNote,
    setEditingNote,
    isShareModalOpen,
    setIsShareModalOpen,
    sharingNote,
    setSharingNote,
    togglePinNote,
    deleteNote,
    updateNote,
    totalCount,
    privateCount,
    sharedCount,
    myNotesCount,
    sharedWithMeCount,
    allTags
  } = useNotepad();

  const { currentUser } = useAuth();
  const [viewLayout, setViewLayout] = useState<'grid' | 'split'>('grid');
  const [copiedDetail, setCopiedDetail] = useState<boolean>(false);

  // Preview display options for simplifying workspace
  const [displayOptions, setDisplayOptions] = useState<NotepadDisplayOptions>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          showPalette: parsed.showPalette !== false,
          showTags: parsed.showTags !== false,
          showSharingStats: parsed.showSharingStats !== false
        };
      }
    } catch {
      // ignore
    }
    return {
      showPalette: true,
      showTags: true,
      showSharingStats: true
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(displayOptions));
    } catch {
      // ignore
    }
  }, [displayOptions]);

  const toggleDisplayOption = (key: keyof NotepadDisplayOptions) => {
    setDisplayOptions((prev) => {
      const nextVal = !prev[key];
      // Reset color filter if palette is hidden
      if (key === 'showPalette' && !nextVal && selectedColor !== 'all') {
        setSelectedColor('all');
      }
      // Reset tag filter if tags are hidden
      if (key === 'showTags' && !nextVal && selectedTag !== null) {
        setSelectedTag(null);
      }
      return {
        ...prev,
        [key]: nextVal
      };
    });
  };

  const isAllSimplified = !displayOptions.showPalette && !displayOptions.showTags && !displayOptions.showSharingStats;

  const toggleSimplifyAll = () => {
    if (isAllSimplified) {
      // Restore standard preview details
      setDisplayOptions({
        showPalette: true,
        showTags: true,
        showSharingStats: true
      });
    } else {
      // Simplify workspace preview: hide palette, tags, and sharing stats
      if (selectedColor !== 'all') setSelectedColor('all');
      if (selectedTag !== null) setSelectedTag(null);
      setDisplayOptions({
        showPalette: false,
        showTags: false,
        showSharingStats: false
      });
    }
  };

  const handleOpenNewNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleOpenShare = (note: Note) => {
    setSharingNote(note);
    setIsShareModalOpen(true);
  };

  const handleCopyDetail = (note: Note) => {
    const text = `📝 ${note.title}\n\n${note.content}`;
    navigator.clipboard.writeText(text);
    setCopiedDetail(true);
    setTimeout(() => setCopiedDetail(false), 2000);
  };

  // Toggle checklist item within split-view detail
  const handleToggleDetailChecklist = async (index: number) => {
    if (!selectedNote) return;
    const isAuthor = currentUser?.id === selectedNote.authorId;
    const canCollab = Boolean(selectedNote.allowCollaboration) && !selectedNote.isPrivate;
    const isAdmin = currentUser?.role === 'admin';
    if (!isAuthor && !canCollab && !isAdmin) return;

    let itemCounter = 0;
    const lines = selectedNote.content.split('\n');
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
      await updateNote(selectedNote.id, { content: newLines.join('\n') });
    } catch (err) {
      console.error('Failed to toggle checklist in detail:', err);
    }
  };

  // Split pinned and unpinned notes
  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.isPinned);

  return (
    <div id="notepad-workspace" className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0d0d]">
      {/* Top Header */}
      <div className="border-b border-neutral-800 bg-[#121212] px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <StickyNote className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-100">Notepad Space</h1>
              {displayOptions.showSharingStats && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
                  {totalCount} notes
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400">
              Personal scratchpads, checklists, and shared team workspace documents
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Workspace Preview Detail Toggles: Palette, Tags, Sharing Stats & Simplify */}
          <div className="flex items-center bg-[#181818] p-1 rounded-xl border border-neutral-800 gap-0.5 text-xs shadow-sm">
            {/* Quick Simplify Master Toggle */}
            <button
              type="button"
              onClick={toggleSimplifyAll}
              title={isAllSimplified ? "Restore standard preview details" : "Simplify preview: hide palette, tags, and sharing stats"}
              aria-label="Toggle simplified preview"
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all cursor-pointer ${
                isAllSimplified
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
              }`}
            >
              {isAllSimplified ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-neutral-400" />}
            </button>

            <div className="h-4 w-px bg-neutral-800 mx-0.5" />

            {/* Toggle Palette */}
            <button
              type="button"
              onClick={() => toggleDisplayOption('showPalette')}
              title={displayOptions.showPalette ? "Hide color palette styling" : "Show color palette styling"}
              aria-label="Toggle palette visibility"
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
                displayOptions.showPalette
                  ? 'bg-neutral-800 text-neutral-200 border border-neutral-700/60 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-300 opacity-60'
              }`}
            >
              <Palette className={`w-4 h-4 ${displayOptions.showPalette ? 'text-amber-400' : 'text-neutral-500'}`} />
            </button>

            {/* Toggle Tags */}
            <button
              type="button"
              onClick={() => toggleDisplayOption('showTags')}
              title={displayOptions.showTags ? "Hide tag badges" : "Show tag badges"}
              aria-label="Toggle tags visibility"
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
                displayOptions.showTags
                  ? 'bg-neutral-800 text-neutral-200 border border-neutral-700/60 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-300 opacity-60'
              }`}
            >
              <Tag className={`w-4 h-4 ${displayOptions.showTags ? 'text-blue-400' : 'text-neutral-500'}`} />
            </button>

            {/* Toggle Sharing Stats */}
            <button
              type="button"
              onClick={() => toggleDisplayOption('showSharingStats')}
              title={displayOptions.showSharingStats ? "Hide sharing badges and counts" : "Show sharing badges and counts"}
              aria-label="Toggle sharing stats visibility"
              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-colors cursor-pointer ${
                displayOptions.showSharingStats
                  ? 'bg-neutral-800 text-neutral-200 border border-neutral-700/60 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-300 opacity-60'
              }`}
            >
              <Users className={`w-4 h-4 ${displayOptions.showSharingStats ? 'text-purple-400' : 'text-neutral-500'}`} />
            </button>
          </div>

          {/* Layout Toggle (Grid vs Split) */}
          <div className="flex items-center bg-[#181818] p-1 rounded-xl border border-neutral-800 gap-0.5 shadow-sm">
            <button
              type="button"
              title="Grid view"
              aria-label="Grid layout view"
              onClick={() => setViewLayout('grid')}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                viewLayout === 'grid'
                  ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700/60'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              title="Master-Detail split view"
              aria-label="Split master-detail view"
              onClick={() => {
                setViewLayout('split');
                if (!selectedNoteId && filteredNotes[0]) {
                  setSelectedNoteId(filteredNotes[0].id);
                }
              }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                viewLayout === 'split'
                  ? 'bg-neutral-800 text-white shadow-xs border border-neutral-700/60'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>

          {/* New Note Button */}
          <button
            id="btn-create-new-note"
            type="button"
            onClick={handleOpenNewNote}
            className="h-10 px-3 sm:px-3.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Note</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Bar */}
      <div className="px-3 sm:px-6 py-2.5 border-b border-neutral-800/80 bg-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Visibility Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar touch-pan-x w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <span>All</span>
            {displayOptions.showSharingStats && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-neutral-900 text-neutral-400">
                {totalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('private')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
              activeFilter === 'private'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>My Private</span>
            {displayOptions.showSharingStats && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-neutral-900 text-amber-400/80">
                {privateCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('shared')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
              activeFilter === 'shared'
                ? 'bg-blue-950/60 text-blue-300 border border-blue-800/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Shared with Team</span>
            {displayOptions.showSharingStats && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-neutral-900 text-blue-400/80">
                {sharedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('me')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
              activeFilter === 'me'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>Created by Me</span>
            {displayOptions.showSharingStats && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-neutral-900 text-neutral-400">
                {myNotesCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('shared_with_me')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
              activeFilter === 'shared_with_me'
                ? 'bg-purple-950/60 text-purple-300 border border-purple-800/40 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-purple-400" />
            <span>Shared with Me</span>
            {displayOptions.showSharingStats && (
              <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-neutral-900 text-purple-400/80">
                {sharedWithMeCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes or tags..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#181818] border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-700"
          />
        </div>
      </div>

      {/* Color Filter & Tags Bar */}
      {(displayOptions.showPalette || (displayOptions.showTags && allTags.length > 0)) && (
        <div className="px-3 sm:px-6 py-2 border-b border-neutral-800/40 bg-[#101010] flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Palette Filter */}
          {displayOptions.showPalette && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar max-w-full">
              <span className="text-neutral-500 text-[11px] font-medium mr-1 shrink-0">Palette:</span>
              {COLOR_PALETTES.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedColor(p.key)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] transition-colors cursor-pointer shrink-0 ${
                    selectedColor === p.key
                      ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tag Filters */}
          {displayOptions.showTags && allTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar max-w-full">
              <span className="text-neutral-500 text-[11px] font-medium mr-1 shrink-0">Tags:</span>
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-medium cursor-pointer shrink-0"
                >
                  Clear #{selectedTag}
                </button>
              )}
              {allTags.slice(0, 8).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors cursor-pointer border shrink-0 ${
                    selectedTag === t
                      ? 'bg-blue-950/70 text-blue-300 border-blue-700'
                      : 'bg-neutral-800/60 text-neutral-400 hover:text-neutral-200 border-neutral-700/40'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-400 gap-3">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading notepad space...</span>
          </div>
        ) : filteredNotes.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#181818] border border-neutral-800 flex items-center justify-center text-amber-400 mb-4 shadow-sm">
              <StickyNote className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-neutral-200">
              {activeFilter === 'private'
                ? 'No Private Notes'
                : activeFilter === 'shared'
                ? 'No Shared Notes'
                : 'No notes found'}
            </h3>
            <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
              {activeFilter === 'private'
                ? 'Keep personal reminders, quick draft checklists, or confidential work notes private to your user account.'
                : activeFilter === 'shared'
                ? 'Collaborate and share engineering guidelines, meeting minutes, or team documentation across the workspace.'
                : searchQuery
                ? `No notes match "${searchQuery}". Try adjusting your search query or color filter.`
                : 'Start jotting down thoughts, checklists, or team guidelines right here.'}
            </p>
            <button
              type="button"
              onClick={handleOpenNewNote}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Note</span>
            </button>
          </div>
        ) : viewLayout === 'grid' ? (
          /* ========================================================= */
          /* GRID VIEW                                                 */
          /* ========================================================= */
          <div className="h-full overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400/90 uppercase tracking-wider">
                  <Pin className="w-3.5 h-3.5 fill-amber-400/80" />
                  <span>Pinned Notes</span>
                  <span className="text-neutral-500 font-normal">({pinnedNotes.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={handleEditNote}
                      onShare={handleOpenShare}
                      onSelect={(n) => {
                        setSelectedNoteId(n.id);
                        setViewLayout('split');
                      }}
                      showPalette={displayOptions.showPalette}
                      showTags={displayOptions.showTags}
                      showSharingStats={displayOptions.showSharingStats}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Other Notes Section */}
            {unpinnedNotes.length > 0 && (
              <div className="space-y-3">
                {pinnedNotes.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider pt-2">
                    <span>Other Notes</span>
                    <span className="text-neutral-500 font-normal">({unpinnedNotes.length})</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {unpinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={handleEditNote}
                      onShare={handleOpenShare}
                      onSelect={(n) => {
                        setSelectedNoteId(n.id);
                        setViewLayout('split');
                      }}
                      showPalette={displayOptions.showPalette}
                      showTags={displayOptions.showTags}
                      showSharingStats={displayOptions.showSharingStats}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================= */
          /* SPLIT MASTER-DETAIL VIEW                                  */
          /* ========================================================= */
          <div className="h-full flex flex-col md:flex-row overflow-hidden">
            {/* Left Note List Pane */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-neutral-800 bg-[#121212] flex flex-col h-full overflow-hidden shrink-0 ${
                selectedNote ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="p-3 border-b border-neutral-800/60 bg-[#161616] flex items-center justify-between text-xs text-neutral-400">
                <span>{displayOptions.showSharingStats ? `${filteredNotes.length} matching notes` : 'Notes'}</span>
                <span className="text-[11px] text-neutral-500">Select to view & edit</span>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {filteredNotes.map((n) => {
                  const isSelected = selectedNote?.id === n.id;
                  return (
                    <div
                      key={n.id}
                      onClick={() => setSelectedNoteId(n.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/30 border-blue-600/60 text-white'
                          : 'bg-[#181818] border-neutral-800/80 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {n.isPrivate ? (
                            <span className="text-amber-400">
                              <Lock className="w-3 h-3" />
                            </span>
                          ) : (
                            <span className="text-blue-400">
                              <Globe className="w-3 h-3" />
                            </span>
                          )}
                          <h4 className="text-xs font-semibold text-neutral-200 truncate">
                            {n.title || 'Untitled'}
                          </h4>
                        </div>
                        {n.isPinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                        {n.content.replace(/^#+\s+/gm, '').trim() || 'Empty note'}
                      </p>
                      {displayOptions.showSharingStats && (
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 mt-2">
                          <span>{n.authorId === currentUser?.id ? 'You' : n.authorName}</span>
                          <span>{new Date(n.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Note Detail Pane */}
            <div
              className={`flex-1 flex flex-col h-full bg-[#141414] overflow-hidden ${
                selectedNote ? 'flex' : 'hidden md:flex'
              }`}
            >
              {selectedNote ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {/* Detail Header */}
                  <div className="p-4 sm:p-5 border-b border-neutral-800 bg-[#181818] flex flex-wrap items-center justify-between gap-3">
                    <div>
                      {/* Mobile Back Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedNoteId(null)}
                        className="md:hidden inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white font-medium py-1 px-2 -ml-2 rounded-lg hover:bg-neutral-800/80 mb-2 cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 text-blue-400" />
                        <span>Back to notes list</span>
                      </button>

                      <div className="flex items-center gap-2 mb-1">
                        {displayOptions.showSharingStats ? (
                          <>
                            {selectedNote.isPrivate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40">
                                <Lock className="w-3 h-3" />
                                <span>Private Note</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/60 text-blue-300 border border-blue-800/40">
                                <Globe className="w-3 h-3" />
                                <span>Shared Note</span>
                              </span>
                            )}

                            {selectedNote.allowCollaboration && !selectedNote.isPrivate && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Collaboration Enabled</span>
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1 py-0.5">
                            {selectedNote.isPrivate ? (
                              <span title="Private note" className="text-amber-400 p-0.5">
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            ) : (
                              <span title="Shared note" className="text-blue-400 p-0.5">
                                <Globe className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => togglePinNote(selectedNote.id)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            selectedNote.isPinned
                              ? 'text-amber-400 bg-amber-950/50'
                              : 'text-neutral-400 hover:text-neutral-200'
                          }`}
                        >
                          <Pin className={`w-3.5 h-3.5 ${selectedNote.isPinned ? 'fill-amber-400' : ''}`} />
                        </button>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-neutral-100">
                        {selectedNote.title || 'Untitled Note'}
                      </h2>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyDetail(selectedNote)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
                      >
                        {copiedDetail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedDetail ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenShare(selectedNote)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Privacy / Share</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditNote(selectedNote)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>

                  {/* Detail Body */}
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                    {/* Author & Timestamp Bar */}
                    <div className="flex items-center gap-3 p-3 bg-[#181818] rounded-xl border border-neutral-800/80 text-xs text-neutral-400">
                      <UserAvatar
                        user={{
                          id: selectedNote.authorId,
                          name: selectedNote.authorName,
                          avatar: selectedNote.authorAvatar,
                          role: selectedNote.authorRole || 'member'
                        }}
                        size="sm"
                      />
                      <div>
                        <p className="text-neutral-200 font-medium">{selectedNote.authorName}</p>
                        <p className="text-[11px] text-neutral-500">
                          Last edited on {new Date(selectedNote.updatedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Note Content (Rendered Markdown & Checklists) */}
                    <div className="p-5 bg-[#181818] rounded-xl border border-neutral-800 space-y-3">
                      {selectedNote.content.split('\n').map((line, idx) => {
                        const checkMatch = line.match(/^(\s*[-*]\s*\[)([ xX])(\]\s*)(.*)$/);
                        if (checkMatch) {
                          const isChecked = checkMatch[2].toLowerCase() === 'x';
                          return (
                            <div
                              key={idx}
                              onClick={() => handleToggleDetailChecklist(idx)}
                              className="flex items-center gap-2.5 text-sm cursor-pointer select-none hover:text-white transition-colors"
                            >
                              <div
                                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                  isChecked
                                    ? 'bg-blue-600 border-blue-500 text-white'
                                    : 'border-neutral-600 bg-neutral-800 hover:border-neutral-500'
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className={isChecked ? 'line-through text-neutral-500' : 'text-neutral-200'}>
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
                            <blockquote key={idx} className="border-l-2 border-amber-500/60 pl-3 py-1 italic text-neutral-300 bg-amber-950/20 rounded-r-lg">
                              {line.replace('> ', '')}
                            </blockquote>
                          );
                        }
                        if (line.startsWith('- ')) {
                          return (
                            <li key={idx} className="list-disc ml-4 text-neutral-300 text-sm">
                              {line.replace('- ', '')}
                            </li>
                          );
                        }
                        return (
                          <p key={idx} className="text-sm text-neutral-300 leading-relaxed min-h-[1.2em]">
                            {line}
                          </p>
                        );
                      })}
                    </div>

                    {/* Linked Task & Tags */}
                    {(selectedNote.linkedTaskId || (displayOptions.showTags && selectedNote.tags && selectedNote.tags.length > 0)) && (
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        {displayOptions.showTags && selectedNote.tags && selectedNote.tags.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-neutral-500" />
                            {selectedNote.tags.map((t) => (
                              <span
                                key={t}
                                className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-800 text-neutral-300 border border-neutral-700"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                        {selectedNote.linkedTaskTitle && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-blue-950/40 text-blue-300 border border-blue-800/40">
                            <span>Linked Task:</span>
                            <span className="font-semibold">{selectedNote.linkedTaskTitle}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-xs">
                  <StickyNote className="w-8 h-8 mb-2 opacity-50" />
                  <span>Select a note from the left to view details</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingNote(null);
        }}
        noteToEdit={editingNote}
      />

      <NoteShareModal
        isOpen={isShareModalOpen}
        onClose={() => {
          setIsShareModalOpen(false);
          setSharingNote(null);
        }}
        note={sharingNote}
      />
    </div>
  );
};
