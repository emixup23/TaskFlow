import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Note, NoteColor, NoteDirectory } from '../types';
import { apiClient } from '../api/client';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';

export type NoteFilterTab = 'all' | 'private' | 'shared' | 'me' | 'shared_with_me';

interface NotepadContextType {
  notes: Note[];
  filteredNotes: Note[];
  directories: NoteDirectory[];
  selectedDirectoryId: string | null; // null = all, 'unfiled' = notes without directory, or directory.id
  setSelectedDirectoryId: (id: string | null) => void;
  activeDirectory: NoteDirectory | null;
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
  isDirectoryModalOpen: boolean;
  setIsDirectoryModalOpen: (open: boolean) => void;
  editingDirectory: NoteDirectory | null;
  setEditingDirectory: (dir: NoteDirectory | null) => void;
  refreshNotes: () => Promise<void>;
  refreshDirectories: () => Promise<void>;
  createNote: (data: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>) => Promise<Note>;
  moveNoteToDirectory: (id: string, directoryId: string | null) => Promise<Note>;
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
  createDirectory: (data: Partial<NoteDirectory>) => Promise<NoteDirectory>;
  updateDirectory: (id: string, data: Partial<NoteDirectory>) => Promise<NoteDirectory>;
  deleteDirectory: (id: string) => Promise<void>;
  totalCount: number;
  privateCount: number;
  sharedCount: number;
  myNotesCount: number;
  sharedWithMeCount: number;
  unfiledCount: number;
  allTags: string[];
}

const NotepadContext = createContext<NotepadContextType | undefined>(undefined);

export const NotepadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { awardXP } = useGamification();

  const [notes, setNotes] = useState<Note[]>([]);
  const [directories, setDirectories] = useState<NoteDirectory[]>([]);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<string | null>(null);
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

  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState<boolean>(false);
  const [editingDirectory, setEditingDirectory] = useState<NoteDirectory | null>(null);

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

  const refreshDirectories = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiClient.getNoteDirectories();
      setDirectories(data || []);
    } catch (err: any) {
      console.error('Failed to fetch note directories:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshNotes();
      refreshDirectories();
    } else {
      setNotes([]);
      setDirectories([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshNotes, refreshDirectories]);

  // Derived statistics for counters and filter badges
  const { totalCount, privateCount, sharedCount, myNotesCount, sharedWithMeCount, unfiledCount, allTags } = useMemo(() => {
    const currentId = currentUser?.id;
    let priv = 0;
    let shared = 0;
    let mine = 0;
    let sharedWithMe = 0;
    let unfiled = 0;
    const tagSet = new Set<string>();

    for (const note of notes) {
      if (!note.directoryId) {
        unfiled++;
      }

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
      unfiledCount: unfiled,
      allTags: Array.from(tagSet).sort()
    };
  }, [notes, currentUser?.id]);

  const activeDirectory = useMemo(() => {
    if (!selectedDirectoryId || selectedDirectoryId === 'unfiled') return null;
    return directories.find((d) => d.id === selectedDirectoryId) || null;
  }, [directories, selectedDirectoryId]);

  // Filtered notes based on current tab, directory, search, color, and tag
  const filteredNotes = useMemo(() => {
    const currentId = currentUser?.id;
    return notes.filter((n) => {
      // 1. Directory Filter
      if (selectedDirectoryId === 'unfiled') {
        if (n.directoryId) return false;
      } else if (selectedDirectoryId) {
        if (n.directoryId !== selectedDirectoryId) return false;
      }

      // 2. Tab Filter
      if (activeFilter === 'private') {
        if (n.authorId !== currentId || !n.isPrivate) return false;
      } else if (activeFilter === 'shared') {
        if (n.isPrivate) return false;
      } else if (activeFilter === 'me') {
        if (n.authorId !== currentId) return false;
      } else if (activeFilter === 'shared_with_me') {
        if (n.authorId === currentId || n.isPrivate) return false;
      }

      // 3. Color Filter
      if (selectedColor !== 'all') {
        if ((n.color || 'amber') !== selectedColor) return false;
      }

      // 4. Tag Filter
      if (selectedTag) {
        if (!Array.isArray(n.tags) || !n.tags.includes(selectedTag)) return false;
      }

      // 5. Search Filter
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
  }, [notes, selectedDirectoryId, activeFilter, selectedColor, selectedTag, searchQuery, currentUser?.id]);

  const selectedNote = useMemo(() => {
    if (!selectedNoteId) return null;
    return notes.find((n) => n.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const createNote = useCallback(
    async (data: Partial<Note>): Promise<Note> => {
      // Default to currently selected directory if in one
      const payload: Partial<Note> = {
        ...data,
        directoryId: data.directoryId !== undefined 
          ? data.directoryId 
          : (selectedDirectoryId && selectedDirectoryId !== 'unfiled' ? selectedDirectoryId : null)
      };

      const created = await apiClient.createNote(payload);
      setNotes((prev) => [created, ...prev]);
      refreshDirectories();
      try {
        awardXP(15, created.isPrivate ? 'Created private note' : 'Created shared workspace note');
      } catch {
        // ignore gamification error
      }
      return created;
    },
    [awardXP, selectedDirectoryId, refreshDirectories]
  );

  const updateNote = useCallback(
    async (id: string, data: Partial<Note>): Promise<Note> => {
      const updated = await apiClient.updateNote(id, data);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      refreshDirectories();
      return updated;
    },
    [refreshDirectories]
  );

  const moveNoteToDirectory = useCallback(
    async (id: string, directoryId: string | null): Promise<Note> => {
      const updated = await apiClient.moveNoteToDirectory(id, directoryId);
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      refreshDirectories();
      return updated;
    },
    [refreshDirectories]
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
      refreshDirectories();
    } catch (err) {
      console.error('Failed to delete note:', err);
      refreshNotes();
      throw err;
    }
  }, [selectedNoteId, refreshNotes, refreshDirectories]);

  // Directory CRUD
  const createDirectory = useCallback(async (data: Partial<NoteDirectory>): Promise<NoteDirectory> => {
    const created = await apiClient.createNoteDirectory(data);
    setDirectories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }, []);

  const updateDirectory = useCallback(async (id: string, data: Partial<NoteDirectory>): Promise<NoteDirectory> => {
    const updated = await apiClient.updateNoteDirectory(id, data);
    setDirectories((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)).sort((a, b) => a.name.localeCompare(b.name)));
    return updated;
  }, []);

  const deleteDirectory = useCallback(async (id: string): Promise<void> => {
    await apiClient.deleteNoteDirectory(id);
    setDirectories((prev) => prev.filter((d) => d.id !== id));
    // Any notes in this directory will become unfiled locally
    setNotes((prev) => prev.map((n) => n.directoryId === id ? { ...n, directoryId: null } : n));
    if (selectedDirectoryId === id) {
      setSelectedDirectoryId(null);
    }
  }, [selectedDirectoryId]);

  return (
    <NotepadContext.Provider
      value={{
        notes,
        filteredNotes,
        directories,
        selectedDirectoryId,
        setSelectedDirectoryId,
        activeDirectory,
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
        isDirectoryModalOpen,
        setIsDirectoryModalOpen,
        editingDirectory,
        setEditingDirectory,
        refreshNotes,
        refreshDirectories,
        createNote,
        updateNote,
        moveNoteToDirectory,
        shareNote,
        togglePinNote,
        deleteNote,
        createDirectory,
        updateDirectory,
        deleteDirectory,
        totalCount,
        privateCount,
        sharedCount,
        myNotesCount,
        sharedWithMeCount,
        unfiledCount,
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
