/**
 * Centralized Sound Manager for StudyMate AI
 * Generates subtle, soft, premium audio synthesized directly via Web Audio API.
 * Completely client-side, zero network latency, zero external asset failures.
 */

export type SoundType =
  | 'button_click'
  | 'nav_tap'
  | 'card_open'
  | 'save'
  | 'delete'
  | 'correct_quiz'
  | 'wrong_quiz'
  | 'quiz_completed'
  | 'ai_response_ready'
  | 'upload_completed'
  | 'toggle'
  | 'error';

class SoundService {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private masterVolume: number = 0.18; // Soft, non-intrusive volume

  constructor() {
    // Check localStorage for user sound preference
    try {
      const stored = localStorage.getItem('studymate_sound_enabled');
      if (stored !== null) {
        this.soundEnabled = stored === 'true';
      }
    } catch {
      this.soundEnabled = true;
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('studymate_sound_enabled', String(enabled));
    } catch {
      // ignore
    }
    if (enabled) {
      this.play('toggle');
    }
  }

  public toggle(): boolean {
    this.setEnabled(!this.soundEnabled);
    return this.soundEnabled;
  }

  public play(type: SoundType): void {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(this.masterVolume, now);
      masterGain.connect(ctx.destination);

      switch (type) {
        case 'button_click': {
          // Soft micro tick (gentle click)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(400, now + 0.035);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.036);
          break;
        }

        case 'nav_tap': {
          // Warm woody/glass tap
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(520, now);
          osc.frequency.exponentialRampToValueAtTime(260, now + 0.045);

          gain.gain.setValueAtTime(0.35, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.046);
          break;
        }

        case 'card_open': {
          // Subtle soft pop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(640, now + 0.06);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.062);
          break;
        }

        case 'save': {
          // Soft ascending warm chime (two notes: 587Hz -> 880Hz)
          [587, 880].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + idx * 0.07;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.25, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(start);
            osc.stop(start + 0.15);
          });
          break;
        }

        case 'delete': {
          // Soft descending low muted click
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(350, now);
          osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.072);
          break;
        }

        case 'correct_quiz': {
          // Pleasant major triad chime (C5, E5, G5)
          [523.25, 659.25, 783.99].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + idx * 0.06;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.28, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(start);
            osc.stop(start + 0.17);
          });
          break;
        }

        case 'wrong_quiz':
        case 'error': {
          // Soft, non-jarring low tone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, now);
          osc.frequency.exponentialRampToValueAtTime(170, now + 0.12);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.13);
          break;
        }

        case 'quiz_completed': {
          // Celebratory arpeggio (C5 -> E5 -> G5 -> C6)
          [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + idx * 0.08;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.26, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(start);
            osc.stop(start + 0.23);
          });
          break;
        }

        case 'ai_response_ready': {
          // Subtle two-tone bubble ping
          [660, 990].forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const start = now + idx * 0.07;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, start);

            gain.gain.setValueAtTime(0.22, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);

            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(start);
            osc.stop(start + 0.13);
          });
          break;
        }

        case 'upload_completed': {
          // Smooth rising confirmation tone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.14);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.16);
          break;
        }

        case 'toggle': {
          // Micro dual click
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(700, now);
          osc.frequency.exponentialRampToValueAtTime(900, now + 0.03);

          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now);
          osc.stop(now + 0.035);
          break;
        }
      }
    } catch (err) {
      // Audio autoplay policy or silent fail
      console.warn('Audio playback suppressed by browser:', err);
    }
  }
}

export const soundManager = new SoundService();
