import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, AlertCircle, Check, Loader2 } from 'lucide-react';

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

interface VoiceToTextButtonProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onDone?: (finalValue: string) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
  title?: string;
}

export const VoiceToTextButton: React.FC<VoiceToTextButtonProps> = ({
  id = 'voice-to-text-btn',
  value,
  onChange,
  onDone,
  disabled = false,
  className = '',
  compact = false,
  title = 'Voice-to-text: Dictate description'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const initialTextRef = useRef<string>('');
  const latestValueRef = useRef<string>(value);
  const timerRef = useRef<number | null>(null);

  // Keep latest value in ref
  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  // Check speech recognition support
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setIsSupported(false);
    }
  }, []);

  const showStatus = (msg: string, duration = 4000) => {
    setStatusMessage(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setStatusMessage(null);
    }, duration);
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore if already stopped
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
    if (onDone) {
      onDone(latestValueRef.current);
    }
  }, [onDone]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startListening = () => {
    if (disabled) return;

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognitionClass) {
      showStatus('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      // Save current value at the start of dictation
      initialTextRef.current = latestValueRef.current;

      const recognition: SpeechRecognitionInstance = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = typeof navigator !== 'undefined' ? navigator.language || 'en-US' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage('Listening... Speak clearly into your microphone');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalChunk += res[0].transcript + ' ';
          } else {
            interimChunk += res[0].transcript;
          }
        }

        const speechRecorded = (finalChunk + interimChunk).trim();
        setInterimText(interimChunk ? `"${interimChunk}"` : '');

        if (speechRecorded) {
          const base = initialTextRef.current.trim();
          let combined = '';
          if (!base) {
            combined = speechRecorded;
          } else {
            // Smart spacing
            const separator = base.endsWith('\n') ? '' : ' ';
            combined = `${base}${separator}${speechRecorded}`;
          }
          latestValueRef.current = combined;
          onChange(combined);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          showStatus('Microphone permission denied. Please allow microphone access in your browser settings.');
        } else if (event.error === 'no-speech') {
          showStatus('No speech detected. Please speak closer to your microphone.');
        } else if (event.error === 'audio-capture') {
          showStatus('No microphone found or microphone is in use by another app.');
        } else if (event.error === 'network') {
          showStatus('Network connection error occurred during voice recognition.');
        } else {
          showStatus(`Speech recognition error: ${event.error}`);
        }
        stopListening();
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
        if (onDone) {
          onDone(latestValueRef.current);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      showStatus(err?.message || 'Could not access microphone');
      setIsListening(false);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isListening) {
      stopListening();
      showStatus('Voice dictation finished');
    } else {
      startListening();
    }
  };

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
      {/* Voice-to-Text Button */}
      <button
        type="button"
        id={id}
        onClick={handleToggle}
        disabled={disabled}
        title={isListening ? 'Click to stop voice dictation' : title}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          isListening
            ? 'bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-500 shadow-sm shadow-rose-900/40 animate-pulse'
            : 'bg-[#222222] hover:bg-[#2c2c2c] text-neutral-300 hover:text-white border border-[#383838] hover:border-neutral-500'
        }`}
      >
        {isListening ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Mic className="w-3.5 h-3.5 text-white" />
            <span className="font-semibold text-[11px] text-white">
              {compact ? 'Listening' : 'Listening... Stop'}
            </span>
            {/* Audio wave animation */}
            <span className="flex items-center gap-0.5 h-2.5 pl-0.5">
              <span className="w-0.5 bg-white/90 rounded-full h-1.5 animate-pulse" />
              <span className="w-0.5 bg-white rounded-full h-2.5 animate-pulse delay-100" />
              <span className="w-0.5 bg-white/80 rounded-full h-1 animate-pulse delay-200" />
            </span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-300 transition-colors" />
            <span className="text-[11px] font-medium text-neutral-300">
              {compact ? 'Voice' : 'Voice-to-Text'}
            </span>
          </>
        )}
      </button>

      {/* Live Interim Transcript Bubble */}
      {isListening && interimText && (
        <span className="hidden sm:inline-block text-[11px] text-rose-300/90 italic truncate max-w-[180px] bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
          {interimText}
        </span>
      )}

      {/* Status / Error Toast Popover */}
      {statusMessage && (
        <div
          role="status"
          className="absolute z-30 bottom-full mb-1.5 right-0 sm:right-auto sm:left-0 min-w-[220px] max-w-xs p-2 bg-[#1b1b1b] border border-[#3b3b3b] shadow-xl rounded-md text-[11px] text-neutral-200 flex items-start gap-2 animate-in fade-in zoom-in-95 duration-150"
        >
          {isListening ? (
            <Loader2 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5 animate-spin" />
          ) : statusMessage.includes('denied') || statusMessage.includes('not supported') || statusMessage.includes('error') ? (
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          ) : (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 leading-snug">{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-neutral-500 hover:text-neutral-300 text-xs ml-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
};
