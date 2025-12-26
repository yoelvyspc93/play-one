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
import { calculateBotMove } from '../engine/bot';
import { v4 as uuidv4 } from 'uuid';

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

    // Add to clients
    this.clients.set(peerId, conn);
    this.playerToPeer.set(peerId, peerId);

    // Add player to game state
    // We need a REDUCER action for Player Join to accept it safely
    const joinAction: GameAction = {
      type: ActionType.PLAYER_JOIN,
      playerId: peerId,
      name: payload.name
    };

    // Dispatch (but we need to implement PLAYER_JOIN logic in reducer properly, currently it's a stub)
    // For MVP, directly mutating state or ensuring reducer handles it.
    // Let's assume we update the reducer to handle it.
    // Or for now, hack it:
    // this.state = gameReducer(this.state, joinAction);

    // Wait, reducer logic for JOIN was... stubbed. 
    // We need to fix reducer.ts to handle PLAYER_JOIN
    // Let's implement it here manually for now to avoid context switching too much,
    // or better, send a patch to reducer later.

    // Actually, if we are in LOBBY, we can just add the player.
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

  public addBot() {
    if (this.state.public.phase !== 'LOBBY') return;

    const botId = `BOT-${uuidv4().slice(0, 4)}`;
    const botName = this.bots.size === 0 ? 'PlayBot' : `PlayBot ${this.bots.size + 1}`;

    // Update state manually or via reducer if we had JOIN action (reducer has placeholder).
    // Manual update safest for now.
    this.state.public.players.push({
      id: botId,
      name: botName,
      connected: true,
      cardCount: 0
    });
    this.state.players[botId] = {
      id: botId,
      name: botName,
      connected: true,
      cardCount: 0,
      hand: []
    };
    this.state.public.order.push(botId);
    this.bots.add(botId);
    this.broadcastState();
  }

  private processBots() {
    try {
      if (this.state.public.phase !== 'TURN' && this.state.public.phase !== 'CHOOSE_COLOR_REQUIRED') return;

      const currentPlayerId = this.state.public.order[this.state.public.currentPlayerIndex];
      if (!this.bots.has(currentPlayerId)) return;

      // Compute Move
      const player = this.state.players[currentPlayerId];
      // We need complete Hand for bot.

      // Simulate think time 
      // calculateBotMove needs "myHand" and public state.
      const action = calculateBotMove(this.state, currentPlayerId);

      if (action) {
        this.handleIntent({ action }, currentPlayerId); // Self-invoke
      } else {
        // Should not happen if computeBestMove returns DRAW if no moves.
        // Check if draw needed?
        const { pendingDraw } = this.state.public;
        if (!isValidMove({} as any, this.state.public, player.hand)) {
          // Force Draw
          console.warn('Bot returned null action, forcing Draw');
          this.handleIntent({ action: { type: ActionType.DRAW_CARD, playerId: currentPlayerId } }, currentPlayerId);
        } else {
          // Valid move exists but bot returned null? 
          // Fallback: draw
          this.handleIntent({ action: { type: ActionType.DRAW_CARD, playerId: currentPlayerId } }, currentPlayerId);
        }
      }
    } catch (e: any) {
      console.error('Bot Error:', e);
      // Fallback: skip turn or random action?
      // Safest is to do nothing and hope next tick works, or force draw if possible.
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
