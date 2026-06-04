const KEY = "nutricrew_bird_daily";

type DailyRecord = {
  day: string;
  best: number;
};

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function load(): DailyRecord {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { day: todayKey(), best: 0 };
    const parsed = JSON.parse(raw) as DailyRecord;
    if (parsed.day !== todayKey()) return { day: todayKey(), best: 0 };
    return parsed;
  } catch {
    return { day: todayKey(), best: 0 };
  }
}

function save(rec: DailyRecord): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(rec));
  } catch {
    /* ignore */
  }
}

export const DAILY_SCORE_TARGET = 18;

export function recordDailyRun(score: number): { best: number; target: number; justBeat: boolean } {
  const rec = load();
  const prev = rec.best;
  if (score > rec.best) rec.best = score;
  save(rec);
  return {
    best: rec.best,
    target: DAILY_SCORE_TARGET,
    justBeat: score > prev && score >= DAILY_SCORE_TARGET,
  };
}

export function getDailyProgress(): { best: number; target: number; done: boolean } {
  const rec = load();
  return {
    best: rec.best,
    target: DAILY_SCORE_TARGET,
    done: rec.best >= DAILY_SCORE_TARGET,
  };
}
