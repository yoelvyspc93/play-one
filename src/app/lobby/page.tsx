'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameHost, GameClient } from '../../network';
import { GameBoard } from '../../components/GameBoard';
import { ActionType, PublicState, Card } from '../../engine';
import { TEXTS } from '../../engine/texts';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Avatar } from '../../components/Avatar';


function LobbyContent() {
    const searchParams = useSearchParams();
    const modeParam = searchParams.get('mode') || searchParams.get('action');
    const isSolo = modeParam?.toLowerCase() === 'solo';
    const forcedMode = isSolo ? 'solo' : (modeParam?.toLowerCase() === 'online' ? 'online' : null);
    
    const [mode, setMode] = useState<'HOME' | 'HOST' | 'CLIENT' | 'GAME'>('HOME');
    const [name, setName] = useState('');
    const [roomNameInput, setRoomNameInput] = useState(''); // Custom Room ID
    const [roomId, setRoomId] = useState('');
    const [hostId, setHostId] = useState(''); // For joining
    const [error, setError] = useState('');

    // Load name from localStorage on mount
    useEffect(() => {
        const savedName = localStorage.getItem('play-one-nickname');
        if (savedName) setName(savedName);
    }, []);

    // Save name to localStorage when it changes
    const handleNameChange = (newName: string) => {
        setName(newName);
        localStorage.setItem('play-one-nickname', newName);
    };

    
    // Instances
    const [host, setHost] = useState<GameHost | null>(null);
    const [client, setClient] = useState<GameClient | null>(null);
    
    // Game State (Client View)
    const [gameState, setGameState] = useState<PublicState | null>(null);
    const [myHand, setMyHand] = useState<Card[]>([]);

    const createRoom = async () => {
        if (!name) return setError(TEXTS.lobby.errors.nameRequired);
        setMode('HOST');
        setError('');

        const h = new GameHost(name);
        try {
            const customId = roomNameInput.trim() || undefined;
            const id = await h.start(customId);
            setRoomId(id);
            setHost(h);
            setGameState(h.getPublicState());
            setMyHand(h.getMyHand());
            
            const interval = setInterval(() => {
                setGameState({...h.getPublicState()}); 
                setMyHand(h.getMyHand());
            }, 500);
            
            (window as any).hostInterval = interval;
            
        } catch (e: any) {
            setError(e.message || 'Failed to start host');
            setMode('HOME');
        }
    };

    const joinRoom = async () => {
        if (!name || !hostId) return setError(TEXTS.lobby.errors.nameAndRoomRequired);
        setMode('CLIENT');

        const c = new GameClient(name);
        setClient(c);
        
        c.onStateUpdate = (s) => setGameState(s);
        c.onHandUpdate = (h) => setMyHand(h);
        
        try {
            await c.initialize();
            c.connectToHost(hostId);
        } catch (e: any) {
            setError(e.message);
            setMode('HOME');
        }
    };
    
    const startSoloLobby = async () => {
        if (!name) return setError(TEXTS.lobby.errors.nameRequired);
        setMode('HOST');

        const soloName = name;
        const h = new GameHost(soloName);
        try {
             // Create unique room for solo
             const id = await h.start(`SOLO-${Math.floor(Math.random() * 1000)}`);
             setRoomId(id);
             setHost(h);
             setGameState(h.getPublicState());
             setMyHand(h.getMyHand());
             
             // Setup Polling
             const interval = setInterval(() => {
                 setGameState({...h.getPublicState()}); 
                 setMyHand(h.getMyHand());
             }, 500);
             (window as any).hostInterval = interval;

             // Add one bot by default
             h.addBot();

        } catch (e: any) {
             setError(e.message || 'Failed to start solo');
             setMode('HOME');
        }
    };
    
    const startGame = () => {
        if (host) {
            host.startGame();
        }
    };
    
    // Cleanup
    useEffect(() => {
        return () => {
             if ((window as any).hostInterval) clearInterval((window as any).hostInterval);
             host?.destroy();
             client?.destroy();
        };
    }, []);

    // Render Game View
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
                     // Inject Player ID if missing or 'ME'
                     if (!action.playerId || action.playerId === 'ME') {
                         action.playerId = myId;
                     }
                     if (client) client.sendIntent(action);
                     if (host) host.dispatchLocalAction(action);
                }} 
            />
        );
    }
    
    // Lobby View
    if (gameState) {
         return (
             <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
                 <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
                     <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">
                         {isSolo ? TEXTS.home.playSolo : TEXTS.lobby.lobbyTitle}
                     </h1>

                     
                     {!isSolo && (
                         <div className="mb-6 bg-black/50 p-4 rounded text-center">
                             <div className="text-gray-400 text-sm">{TEXTS.lobby.roomId}</div>
                             <div className="text-xl font-mono select-all bg-black p-2 rounded mt-1 border border-gray-700">{roomId || hostId}</div>

                         </div>
                     )}
                     
                     <div className="mb-6">
                         <h2 className="text-xl font-bold mb-4">{TEXTS.lobby.players}</h2>
                         <ul className="space-y-3">
                             {gameState.players.map(p => {
                                 const isMe = p.id === (client ? (client as any).peerManager.myId : roomId);
                                 return (
                                     <li key={p.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-xl border border-white/5">
                                         <div className="flex items-center gap-3">
                                             <Avatar name={p.name} size="sm" />
                                             <span className="font-bold">{p.name} {isMe && TEXTS.common.youLabel}</span>
                                         </div>

                                         <span className={p.connected ? 'text-green-400' : 'text-red-400'}>●</span>
                                     </li>
                                 );
                             })}
                         </ul>
                     </div>

                     
                     {mode === 'HOST' && (
                         <div className="flex flex-col gap-3">
                             <div className="flex gap-2">
                                 <Button className="flex-1" size="lg" onClick={startGame}>{TEXTS.lobby.startGame}</Button>
                                 <Button 
                                     variant="secondary"
                                     onClick={() => gameState.players.length < 4 && host?.addBot()}
                                     disabled={gameState.players.length >= 4}
                                 >
                                     {TEXTS.lobby.addBot}
                                 </Button>
                             </div>
                             <div className="text-center text-gray-500 text-sm">{TEXTS.lobby.minPlayers}</div>
                         </div>
                     )}
                     
                     {mode === 'CLIENT' && (
                         <div className="text-center animate-pulse">{TEXTS.lobby.waitingHost}</div>
                     )}

                 </div>
             </div>
         );
    }

    // Login/Home
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-blue-900 text-white flex flex-col items-center justify-center font-sans">
            <h1 className="text-6xl font-black mb-8 italic tracking-tighter drop-shadow-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600">
                PLAY<span className="text-white">ONE</span>
            </h1>
            
            {error && <div className="bg-red-500/80 p-3 rounded mb-4">{error}</div>}
            
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl shadow-2xl w-full max-w-sm border border-white/20">
                {mode === 'HOME' && (
                    <div className="flex flex-col gap-4">
                         <Input 
                             value={name} 
                             onChange={e => handleNameChange(e.target.value)} 
                             placeholder={TEXTS.lobby.enterNickname} 
                         />

                         {isSolo ? (
                             <Button onClick={startSoloLobby} size="xl" className="mt-2">
                                 {TEXTS.lobby.startGame}
                             </Button>
                         ) : (
                             <>
                                 
                                 <Input 
                                     value={roomNameInput} 
                                     onChange={e => setRoomNameInput(e.target.value)} 
                                     placeholder={TEXTS.lobby.roomNameOptional} 
                                     className="mt-2"
                                 />

                                 <Button variant="success" onClick={createRoom} size="lg">
                                     {TEXTS.lobby.createRoom}
                                 </Button>                                 
                                 
                                 <div className="relative text-center justify text-sm text-gray-300 my-2 flex flex-row gap-2">
                                    <div className='w-full h-0.5 h-px bg-white/20 my-2'/>
                                    <span className='w-full'>{TEXTS.lobby.orJoin}</span>
                                    <div className='w-full h-0.5 h-px bg-white/20 my-2'/>
                                 </div>
                                 
                                 <div className="flex flex-col gap-2">
                                     <Input 
                                         value={hostId} 
                                         onChange={e => setHostId(e.target.value)} 
                                         placeholder={TEXTS.lobby.pasteRoomId} 
                                     />
                                     <Button onClick={joinRoom}>
                                         {TEXTS.lobby.join}
                                     </Button>
                                 </div>
                             </>
                         )}
                    </div>
                )}
                
                {mode === 'HOST' && <p className="text-center animate-pulse">{TEXTS.lobby.initializingHost}</p>}
                {mode === 'CLIENT' && <p className="text-center animate-pulse">{TEXTS.lobby.connectingHost}</p>}

            </div>
            
        </div>
    );
}

export default function LobbyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>}>
            <LobbyContent />
        </Suspense>
    );
}
