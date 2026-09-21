import React from 'react';
import { useVoiceAssistant } from '../../context/VoiceAssistantContext';
import { Mic, MicOff, Sparkles } from 'lucide-react';

interface VoiceAssistantHeaderToggleProps {
  className?: string;
}

export const VoiceAssistantHeaderToggle: React.FC<VoiceAssistantHeaderToggleProps> = ({ className = '' }) => {
  const {
    isEnabled,
    toggleVoiceAssistant,
    status,
    isListening,
    isSpeaking,
    isWidgetOpen
  } = useVoiceAssistant();

  return (
    <div className={`relative flex items-center ${className}`}>
      <button
        type="button"
        id="btn-header-voice-assistant-toggle"
        onClick={toggleVoiceAssistant}
        title={
          !isEnabled
            ? 'Voice Assistant is OFF. Click to Turn ON (Ctrl+Shift+V)'
            : isWidgetOpen
            ? 'Voice Assistant window is OPEN. Click to Close (Ctrl+Shift+V)'
            : 'Voice Assistant is Ready. Click to Open Window (Ctrl+Shift+V)'
        }
        className={`h-8 w-8 rounded-lg flex items-center justify-center border text-xs font-medium transition-all cursor-pointer active:scale-95 group ${
          isEnabled
            ? isListening
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 shadow-sm shadow-emerald-500/20 ring-1 ring-emerald-500/40 animate-pulse'
              : isSpeaking
              ? 'bg-indigo-950/40 border-indigo-500/60 text-indigo-300 shadow-sm shadow-indigo-500/20'
              : 'bg-blue-950/30 hover:bg-blue-900/40 border-blue-500/40 text-blue-300 shadow-sm shadow-blue-500/10'
            : 'bg-[#1a1a1a] hover:bg-[#262626] text-neutral-400 hover:text-neutral-200 border-[#333333]'
        }`}
      >
        {/* Icon */}
        <div className="relative flex items-center justify-center">
          {isEnabled ? (
            <Mic
              className={`w-3.5 h-3.5 transition-colors ${
                isListening ? 'text-emerald-400' : isSpeaking ? 'text-indigo-400' : 'text-blue-400'
              }`}
            />
          ) : (
            <MicOff className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300" />
          )}

          {isEnabled && (
            <span
              className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${
                isListening ? 'bg-emerald-400 animate-ping' : isSpeaking ? 'bg-indigo-400' : 'bg-blue-400'
              }`}
            />
          )}
        </div>
      </button>
    </div>
  );
};
