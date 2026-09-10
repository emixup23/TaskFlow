import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, Sparkles, FileText } from 'lucide-react';
import { VoiceNoteData } from '../../types';

interface VoiceMessagePlayerProps {
  voiceNote: VoiceNoteData;
  isSelf?: boolean;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({ voiceNote, isSelf = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number>(voiceNote.duration || 0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showTranscript, setShowTranscript] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Default fallback waveform if none stored
  const waveform = voiceNote.waveform && voiceNote.waveform.length > 0
    ? voiceNote.waveform
    : [0.3, 0.45, 0.6, 0.8, 0.5, 0.35, 0.7, 0.9, 0.75, 0.6, 0.4, 0.55, 0.7, 0.85, 0.6, 0.45, 0.3, 0.65, 0.8, 0.5, 0.35, 0.6, 0.4, 0.3];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play failed:', err);
      });
    }
  };

  const handleSeek = (index: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const targetFraction = (index + 0.5) / waveform.length;
    const targetTime = targetFraction * duration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const handleCycleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentFraction = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="w-full max-w-sm my-1">
      {/* Hidden Audio Tag */}
      <audio ref={audioRef} src={voiceNote.audioUrl} preload="metadata" />

      {/* Voice Message Bubble Container */}
      <div
        className={`p-3 rounded-xl border transition-all ${
          isSelf
            ? 'bg-blue-950/30 border-blue-800/40 text-neutral-100'
            : 'bg-[#1a1a1a] border-[#2a2a2a] text-neutral-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Circular Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-md ${
              isSelf
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
            }`}
            title={isPlaying ? 'Pause voice message' : 'Play voice message'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Waveform & Scrubber */}
          <div className="flex-1 min-w-0">
            {/* Waveform Bars */}
            <div
              className="flex items-center gap-[2.5px] h-7 cursor-pointer group py-1"
              title="Click bar to seek"
            >
              {waveform.map((amp, idx) => {
                const barFraction = idx / waveform.length;
                const isPlayed = barFraction <= currentFraction;
                // Minimum bar height is 15%, max is 100%
                const heightPercent = Math.max(15, Math.min(100, Math.round(amp * 100)));

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSeek(idx)}
                    className="h-full flex-1 flex items-center justify-center cursor-pointer p-0 bg-transparent border-0 focus:outline-none"
                  >
                    <span
                      className={`w-full rounded-full transition-colors ${
                        isPlayed
                          ? 'bg-blue-400 group-hover:bg-blue-300'
                          : 'bg-neutral-600 group-hover:bg-neutral-500'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Time & Speed Controls */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mt-0.5">
              <span>{formatTime(currentTime)}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCycleSpeed}
                  className="px-1.5 py-0.2 bg-[#252525] hover:bg-[#303030] rounded text-[10px] font-semibold text-neutral-300 transition-colors cursor-pointer"
                  title="Playback speed"
                >
                  {playbackRate}x
                </button>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions (Download) */}
          <a
            href={voiceNote.audioUrl}
            download={`voice-message-${voiceNote.id || Date.now()}.webm`}
            className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-[#252525] rounded transition-colors shrink-0 cursor-pointer"
            title="Download voice audio"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Optional Transcript Toggle */}
        {voiceNote.transcript && (
          <div className="mt-2 pt-2 border-t border-neutral-800/60">
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
            >
              <FileText className="w-3 h-3" />
              <span>{showTranscript ? 'Hide transcript' : 'Show transcript'}</span>
            </button>
            {showTranscript && (
              <p className="mt-1.5 text-xs text-neutral-300 italic bg-black/20 p-2 rounded border border-neutral-800/40 leading-relaxed break-words">
                &ldquo;{voiceNote.transcript}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
