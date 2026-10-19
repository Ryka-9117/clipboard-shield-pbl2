class OceanAudioService {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isMuted: boolean = true;
  private isAmbientPlaying: boolean = false;
  private ambientOsc: OscillatorNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopAmbient();
    } else {
      this.initCtx();
      this.startAmbient();
      this.playBubble();
    }
    return !this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public startAmbient() {
    if (this.isMuted || this.isAmbientPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // Gentle underwater deep pressure hum & filtered water motion
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = buffer;
      this.noiseNode.loop = true;

      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(140, this.ctx.currentTime);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.noiseNode.connect(lowpass);
      lowpass.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);

      this.noiseNode.start();
      this.isAmbientPlaying = true;
    } catch {
      // Audio autoplay policy fallback
    }
  }

  public stopAmbient() {
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch {
        // Safe disconnect
      }
      this.noiseNode = null;
    }
    this.isAmbientPlaying = false;
  }

  public playBubble() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280 + Math.random() * 120, now);
      osc.frequency.exponentialRampToValueAtTime(560 + Math.random() * 180, now + 0.12);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Safe fallback
    }
  }

  public playPromptAlert() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // High-clarity aquatic security prompt chime
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.06, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.28);
      });
    } catch {
      // Safe fallback
    }
  }

  public playApprovedChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        gain.gain.setValueAtTime(0.07, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.38);
      });
    } catch {
      // Safe fallback
    }
  }
}

export const oceanAudio = new OceanAudioService();
