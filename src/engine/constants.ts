import { CardColor, CardKind } from './types';

export const INITIAL_HAND_SIZE = 7;

export const DECK_COMPOSITION = [
  // Numbers 0 (1 per color)
  { kind: CardKind.NUMBER, count: 1, numbers: [0] },
  // Numbers 1-9 (2 per color)
  { kind: CardKind.NUMBER, count: 2, numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  // Actions (2 per color)
  { kind: CardKind.SKIP, count: 2 },
  { kind: CardKind.REVERSE, count: 2 },
  { kind: CardKind.DRAW_TWO, count: 2 },
  // Wilds (4 total)
  { kind: CardKind.WILD, count: 4, isWild: true },
  { kind: CardKind.WILD_DRAW_FOUR, count: 4, isWild: true },
];

export const COLORS = [
  CardColor.RED,
  CardColor.GREEN,
  CardColor.BLUE,
  CardColor.YELLOW,
];
