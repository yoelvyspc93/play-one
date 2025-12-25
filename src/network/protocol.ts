import { ActionType, GameAction } from '../engine/actions';
import { PublicState, Card } from '../engine/types';

export enum MessageType {
  // Handshake
  JOIN = 'JOIN', // Client -> Host
  WELCOME = 'WELCOME', // Host -> Client (Initial State)
  ERROR = 'ERROR', // Host -> Client

  // Game Actions (Client -> Host)
  INTENT = 'INTENT',

  // State Updates (Host -> Client)
  STATE_UPDATE = 'STATE_UPDATE',
  HAND_UPDATE = 'HAND_UPDATE'
}

export interface MessageEnvelope {
  type: MessageType;
  roomId: string; // Peer ID of Host
  senderId: string; // Peer ID of Sender
  payload: any;
  seq?: number;
}

export interface PayloadJoin {
  name: string;
}

export interface PayloadWelcome {
  playerId: string; // Assigned Player ID (usually Peer ID)
  state: PublicState;
  hand: Card[]; // Initial hand if game in progress?
}

export interface PayloadIntent {
  action: GameAction; // Re-user engine actions
}

export interface PayloadStateUpdate {
  state: PublicState;
  seq: number;
}

export interface PayloadHandUpdate {
  hand: Card[];
}

export interface PayloadError {
  code: string;
  message: string;
}
