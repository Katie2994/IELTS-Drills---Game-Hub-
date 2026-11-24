// Procedural Web Audio API soundtrack & tactile acoustic SFX
// Tailored for the warm sunlit curved gallery corridor aesthetic.

interface ChordDef {
  bass: number;
  voicing: number[];
  melodyPool: number[];
}

// Warm impressionist progression in F Major / Lydian (Hz)
const PROGRESSION: ChordDef[] = [
  {
    // Fmaj9
    bass: 87.31,
    voicing: [174.61, 220.0, 261.63, 329.63, 392.0],
    melodyPool: [523.25, 659.25, 783.99, 880.0],
  },
  {
    // Dm9
    bass: 73.42,
    voicing: [146.83, 220.0, 261.63, 329.63, 440.0],
    melodyPool: [587.33, 659.25, 783.99, 880.0],
  },
  {
    // Bbmaj7(#11)
    bass: 116.54,
    voicing: [174.61, 233.08, 293.66, 329.63, 440.0],
    melodyPool: [587.33, 659.25, 698.46, 880.0],
  },
  {
    // C6/9
    bass: 65.41,
    voicing: [130.81, 196.0, 220.0, 293.66, 329.63],
    melodyPool: [523.25, 587.33, 659.25, 783.99],
  },
  {
    // Am7(11)
    bass: 110.0,
    voicing: [164.81, 220.0, 261.63, 293.66, 392.0],
    melodyPool: [523.25, 659.25, 783.99, 880.0],
  },
  {
    // Dm9 (revoiced)
    bass: 73.42,
    voicing: [174.61, 220.0, 293.66, 329.63, 392.0],
    melodyPool: [523.25, 587.33, 698.46, 880.0],
  },
  {
    // Gm9
    bass: 98.0,
    voicing: [146.83, 196.0, 233.08, 293.66, 349.23],
    melodyPool: [587.33, 698.46, 783.99, 880.0],
  },
  {
    // C13sus4 -> C9
    bass: 65.41,
    voicing: [146.83, 174.61, 220.0, 261.63, 329.63],
    melodyPool: [523.25, 587.33, 659.25, 783.99],
  },
];

class GalleryAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbSend: GainNode | null = null;

  private isPlaying = false;
  private userMuted = false;
  private stepTimer: number | null = null;
  private barIndex = 0;
  private beatIndex = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      const ctx = new AudioCtx();
      this.ctx = ctx;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 18;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.02;
      compressor.release.value = 0.25;

      const master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(compressor);
      compressor.connect(ctx.destination);
      this.masterGain = master;

      const bgmBus = ctx.createGain();
      bgmBus.gain.value = 0;
      bgmBus.connect(master);
      this.bgmBus = bgmBus;

      const sfxBus = ctx.createGain();
      sfxBus.gain.value = 0.42;
      sfxBus.connect(master);
      this.sfxBus = sfxBus;

      // Build warm gallery hall impulse response (2.4s)
      const sampleRate = ctx.sampleRate;
      const length = Math.floor(sampleRate * 2.4);
      const impulse = ctx.createBuffer(2, length, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        let prev = 0;
        for (let i = 0; i < length; i++) {
          const t = i / length;
          const env = Math.pow(1 - t, 2.8);
          const white = (Math.random() * 2 - 1) * env;
          // Gentle one-pole lowpass so gallery walls sound warm, not metallic
          prev = prev * 0.72 + white * 0.28;
          data[i] = prev;
        }
      }

      const convolver = ctx.createConvolver();
      convolver.buffer = impulse;
      const reverbSend = ctx.createGain();
      reverbSend.gain.value = 0.48;
      reverbSend.connect(convolver);
      convolver.connect(master);

      this.reverbNode = convolver;
      this.reverbSend = reverbSend;
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAndAutoStart(): boolean {
    if (this.userMuted || this.isPlaying) return this.isPlaying;
    return this.startBgm();
  }

  public startBgm(): boolean {
    const ctx = this.ensureContext();
    if (!ctx || !this.bgmBus) return false;
    this.userMuted = false;
    if (this.isPlaying) return true;

    this.isPlaying = true;
    const now = ctx.currentTime;
    this.bgmBus.gain.cancelScheduledValues(now);
    this.bgmBus.gain.setValueAtTime(this.bgmBus.gain.value, now);
    this.bgmBus.gain.linearRampToValueAtTime(0.32, now + 1.4);

    this.scheduleNextBeat();
    return true;
  }

  public stopBgm(byUser = true): void {
    if (byUser) {
      this.userMuted = true;
    }
    this.isPlaying = false;
    if (this.stepTimer !== null) {
      window.clearTimeout(this.stepTimer);
      this.stepTimer = null;
    }
    if (this.ctx && this.bgmBus) {
      const now = this.ctx.currentTime;
      this.bgmBus.gain.cancelScheduledValues(now);
      this.bgmBus.gain.setValueAtTime(this.bgmBus.gain.value, now);
      this.bgmBus.gain.linearRampToValueAtTime(0, now + 0.45);
    }
  }

  public toggleBgm(): boolean {
    if (this.isPlaying) {
      this.stopBgm(true);
      return false;
    }
    return this.startBgm();
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private scheduleNextBeat(): void {
    if (!this.isPlaying) return;
    const ctx = this.ctx;
    if (!ctx) return;

    const chord = PROGRESSION[this.barIndex % PROGRESSION.length];
    const beat = this.beatIndex % 8;

    // Beat 0: warm chord bloom & soft bass anchor
    if (beat === 0) {
      this.playWarmBass(chord.bass, 3.6);
      chord.voicing.forEach((freq, idx) => {
        const strumDelay = idx * 0.055;
        this.playFeltNote(freq, 0.085 - idx * 0.008, 3.3, strumDelay);
      });
    }

    // Beat 2 & 5 & 6: gentle lyrical celesta/harp melody
    if (beat === 2 || beat === 5 || (beat === 6 && this.barIndex % 2 === 1)) {
      const pool = chord.melodyPool;
      const pick = pool[(this.barIndex * 3 + beat) % pool.length];
      const humanDelay = Math.random() * 0.024;
      this.playHarpPluck(pick, 0.065, 2.2, humanDelay);
    }

    // Beat 4: subtle inner-voice breathing note
    if (beat === 4) {
      const innerFreq = chord.voicing[2 + (this.barIndex % 2)];
      this.playFeltNote(innerFreq, 0.045, 2.1, 0.01);
    }

    // Beat 7: occasional soft octave shimmer before chord change
    if (beat === 7 && this.barIndex % 2 === 0) {
      const topFreq = chord.melodyPool[chord.melodyPool.length - 1];
      this.playHarpPluck(topFreq * 0.5, 0.038, 1.8, 0.02);
    }

    this.beatIndex = (this.beatIndex + 1) % 8;
    if (this.beatIndex === 0) {
      this.barIndex = (this.barIndex + 1) % PROGRESSION.length;
    }

    // 66 BPM eighth-note pulse (~455ms)
    this.stepTimer = window.setTimeout(() => this.scheduleNextBeat(), 455);
  }

  private playFeltNote(freq: number, peakGain: number, duration: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.bgmBus || !this.reverbSend) return;

    const t = ctx.currentTime + delay;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.0018, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1150, t);
    filter.frequency.exponentialRampToValueAtTime(340, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.055);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmBus);

    // Send a portion to the gallery reverb
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    gain.connect(wet);
    wet.connect(this.reverbSend);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration + 0.05);
    osc2.stop(t + duration + 0.05);
  }

  private playHarpPluck(freq: number, peakGain: number, duration: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx || !this.bgmBus || !this.reverbSend) return;

    const t = ctx.currentTime + delay;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Subtle 2nd harmonic overtone for bell/harp bloom
    const over = ctx.createOscillator();
    over.type = 'sine';
    over.frequency.setValueAtTime(freq * 2, t);
    const overGain = ctx.createGain();
    overGain.gain.setValueAtTime(0.18, t);
    overGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    over.connect(overGain);
    overGain.connect(gain);
    gain.connect(this.bgmBus);

    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    gain.connect(wet);
    wet.connect(this.reverbSend);

    osc.start(t);
    over.start(t);
    osc.stop(t + duration + 0.05);
    over.stop(t + duration + 0.05);
  }

  private playWarmBass(freq: number, duration: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.bgmBus) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.09, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.bgmBus);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  // Tactile Gallery SFX
  public playStep(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.075);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.11, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxBus);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playOpen(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus || !this.reverbSend) return;
    const notes = [523.25, 659.25]; // C5 -> E5 soft gallery chime
    notes.forEach((f, idx) => {
      const t = ctx.currentTime + idx * 0.065;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

      osc.connect(gain);
      gain.connect(this.sfxBus!);
      gain.connect(this.reverbSend!);
      osc.start(t);
      osc.stop(t + 0.6);
    });
  }

  public playClose(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus) return;
    const notes = [440.0, 349.23]; // A4 -> F4 gentle return
    notes.forEach((f, idx) => {
      const t = ctx.currentTime + idx * 0.055;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.09, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);

      osc.connect(gain);
      gain.connect(this.sfxBus!);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  public playQueueAdd(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxBus || !this.reverbSend) return;
    const notes = [587.33, 880.0]; // D5 -> A5 warm interval
    notes.forEach((f, idx) => {
      const t = ctx.currentTime + idx * 0.075;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.13, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxBus!);
      gain.connect(this.reverbSend!);
      osc.start(t);
      osc.stop(t + 0.52);
    });
  }
}

export const galleryAudio = new GalleryAudioEngine();
