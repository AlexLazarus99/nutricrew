let muted = false;

export function loadMuted(): boolean {
  try {
    return localStorage.getItem("piprun_muted") === "1";
  } catch {
    return false;
  }
}

export function saveMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem("piprun_muted", m ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function createPipAudio() {
  muted = loadMuted();
  let ctx: AudioContext | null = null;

  function ensure(): AudioContext | null {
    if (muted) return null;
    if (!ctx) {
      try {
        ctx = new AudioContext();
      } catch {
        return null;
      }
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }

  function beep(freq: number, dur: number, vol = 0.08): void {
    const c = ensure();
    if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g);
    g.connect(c.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.stop(c.currentTime + dur);
  }

  return {
    unlock: async () => {
      ensure();
    },
    onJump: () => beep(420, 0.06),
    onCollect: () => beep(880, 0.05, 0.06),
    onHit: () => beep(120, 0.15, 0.1),
    onVictory: () => {
      beep(523, 0.1);
      setTimeout(() => beep(659, 0.1), 80);
      setTimeout(() => beep(784, 0.15), 160);
    },
    toggleMute: () => {
      muted = !muted;
      saveMuted(muted);
      return muted;
    },
    isMuted: () => muted,
  };
}
