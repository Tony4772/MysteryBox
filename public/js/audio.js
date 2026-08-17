// ═══════════════════════════════════════════════════════
// MYSTERYBOX AUDIO ENGINE — Web Audio API procedural
// ═══════════════════════════════════════════════════════

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.muted = false;
    this.musicMuted = false;
    this.musicPlaying = false;
    this.musicNodes = [];
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.6;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.25;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.master);

    this.initialized = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.6;
    return this.muted;
  }

  toggleMusic() {
    this.musicMuted = !this.musicMuted;
    if (this.musicGain) this.musicGain.gain.value = this.musicMuted ? 0 : 0.25;
    if (!this.musicMuted && !this.musicPlaying) this.startMusic();
    return this.musicMuted;
  }

  // ─── UTILITY ───
  _osc(type, freq, duration, gainVal, dest, startTime) {
    const t = startTime || this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainVal, t + 0.01);
    gain.gain.linearRampToValueAtTime(0, t + duration);
    osc.connect(gain);
    gain.connect(dest || this.sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.05);
    return osc;
  }

  _noise(duration, gainVal, dest, startTime) {
    const t = startTime || this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(gainVal, t + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    source.connect(gain);
    gain.connect(dest || this.sfxGain);
    source.start(t);
    source.stop(t + duration + 0.05);
    return source;
  }

  // ─── BACKGROUND MUSIC (ambient procedural loop) ───
  startMusic() {
    if (!this.initialized || this.musicPlaying) return;
    this.musicPlaying = true;
    this._playMusicLoop();
  }

  _playMusicLoop() {
    if (!this.musicPlaying || this.musicMuted) return;
    const t = this.ctx.currentTime;
    const chordDuration = 4;

    // Ambient pad chord progression
    const chords = [
      [130.81, 164.81, 196.00],  // C major
      [110.00, 138.59, 164.81],  // A minor
      [146.83, 185.00, 220.00],  // D minor
      [123.47, 155.56, 185.00],  // B dim -> use G major
    ];

    const progressionIndex = Math.floor((t / chordDuration) % chords.length);
    const chord = chords[progressionIndex];

    chord.forEach((freq, i) => {
      // Main pad
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = "sine";
      osc.frequency.value = freq;
      filter.type = "lowpass";
      filter.frequency.value = 400;
      filter.Q.value = 1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 1.5);
      gain.gain.setValueAtTime(0.08, t + chordDuration - 1.5);
      gain.gain.linearRampToValueAtTime(0, t + chordDuration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(t);
      osc.stop(t + chordDuration + 0.1);

      // Shimmer octave
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.value = freq * 2;
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.02, t + 2);
      gain2.gain.linearRampToValueAtTime(0, t + chordDuration);
      osc2.connect(gain2);
      gain2.connect(this.musicGain);
      osc2.start(t);
      osc2.stop(t + chordDuration + 0.1);
    });

    // Sub bass
    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.type = "sine";
    bass.frequency.value = chord[0] / 2;
    bassGain.gain.setValueAtTime(0, t);
    bassGain.gain.linearRampToValueAtTime(0.12, t + 0.5);
    bassGain.gain.setValueAtTime(0.12, t + chordDuration - 1);
    bassGain.gain.linearRampToValueAtTime(0, t + chordDuration);
    bass.connect(bassGain);
    bassGain.connect(this.musicGain);
    bass.start(t);
    bass.stop(t + chordDuration + 0.1);

    // High sparkle
    if (Math.random() > 0.5) {
      const sparkleFreq = chord[Math.floor(Math.random() * 3)] * 4;
      const sparkle = this.ctx.createOscillator();
      const spGain = this.ctx.createGain();
      sparkle.type = "sine";
      sparkle.frequency.value = sparkleFreq;
      spGain.gain.setValueAtTime(0, t + 1);
      spGain.gain.linearRampToValueAtTime(0.03, t + 1.5);
      spGain.gain.linearRampToValueAtTime(0, t + 3);
      sparkle.connect(spGain);
      spGain.connect(this.musicGain);
      sparkle.start(t + 1);
      sparkle.stop(t + chordDuration + 0.1);
    }

    setTimeout(() => this._playMusicLoop(), (chordDuration - 0.5) * 1000);
  }

  // ─── SFX: Button Click ───
  click() {
    if (!this.initialized) return;
    this._osc("sine", 800, 0.06, 0.15);
    this._osc("sine", 1200, 0.04, 0.08);
  }

  // ─── SFX: Button Hover ───
  hover() {
    if (!this.initialized) return;
    this._osc("sine", 600, 0.04, 0.06);
  }

  // ─── SFX: Box Shake ───
  boxShake() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      this._noise(0.06, 0.12, this.sfxGain, t + i * 0.08);
      this._osc("sine", 200 + Math.random() * 100, 0.06, 0.1, this.sfxGain, t + i * 0.08);
    }
  }

  // ─── SFX: Box Burst / Open ───
  boxBurst() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    // Impact
    this._noise(0.3, 0.3);
    this._osc("sine", 150, 0.4, 0.25);
    this._osc("sine", 300, 0.3, 0.15);
    // Rising sweep
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = "sine";
    sweep.frequency.setValueAtTime(200, t);
    sweep.frequency.exponentialRampToValueAtTime(2000, t + 0.3);
    sweepGain.gain.setValueAtTime(0.15, t);
    sweepGain.gain.linearRampToValueAtTime(0, t + 0.4);
    sweep.connect(sweepGain);
    sweepGain.connect(this.sfxGain);
    sweep.start(t);
    sweep.stop(t + 0.5);
  }

  // ─── SFX: Item Reveal (common) ───
  revealCommon() {
    if (!this.initialized) return;
    this._osc("sine", 440, 0.2, 0.15);
    this._osc("sine", 554, 0.15, 0.1);
  }

  // ─── SFX: Item Reveal (rare) ───
  revealRare() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    this._osc("sine", 523, 0.15, 0.15, this.sfxGain, t);
    this._osc("sine", 659, 0.15, 0.12, this.sfxGain, t + 0.08);
    this._osc("sine", 784, 0.2, 0.1, this.sfxGain, t + 0.16);
  }

  // ─── SFX: Item Reveal (epic) ───
  revealEpic() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
      this._osc("sine", f, 0.25, 0.12, this.sfxGain, t + i * 0.07);
      this._osc("triangle", f * 1.005, 0.3, 0.06, this.sfxGain, t + i * 0.07);
    });
    this._noise(0.1, 0.08, this.sfxGain, t + 0.2);
  }

  // ─── SFX: Item Reveal (legendary) ───
  revealLegendary() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    // Epic chord
    [261, 329, 392, 523, 659, 784].forEach((f, i) => {
      this._osc("sine", f, 0.8, 0.1, this.sfxGain, t + i * 0.05);
      this._osc("triangle", f, 0.6, 0.05, this.sfxGain, t + i * 0.05);
    });
    // Rising shimmer
    for (let i = 0; i < 8; i++) {
      this._osc("sine", 1000 + i * 200, 0.15, 0.04, this.sfxGain, t + 0.3 + i * 0.06);
    }
    // Sparkle noise
    this._noise(0.5, 0.06, this.sfxGain, t + 0.2);
    // Sub boom
    this._osc("sine", 60, 0.8, 0.2, this.sfxGain, t);
  }

  // ─── SFX: Reveal by rarity ───
  reveal(rarity) {
    switch (rarity) {
      case "Legendary": this.revealLegendary(); break;
      case "Epic": this.revealEpic(); break;
      case "Rare": this.revealRare(); break;
      default: this.revealCommon();
    }
  }

  // ─── SFX: Credits / Coin ───
  coin() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    this._osc("sine", 1200, 0.08, 0.12, this.sfxGain, t);
    this._osc("sine", 1600, 0.1, 0.1, this.sfxGain, t + 0.06);
    this._osc("sine", 2000, 0.12, 0.08, this.sfxGain, t + 0.12);
  }

  // ─── SFX: Success ───
  success() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    this._osc("sine", 523, 0.12, 0.12, this.sfxGain, t);
    this._osc("sine", 659, 0.12, 0.12, this.sfxGain, t + 0.1);
    this._osc("sine", 784, 0.2, 0.15, this.sfxGain, t + 0.2);
  }

  // ─── SFX: Error ───
  error() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    this._osc("sawtooth", 200, 0.15, 0.1, this.sfxGain, t);
    this._osc("sawtooth", 150, 0.2, 0.1, this.sfxGain, t + 0.1);
  }

  // ─── SFX: Whoosh (section transitions) ───
  whoosh() {
    if (!this.initialized) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(2000, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.3);
    filter.type = "bandpass";
    filter.frequency.value = 800;
    filter.Q.value = 2;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.05);
    gain.gain.linearRampToValueAtTime(0, t + 0.3);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  // ─── SFX: UI Pop ───
  pop() {
    if (!this.initialized) return;
    this._osc("sine", 600, 0.05, 0.12);
    this._osc("sine", 900, 0.03, 0.06);
  }
}

const audio = new AudioEngine();
