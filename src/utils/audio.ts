/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Synthesizer - 100% offline, zero latency, no external assets needed
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenTimer: number | null = null;
  private isSirenPlaying: boolean = false;

  constructor() {
    // Check localStorage for muted state
    try {
      this.isMuted = localStorage.getItem('srt_sound_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('srt_sound_muted', muted ? 'true' : 'false');
    } catch {}
    if (muted) {
      this.stopEmergencyAlarm();
    }
  }

  /**
   * Tactile click sound for button taps, keyboard keys, and tabs
   */
  public playClickSound() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Sharp mechanical transient click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.035);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600, this.ctx.currentTime);
      filter.Q.setValueAtTime(3, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      // Audio context might fail before user interaction
    }
  }

  /**
   * Emergency siren sound when SOS button is pressed or auto-SOS triggers
   */
  public playEmergencyAlarm(force: boolean = true) {
    if (force && this.isMuted) {
      this.isMuted = false;
      try {
        localStorage.setItem('srt_sound_muted', 'false');
      } catch {}
    }
    if (this.isMuted) return;
    if (this.isSirenPlaying) return;

    try {
      this.initCtx();
      if (!this.ctx) return;

      // Resume context if browser suspended it
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      this.isSirenPlaying = true;
      const now = this.ctx.currentTime;

      // Master siren gain
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.55, now);
      masterGain.connect(this.ctx.destination);
      this.sirenGain = masterGain;

      // Oscillator 1: High piercing alarm saw wave
      const osc1 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(760, now);
      osc1.connect(masterGain);
      osc1.start(now);
      this.sirenOsc1 = osc1;

      // Oscillator 2: Secondary harmonic horn square wave
      const osc2 = this.ctx.createOscillator();
      const osc2Gain = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(510, now);
      osc2Gain.gain.setValueAtTime(0.35, now);
      osc2.connect(osc2Gain);
      osc2Gain.connect(masterGain);
      osc2.start(now);
      this.sirenOsc2 = osc2;

      // Immediate high alert chirp for instant tactile feedback
      const alertOsc = this.ctx.createOscillator();
      const alertGain = this.ctx.createGain();
      alertOsc.type = 'sine';
      alertOsc.frequency.setValueAtTime(1100, now);
      alertOsc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
      alertGain.gain.setValueAtTime(0.4, now);
      alertGain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      alertOsc.connect(alertGain);
      alertGain.connect(this.ctx.destination);
      alertOsc.start(now);
      alertOsc.stop(now + 0.18);

      // Two-tone European/US emergency wail modulation
      let highTone = false;
      const intervalMs = 360;
      this.sirenTimer = window.setInterval(() => {
        if (!this.ctx || !this.sirenOsc1 || !this.sirenOsc2) return;
        const t = this.ctx.currentTime;
        highTone = !highTone;
        const targetFreq1 = highTone ? 980 : 660;
        const targetFreq2 = highTone ? 680 : 460;
        
        this.sirenOsc1.frequency.cancelScheduledValues(t);
        this.sirenOsc1.frequency.exponentialRampToValueAtTime(targetFreq1, t + 0.12);

        this.sirenOsc2.frequency.cancelScheduledValues(t);
        this.sirenOsc2.frequency.exponentialRampToValueAtTime(targetFreq2, t + 0.12);
      }, intervalMs);

      // Trigger hardware vibration if supported
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([400, 200, 400, 200, 800]);
        } catch {}
      }
    } catch (e) {
      console.warn('Emergency siren failed:', e);
    }
  }

  public stopEmergencyAlarm() {
    if (this.sirenTimer) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
    if (this.sirenOsc1) {
      try {
        this.sirenOsc1.stop();
        this.sirenOsc1.disconnect();
      } catch {}
      this.sirenOsc1 = null;
    }
    if (this.sirenOsc2) {
      try {
        this.sirenOsc2.stop();
        this.sirenOsc2.disconnect();
      } catch {}
      this.sirenOsc2 = null;
    }
    if (this.sirenGain) {
      try {
        this.sirenGain.disconnect();
      } catch {}
      this.sirenGain = null;
    }
    this.isSirenPlaying = false;
  }

  /**
   * Warning ping when entering caution / danger geo-fence
   */
  public playWarningTone() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.setValueAtTime(880, now + 0.12);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } catch {}
  }

  /**
   * Countdown warning tick during Smart Check-in grace period
   */
  public playCountdownBeep() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /**
   * Harmonious confirmation chime when user marks "I'm Safe"
   */
  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);

        gain.gain.setValueAtTime(0.15, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.32);
      });
    } catch {}
  }

  /**
   * Radio chirp / double-pip tone when automated SMS is dispatched to cellular network
   */
  public playSmsDispatchedTone() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // High-tech telecom chirp: two quick frequency pings
      const pings = [1200, 1800];
      pings.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.07);
      });
    } catch {}
  }

  // --- IN-APP DIRECT CALLING TELEPHONY AUDIO ENGINE ---

  private ringbackInterval: number | null = null;
  private ringbackOsc1: OscillatorNode | null = null;
  private ringbackOsc2: OscillatorNode | null = null;
  private ringbackGain: GainNode | null = null;

  /**
   * Plays authentic telecom ringback tone (repeating ringing tone while waiting for contact to answer)
   */
  public startRingbackTone() {
    if (this.isMuted) return;
    this.stopRingbackTone();
    try {
      this.initCtx();
      if (!this.ctx) return;

      const playRingBurst = () => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Standard Indian / International telecom tone: 400Hz + 450Hz
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(400, now);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 1.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.45);
        osc2.stop(now + 1.45);
      };

      playRingBurst();
      this.ringbackInterval = window.setInterval(playRingBurst, 3000);
    } catch {}
  }

  /**
   * Stops repeating ringback tone
   */
  public stopRingbackTone() {
    if (this.ringbackInterval !== null) {
      clearInterval(this.ringbackInterval);
      this.ringbackInterval = null;
    }
  }

  /**
   * Pleasant ascending two-tone chime when in-app call is picked up
   */
  public playCallConnectedChime() {
    this.stopRingbackTone();
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.setValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.36);
    } catch {}
  }

  /**
   * Telecom busy/hangup disconnect tone
   */
  public playCallHangupTone() {
    this.stopRingbackTone();
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // 3 short disconnect beeps
      [0, 0.22, 0.44].forEach(offset => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now + offset);

        gain.gain.setValueAtTime(0.15, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.14);
      });
    } catch {}
  }

  /**
   * Dual-Tone Multi-Frequency (DTMF) dialpad tone generator
   */
  public playDtmfTone(key: string) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const dtmfMap: Record<string, [number, number]> = {
        '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
        '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
        '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
        '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
      };

      const freqs = dtmfMap[key] || [941, 1336];
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freqs[0], now);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freqs[1], now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.16);
      osc2.stop(now + 0.16);
    } catch {}
  }
}

export const soundEngine = new SoundEngine();
