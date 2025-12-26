export enum CardColor {
  RED = 'RED',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
  YELLOW = 'YELLOW',
  WILD = 'WILD', // Used for base color of Wild cards
}

export enum CardKind {
  NUMBER = 'NUMBER',
  SKIP = 'SKIP',
  REVERSE = 'REVERSE',
  DRAW_TWO = 'DRAW_TWO',
  WILD = 'WILD',
  WILD_DRAW_FOUR = 'WILD_DRAW_FOUR',
}

export interface Card {
  id: string;
  kind: CardKind;
  color: CardColor | null; // WILD cards might have null initially or WILD color, but when played we need to know the chosen color. Sticking to spec: "color: RED|GREEN|...|WILD|null"
  number?: number; // 0-9, only for NUMBER kind
}

export interface Player {
  id: string; // Persistent ID
  name: string;
  connected: boolean;
  hand: Card[]; // Only for internal state or private hand msg
  cardCount: number; // Derived for public state
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  ROUND_START = 'ROUND_START',
  TURN = 'TURN',
  CHOOSE_COLOR_REQUIRED = 'CHOOSE_COLOR_REQUIRED',
  ROUND_END = 'ROUND_END',
}

export enum RoundEndReason {
  PLAYER_EMPTY_HAND = 'PLAYER_EMPTY_HAND',
  OPPONENT_LEFT = 'OPPONENT_LEFT',
}

export interface PublicState {
  roomId: string;
  hostId: string;
  players: Omit<Player, 'hand'>[]; // Public view doesn't see hands
  order: string[]; // Array of player IDs defining turn order
  dealerIndex: number;
  currentPlayerIndex: number;
  direction: 1 | -1;
  topCard: Card | null;
  currentColor: CardColor | null; // The effective color (important after wild)
  pendingDraw: number;
  phase: GamePhase;
  winnerId?: string;
  roundEndReason?: RoundEndReason;
  stateVersion: number;
  version: number;
}

export interface InternalState {
  deck: Card[];
  discard: Card[];
  // skipNext: boolean; // Spec mentioned this might be derived or modeled. Let's see if we need it explicitly or just handle it in logic.
  // awaitingColorChoiceFrom?: string; // PlayerID
  // removedCards: Card[];
  // rngSeed?: string;
}

// Complete game state held by Host/Local Engine
export interface GameState {
  public: PublicState;
  internal: InternalState;
  players: Record<string, Player>; // Map for easy access, source of truth for hands
}
