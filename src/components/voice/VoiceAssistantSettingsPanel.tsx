import React, { useState } from 'react';
import { useVoiceAssistant } from '../../context/VoiceAssistantContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Power,
  Play,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Command,
  Compass,
  ListPlus,
  Filter,
  BarChart3,
  HelpCircle
} from 'lucide-react';

export const VoiceAssistantSettingsPanel: React.FC = () => {
  const {
    isEnabled,
    setIsEnabled,
    isMuted,
    toggleMute,
    speak,
    isSpeechRecognitionSupported,
    isSpeechSynthesisSupported,
    isWidgetOpen,
    setIsWidgetOpen
  } = useVoiceAssistant();

  const { currentLanguageConfig } = useLanguage();
  const [testSpeechStatus, setTestSpeechStatus] = useState<string | null>(null);

  const handleTestVoice = () => {
    setTestSpeechStatus('Playing audio sample...');
    speak('Hello! TaskFlow Voice Assistant is ready and listening. How can I help you today?');
    setTimeout(() => {
      setTestSpeechStatus(null);
    }, 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner Card with Master ON/OFF Switch */}
      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-[#181818] border border-blue-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-3 rounded-xl border transition-all ${
                isEnabled
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              {isEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Voice Assistant &amp; Spoken Commands
                </h3>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded font-mono uppercase tracking-wider ${
                    isEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}
                >
                  {isEnabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-1 max-w-lg leading-relaxed">
                Control your workspace with hands-free voice commands. Switch views, search and filter
                tasks, dictate new action items, and listen to spoken task summaries.
              </p>
            </div>
          </div>

          {/* Master Toggle Button */}
          <button
            type="button"
            id="settings-voice-master-toggle"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md active:scale-95 shrink-0 ${
              isEnabled
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{isEnabled ? 'Turn Off Assistant' : 'Turn On Assistant'}</span>
          </button>
        </div>
      </div>

      {/* Voice Preferences Section */}
      <div className="p-4 rounded-xl bg-[#161616] border border-[#262626] space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-blue-400" />
          <span>Audio &amp; Speech Feedback</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Spoken Audio Toggle */}
          <div className="p-3.5 rounded-lg bg-[#1c1c1c] border border-[#2b2b2b] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#262626] flex items-center justify-center text-neutral-300">
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Spoken Responses</p>
                <p className="text-[11px] text-neutral-400">
                  {isMuted ? 'Voice output is currently muted' : 'Assistant speaks responses aloud'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="settings-voice-mute-toggle"
              onClick={toggleMute}
              disabled={!isEnabled}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 ${
                !isMuted
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400'
              }`}
            >
              {!isMuted ? 'Mute' : 'Unmute'}
            </button>
          </div>

          {/* Test Voice Button */}
          <div className="p-3.5 rounded-lg bg-[#1c1c1c] border border-[#2b2b2b] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#262626] flex items-center justify-center text-neutral-300">
                <Play className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Test Speech Output</p>
                <p className="text-[11px] text-neutral-400">
                  {testSpeechStatus || 'Play a sample audio greeting'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="settings-voice-test-btn"
              onClick={handleTestVoice}
              disabled={!isEnabled || isMuted || !isSpeechSynthesisSupported}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#262626] hover:bg-[#303030] text-neutral-200 hover:text-white border border-[#383838] transition-all cursor-pointer disabled:opacity-40"
            >
              Play Sample
            </button>
          </div>

          {/* Window State (Default Closed) */}
          <div className="p-3.5 rounded-lg bg-[#1c1c1c] border border-[#2b2b2b] flex items-center justify-between sm:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#262626] flex items-center justify-center text-neutral-300">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-white">Voice Assistant Window</p>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 border border-neutral-700">
                    Closed by default
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  {isWidgetOpen
                    ? 'Window is currently open on your screen'
                    : 'Window is currently closed. Press Ctrl+Shift+V or click to open.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              id="settings-voice-window-toggle"
              onClick={() => setIsWidgetOpen(!isWidgetOpen)}
              disabled={!isEnabled}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-40 ${
                isWidgetOpen
                  ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white'
              }`}
            >
              {isWidgetOpen ? 'Close Window' : 'Open Window'}
            </button>
          </div>
        </div>

        {/* System Capabilities & Hardware Diagnostics */}
        <div className="pt-2 border-t border-[#222] grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <div className="flex items-center gap-2 p-2 rounded bg-[#181818] border border-[#222]">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                isSpeechRecognitionSupported ? 'text-emerald-400' : 'text-rose-400'
              }`}
            />
            <span className="text-neutral-300">
              Web Speech API:{' '}
              <strong className={isSpeechRecognitionSupported ? 'text-emerald-400' : 'text-rose-400'}>
                {isSpeechRecognitionSupported ? 'Supported' : 'Unavailable'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-[#181818] border border-[#222]">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                isSpeechSynthesisSupported ? 'text-emerald-400' : 'text-rose-400'
              }`}
            />
            <span className="text-neutral-300">
              Speech Synthesis:{' '}
              <strong className={isSpeechSynthesisSupported ? 'text-emerald-400' : 'text-rose-400'}>
                {isSpeechSynthesisSupported ? 'Supported' : 'Unavailable'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 p-2 rounded bg-[#181818] border border-[#222]">
            <Command className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-neutral-300">
              Shortcut: <strong className="text-blue-400 font-mono">Ctrl + Shift + V</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Voice Commands Cheat Sheet */}
      <div className="p-4 rounded-xl bg-[#161616] border border-[#262626] space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Voice Commands Reference Guide</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Navigation Category */}
          <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#282828] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Compass className="w-3.5 h-3.5 text-blue-400" />
              <span>Workspace Navigation</span>
            </div>
            <ul className="space-y-1.5 text-neutral-300 text-[11px]">
              <li>• <span className="font-mono text-neutral-200">"Switch to Kanban"</span> / "Show board"</li>
              <li>• <span className="font-mono text-neutral-200">"Go to Daily tasks"</span> / "Standup"</li>
              <li>• <span className="font-mono text-neutral-200">"Open Timeline"</span> / "Show Gantt chart"</li>
              <li>• <span className="font-mono text-neutral-200">"Open Support tickets"</span></li>
              <li>• <span className="font-mono text-neutral-200">"Show Dependency graph"</span></li>
              <li>• <span className="font-mono text-neutral-200">"Open Team chat"</span> / "Open Meetings"</li>
            </ul>
          </div>

          {/* Task Management Category */}
          <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#282828] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <ListPlus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Task Management</span>
            </div>
            <ul className="space-y-1.5 text-neutral-300 text-[11px]">
              <li>• <span className="font-mono text-neutral-200">"Create task Review Pull Request"</span></li>
              <li>• <span className="font-mono text-neutral-200">"Add new task Update Auth Flow"</span></li>
              <li>• <span className="font-mono text-neutral-200">"New task"</span> (opens dialog)</li>
              <li>• <span className="font-mono text-neutral-200">"Open Notepad"</span> / "Personal notes"</li>
            </ul>
          </div>

          {/* Search & Filtering */}
          <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#282828] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Search &amp; Priority Filters</span>
            </div>
            <ul className="space-y-1.5 text-neutral-300 text-[11px]">
              <li>• <span className="font-mono text-neutral-200">"Search for database"</span></li>
              <li>• <span className="font-mono text-neutral-200">"Filter urgent tasks"</span> / "High priority"</li>
              <li>• <span className="font-mono text-neutral-200">"Clear filters"</span> / "Reset search"</li>
            </ul>
          </div>

          {/* Intelligence & Analytics */}
          <div className="p-3 rounded-lg bg-[#1a1a1a] border border-[#282828] space-y-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Intelligence &amp; Executive Briefing</span>
            </div>
            <ul className="space-y-1.5 text-neutral-300 text-[11px]">
              <li>• <span className="font-mono text-neutral-200">"Summarize my tasks"</span></li>
              <li>• <span className="font-mono text-neutral-200">"What's on my plate today?"</span></li>
              <li>• <span className="font-mono text-neutral-200">"How many kudos do I have?"</span></li>
              <li>• <span className="font-mono text-neutral-200">"Open Analytics dashboard"</span></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
