import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Send,
  RotateCcw,
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { VoiceNoteData } from '../../types';

interface VoiceMessageRecorderProps {
  onClose: () => void;
  onSendVoice: (voiceNote: VoiceNoteData, textCaption?: string) => Promise<void> | void;
}

export const VoiceMessageRecorder: React.FC<VoiceMessageRecorderProps> = ({
  onClose,
  onSendVoice
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [previewAudioUrl, setPreviewAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([15, 20, 15, 25, 18, 12, 22]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const amplitudeHistoryRef = useRef<number[]>([]);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up all resources on unmount
  useEffect(() => {
    startRecording();

    return () => {
      stopTracks();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
    };
  }, []);

  const stopTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    audioChunksRef.current = [];
    amplitudeHistoryRef.current = [];
    setDuration(0);
    setTranscript('');
    setPreviewAudioUrl(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg('Microphone recording is not supported in this browser environment.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      mediaStreamRef.current = stream;

      // Select supported audio mime type
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg'
      ];
      let selectedMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        const url = URL.createObjectURL(blob);
        setPreviewAudioUrl(url);
        setIsRecording(false);
        setIsPaused(false);
      };

      recorder.start(100); // collect slice every 100ms
      setIsRecording(true);
      setIsPaused(false);

      // Start duration counter
      const startTime = Date.now();
      timerIntervalRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Setup Web Audio API Analyser for real-time visualizer
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateWaveform = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            // Compute normalized average intensity
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / (dataArray.length * 255);
            amplitudeHistoryRef.current.push(Math.max(0.1, avg));

            // Generate live heights for the 7 visualizer bars
            const liveBars = [
              Math.min(95, Math.max(15, (dataArray[2] || 0) / 2.7)),
              Math.min(95, Math.max(15, (dataArray[5] || 0) / 2.7)),
              Math.min(95, Math.max(15, (dataArray[8] || 0) / 2.7)),
              Math.min(95, Math.max(15, (dataArray[12] || 0) / 2.7)),
              Math.min(95, Math.max(15, (dataArray[16] || 0) / 2.7)),
              Math.min(95, Math.max(15, (dataArray[20] || 0) / 2.7)),
              Math.min(95, Math.max(15, (dataArray[24] || 0) / 2.7))
            ];
            setAudioLevels(liveBars);

            animationFrameRef.current = requestAnimationFrame(updateWaveform);
          };
          updateWaveform();
        }
      } catch (audioErr) {
        console.warn('AudioContext analyser warning:', audioErr);
      }

      // Optional Speech Recognition for live transcription
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = navigator.language || 'en-US';

          recognition.onresult = (event: any) => {
            let finalStr = '';
            let interimStr = '';
            for (let i = 0; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalStr += event.results[i][0].transcript + ' ';
              } else {
                interimStr += event.results[i][0].transcript;
              }
            }
            setTranscript((finalStr + interimStr).trim());
          };

          recognition.onerror = () => {};
          recognitionRef.current = recognition;
          recognition.start();
        } catch {}
      }
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setIsRecording(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Microphone access denied. Please allow microphone permissions in your browser to send voice messages.');
      } else if (err.name === 'NotFoundError') {
        setErrorMsg('No microphone found. Please connect a microphone and try again.');
      } else {
        setErrorMsg(`Unable to access microphone: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handlePauseToggle = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state === 'recording') {
      recorder.pause();
      setIsPaused(true);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    } else if (recorder.state === 'paused') {
      recorder.resume();
      setIsPaused(false);
      timerIntervalRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleStopRecording = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    stopTracks();
  };

  const handleDiscard = () => {
    handleStopRecording();
    onClose();
  };

  const handleReRecord = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    setIsPlayingPreview(false);
    if (previewAudioUrl) {
      URL.revokeObjectURL(previewAudioUrl);
    }
    setPreviewAudioUrl(null);
    startRecording();
  };

  const togglePreviewPlay = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      audio.play().then(() => {
        setIsPlayingPreview(true);
      }).catch((e) => console.warn('Preview play error:', e));
    }
  };

  // Generate downsampled waveform array (28 normalized bars)
  const generateFinalWaveform = (): number[] => {
    const history = amplitudeHistoryRef.current;
    const targetBars = 28;
    if (history.length === 0) {
      return Array.from({ length: targetBars }, () => Math.round((Math.random() * 0.5 + 0.3) * 100) / 100);
    }

    const result: number[] = [];
    const step = Math.max(1, Math.floor(history.length / targetBars));

    for (let i = 0; i < targetBars; i++) {
      const start = Math.min(history.length - 1, i * step);
      const end = Math.min(history.length, (i + 1) * step);
      let sum = 0;
      let count = 0;
      for (let j = start; j < end; j++) {
        sum += history[j];
        count++;
      }
      const avg = count > 0 ? sum / count : 0.2;
      // Scale and normalize with a minimum of 0.15
      const val = Math.min(1.0, Math.max(0.15, avg * 2.5));
      result.push(Math.round(val * 100) / 100);
    }
    return result;
  };

  const handleSend = async () => {
    if (isProcessing) return;

    // If still recording, stop and capture
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      setIsProcessing(true);
      mediaRecorderRef.current.addEventListener('stop', async () => {
        await processAndSend();
      }, { once: true });
      handleStopRecording();
      return;
    }

    await processAndSend();
  };

  const processAndSend = async () => {
    setIsProcessing(true);
    try {
      const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type: mime });

      if (blob.size === 0) {
        setErrorMsg('Voice message was empty. Please record again.');
        setIsProcessing(false);
        return;
      }

      // Convert to Base64 data URL
      const base64Audio = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const finalDuration = Math.max(1, duration);
      const finalWaveform = generateFinalWaveform();

      const voiceNote: VoiceNoteData = {
        id: `vn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        audioUrl: base64Audio,
        duration: finalDuration,
        waveform: finalWaveform,
        mimeType: mime,
        transcript: transcript.trim() || undefined,
        fileSize: blob.size
      };

      await onSendVoice(voiceNote, transcript.trim() || undefined);
      onClose();
    } catch (err: any) {
      console.error('Error preparing voice message:', err);
      setErrorMsg(`Failed to prepare voice message: ${err.message || 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-3 bg-[#181818] border border-[#2e2e2e] rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-150">
      {errorMsg ? (
        <div className="flex items-start justify-between gap-3 text-rose-300 text-xs py-1">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 bg-[#252525] hover:bg-[#303030] text-neutral-300 rounded text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      ) : previewAudioUrl ? (
        /* Preview Player Mode */
        <div className="space-y-2.5">
          <audio
            ref={previewAudioRef}
            src={previewAudioUrl}
            onEnded={() => {
              setIsPlayingPreview(false);
              setPreviewCurrentTime(0);
            }}
            onTimeUpdate={(e) => setPreviewCurrentTime((e.target as HTMLAudioElement).currentTime)}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-300">Voice Note Preview</span>
              <span className="text-[11px] font-mono text-neutral-400">
                {formatTimer(Math.floor(previewCurrentTime))} / {formatTimer(duration)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleReRecord}
              className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-[#222] hover:bg-[#2c2c2c] transition-colors cursor-pointer"
              title="Record again"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Re-record</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Play/Pause Preview */}
            <button
              type="button"
              onClick={togglePreviewPlay}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md shadow-blue-600/30"
              title={isPlayingPreview ? 'Pause preview' : 'Play preview'}
            >
              {isPlayingPreview ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>

            {/* Simulated mini waveform scrubber */}
            <div className="flex-1 h-6 bg-[#202020] rounded-lg px-2 flex items-center gap-1 overflow-hidden border border-[#2a2a2a]">
              {generateFinalWaveform().slice(0, 24).map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-full bg-blue-500/70"
                  style={{ height: `${Math.max(20, Math.round(h * 100))}%` }}
                />
              ))}
            </div>

            {/* Discard & Send Controls */}
            <button
              type="button"
              onClick={handleDiscard}
              className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
              title="Discard voice message"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={isProcessing}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Transcript preview if speech recognized */}
          {transcript && (
            <div className="text-[11px] text-neutral-300 italic bg-black/20 p-1.5 rounded border border-neutral-800/40 truncate">
              &ldquo;{transcript}&rdquo;
            </div>
          )}
        </div>
      ) : (
        /* Active Recording Mode */
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Recording state & timer */}
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                {!isPaused && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isPaused ? 'bg-amber-400' : 'bg-rose-500'}`}></span>
              </span>
              <span className="text-xs font-semibold text-white">
                {isPaused ? 'Paused' : 'Recording Voice Message'}
              </span>
              <span className="font-mono text-xs text-rose-400 font-bold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/30">
                {formatTimer(duration)}
              </span>
            </div>

            {/* Live Visualizer Bars */}
            <div className="flex items-center gap-1 h-5 px-2 bg-[#202020] rounded-md border border-[#2e2e2e]">
              {audioLevels.map((lvl, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isPaused ? 'bg-neutral-500' : 'bg-rose-500'
                  }`}
                  style={{ height: `${isPaused ? 20 : lvl}%` }}
                />
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
              {/* Discard / Cancel */}
              <button
                type="button"
                onClick={handleDiscard}
                className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-[#252525] rounded transition-colors cursor-pointer"
                title="Discard recording"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Pause / Resume */}
              <button
                type="button"
                onClick={handlePauseToggle}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-[#252525] rounded transition-colors cursor-pointer"
                title={isPaused ? 'Resume recording' : 'Pause recording'}
              >
                {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
              </button>

              {/* Stop & Review */}
              <button
                type="button"
                onClick={handleStopRecording}
                className="p-1.5 text-neutral-400 hover:text-blue-400 hover:bg-[#252525] rounded transition-colors cursor-pointer"
                title="Stop & review preview"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>

              {/* Send immediately */}
              <button
                type="button"
                onClick={handleSend}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-rose-900/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Send voice message now"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time live speech-to-text preview */}
          {transcript && (
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 italic bg-black/20 px-2 py-1 rounded border border-neutral-800/40 truncate">
              <FileText className="w-3 h-3 text-neutral-500 shrink-0" />
              <span className="truncate">&ldquo;{transcript}&rdquo;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
