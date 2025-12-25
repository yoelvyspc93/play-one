import Peer, { DataConnection } from 'peerjs';
import { MessageEnvelope, MessageType } from './protocol';

type MessageHandler = (msg: MessageEnvelope, conn: DataConnection) => void;

export class PeerManager {
  public peer: Peer | null = null;
  public myId: string = '';

  private onMessageCallback: MessageHandler | null = null;
  private onConnectionCallback: ((conn: DataConnection) => void) | null = null;

  constructor() { }

  public async initialize(id?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Import dynamically if needed for SSR, but usually we use Effect
      // PeerJS runs only in browser
      if (typeof window === 'undefined') {
        reject('PeerJS only in browser');
        return;
      }

      const peer = id ? new Peer(id) : new Peer();

      peer.on('open', (id) => {
        console.log('Peer Opened:', id);
        this.myId = id;
        this.peer = peer;
        resolve(id);
      });

      peer.on('connection', (conn) => {
        this.handleConnection(conn);
        if (this.onConnectionCallback) this.onConnectionCallback(conn);
      });

      peer.on('error', (err) => {
        console.error('Peer Error:', err);
        // reject(err); // If initializing
      });
    });
  }

  public connect(hostId: string): DataConnection {
    if (!this.peer) throw new Error('Peer not initialized');
    const conn = this.peer.connect(hostId);
    this.handleConnection(conn);
    return conn;
  }

  public setMessageHandler(handler: MessageHandler) {
    this.onMessageCallback = handler;
  }

  public setConnectionHandler(handler: (conn: DataConnection) => void) {
    this.onConnectionCallback = handler;
  }

  public send(conn: DataConnection, msg: MessageEnvelope) {
    if (conn.open) {
      conn.send(msg);
    } else {
      console.warn('Connection not open, cannot send', msg);
    }
  }

  public broadcast(conns: DataConnection[], msg: MessageEnvelope) {
    conns.forEach(c => this.send(c, msg));
  }

  public destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  private handleConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log('Connection Open:', conn.peer);
    });

    conn.on('data', (data) => {
      // console.log('Received:', data);
      if (this.onMessageCallback) {
        this.onMessageCallback(data as MessageEnvelope, conn);
      }
    });

    conn.on('close', () => {
      console.log('Connection Closed:', conn.peer);
      // Handle disconnect?
    });

    conn.on('error', (err) => {
      console.error('Connection Error:', err);
    });
  }
}
