/**
 * Sound Utility for Notifications and Chat Messages
 * Powered by Web Audio API - zero latency, zero external asset dependencies,
 * crisp, pleasant acoustic harmonic synthesis.
 */

// User preference keys
const STORAGE_KEYS = {
  SOUND_ENABLED: 'taskflow_sound_enabled',
  NOTIFICATION_SOUND_ENABLED: 'taskflow_sound_notification_enabled',
  CHAT_SOUND_ENABLED: 'taskflow_sound_chat_enabled',
  SOUND_VOLUME: 'taskflow_sound_volume'
};

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private notificationSoundEnabled: boolean = true;
  private chatSoundEnabled: boolean = true;
  private volume: number = 0.8;

  constructor() {
    this.loadPreferences();
    // Warm up AudioContext on first user interaction to satisfy browser autoplay policies
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.getAudioContext();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { once: true, passive: true });
      window.addEventListener('keydown', unlockAudio, { once: true, passive: true });
    }
  }

  private loadPreferences() {
    try {
      const storedEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
      if (storedEnabled !== null) this.soundEnabled = storedEnabled === 'true';

      const storedNotif = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_SOUND_ENABLED);
      if (storedNotif !== null) this.notificationSoundEnabled = storedNotif === 'true';

      const storedChat = localStorage.getItem(STORAGE_KEYS.CHAT_SOUND_ENABLED);
      if (storedChat !== null) this.chatSoundEnabled = storedChat === 'true';

      const storedVol = localStorage.getItem(STORAGE_KEYS.SOUND_VOLUME);
      if (storedVol !== null) {
        const v = parseFloat(storedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) this.volume = v;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  public getAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return null;
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  // Preference getters & setters
  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
    } catch {}
  }

  public isNotificationSoundEnabled(): boolean {
    return this.soundEnabled && this.notificationSoundEnabled;
  }

  public setNotificationSoundEnabled(enabled: boolean) {
    this.notificationSoundEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATION_SOUND_ENABLED, String(enabled));
    } catch {}
  }

  public isChatSoundEnabled(): boolean {
    return this.soundEnabled && this.chatSoundEnabled;
  }

  public setChatSoundEnabled(enabled: boolean) {
    this.chatSoundEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEYS.CHAT_SOUND_ENABLED, String(enabled));
    } catch {}
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    try {
      localStorage.setItem(STORAGE_KEYS.SOUND_VOLUME, String(clamped));
    } catch {}
  }

  /**
   * Play crystal notification chime (2-stage harmonic bell)
   * High-contrast, clean, distinctive chime for general notifications, assignments, and mentions.
   */
  public playNotificationSound() {
    if (!this.isNotificationSoundEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const baseVol = 0.15 * this.volume;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(baseVol, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      // Note 2: B5 (987.77 Hz) slightly staggered
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.08);
      gain2.gain.setValueAtTime(baseVol * 1.1, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.38);

      // Note 3: E6 (1318.51 Hz) crystal sparkle overtone
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1318.51, now + 0.16);
      gain3.gain.setValueAtTime(baseVol * 0.7, now + 0.16);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.16);
      osc3.stop(now + 0.45);
    } catch (e) {
      console.warn('Notification sound failed to play:', e);
    }
  }

  /**
   * Play chat incoming message pop / bubble chime
   * Gentle, soft, satisfying bubble chirp.
   */
  public playChatMessageSound() {
    if (!this.isChatSoundEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const baseVol = 0.16 * this.volume;

      // Harmonic 1: quick upward bubble sweep (440Hz -> 680Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.06);
      gain.gain.setValueAtTime(baseVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);

      // Harmonic 2: resonant second harmonic ping (880Hz)
      const oscHigh = ctx.createOscillator();
      const gainHigh = ctx.createGain();
      oscHigh.type = 'triangle';
      oscHigh.frequency.setValueAtTime(880, now + 0.04);
      gainHigh.gain.setValueAtTime(baseVol * 0.5, now + 0.04);
      gainHigh.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      oscHigh.connect(gainHigh);
      gainHigh.connect(ctx.destination);
      oscHigh.start(now + 0.04);
      oscHigh.stop(now + 0.18);
    } catch (e) {
      console.warn('Chat message sound failed to play:', e);
    }
  }

  /**
   * Play subtle sent message confirmation (soft low pop)
   */
  public playMessageSentSound() {
    if (!this.isChatSoundEnabled()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const baseVol = 0.08 * this.volume;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      gain.gain.setValueAtTime(baseVol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      console.warn('Sent message sound failed to play:', e);
    }
  }
}

export const soundManager = new SoundManager();

export const playNotificationSound = () => soundManager.playNotificationSound();
export const playChatMessageSound = () => soundManager.playChatMessageSound();
export const playMessageSentSound = () => soundManager.playMessageSentSound();
