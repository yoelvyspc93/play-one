import { DataConnection } from 'peerjs';
import { PeerManager } from './connection';
import {
  MessageType, MessageEnvelope, PayloadStateUpdate, PayloadHandUpdate
} from './protocol';
import { PublicState, Card } from '../engine';
import { GameAction } from '../engine/actions';

export class GameClient {
  private peerManager: PeerManager;
  private hostConn: DataConnection | null = null;

  // Callbacks for UI updates
  public onStateUpdate: ((state: PublicState) => void) | null = null;
  public onHandUpdate: ((hand: Card[]) => void) | null = null;

  constructor(private nickname: string) {
    this.peerManager = new PeerManager();
  }

  public async initialize(): Promise<string> {
    return this.peerManager.initialize(); // Get my ID
  }

  public connectToHost(hostId: string) {
    const conn = this.peerManager.connect(hostId);
    this.hostConn = conn;

    conn.on('open', () => {
      console.log('Connected to Host');
      // Send Join
      this.peerManager.send(conn, {
        type: MessageType.JOIN,
        roomId: hostId,
        senderId: this.peerManager.myId,
        payload: { name: this.nickname }
      });
    });

    this.peerManager.setMessageHandler(this.handleMessage.bind(this));
  }

  private handleMessage(msg: MessageEnvelope) {
    switch (msg.type) {
      case MessageType.STATE_UPDATE: {
        const payload = msg.payload as PayloadStateUpdate;
        if (this.onStateUpdate) this.onStateUpdate(payload.state);
        break;
      }
      case MessageType.HAND_UPDATE: {
        const payload = msg.payload as PayloadHandUpdate;
        if (this.onHandUpdate) this.onHandUpdate(payload.hand);
        break;
      }
      case MessageType.ERROR:
        console.error('Game Error:', msg.payload);
        break;
    }
  }

  public sendIntent(action: GameAction) {
    if (this.hostConn) {
      this.peerManager.send(this.hostConn, {
        type: MessageType.INTENT,
        roomId: this.hostConn.peer,
        senderId: this.peerManager.myId,
        payload: { action }
      });
    }
  }

  public destroy() {
    this.peerManager.destroy();
  }
}
