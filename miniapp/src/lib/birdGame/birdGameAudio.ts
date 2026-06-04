import { ChiptunePlayer } from "./chiptuneMusic.js";

const MUTE_KEY = "nutricrew-bird-music-muted";

export function loadMusicMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMusicMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* private mode */
  }
}

export type BirdGameAudio = {
  unlock: () => Promise<boolean>;
  startMusic: () => Promise<void>;
  stopMusic: () => void;
  onFlap: () => void;
  onFruit: () => void;
  onNearMiss: () => void;
  onCombo: () => void;
  onGameOver: () => void;
  toggleMute: () => boolean;
  isMuted: () => boolean;
  dispose: () => void;
};

export function createBirdGameAudio(): BirdGameAudio {
  const player = new ChiptunePlayer();
  player.setMuted(loadMusicMuted());

  return {
    unlock: () => player.unlock(),
    startMusic: async () => {
      if (!player.isUnlocked()) {
        await player.unlock();
      }
      player.startLoop();
    },
    stopMusic: () => player.stopLoop(),
    onFlap: () => player.playFlap(),
    onFruit: () => player.playFruit(),
    onNearMiss: () => player.playNearMiss(),
    onCombo: () => player.playCombo(),
    onGameOver: () => {
      player.stopLoop();
      player.playGameOver();
    },
    toggleMute: () => {
      const next = !player.isMuted();
      player.setMuted(next);
      saveMusicMuted(next);
      return next;
    },
    isMuted: () => player.isMuted(),
    dispose: () => player.dispose(),
  };
}
