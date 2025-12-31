export type GameDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT';
export type GameLanguage = 'es' | 'en';

export interface GameSettings {
  difficulty: GameDifficulty;
  playerName: string;
  nickname: string;
  language: GameLanguage;
}

export const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'NORMAL',
  playerName: '',
  nickname: '',
  language: 'es',
};

const SETTINGS_KEY = 'play-one-settings';
const LEGACY_NAME_KEY = 'play-one-nickname';

export function loadSettings(): GameSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  const raw = localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    const legacyName = localStorage.getItem(LEGACY_NAME_KEY) ?? '';
    return { ...DEFAULT_SETTINGS, playerName: legacyName, nickname: legacyName };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      difficulty: parsed.difficulty ?? DEFAULT_SETTINGS.difficulty,
      playerName: parsed.playerName ?? DEFAULT_SETTINGS.playerName,
      nickname: parsed.nickname ?? parsed.playerName ?? DEFAULT_SETTINGS.nickname,
      language: parsed.language ?? DEFAULT_SETTINGS.language,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings) {
  if (typeof window === 'undefined') return;
  const next: GameSettings = {
    ...settings,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  localStorage.setItem(LEGACY_NAME_KEY, next.nickname || next.playerName);
}
