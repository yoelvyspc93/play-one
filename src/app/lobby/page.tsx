'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameHost, GameClient } from '../../network';
import { GameBoard } from '../../components/GameBoard';
import { ActionType, PublicState, Card } from '../../engine';

function LobbyContent() {
    const [mode, setMode] = useState<'HOME' | 'HOST' | 'CLIENT' | 'GAME'>('HOME');
    const [name, setName] = useState('');
    const [roomNameInput, setRoomNameInput] = useState(''); // Custom Room ID
    const [roomId, setRoomId] = useState('');
    const [hostId, setHostId] = useState(''); // For joining
    const [error, setError] = useState('');
    
    // Instances
    const [host, setHost] = useState<GameHost | null>(null);
    const [client, setClient] = useState<GameClient | null>(null);
    
    // Game State (Client View)
    const [gameState, setGameState] = useState<PublicState | null>(null);
    const [myHand, setMyHand] = useState<Card[]>([]);

    const createRoom = async () => {
        if (!name) return setError('Name required');
        setMode('HOST');
        const h = new GameHost(name);
        try {
            // Sanitize valid peer ID characters if needed, but basic alphanumeric is safer.
            // If empty, random.
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
        if (!name || !hostId) return setError('Name and Room ID required');
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
    
    const startSoloGame = async () => {
        setMode('HOST');
        const soloName = name || 'Player';
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

             // Add Bot and Start
             h.addBot();
             setTimeout(() => {
                 h.startGame();
             }, 500); // Small delay to ensuring state update

        } catch (e: any) {
             setError(e.message || 'Failed to start solo');
             setMode('HOME');
        }
    };
    
    // Auto-start check
    const searchParams = useSearchParams();
    const hasAutoStarted = useRef(false);

    useEffect(() => {
        const action = searchParams.get('action');
        if (action === 'solo' && !hasAutoStarted.current) {
            console.log("Auto-starting Solo Game...");
            hasAutoStarted.current = true;
            // Name might be empty, will default to 'Player' in startSoloGame
            startSoloGame();
        }
    }, [searchParams]);

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
                     <h1 className="text-3xl font-bold mb-6 text-center text-yellow-400">PlayOne Lobby</h1>
                     <div className="mb-6 bg-black/50 p-4 rounded text-center">
                         <div className="text-gray-400 text-sm">Room ID</div>
                         <div className="text-xl font-mono select-all bg-black p-2 rounded mt-1 border border-gray-700">{roomId || hostId}</div>
                     </div>
                     
                     <div className="mb-6">
                         <h2 className="text-xl font-bold mb-2">Players</h2>
                         <ul className="space-y-2">
                             {gameState.players.map(p => (
                                 <li key={p.id} className="flex justify-between items-center bg-gray-700 p-3 rounded">
                                     <span>{p.name} {p.id === (client ? (client as any).peerManager.myId : roomId) && '(You)'}</span>
                                     <span className={p.connected ? 'text-green-400' : 'text-red-400'}>●</span>
                                 </li>
                             ))}
                         </ul>
                     </div>
                     
                     {mode === 'HOST' && (
                         <div className="flex flex-col gap-3">
                             <div className="flex gap-2">
                                 <button className="btn-primary flex-1 py-3 rounded-lg font-bold bg-yellow-500 hover:scale-105 transition-transform" onClick={startGame}>START GAME</button>
                                 <button 
                                     className={`px-4 py-3 rounded-lg font-bold transition-transform ${gameState.players.length >= 4 ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' : 'bg-gray-600 hover:bg-gray-500 hover:scale-105'}`} 
                                     onClick={() => gameState.players.length < 4 && host?.addBot()}
                                     disabled={gameState.players.length >= 4}
                                 >
                                     + BOT
                                 </button>
                             </div>
                             <div className="text-center text-gray-500 text-sm">Min 2 players needed</div>
                         </div>
                     )}
                     
                     {mode === 'CLIENT' && (
                         <div className="text-center animate-pulse">Waiting for host to start...</div>
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
                         <input 
                             className="input-field bg-black/40 border border-white/20 rounded-xl p-4 text-center text-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                             value={name} 
                             onChange={e => setName(e.target.value)} 
                             placeholder="Enter Nickname" 
                         />

                         <input 
                             className="input-field bg-black/40 border border-white/20 rounded-xl p-4 text-center text-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 mt-2"
                             value={roomNameInput} 
                             onChange={e => setRoomNameInput(e.target.value)} 
                             placeholder="Room Name (Optional)" 
                         />
                         
                         <div className="h-px bg-white/20 my-2" />
                         
                         <button onClick={createRoom} className="bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105">
                             CREATE ROOM
                         </button>

                         <button onClick={startSoloGame} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-4 rounded-xl shadow-lg transition-transform hover:scale-105">
                             PLAY SOLO (VS BOT)
                         </button>
                         
                         <div className="relative text-center text-sm text-gray-300">
                              <span>OR JOIN</span>
                         </div>
                         
                         <div className="flex gap-2">
                             <input 
                                 className="flex-1 bg-black/40 border border-white/20 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                                 value={hostId} 
                                 onChange={e => setHostId(e.target.value)} 
                                 placeholder="Paste Room ID" 
                             />
                             <button onClick={joinRoom} className="bg-blue-500 hover:bg-blue-400 text-white font-bold p-3 rounded-xl transition-transform hover:scale-105">
                                 JOIN
                             </button>
                         </div>
                    </div>
                )}
                
                {mode === 'HOST' && <p className="text-center animate-pulse">Initializing Host...</p>}
                {mode === 'CLIENT' && <p className="text-center animate-pulse">Connecting to Host...</p>}
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
