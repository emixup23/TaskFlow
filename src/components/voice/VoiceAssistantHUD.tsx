import React, { useState, useRef, useEffect } from 'react';
import { useVoiceAssistant } from '../../context/VoiceAssistantContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  Trash2,
  CheckCircle2,
  Square,
  Compass,
  ListTodo,
  HelpCircle,
  AlertCircle,
  X
} from 'lucide-react';

export const VoiceAssistantHUD: React.FC = () => {
  const {
    isEnabled,
    setIsEnabled,
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
    executeCommand,
    clearHistory,
    isSpeechRecognitionSupported,
    lastActionMessage
  } = useVoiceAssistant();

  const { t } = useLanguage();
  const [typedInput, setTypedInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll message list when new messages arrive
  useEffect(() => {
    if (isWidgetOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isWidgetOpen, interimTranscript]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim() || isProcessing) return;
    executeCommand(typedInput);
    setTypedInput('');
  };

  const handlePromptClick = (prompt: string) => {
    if (isProcessing) return;
    executeCommand(prompt);
  };

  // If completely disabled, render nothing (user can activate from Header or Settings)
  if (!isEnabled) {
    return null;
  }

  // Minimized state when enabled (window is closed by default)
  if (!isWidgetOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5">
        <div
          className={`flex items-center gap-2.5 pl-3.5 pr-2 py-1.5 rounded-full shadow-2xl border backdrop-blur-md transition-all ${
            isListening
              ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/40 animate-pulse'
              : isSpeaking
              ? 'bg-indigo-950/90 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/40'
              : isProcessing
              ? 'bg-blue-950/90 border-blue-500 text-blue-200'
              : 'bg-[#141414]/95 border-blue-500/40 hover:border-blue-400 text-white'
          }`}
        >
          <button
            type="button"
            id="btn-voice-assistant-expand-dock"
            onClick={() => setIsWidgetOpen(true)}
            className="flex items-center gap-2.5 text-left cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 focus:outline-none"
            title="Open Voice Assistant window (Ctrl+Shift+V)"
          >
            <div className="relative flex items-center justify-center">
              {isListening ? (
                <Mic className="w-4 h-4 text-emerald-400 animate-bounce" />
              ) : isSpeaking ? (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-400" />
              )}
              <span
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                  isListening ? 'bg-emerald-400 animate-ping' : isSpeaking ? 'bg-indigo-400' : 'bg-blue-500'
                }`}
              />
            </div>

            <div className="flex flex-col text-left">
            </div>
          </button>

          {/* Quick Mic trigger */}
          <button
            type="button"
            id="btn-voice-mini-mic"
            onClick={(e) => {
              e.stopPropagation();
              if (isListening) stopListening();
              else startListening();
            }}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-1 ${
              isListening ? 'bg-emerald-500 text-black' : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
            title={isListening ? 'Stop listening' : 'Start listening'}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          id="btn-voice-dock-close"
          onClick={() => setIsEnabled(false)}
          title="Turn off Voice Assistant"
          className="w-8 h-8 rounded-full bg-[#181818]/95 border border-[#333] hover:border-neutral-500 text-neutral-400 hover:text-white flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Full Expanded HUD Window
  return (
    <div
      id="taskflow-voice-assistant-hud"
      className="fixed bottom-4 right-4 z-40 w-[94vw] max-w-sm sm:max-w-md bg-[#121212]/98 border border-[#2d2d2d] rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-neutral-200 transition-all duration-200"
      style={{ maxHeight: 'min(580px, 85vh)' }}
    >
      {/* HUD Header */}
      <div className="px-4 py-3 bg-[#181818] border-b border-[#262626] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${
              isListening
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : isSpeaking
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400'
                : isProcessing
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                : 'bg-blue-600/20 border-blue-500/30 text-blue-400'
            }`}
          >
            <Sparkles className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Voice Assistant</h3>
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ON
              </span>
            </div>
            <p className="text-[10px] text-neutral-400">
              {status === 'listening'
                ? 'Listening to microphone...'
                : status === 'speaking'
                ? 'Replying via speech...'
                : status === 'processing'
                ? 'Analyzing command...'
                : 'Voice commands & productivity'}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Audio Mute/Unmute */}
          <button
            type="button"
            id="hud-btn-toggle-mute"
            onClick={toggleMute}
            title={isMuted ? 'Unmute voice output' : 'Mute voice output'}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                : 'bg-[#222] hover:bg-[#2c2c2c] border-[#333] text-neutral-300 hover:text-white'
            }`}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Clear history */}
          <button
            type="button"
            id="hud-btn-clear-history"
            onClick={clearHistory}
            title="Clear conversation"
            className="p-1.5 rounded-lg bg-[#222] hover:bg-[#2c2c2c] border border-[#333] text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close / Minimize HUD Window */}
          <button
            type="button"
            id="hud-btn-close"
            onClick={() => setIsWidgetOpen(false)}
            title="Close Voice Assistant window (Ctrl+Shift+V)"
            className="p-1.5 rounded-lg bg-[#222] hover:bg-[#2c2c2c] border border-[#333] text-neutral-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Master Turn OFF Power Button */}
          <button
            type="button"
            id="hud-btn-turn-off"
            onClick={() => setIsEnabled(false)}
            title="Turn Off Voice Assistant"
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
          >
            <Power className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Audio Waveform Visualizer & Status Banner */}
      <div className="px-4 py-2.5 bg-[#141414] border-b border-[#222] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {/* Animated dynamic wave bars */}
          <div className="flex items-center gap-1 h-5">
            {[40, 75, 100, 60, 90, 45, 80, 55].map((height, idx) => (
              <span
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening
                    ? 'bg-emerald-400 animate-pulse'
                    : isSpeaking
                    ? 'bg-indigo-400 animate-pulse'
                    : isProcessing
                    ? 'bg-blue-400'
                    : 'bg-neutral-600'
                }`}
                style={{
                  height:
                    isListening || isSpeaking
                      ? `${Math.max(4, (height * (isListening ? 1 : 0.85)) / 4)}px`
                      : '4px',
                  animationDelay: `${idx * 0.1}s`
                }}
              />
            ))}
          </div>

          <span className="text-xs font-semibold text-neutral-300">
            {isListening
              ? 'Listening to speech...'
              : isSpeaking
              ? 'Speaking response...'
              : isProcessing
              ? 'Thinking...'
              : 'Voice Ready'}
          </span>
        </div>

        {/* If Speaking: Show Stop button */}
        {isSpeaking && (
          <button
            type="button"
            id="hud-btn-stop-speech"
            onClick={stopSpeaking}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition-colors cursor-pointer"
          >
            <Square className="w-2.5 h-2.5 fill-current" />
            <span>Stop</span>
          </button>
        )}

        {/* If listening: Show Stop listening button */}
        {isListening && (
          <button
            type="button"
            id="hud-btn-stop-listening"
            onClick={stopListening}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            <Square className="w-2.5 h-2.5 fill-current" />
            <span>Done</span>
          </button>
        )}
      </div>

      {/* Real-time live speech transcript preview bubble (when listening) */}
      {(transcript || interimTranscript) && (
        <div className="px-4 py-2 bg-blue-950/30 border-b border-blue-900/40 flex items-start gap-2 text-xs text-blue-200">
          <Mic className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 italic">
            <span className="font-semibold text-blue-300 not-italic">Hearing: </span>
            <span>{transcript}</span>
            <span className="opacity-70 text-blue-400"> {interimTranscript}</span>
          </div>
        </div>
      )}

      {/* Action Notification Chip */}
      {lastActionMessage && (
        <div className="px-4 py-1.5 bg-emerald-950/25 border-b border-emerald-900/30 flex items-center justify-between text-[11px] text-emerald-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{lastActionMessage}</span>
          </div>
        </div>
      )}

      {/* Scrollable Conversation Stream */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-72 min-h-48 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400">
            <Sparkles className="w-8 h-8 text-neutral-600 mb-2" />
            <p className="font-semibold text-neutral-300 text-xs">How can I help you today?</p>
            <p className="text-[11px] text-neutral-500 mt-1 max-w-xs">
              Tap the microphone to speak or click any of the suggestion chips below.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-xs'
                    : 'bg-[#1c1c1c] border border-[#2b2b2b] text-neutral-200 rounded-bl-xs'
                }`}
              >
                <p>{msg.content}</p>

                {msg.actionExecuted && (
                  <div className="mt-1.5 pt-1.5 border-t border-neutral-700/40 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{msg.actionExecuted}</span>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-neutral-500 px-1 mt-0.5">{msg.timestamp}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips */}
      <div className="px-3 py-2 bg-[#161616] border-t border-[#242424] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => handlePromptClick('Summarize my tasks')}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#202020] hover:bg-[#2a2a2a] border border-[#333] hover:border-blue-500/40 text-[11px] text-neutral-300 hover:text-white transition-all cursor-pointer shrink-0"
        >
          📊 Summarize tasks
        </button>
        <button
          type="button"
          onClick={() => handlePromptClick('Show urgent tasks')}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#202020] hover:bg-[#2a2a2a] border border-[#333] hover:border-blue-500/40 text-[11px] text-neutral-300 hover:text-white transition-all cursor-pointer shrink-0"
        >
          🔥 Show urgent
        </button>
        <button
          type="button"
          onClick={() => handlePromptClick('Switch to Timeline')}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#202020] hover:bg-[#2a2a2a] border border-[#333] hover:border-blue-500/40 text-[11px] text-neutral-300 hover:text-white transition-all cursor-pointer shrink-0"
        >
          ⏱️ Switch to Timeline
        </button>
        <button
          type="button"
          onClick={() => handlePromptClick('Open Notepad')}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#202020] hover:bg-[#2a2a2a] border border-[#333] hover:border-blue-500/40 text-[11px] text-neutral-300 hover:text-white transition-all cursor-pointer shrink-0"
        >
          📝 Open Notepad
        </button>
        <button
          type="button"
          onClick={() => handlePromptClick('Clear filters')}
          className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#202020] hover:bg-[#2a2a2a] border border-[#333] hover:border-blue-500/40 text-[11px] text-neutral-300 hover:text-white transition-all cursor-pointer shrink-0"
        >
          🔄 Clear filters
        </button>
      </div>

      {/* Input Row: Big Mic Button & Text Input fallback */}
      <div className="p-3 bg-[#181818] border-t border-[#262626] shrink-0">
        <form onSubmit={handleSendText} className="flex items-center gap-2">
          {/* Main Push-To-Talk Mic Button */}
          <button
            type="button"
            id="hud-btn-main-mic"
            onClick={isListening ? stopListening : startListening}
            disabled={!isSpeechRecognitionSupported}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-md ${
              isListening
                ? 'bg-emerald-500 text-black shadow-emerald-500/30 animate-pulse ring-2 ring-emerald-400'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
            title={
              !isSpeechRecognitionSupported
                ? 'Speech recognition not supported'
                : isListening
                ? 'Stop listening'
                : 'Click to speak a voice command'
            }
          >
            {isListening ? <Mic className="w-5 h-5 animate-bounce" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input fallback */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              id="hud-voice-text-input"
              value={typedInput}
              onChange={(e) => setTypedInput(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Type or tap mic to speak...'}
              disabled={isProcessing}
              className="w-full bg-[#121212] border border-[#303030] rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />

            <button
              type="submit"
              disabled={!typedInput.trim() || isProcessing}
              id="hud-btn-send-text"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neutral-400 hover:text-blue-400 hover:bg-neutral-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              title="Send command"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Footer info & Turn Off shortcut hint */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Voice Assistant Active</span>
          </div>
          <button
            type="button"
            onClick={() => setIsEnabled(false)}
            className="text-neutral-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Power className="w-2.5 h-2.5" />
            <span>Turn Off Assistant</span>
          </button>
        </div>
      </div>
    </div>
  );
};
