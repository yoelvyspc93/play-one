import { DataConnection } from 'peerjs';
import { PeerManager } from './connection';
import {
  MessageType, MessageEnvelope, PayloadJoin, PayloadIntent
} from './protocol';
import {
  GameState,
  createInitialState,
  gameReducer,
  GameAction,
  ActionType,
  isValidMove
} from '../engine';
import { calculateBotMove, calculateBotDelay } from '../engine/bot';
import type { BotPlayerConfig } from '../lib/bots';
import { v4 as uuidv4 } from 'uuid';

const botNames = ['Luna', 'Lucky', 'Atlas', 'Ares', 'Apollo', 'Athena', 'Zeus', 'Hades', 'Gael', 'Zara', 'Nina'];

export class GameHost {
  private peerManager: PeerManager;
  private state: GameState;
  private clients: Map<string, DataConnection> = new Map(); // PeerID -> Connection
  private playerToPeer: Map<string, string> = new Map(); // PlayerID -> PeerID (Usually same)
  private bots: Set<string> = new Set(); // Bot Player IDs
  private botInterval: NodeJS.Timeout | null = null;


  constructor(private hostPlayerName: string) {
    this.peerManager = new PeerManager();
    // Initial state with just host
    this.state = createInitialState(['host'], [hostPlayerName]);
  }

  public async start(customId?: string): Promise<string> {
    const id = await this.peerManager.initialize(customId);
    console.log('Host initialized with ID:', id);

    this.peerManager.setMessageHandler(this.handleMessage.bind(this));

    // Host is Player 1 (index 0)
    // Update valid ID in state
    this.state.players['host'].id = id;
    this.state.public.hostId = id;
    // Re-map host key?
    // Actually createInitialState uses the IDs passed.
    // So we should re-create state once we have the ID? 
    // Or just map 'host' -> real ID.
    // Let's re-init for simplicity or update the ID mappings.
    // Re-init:
    this.state = createInitialState([id], [this.hostPlayerName]);
    this.state.public.roomId = id; // Sync correct Room ID

    return id;
  }

  private handleMessage(msg: MessageEnvelope, conn: DataConnection) {
    switch (msg.type) {
      case MessageType.JOIN:
        this.handleJoin(msg.payload as PayloadJoin, conn, msg.senderId);
        break;
      case MessageType.INTENT:
        this.handleIntent(msg.payload as PayloadIntent, msg.senderId);
        break;
    }
  }

  private handleJoin(payload: PayloadJoin, conn: DataConnection, peerId: string) {
    if (this.clients.has(peerId)) {
      // Already connected?
      return;
    }

    // Check for 4 player limit
    if (this.state.public.phase === 'LOBBY' && this.state.public.players.length >= 4) {
      // Find if there is a bot with the same name as the joining player
      const botWithSameName = this.state.public.players.find(p => this.bots.has(p.id) && p.name.toLowerCase() === payload.name.toLowerCase());

      const botIds = Array.from(this.bots);
      if (botIds.length > 0) {
        // Kick the matched bot or the last one if no match
        const botIdToKick = botWithSameName?.id || botIds[botIds.length - 1];

        this.bots.delete(botIdToKick);
        this.state.public.order = this.state.public.order.filter(id => id !== botIdToKick);
        this.state.public.players = this.state.public.players.filter(p => p.id !== botIdToKick);
        delete this.state.players[botIdToKick];
        console.log(`Kicked bot ${botIdToKick} (Name: ${botWithSameName ? 'Matched' : 'Last Bot'}) to make space for human player`);
      } else {
        // No bots to kick, room is truly full
        this.peerManager.send(conn, {
          type: MessageType.ERROR,
          roomId: this.state.public.roomId,
          senderId: this.peerManager.myId,
          payload: { code: 'ROOM_FULL', message: 'The room is full' }
        });
        return;
      }
    }

    // Add to clients
    this.clients.set(peerId, conn);
    this.playerToPeer.set(peerId, peerId);

    // Add player to game state
    if (this.state.public.phase === 'LOBBY') {
      this.state.public.players.push({
        id: peerId,
        name: payload.name,
        connected: true,
        cardCount: 0
      });
      this.state.players[peerId] = {
        id: peerId,
        name: payload.name,
        connected: true,
        cardCount: 0,
        hand: []
      };
      if (!this.state.public.order.includes(peerId)) {
        this.state.public.order.push(peerId);
      }

      // Broadcast Update
      this.broadcastState();
    } else {
      // Reject? Or allow reconnect?
      // MVP: Reject if running
      this.peerManager.send(conn, {
        type: MessageType.ERROR,
        roomId: this.state.public.roomId,
        senderId: this.peerManager.myId,
        payload: { code: 'GAME_RUNNING', message: 'Game already started' }
      });
      return;
    }

    // Send Welcome
    /*
    this.peerManager.send(conn, {
        type: MessageType.WELCOME,
        roomId: this.state.public.roomId,
        senderId: this.peerManager.myId,
        payload: {
            playerId: peerId,
            state: this.state.public,
            hand: []
        }
    });*/
  }

  private handleIntent(payload: PayloadIntent, senderId: string) {
    // Validate sender matches action playerId
    // (Basic security)
    if (payload.action.type === ActionType.PLAY_CARD ||
      payload.action.type === ActionType.DRAW_CARD ||
      payload.action.type === ActionType.CHOOSE_COLOR) {
      if (payload.action.playerId !== senderId) {
        console.warn(`Player ${senderId} tried to act as ${payload.action.playerId}`);
        return;
      }
    }

    // Apply Action
    const nextState = gameReducer(this.state, payload.action);

    // If state changed (version check)
    if (nextState.public.stateVersion !== this.state.public.stateVersion) {
      this.state = nextState;
      this.broadcastState();
    }
  }

  private broadcastState() {
    // Send Public State to All
    const publicMsg: MessageEnvelope = {
      type: MessageType.STATE_UPDATE,
      roomId: this.peerManager.myId,
      senderId: this.peerManager.myId,
      payload: {
        state: this.state.public,
        seq: this.state.public.stateVersion
      }
    };

    this.peerManager.broadcast(Array.from(this.clients.values()), publicMsg);

    // Send Private Hands
    this.clients.forEach((conn, peerId) => {
      const player = this.state.players[peerId];
      if (player) {
        this.peerManager.send(conn, {
          type: MessageType.HAND_UPDATE,
          roomId: this.peerManager.myId,
          senderId: this.peerManager.myId,
          payload: {
            hand: player.hand
          }
        });
      }
    });
  }

  public startGame() {
    // Logic to start game
    this.state = gameReducer(this.state, { type: ActionType.START_GAME });
    this.broadcastState();

    // Start Bot Loop
    if (this.botInterval) clearInterval(this.botInterval);
    this.botInterval = setInterval(() => this.processBots(), 1000);
  }

  public addBot(botConfig?: BotPlayerConfig) {
    if (this.state.public.phase !== 'LOBBY') return;
    if (this.state.public.players.length >= 4) {
      console.warn('Cannot add more bots, lobby is full');
      return;
    }

    const botId = botConfig?.id ?? `BOT-${uuidv4().slice(0, 4)}`;

    // Pick a random name from the list, trying to avoid duplicates
    const currentBotNames = Object.values(this.state.players).map(p => p.name);
    const availableNames = botNames.filter(name => !currentBotNames.includes(name));

    // Fallback to random choice from full list if all are taken
    const sourceList = availableNames.length > 0 ? availableNames : botNames;
    const botName = botConfig?.name ?? sourceList[Math.floor(Math.random() * sourceList.length)];

    // Update state manually or via reducer if we had JOIN action (reducer has placeholder).
    // Manual update safest for now.
    this.state.public.players.push({
      id: botId,
      name: botName,
      connected: true,
      cardCount: 0,
      isBot: true,
      profile: botConfig?.profile,
      botTuning: botConfig?.botTuning,
    });
    this.state.players[botId] = {
      id: botId,
      name: botName,
      connected: true,
      cardCount: 0,
      hand: [],
      isBot: true,
      profile: botConfig?.profile,
      botTuning: botConfig?.botTuning,
    };
    this.state.public.order.push(botId);
    this.bots.add(botId);
    this.broadcastState();
  }

  private botActionPending: boolean = false;

  private processBots() {
    try {
      if (this.state.public.phase !== 'TURN' && this.state.public.phase !== 'CHOOSE_COLOR_REQUIRED') {
        return;
      }

      const currentPlayerId = this.state.public.order[this.state.public.currentPlayerIndex];
      if (!this.bots.has(currentPlayerId)) return;

      // Avoid multiple concurrent "thinking" processes for the same bot
      if (this.botActionPending) return;

      this.botActionPending = true;

      const botPlayer = this.state.players[currentPlayerId];
      const cardCount = botPlayer.hand.length;
      const thinkTime = calculateBotDelay(cardCount, botPlayer.botTuning);

      setTimeout(() => {
        try {
          // Re-verify it's still the bot's turn and game still running
          if (this.state.public.phase !== 'TURN' && this.state.public.phase !== 'CHOOSE_COLOR_REQUIRED') {
            this.botActionPending = false;
            return;
          }

          const activePlayerId = this.state.public.order[this.state.public.currentPlayerIndex];
          if (activePlayerId !== currentPlayerId) {
            this.botActionPending = false;
            return;
          }

          const action = calculateBotMove(this.state, currentPlayerId);

          if (action) {
            this.handleIntent({ action }, currentPlayerId);
          } else {
            // Fallback to draw if no move calculated
            this.handleIntent({
              action: { type: ActionType.DRAW_CARD, playerId: currentPlayerId }
            }, currentPlayerId);
          }
        } catch (e) {
          console.error('Error in bot thought execution:', e);
        } finally {
          this.botActionPending = false;
        }
      }, thinkTime);

    } catch (e: any) {
      console.error('Bot Pipeline Error:', e);
      this.botActionPending = false;
    }
  }


  public getPublicState() {
    return this.state.public;
  }

  public getMyHand() {
    return this.state.players[this.peerManager.myId]?.hand || [];
  }

  public dispatchLocalAction(action: GameAction) {
    this.handleIntent({ action }, this.peerManager.myId);
  }

  public destroy() {
    if (this.botInterval) clearInterval(this.botInterval);
    this.peerManager.destroy();
  }
}
