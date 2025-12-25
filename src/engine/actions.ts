import { CardColor } from './types';

export enum ActionType {
  START_GAME = 'START_GAME',
  PLAY_CARD = 'PLAY_CARD',
  DRAW_CARD = 'DRAW_CARD',
  CHOOSE_COLOR = 'CHOOSE_COLOR',
  PLAYER_JOIN = 'PLAYER_JOIN',
  PLAYER_LEAVE = 'PLAYER_LEAVE',
}

export interface ActionStartGame {
  type: ActionType.START_GAME;
}

export interface ActionPlayCard {
  type: ActionType.PLAY_CARD;
  playerId: string;
  cardId: string;
}

export interface ActionDrawCard {
  type: ActionType.DRAW_CARD;
  playerId: string;
}

export interface ActionChooseColor {
  type: ActionType.CHOOSE_COLOR;
  playerId: string;
  color: CardColor;
}

export interface ActionPlayerJoin {
  type: ActionType.PLAYER_JOIN;
  playerId: string;
  name: string;
}

export interface ActionPlayerLeave {
  type: ActionType.PLAYER_LEAVE;
  playerId: string;
}

export type GameAction =
  | ActionStartGame
  | ActionPlayCard
  | ActionDrawCard
  | ActionChooseColor
  | ActionPlayerJoin
  | ActionPlayerLeave;
