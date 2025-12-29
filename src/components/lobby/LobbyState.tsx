'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameClient } from '../../network';
import { Card, PublicState } from '../../engine';
import { text } from '../../content/texts';
import {
  createHost,
  ensureName,
  ensureNameAndRoom,
  startHostRoom,
  startSoloHost,
} from './lobbyUtils';
import { LobbyShell } from './LobbyShell';
import { LobbyView } from './LobbyView';
import { GameBoard } from '../GameBoard';

const POLL_INTERVAL = 500;
const SOLO_START_DELAY = 500;

export function LobbyState() {
  const [mode, setMode] = useState<'HOME' | 'HOST' | 'CLIENT' | 'GAME'>('HOME');
  const [name, setName] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('');
  const [roomId, setRoomId] = useState('');
  const [hostId, setHostId] = useState('');
  const [error, setError] = useState('');

  const [host, setHost] = useState<ReturnType<typeof createHost> | null>(null);
  const [client, setClient] = useState<GameClient | null>(null);
  const [gameState, setGameState] = useState<PublicState | null>(null);
  const [myHand, setMyHand] = useState<Card[]>([]);

  const searchParams = useSearchParams();
  const hasAutoStarted = useRef(false);

  const updateFromHost = (h: ReturnType<typeof createHost>) => {
    setGameState({ ...h.getPublicState() });
    setMyHand(h.getMyHand());
  };

  const startPolling = (h: ReturnType<typeof createHost>) => {
    const interval = setInterval(() => updateFromHost(h), POLL_INTERVAL);
    (window as any).hostInterval = interval;
  };

  const createRoom = async () => {
    try {
      ensureName(name);
      setMode('HOST');
      const h = createHost(name);
      const id = await startHostRoom(h, roomNameInput);
      setRoomId(id);
      setHost(h);
      updateFromHost(h);
      startPolling(h);
    } catch (err: any) {
      setError(err.message || text.lobby.errors.startHost);
      setMode('HOME');
    }
  };

  const joinRoom = async () => {
    try {
      ensureNameAndRoom(name, hostId);
      setMode('CLIENT');
      const c = new GameClient(name);
      setClient(c);

      c.onStateUpdate = (s) => setGameState(s);
      c.onHandUpdate = (h) => setMyHand(h);

      await c.initialize();
      c.connectToHost(hostId);
    } catch (err: any) {
      setError(err.message || text.lobby.errors.startHost);
      setMode('HOME');
    }
  };

  const startSoloGame = async () => {
    setMode('HOST');
    const soloName = name || text.game.defaultPlayerName;
    try {
      const { host: h, id } = await startSoloHost(soloName);
      setRoomId(id);
      setHost(h);
      updateFromHost(h);
      startPolling(h);

      h.addBot();
      setTimeout(() => {
        h.startGame();
      }, SOLO_START_DELAY);
    } catch (err: any) {
      setError(err.message || text.lobby.errors.startSolo);
      setMode('HOME');
    }
  };

  const startGame = () => {
    host?.startGame();
  };

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'solo' && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      startSoloGame();
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if ((window as any).hostInterval) clearInterval((window as any).hostInterval);
      host?.destroy();
      client?.destroy();
    };
  }, [host, client]);

  if (gameState && (mode === 'HOST' || mode === 'CLIENT') && gameState.phase !== 'LOBBY') {
    const myId = client ? (client as any).peerManager.myId : (host as any).peerManager.myId;
    const isMyTurn = gameState.order[gameState.currentPlayerIndex] === myId;

    return (
      <GameBoard
        state={gameState}
        myHand={myHand}
        isMyTurn={isMyTurn}
        myId={myId}
        onAction={(action) => {
          if (!action.playerId || action.playerId === 'ME') {
            action.playerId = myId;
          }
          if (client) client.sendIntent(action);
          if (host) host.dispatchLocalAction(action);
        }}
      />
    );
  }

  if (gameState) {
    const myId = client ? (client as any).peerManager.myId : (host as any).peerManager.myId;
    return (
      <LobbyView
        state={gameState}
        roomId={roomId}
        hostId={hostId}
        isHost={mode === 'HOST'}
        myId={myId}
        onStartGame={startGame}
        onAddBot={() => gameState.players.length < 4 && host?.addBot()}
      />
    );
  }

  return (
    <LobbyShell
      mode={mode}
      error={error}
      name={name}
      roomNameInput={roomNameInput}
      hostId={hostId}
      onNameChange={setName}
      onRoomNameChange={setRoomNameInput}
      onHostIdChange={setHostId}
      onCreateRoom={createRoom}
      onStartSolo={startSoloGame}
      onJoinRoom={joinRoom}
    />
  );
}
