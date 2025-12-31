import { v4 as uuidv4 } from 'uuid';
import type { BotProfileName, BotTuning, Player } from '@/engine/types';
import { GameDifficulty, GameSettings } from './settings';

export interface BotPlayerConfig extends Pick<Player, 'id' | 'name' | 'connected' | 'hand' | 'cardCount'> {
  isBot: true;
  profile: BotProfileName;
  botTuning: BotTuning;
}

export const DIFFICULTY_PRESETS: Record<GameDifficulty, BotTuning> = {
  EASY: {
    aggressionMultiplier: 0.8,
    conserveWildMultiplier: 0.75,
    chaos: 0.55,
    memoryEnabled: false,
    targetingEnabled: false,
    riskAversion: 0.8,
    delayMinMs: 1400,
    delayMaxMs: 3200,
  },
  NORMAL: {
    aggressionMultiplier: 1.0,
    conserveWildMultiplier: 1.0,
    chaos: 0.26,
    memoryEnabled: true,
    targetingEnabled: true,
    riskAversion: 1.0,
    delayMinMs: 1100,
    delayMaxMs: 2600,
  },
  HARD: {
    aggressionMultiplier: 1.12,
    conserveWildMultiplier: 1.2,
    chaos: 0.14,
    memoryEnabled: true,
    targetingEnabled: true,
    riskAversion: 1.2,
    delayMinMs: 850,
    delayMaxMs: 2100,
  },
  EXPERT: {
    aggressionMultiplier: 1.28,
    conserveWildMultiplier: 1.35,
    chaos: 0.05,
    memoryEnabled: true,
    targetingEnabled: true,
    riskAversion: 1.35,
    delayMinMs: 650,
    delayMaxMs: 1600,
  },
};

const BOT_NAMES_BY_PROFILE: Record<BotProfileName, string[]> = {
  aggressive: ['Ares', 'Kira', 'Rex', 'Nova'],
  controller: ['Atlas', 'Sage', 'Mara', 'Orion'],
  conservative: ['Ivy', 'Basil', 'Noa', 'Lina'],
  chaotic: ['Ziggy', 'Pixel', 'Jinx', 'Koa'],
};

const DIFFICULTY_PROFILE_ORDER: Record<GameDifficulty, BotProfileName[]> = {
  EASY: ['chaotic', 'conservative', 'controller', 'chaotic'],
  NORMAL: ['controller', 'conservative', 'aggressive', 'chaotic'],
  HARD: ['aggressive', 'controller', 'conservative', 'aggressive'],
  EXPERT: ['aggressive', 'controller', 'aggressive', 'conservative'],
};

export function createBots(settings: GameSettings, existingPlayersCount: number, botCount = 1): BotPlayerConfig[] {
  const preset = DIFFICULTY_PRESETS[settings.difficulty];
  const profileOrder = DIFFICULTY_PROFILE_ORDER[settings.difficulty];
  const bots: BotPlayerConfig[] = [];
  const usedNames = new Set<string>();
  const clampedCount = Math.max(0, Math.min(3, botCount));

  for (let i = 0; i < clampedCount; i++) {
    const profile = profileOrder[i % profileOrder.length];
    const names = BOT_NAMES_BY_PROFILE[profile];
    let nameIndex = (existingPlayersCount + i) % names.length;
    let name = names[nameIndex];
    let guard = 0;
    while (usedNames.has(name) && guard < names.length) {
      nameIndex = (nameIndex + 1) % names.length;
      name = names[nameIndex];
      guard += 1;
    }
    usedNames.add(name);

    bots.push({
      id: `BOT-${uuidv4().slice(0, 4)}`,
      name,
      connected: true,
      hand: [],
      cardCount: 0,
      isBot: true,
      profile,
      botTuning: preset,
    });
  }

  return bots;
}
