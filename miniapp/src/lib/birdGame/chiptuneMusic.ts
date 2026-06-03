/** Procedural 8-bit loop for Nutri Bird (Web Audio API). */

const BPM = 148;
const STEPS_PER_BAR = 8;
const STEP_SEC = 60 / BPM / (STEPS_PER_BAR / 4);

/** C-major adventure motif — freq Hz, null = rest */
const MELODY: (number | null)[] = [
  392, 392, 440, 494, 523, 659, 784, 659,
  587, 523, 494, 440, 392, 440, 494, 523,
  659, 784, 988, 784, 659, 523, 494, 440,
  494, 523, 587, 659, 587, 523, 440, 392,
];

const BASS: (number | null)[] = [
  131, null, 131, null, 165, null, 165, null,
  147, null, 147, null, 131, null, 131, null,
  98, null, 98, null, 123, null, 123, null,
  131, null, 131, null, 98, null, 98, null,
];

const KICK_ON = new Set([0, 8, 16, 24]);

function createAudioContext(): AudioContext {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) throw new Error("Web Audio not supported");
  return new Ctx();
}

function playTone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  when: number,
  dur: number,
  type: OscillatorType,
  peak: number,
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  const attack = Math.min(0.015, dur * 0.3);
  const release = Math.max(0.02, dur - attack);
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(peak, when + attack);
  g.gain.linearRampToValueAtTime(0.001, when + attack + release);
  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.05);
}

function playKick(ctx: AudioContext, dest: AudioNode, when: number): void {
  const len = Math.floor(ctx.sampleRate * 0.07);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 800;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.45, when);
  g.gain.exponentialRampToValueAtTime(0.001, when + 0.08);
  src.connect(hp);
  hp.connect(g);
  g.connect(dest);
  src.start(when);
  src.stop(when + 0.09);
}

export class ChiptunePlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextTime = 0;
  private running = false;
  private unlocked = false;
  private muted = false;

  constructor(
    private readonly musicGain = 0.42,
    private readonly sfxGain = 0.38,
  ) {}

  isMuted(): boolean {
    return this.muted;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx!.currentTime, 0.015);
    }
  }

  /** Must run in a user-gesture handler (tap). Creates context + resumes. */
  async unlock(): Promise<boolean> {
    if (!this.ctx) {
      this.ctx = createAudioContext();
      this.master = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus.gain.value = this.musicGain;
      this.sfxBus.gain.value = this.sfxGain;
      this.master.gain.value = this.muted ? 0 : 1;
      this.musicBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.master.connect(this.ctx.destination);
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    // iOS / Telegram: play a tiny buffer in the gesture to unlock output
    const buffer = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
    const ping = this.ctx.createBufferSource();
    ping.buffer = buffer;
    ping.connect(this.ctx.destination);
    ping.start(0);
    ping.stop(this.ctx.currentTime + 0.01);

    if (!this.muted) {
      playTone(this.ctx, this.sfxBus!, 523.25, this.ctx.currentTime, 0.08, "square", 0.35);
    }

    this.unlocked = true;
    return true;
  }

  startLoop(): void {
    if (!this.unlocked || !this.ctx || !this.musicBus || this.muted) return;
    if (this.running) return;

    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }

    this.running = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), 30);
  }

  stopLoop(): void {
    this.running = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  dispose(): void {
    this.stopLoop();
    void this.ctx?.close();
    this.ctx = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.unlocked = false;
  }

  playFlap(): void {
    if (this.muted || !this.sfxBus || !this.ctx) return;
    const t = this.ctx.currentTime;
    playTone(this.ctx, this.sfxBus, 880, t, 0.07, "square", 0.5);
    playTone(this.ctx, this.sfxBus, 1318, t + 0.04, 0.06, "square", 0.28);
  }

  playFruit(): void {
    if (this.muted || !this.sfxBus || !this.ctx) return;
    const t = this.ctx.currentTime;
    [1047, 1319, 1568].forEach((f, i) => {
      playTone(this.ctx!, this.sfxBus!, f, t + i * 0.06, 0.08, "square", 0.45);
    });
  }

  playGameOver(): void {
    if (this.muted || !this.sfxBus || !this.ctx) return;
    const t = this.ctx.currentTime;
    [392, 349, 330, 262].forEach((f, i) => {
      playTone(this.ctx!, this.sfxBus!, f, t + i * 0.13, 0.15, "triangle", 0.5);
    });
  }

  private schedule(): void {
    if (!this.running || !this.ctx || !this.musicBus) return;

    const now = this.ctx.currentTime;
    if (this.nextTime < now - 0.05) {
      this.nextTime = now + 0.05;
    }

    const horizon = now + 0.15;

    while (this.nextTime < horizon) {
      const i = this.step % MELODY.length;
      const mel = MELODY[i];
      const bass = BASS[i];
      const dur = STEP_SEC * 0.9;

      if (mel) {
        playTone(this.ctx, this.musicBus, mel, this.nextTime, dur, "square", 0.22);
        playTone(this.ctx, this.musicBus, mel * 2, this.nextTime, dur * 0.8, "square", 0.06);
      }
      if (bass) {
        playTone(this.ctx, this.musicBus, bass, this.nextTime, dur * 1.05, "triangle", 0.28);
      }
      if (KICK_ON.has(i)) {
        playKick(this.ctx, this.musicBus, this.nextTime);
      }

      this.nextTime += STEP_SEC;
      this.step += 1;
    }
  }
}
