'use client';

import { PublicState, Card as CardType, CardColor, ActionType } from '../engine';
import { Card } from './Card';
import { Hand } from './Hand';
import { motion, AnimatePresence } from 'framer-motion';

interface GameBoardProps {
    state: PublicState;
    myHand: CardType[];
    onAction: (action: any) => void;
    isMyTurn: boolean;
    myId: string;
}

export function GameBoard({ state, myHand, onAction, isMyTurn, myId }: GameBoardProps) {
    // Relative positioning logic
    const totalPlayers = state.order.length;
    const myIndex = state.order.indexOf(myId);
    
    // Helper to get player at relative position
    const getPlayerAtRel = (rel: number) => {
        if (totalPlayers <= rel) return null;
        const targetIndex = (myIndex + rel) % totalPlayers;
        const targetId = state.order[targetIndex];
        return state.players.find(p => p.id === targetId) || null;
    };

    // Positions for 2-4 players:
    // 2 players: [0: Bot, 1: Top]
    // 3 players: [0: Bot, 1: Right, 2: Left]
    // 4 players: [0: Bot, 1: Right, 2: Top, 3: Left]
    
    const playersAtPos: (any | null)[] = [null, null, null, null];
    playersAtPos[0] = getPlayerAtRel(0); // Always Me
    
    if (totalPlayers === 2) {
        playersAtPos[2] = getPlayerAtRel(1); // Top
    } else if (totalPlayers === 3) {
        playersAtPos[1] = getPlayerAtRel(1); // Right
        playersAtPos[3] = getPlayerAtRel(2); // Left
    } else if (totalPlayers >= 4) {
        playersAtPos[1] = getPlayerAtRel(1); // Right
        playersAtPos[2] = getPlayerAtRel(2); // Top
        playersAtPos[3] = getPlayerAtRel(3); // Left
    }
    
    return (
        <div className="relative w-full h-[100dvh] bg-[#065f46] overflow-hidden flex flex-col font-sans select-none">
            {/* Background Texture/Gradient */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-green-400" />
            


            {/* Main Table Area */}
            <div className={`relative flex-1 flex flex-col ${totalPlayers === 2 ? 'justify-around py-4' : 'items-center justify-center'} transition-all px-4`}>
                
                {/* TOP PLAYER - Integrated in flow for 2 players to avoid overlap */}
                {playersAtPos[2] && (
                    <div className={`${totalPlayers === 2 ? 'relative' : 'absolute top-8 md:top-12 left-1/2 -translate-x-1/2'} flex flex-col items-center z-20`}>
                        <Opponent 
                            player={playersAtPos[2]} 
                            active={state.order[state.currentPlayerIndex] === playersAtPos[2].id} 
                            position="top"
                        />
                    </div>
                )}
                
                {/* Center Table (Deck & Pile) */}
                <div className={`flex ${totalPlayers === 2 ? 'flex-row' : 'flex-col md:flex-row'} items-center justify-center gap-4 md:gap-12 z-10`}>
                    {/* Draw Pile (Deck) */}
                    <div className="relative group">
                         <Card 
                            hidden 
                            card={{} as any} 
                            onClick={() => {
                                if (isMyTurn) onAction({ type: ActionType.DRAW_CARD, playerId: 'ME' });
                            }}
                            className="w-20 h-28 md:w-28 md:h-40 cursor-pointer shadow-2xl transform transition-transform group-hover:scale-105 group-active:scale-95"
                        />
                        {/* Stack Effect */}
                        <div className="absolute top-1 left-1 -z-10 w-full h-full bg-black/40 rounded-xl" />
                        <div className="absolute top-2 left-2 -z-20 w-full h-full bg-black/40 rounded-xl" />

                        {isMyTurn && state.pendingDraw > 0 && (
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-max bg-red-600 text-white font-bold text-sm rounded-full px-4 py-1.5 animate-bounce shadow-lg ring-2 ring-white">
                                 DRAW {state.pendingDraw}!
                             </div>
                        )}
                    </div>

                    {/* Discard Pile */}
                    <AnimatePresence mode="popLayout">
                        <div className="relative">
                            {state.topCard ? (
                                <motion.div
                                    key={state.topCard.id}
                                    initial={{ scale: 1.5, opacity: 0, rotate: state.direction * 45, y: -200 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
                                    className="relative z-10"
                                >
                                    <Card 
                                        card={state.topCard} 
                                        activeColor={state.currentColor}
                                        className="w-20 h-28 md:w-28 md:h-40 shadow-2xl" 
                                    />
                                </motion.div>
                            ) : (
                                <div className="w-20 h-28 md:w-28 md:h-40 border-4 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/20 font-bold">
                                    START
                                </div>
                            )}
                            {/* Pile Shadow */}
                            <div className="absolute -bottom-4 inset-x-4 h-4 bg-black/20 blur-xl rounded-full" />
                        </div>
                    </AnimatePresence>
                </div>



                {/* LEFT PLAYER */}
                {playersAtPos[3] && (
                    <div className="absolute left-2 md:left-20 top-1/2 -translate-y-1/2 flex flex-col items-center">
                        <Opponent 
                            player={playersAtPos[3]} 
                            active={state.order[state.currentPlayerIndex] === playersAtPos[3].id} 
                            position="left"
                        />
                    </div>
                )}

                {/* RIGHT PLAYER */}
                {playersAtPos[1] && (
                    <div className="absolute right-2 md:right-20 top-1/2 -translate-y-1/2 flex flex-col items-center">
                        <Opponent 
                            player={playersAtPos[1]} 
                            active={state.order[state.currentPlayerIndex] === playersAtPos[1].id} 
                            position="right"
                        />
                    </div>
                )}

            </div>
            
            {/* Bottom Section (Player Hand & Info) */}
            <div className="w-full pb-4 md:pb-8 pt-2 md:pt-12 relative z-30">
                {/* Turn Indicator Overlay */}
                <div className="pointer-events-none absolute -top-8 md:-top-12 left-0 right-0 flex justify-center">
                    <motion.div
                        animate={isMyTurn ? { scale: [1, 1.05, 1], opacity: 1 } : { opacity: 0.8 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`px-6 py-1.5 md:px-8 md:py-2 rounded-full font-black text-lg md:text-2xl uppercase tracking-widest shadow-2xl border-2 ${
                            isMyTurn 
                                ? "bg-yellow-400 text-black border-white animate-pulse" 
                                : "bg-black/60 text-white/50 border-white/10"
                        }`}
                    >
                        {isMyTurn ? "Your Turn!" : "Waiting..."}
                    </motion.div>
                </div>

                <div className="flex items-center justify-center gap-4 relative">
                    <Hand 
                        cards={myHand} 
                        state={state}
                        active={isMyTurn && state.phase === 'TURN'} 
                        onPlay={(card) => onAction({ type: ActionType.PLAY_CARD, playerId: 'ME', cardId: card.id })} 
                    />
                </div>
            </div>


            {/* Same Color Chooser / Winner Modals */}
             {/* Color Chooser Modal */}
             {isMyTurn && state.phase === 'CHOOSE_COLOR_REQUIRED' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white/90 p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center border-4 border-white"
                    >
                        <h2 className="text-3xl font-black mb-6 text-black tracking-tight uppercase">Choose Next Color</h2>
                        <div className="grid grid-cols-2 gap-6">
                            {[
                                { name: 'RED', color: 'bg-red-500' },
                                { name: 'GREEN', color: 'bg-green-500' },
                                { name: 'BLUE', color: 'bg-blue-500' },
                                { name: 'YELLOW', color: 'bg-yellow-400' }
                            ].map(c => (
                                <button 
                                    key={c.name}
                                    onClick={() => onAction({ type: ActionType.CHOOSE_COLOR, playerId: 'ME', color: c.name as any })}
                                    className={`w-28 h-28 rounded-[2rem] shadow-xl ring-4 ring-transparent hover:ring-white transition-all hover:scale-110 active:scale-90 ${c.color}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Winner Overlay */}
            {state.phase === 'ROUND_END' && (
                <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
                     <motion.div 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="bg-white p-1 rounded-[3rem] shadow-[0_0_100px_rgba(255,215,0,0.4)]"
                     >
                        <div className="bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 p-12 rounded-[2.9rem] text-center border-8 border-white">
                             <div className="text-8xl mb-6 filter drop-shadow-lg">🏆</div>
                             <h1 className="text-6xl font-black text-white mb-2 italic tracking-tighter drop-shadow-md">VICTORY!</h1>
                             
                             <div className="text-3xl font-black text-black bg-white/90 rounded-2xl py-3 px-10 mb-10 shadow-inner">
                                 {state.players.find(p => p.id === state.winnerId)?.name || 'Unknown'}
                             </div>

                             <button 
                                onClick={() => window.location.reload()} 
                                className="w-full bg-white text-orange-600 font-black text-2xl py-5 px-10 rounded-2xl shadow-2xl hover:scale-105 hover:bg-gray-100 active:scale-95 transition-all uppercase tracking-tight"
                             >
                                 Play Again
                             </button>
                        </div>
                     </motion.div>
                </div>
            )}
        </div>
    );
}

function Opponent({ player, active, position }: { player: any, active: boolean, position: 'top' | 'left' | 'right' }) {
    // Determine card orientation and fan style based on position
    const isHorizontal = position === 'top';
    const cardLimit = 10;
    
    return (
        <div className={`flex ${position === 'top' ? 'flex-col-reverse' : 'flex-col'} items-center transition-all duration-500 ${active ? 'scale-110 z-20' : 'opacity-90 z-10'}`}>
            
            {/* Hand Layout */}
            <div className={`flex relative min-h-[50px] md:min-h-[100px] justify-center items-center ${isHorizontal ? '-space-x-10 md:-space-x-14' : 'flex-col -space-y-16 md:-space-y-24 px-4 md:px-8'}`}>
                {Array.from({ length: Math.min(player.cardCount, cardLimit) }).map((_, i) => {
                    const rotation = isHorizontal 
                        ? (i - (Math.min(player.cardCount, cardLimit) - 1)/2) * 10
                        : position === 'left' ? 90 + (i * 4) : -90 - (i * 4);
                    
                    return (
                        <motion.div 
                            key={i} 
                            initial={{ scale: 0, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, rotate: rotation, y: 0 }}
                            className="relative"
                            style={{ 
                                zIndex: i,
                                transformOrigin: isHorizontal ? 'bottom center' : 'center center'
                            }}
                        >
                            <Card 
                                hidden 
                                card={{} as any} 
                                className="w-14 h-20 md:w-20 md:h-28 border-2 border-white shadow-2xl rounded-xl"
                            />
                        </motion.div>
                    );
                })}
            </div>

            {/* Avatar & Info Section */}
            <div className="flex flex-col items-center">
                 <div className="relative group">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center bg-gray-700 text-white font-black text-lg md:text-xl shadow-2xl relative transition-all ${active ? 'border-yellow-400 ring-4 ring-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.5)] scale-110' : 'border-white/40'}`}>
                        {player.name[0].toUpperCase()}
                        
                        {/* Red Badge for card count like in image */}
                        <div className="absolute -bottom-1 -right-1 bg-red-600 border-2 border-white text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                            {player.cardCount}
                        </div>
                        
                        {/* Active indicator badge */}
                        {active && (
                            <div className="absolute -top-1 -right-1">
                                <span className="flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 border-2 border-white"></span>
                                </span>
                            </div>
                        )}
                    </div>
                 </div>

                 <div className="mt-2 text-white font-black bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/5 uppercase text-[10px] tracking-widest shadow-md">
                     {player.name}
                 </div>
            </div>
        </div>
    );
}
