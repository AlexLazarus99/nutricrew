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
  g.gain.setValueAtTime(0.0001, when);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), when + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(when);
  osc.stop(when + dur + 0.04);
}

function playKick(ctx: AudioContext, dest: AudioNode, when: number): void {
  const len = Math.floor(ctx.sampleRate * 0.06);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 900;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.22, when);
  g.gain.exponentialRampToValueAtTime(0.0001, when + 0.07);
  src.connect(hp);
  hp.connect(g);
  g.connect(dest);
  src.start(when);
  src.stop(when + 0.08);
}

export class ChiptunePlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextTime = 0;
  private running = false;
  private muted = false;

  constructor(private readonly musicGain = 0.14, private readonly sfxGain = 0.2) {}

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 1, this.getCtx().currentTime, 0.02);
    }
  }

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  async unlock(): Promise<void> {
    const ctx = this.getCtx();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  }

  startLoop(): void {
    if (this.running) return;
    this.running = true;
    const ctx = this.getCtx();
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.05;

    this.timer = setInterval(() => this.schedule(), 25);
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
  }

  playFlap(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const dest = this.master!;
    playTone(ctx, dest, 880, t, 0.06, "square", this.sfxGain * 0.35);
    playTone(ctx, dest, 1320, t + 0.04, 0.05, "square", this.sfxGain * 0.2);
  }

  playFruit(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const dest = this.master!;
    [1047, 1319, 1568].forEach((f, i) => {
      playTone(ctx, dest, f, t + i * 0.055, 0.07, "square", this.sfxGain * 0.4);
    });
  }

  playGameOver(): void {
    if (this.muted) return;
    const ctx = this.getCtx();
    const t = ctx.currentTime;
    const dest = this.master!;
    [392, 349, 330, 262].forEach((f, i) => {
      playTone(ctx, dest, f, t + i * 0.12, 0.14, "triangle", this.sfxGain * 0.45);
    });
  }

  private schedule(): void {
    if (!this.running || !this.master) return;
    const ctx = this.getCtx();
    const horizon = ctx.currentTime + 0.12;

    while (this.nextTime < horizon) {
      const i = this.step % MELODY.length;
      const mel = MELODY[i];
      const bass = BASS[i];
      const dur = STEP_SEC * 0.92;

      if (mel) {
        playTone(ctx, this.master, mel, this.nextTime, dur, "square", this.musicGain * 0.55);
        playTone(ctx, this.master, mel * 2, this.nextTime, dur * 0.85, "square", this.musicGain * 0.12);
      }
      if (bass) {
        playTone(ctx, this.master, bass, this.nextTime, dur * 1.1, "triangle", this.musicGain * 0.7);
      }
      if (KICK_ON.has(i)) {
        playKick(ctx, this.master, this.nextTime);
      }

      this.nextTime += STEP_SEC;
      this.step += 1;
    }
  }
}
