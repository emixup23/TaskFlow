import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onToggleSidebar: () => void;
  onToggleThemeEditor: () => void;
  onToggleVoiceAssistant?: () => void;
}

/**
 * Handles global workspace keyboard shortcuts:
 * - Ctrl/Cmd + B: Toggles sidebar drawer
 * - Ctrl/Cmd + Shift/Alt + T: Toggles theme editor modal
 * - Ctrl/Cmd + Shift + V: Toggles voice assistant
 * 
 * Safely ignores events originating from form controls (input, textarea, contenteditable).
 */
export function useGlobalKeyboardShortcuts({
  onToggleSidebar,
  onToggleThemeEditor,
  onToggleVoiceAssistant
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Ctrl+B or Cmd+B -> Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleSidebar();
      }

      // Ctrl+Shift+T or Cmd+Shift+T or Alt+T -> Toggle Theme Studio
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.shiftKey || e.altKey) &&
        e.key.toLowerCase() === 't'
      ) {
        e.preventDefault();
        onToggleThemeEditor();
      }

      // Ctrl+Shift+V or Cmd+Shift+V -> Toggle Voice Assistant
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === 'v' &&
        onToggleVoiceAssistant
      ) {
        e.preventDefault();
        onToggleVoiceAssistant();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSidebar, onToggleThemeEditor, onToggleVoiceAssistant]);
}
