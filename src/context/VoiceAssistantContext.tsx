import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useTasks } from './TaskContext';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { apiClient } from '../api/client';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { VoiceAssistantMessage, VoiceAssistantStatus, ViewMode, Priority } from '../types';

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
}

interface VoiceAssistantContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  toggleVoiceAssistant: () => void;
  status: VoiceAssistantStatus;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  transcript: string;
  interimTranscript: string;
  messages: VoiceAssistantMessage[];
  isWidgetOpen: boolean;
  setIsWidgetOpen: (open: boolean) => void;
  startListening: () => void;
  stopListening: () => void;
  stopSpeaking: () => void;
  speak: (text: string) => void;
  executeCommand: (text: string) => Promise<void>;
  clearHistory: () => void;
  isSpeechRecognitionSupported: boolean;
  isSpeechSynthesisSupported: boolean;
  lastActionMessage: string | null;
}

const VoiceAssistantContext = createContext<VoiceAssistantContextType | undefined>(undefined);

export const VoiceAssistantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    tasks,
    projects,
    activeProjectId,
    viewMode,
    setViewMode,
    setFilters,
    resetFilters,
    setIsCreateModalOpen,
    setIsSettingsModalOpen,
    addToast
  } = useTasks();

  const { currentUser } = useAuth();
  const { currentLanguageConfig } = useLanguage();

  // Master switch state (default: true so users can immediately use it, or restored from localStorage)
  const [isEnabled, setIsEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(STORAGE_KEYS.VOICE_ASSISTANT_ENABLED);
    return stored !== null ? stored === 'true' : true;
  });

  // Audio output mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEYS.VOICE_ASSISTANT_MUTED);
    return stored === 'true';
  });

  // Window open state: closed (false) by default
  const [isWidgetOpen, setIsWidgetOpenState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(STORAGE_KEYS.VOICE_ASSISTANT_WIDGET_OPEN);
    return stored !== null ? stored === 'true' : false;
  });

  const setIsWidgetOpen = useCallback((open: boolean) => {
    setIsWidgetOpenState(open);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.VOICE_ASSISTANT_WIDGET_OPEN, String(open));
    }
  }, []);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<VoiceAssistantMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: 'Hello! I am your TaskFlow Voice Assistant. You can tell me to summarize your tasks, switch views, or create new action items. Turn me off anytime using the power button or header toggle.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSpeechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition ||
        (window as any).mozSpeechRecognition ||
        (window as any).msSpeechRecognition
    );

  const isSpeechSynthesisSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Persist enabled state
  const setIsEnabled = useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.VOICE_ASSISTANT_ENABLED, String(enabled));
    }
    if (!enabled) {
      setIsWidgetOpen(false);
      // Abruptly cancel speech recognition & speaking when turned off
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      setIsListening(false);
      setIsSpeaking(false);
      setIsProcessing(false);
      setInterimTranscript('');
    }
  }, [setIsWidgetOpen]);

  const toggleVoiceAssistant = useCallback(() => {
    if (!isEnabled) {
      setIsEnabled(true);
      setIsWidgetOpen(true);
    } else if (!isWidgetOpen) {
      setIsWidgetOpen(true);
    } else {
      setIsWidgetOpen(false);
    }
  }, [isEnabled, isWidgetOpen, setIsEnabled, setIsWidgetOpen]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.VOICE_ASSISTANT_MUTED, String(next));
      }
      if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      return next;
    });
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsSpeaking(false);
  }, []);

  // Speak text response via SpeechSynthesis
  const speak = useCallback(
    (text: string) => {
      if (!isEnabled || isMuted || !isSpeechSynthesisSupported || !text) {
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Choose appropriate voice or language
        utterance.lang = currentLanguageConfig?.code ? `${currentLanguageConfig.code}-US` : 'en-US';
        utterance.rate = 1.05;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
        };

        utterance.onerror = (e) => {
          console.warn('Speech synthesis utterance error:', e);
          setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis failed:', err);
        setIsSpeaking(false);
      }
    },
    [isEnabled, isMuted, isSpeechSynthesisSupported, currentLanguageConfig]
  );

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  // Execute command (called after voice capture or typed input)
  const executeCommand = useCallback(
    async (commandText: string) => {
      const trimmed = commandText.trim();
      if (!trimmed) return;

      // Append user message to log
      const userMsg: VoiceAssistantMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, userMsg]);
      setTranscript('');
      setInterimTranscript('');
      setIsProcessing(true);

      try {
        const activeProject = projects.find((p) => p.id === activeProjectId);
        const res = await apiClient.assistantChat({
          message: trimmed,
          context: {
            currentUser: currentUser ? { name: currentUser.name, role: currentUser.role, email: currentUser.email } : undefined,
            activeProjectId,
            activeProjectName: activeProject?.name || 'Workspace',
            viewMode,
            tasksCount: tasks.length
          }
        });

        const reply = res.reply || 'Understood.';
        let actionNote: string | undefined;

        // Execute frontend action if specified
        if (res.action) {
          const { type, payload } = res.action;

          if (type === 'NAVIGATE' && payload) {
            setViewMode(payload as ViewMode);
            actionNote = `Navigated to ${payload}`;
            setLastActionMessage(actionNote);
          } else if (type === 'OPEN_MODAL') {
            if (payload === 'create_task') {
              setIsCreateModalOpen(true);
              actionNote = 'Opened new task modal';
            } else if (payload === 'settings') {
              setIsSettingsModalOpen(true);
              actionNote = 'Opened settings modal';
            }
            if (actionNote) setLastActionMessage(actionNote);
          } else if (type === 'CREATE_TASK') {
            setIsCreateModalOpen(true);
            actionNote = payload?.title ? `Ready to create: "${payload.title}"` : 'Opened task creator';
            setLastActionMessage(actionNote);
          } else if (type === 'SEARCH' && typeof payload === 'string') {
            setFilters((prev) => ({ ...prev, search: payload }));
            actionNote = `Filtered by "${payload}"`;
            setLastActionMessage(actionNote);
          } else if (type === 'FILTER_PRIORITY' && payload) {
            setFilters((prev) => ({ ...prev, priority: [payload as Priority] }));
            actionNote = `Filtered by ${payload} priority`;
            setLastActionMessage(actionNote);
          } else if (type === 'CLEAR_FILTERS') {
            resetFilters();
            actionNote = 'Reset all filters';
            setLastActionMessage(actionNote);
          } else if (type === 'SUMMARIZE') {
            actionNote = 'Generated task summary';
            setLastActionMessage(actionNote);
          }
        }

        const assistantMsg: VoiceAssistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionExecuted: actionNote
        };

        setMessages((prev) => [...prev, assistantMsg]);
        speak(reply);
      } catch (err: any) {
        console.error('Error executing voice command:', err);
        const errorMsg: VoiceAssistantMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I had trouble processing that request. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errorMsg]);
        speak('Sorry, I had trouble processing that request.');
      } finally {
        setIsProcessing(false);
      }
    },
    [
      currentUser,
      activeProjectId,
      projects,
      viewMode,
      tasks.length,
      setViewMode,
      setIsCreateModalOpen,
      setIsSettingsModalOpen,
      setFilters,
      resetFilters,
      speak
    ]
  );

  // Start speech recognition
  const startListening = useCallback(() => {
    if (!isEnabled) {
      addToast('info', 'Turn on the Voice Assistant to enable listening.');
      return;
    }

    if (!isSpeechRecognitionSupported) {
      addToast('error', 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Stop speaking if currently speaking
    stopSpeaking();

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition: SpeechRecognitionInstance = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = currentLanguageConfig?.code ? `${currentLanguageConfig.code}-US` : 'en-US';

      let finalCapturedText = '';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            finalCapturedText += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }
        setTranscript(finalCapturedText);
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed') {
          addToast('error', 'Microphone permission denied. Please allow microphone access in browser settings.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
        const captured = finalCapturedText.trim();
        if (captured) {
          executeCommand(captured);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      addToast('error', 'Unable to start speech recognition.');
    }
  }, [isEnabled, isSpeechRecognitionSupported, stopSpeaking, currentLanguageConfig, addToast, executeCommand]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    setLastActionMessage(null);
  }, []);

  // Cleanup when unmounting
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, []);

  // Calculate high-level status
  const status: VoiceAssistantStatus = !isEnabled
    ? 'disabled'
    : isProcessing
    ? 'processing'
    : isSpeaking
    ? 'speaking'
    : isListening
    ? 'listening'
    : 'idle';

  return (
    <VoiceAssistantContext.Provider
      value={{
        isEnabled,
        setIsEnabled,
        toggleVoiceAssistant,
        status,
        isListening,
        isSpeaking,
        isProcessing,
        isMuted,
        toggleMute,
        transcript,
        interimTranscript,
        messages,
        isWidgetOpen,
        setIsWidgetOpen,
        startListening,
        stopListening,
        stopSpeaking,
        speak,
        executeCommand,
        clearHistory,
        isSpeechRecognitionSupported,
        isSpeechSynthesisSupported,
        lastActionMessage
      }}
    >
      {children}
    </VoiceAssistantContext.Provider>
  );
};

export const useVoiceAssistant = (): VoiceAssistantContextType => {
  const context = useContext(VoiceAssistantContext);
  if (!context) {
    throw new Error('useVoiceAssistant must be used within a VoiceAssistantProvider');
  }
  return context;
};
