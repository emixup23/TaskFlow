import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Note, NoteColor } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';

export type NoteFilterTab = 'all' | 'private' | 'shared' | 'me' | 'shared_with_me';

interface NotepadContextType {
  notes: Note[];
  filteredNotes: Note[];
  isLoading: boolean;
  error: string | null;
  activeFilter: NoteFilterTab;
  setActiveFilter: (filter: NoteFilterTab) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  selectedNote: Note | null;
  isEditorOpen: boolean;
  setIsEditorOpen: (open: boolean) => void;
  editingNote: Note | null;
  setEditingNote: (note: Note | null) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  sharingNote: Note | null;
  setSharingNote: (note: Note | null) => void;
  refreshNotes: () => Promise<void>;
  createNote: (data: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>) => Promise<Note>;
  shareNote: (
    id: string,
    data: {
      isPrivate: boolean;
      isSharedWithAll?: boolean;
      sharedWithUserIds?: string[];
      allowCollaboration?: boolean;
    }
  ) => Promise<Note>;
  togglePinNote: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  totalCount: number;
  privateCount: number;
  sharedCount: number;
  myNotesCount: number;
  sharedWithMeCount: number;
  allTags: string[];
}

const NotepadContext = createContext<NotepadContextType | undefined>(undefined);

export const NotepadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { awardXP } = useGamification();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<NoteFilterTab>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [sharingNote, setSharingNote] = useState<Note | null>(null);

  const refreshNotes = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setError(null);
      const data = await apiClient.getNotes();
      setNotes(data || []);
    } catch (err: any) {
      console.error('Failed to fetch notes:', err);
      setError(err?.message || 'Failed to load notepad notes');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshNotes();
    } else {
      setNotes([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshNotes]);

  // Derived statistics for counters and filter badges
  const { totalCount, privateCount, sharedCount, myNotesCount, sharedWithMeCount, allTags } = useMemo(() => {
    const currentId = currentUser?.id;
    let priv = 0;
    let shared = 0;
    let mine = 0;
    let sharedWithMe = 0;
    const tagSet = new Set<string>();

    for (const note of notes) {
      if (note.authorId === currentId) {
        mine++;
        if (note.isPrivate) {
          priv++;
        } else {
          shared++;
        }
      } else {
        if (!note.isPrivate) {
          sharedWithMe++;
          shared++;
        }
      }

      if (Array.isArray(note.tags)) {
        for (const t of note.tags) {
          if (t.trim()) tagSet.add(t.trim());
        }
      }
    }

    return {
      totalCount: notes.length,
      privateCount: priv,
      sharedCount: shared,
      myNotesCount: mine,
      sharedWithMeCount: sharedWithMe,
      allTags: Array.from(tagSet).sort()
    };
  }, [notes, currentUser?.id]);

  // Filtered notes based on current tab, search, color, and tag
  const filteredNotes = useMemo(() => {
    const currentId = currentUser?.id;
    return notes.filter((n) => {
      // 1. Tab Filter
      if (activeFilter === 'private') {
        if (n.authorId !== currentId || !n.isPrivate) return false;
      } else if (activeFilter === 'shared') {
        if (n.isPrivate) return false;
      } else if (activeFilter === 'me') {
        if (n.authorId !== currentId) return false;
      } else if (activeFilter === 'shared_with_me') {
        if (n.authorId === currentId || n.isPrivate) return false;
      }

      // 2. Color Filter
      if (selectedColor !== 'all') {
        if ((n.color || 'amber') !== selectedColor) return false;
      }

      // 3. Tag Filter
      if (selectedTag) {
        if (!Array.isArray(n.tags) || !n.tags.includes(selectedTag)) return false;
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesAuthor = n.authorName.toLowerCase().includes(q);
        const matchesTag = Array.isArray(n.tags) && n.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesAuthor && !matchesTag) {
          return false;
        }
      }

      return true;
    });
  }, [notes, activeFilter, selectedColor, selectedTag, searchQuery, currentUser?.id]);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const createNote = useCallback(
    async (data: Partial<Note>): Promise<Note> => {
      const created = await apiClient.createNote(data);
      setNotes((prev) => [created, ...prev]);
      try {
        awardXP(15, created.isPrivate ? 'Created private note' : 'Created shared workspace note');
      } catch {
        // ignore gamification error
      }
      return created;
    },
    [awardXP]
  );

  const updateNote = useCallback(
    async (id: string, data: Partial<Note>): Promise<Note> => {
      const updated = await apiClient.updateNote(id, data);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      return updated;
    },
    []
  );

  const shareNote = useCallback(
    async (
      id: string,
      data: {
        isPrivate: boolean;
        isSharedWithAll?: boolean;
        sharedWithUserIds?: string[];
        allowCollaboration?: boolean;
      }
    ): Promise<Note> => {
      const updated = await apiClient.shareNote(id, data);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      if (!data.isPrivate) {
        try {
          awardXP(10, 'Shared note with team');
        } catch {
          // ignore
        }
      }
      return updated;
    },
    [awardXP]
  );

  const togglePinNote = useCallback(async (id: string) => {
    // Optimistic toggle
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
    try {
      const updated = await apiClient.togglePinNote(id);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
    } catch (err) {
      console.error('Failed to toggle pin:', err);
      // Revert
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
      );
    }
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    // Optimistic delete
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
    try {
      await apiClient.deleteNote(id);
    } catch (err) {
      console.error('Failed to delete note:', err);
      refreshNotes();
      throw err;
    }
  }, [selectedNoteId, refreshNotes]);

  return (
    <NotepadContext.Provider
      value={{
        notes,
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
        refreshNotes,
        createNote,
        updateNote,
        shareNote,
        togglePinNote,
        deleteNote,
        totalCount,
        privateCount,
        sharedCount,
        myNotesCount,
        sharedWithMeCount,
        allTags
      }}
    >
      {children}
    </NotepadContext.Provider>
  );
};

export const useNotepad = (): NotepadContextType => {
  const context = useContext(NotepadContext);
  if (!context) {
    throw new Error('useNotepad must be used within a NotepadProvider');
  }
  return context;
};
