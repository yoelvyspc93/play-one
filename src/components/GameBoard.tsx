'use client';

import { PublicState, Card as CardType, CardColor, ActionType } from '../engine';
import { GameHost, GameClient } from '../network';
import { Card } from './Card';
import { Hand } from './Hand';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GameBoardProps {
    state: PublicState;
    myHand: CardType[];
    onAction: (action: any) => void; // Generic action dispatcher
    isMyTurn: boolean;
}

export function GameBoard({ state, myHand, onAction, isMyTurn }: GameBoardProps) {
    // Derived: Opponents
    // We need to map positions (Top, Left, Right) based on my index.
    // Order: [offsets]
    
    // Find my index
    // If I am not in players list (e.g. spectator?), default to 0.
    // We assume 'myHand' implies I am a player, but we don't know my ID easily solely from props unless passed.
    // Let's assume onAction can trigger without ID, or ID is inferred? 
    // Actually, we need my ID to know rotation. 
    // Let's deduce my ID from the hand? No.
    // Let's pass 'myId' prop or use 'isMyTurn' logic?
    // We need 'myId' to rotate the table.
    
    // For now, let's just render a "Circle" of players + "Me" at bottom.
    // MVP: List players at top, Me at bottom.
    
    return (
        <div className="relative w-full h-screen bg-green-800 overflow-hidden flex flex-col">
            {/* Top Bar / Info */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between text-white bg-black/30 backdrop-blur-md z-10">
                 <div>Room: <span className="font-mono">{state.roomId}</span></div>
                 <div>Color: <span className="font-bold" style={{ color: state.currentColor?.toLowerCase() || 'white' }}>{state.currentColor || 'None'}</span></div>
                 <div>Phase: {state.phase} {state.winnerId && `- Winner: ${state.winnerId}`}</div>
            </div>

            {/* Game Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                
                {/* Opponents (Top Row for MVP) */}
                <div className="absolute top-20 flex gap-8">
                     {state.players.filter(p => !myHand.some(c => false /* TODO: filter me */)).map(p => (
                         // We don't know who "me" is easily to filter. 
                         // Let's just show ALL other players for now.
                         // Or better: Pass myId prop.
                         <Opponent key={p.id} player={p} active={state.order[state.currentPlayerIndex] === p.id} />
                     ))}
                </div>
                
                {/* Center Table */}
                <div className="flex items-center gap-8 mb-20">
                    {/* Deck - Explicit Click Handler */} 
                    <div 
                        className="relative transition-transform active:scale-95 hover:scale-105"
                    >
                         {/* Card component now accepts onClick even if hidden */}
                        <Card 
                            hidden 
                            card={{} as any} 
                            onClick={() => {
                                if (isMyTurn) onAction({ type: ActionType.DRAW_CARD, playerId: 'ME' });
                            }}
                            className="w-20 h-32 md:w-24 md:h-36 cursor-pointer"
                        />

                        {isMyTurn && state.pendingDraw > 0 && (
                             <div className="absolute -top-4 w-full text-center bg-red-600 text-white text-xs rounded-full px-2 py-1 animate-bounce">
                                 Draw {state.pendingDraw}!
                             </div>
                        )}
                    </div>
                    
                    {/* Discard / Top Card */}
                    <div className="relative">
                         {state.topCard ? (
                             <motion.div
                                key={state.topCard.id} // Animate change
                                initial={{ scale: 0.8, opacity: 0, y: -50 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                             >
                                 <Card card={state.topCard} />
                             </motion.div>
                         ) : (
                             <div className="w-20 h-32 md:w-24 md:h-36 border-2 border-white/20 rounded-xl" />
                         )}
                    </div>
                </div>

                {/* Color Chooser Modal */}
                {isMyTurn && state.phase === 'CHOOSE_COLOR_REQUIRED' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.5 }} animate={{ scale: 1 }}
                            className="bg-white p-6 rounded-2xl shadow-2xl text-center"
                        >
                            <h2 className="text-2xl font-bold mb-4 text-black">Choose Color</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {['RED', 'GREEN', 'BLUE', 'YELLOW'].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => onAction({ type: ActionType.CHOOSE_COLOR, playerId: 'ME', color: c })}
                                        className={`w-24 h-24 rounded-xl shadow-lg ring-4 ring-white transition-transform hover:scale-105 ${
                                            c === 'RED' ? 'bg-red-500' : 
                                            c === 'BLUE' ? 'bg-blue-500' :
                                            c === 'GREEN' ? 'bg-green-500' : 'bg-yellow-400'
                                        }`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
                {/* Winner Overlay */}
                {state.phase === 'ROUND_END' && (
                    <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                         <motion.div 
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="bg-gradient-to-br from-yellow-400 to-orange-500 p-10 rounded-3xl shadow-[0_0_50px_gold] text-center"
                         >
                             <div className="text-6xl mb-4">👑</div>
                             <h1 className="text-4xl font-black text-white mb-2 text-shadow-lg">WINNER!</h1>
                             
                             <div className="text-2xl font-bold text-black bg-white/20 rounded-xl py-2 px-6 mb-8">
                                 {state.players.find(p => p.id === state.winnerId)?.name || 'Unknown'}
                             </div>

                             <button 
                                onClick={() => window.location.reload()} 
                                className="bg-white text-orange-600 font-black text-xl py-3 px-8 rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all"
                             >
                                 BACK TO LOBBY
                             </button>
                         </motion.div>
                    </div>
                )}
            </div>

            {/* My Hand (Bottom) */}
            <div className="w-full pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent z-20 flex flex-col items-center">
                <div className="text-center text-white mb-2 font-bold text-shadow text-xl animate-pulse">
                    {isMyTurn 
                        ? "Your Turn!" 
                        : `Waiting for ${state.players.find(p => p.id === state.order[state.currentPlayerIndex])?.name || 'Opponent'}...`}
                </div>
                <Hand 
                    cards={myHand} 
                    active={isMyTurn && state.phase === 'TURN'} 
                    onPlay={(card) => onAction({ type: ActionType.PLAY_CARD, playerId: 'ME', cardId: card.id })} 
                />
            </div>
        </div>
    );
}

function Opponent({ player, active }: { player: any, active: boolean }) {
    return (
        <div className={`flex flex-col items-center transition-all duration-300 ${active ? 'scale-110' : 'opacity-90'}`}>
            {/* Avatar */}
            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center bg-gray-700 text-white font-bold text-xl relative z-10 ${active ? 'border-yellow-400 shadow-[0_0_15px_gold]' : 'border-gray-500'}`}>
                {player.name[0].toUpperCase()}
                <div className="absolute -bottom-2 bg-red-600 text-white text-xs px-2 rounded-full border border-white">
                    {player.cardCount}
                </div>
            </div>
            
            <div className="mt-1 text-white font-medium text-shadow bg-black/40 px-2 rounded text-xs md:text-sm mb-1">
                {player.name}
            </div>

            {/* Opponent Hand (Backs) */}
            <div className="flex -space-x-4 h-8 md:h-12 overflow-visible items-start mt-2">
                 {Array.from({ length: Math.min(player.cardCount, 5) }).map((_, i) => (
                     <div key={i} className="transform origin-top hover:-translate-y-2 transition-transform">
                         <Card hidden card={{} as any} className="w-8 h-12 md:w-10 md:h-16 shadow-sm border-1" />
                     </div>
                 ))}
                 {player.cardCount > 5 && (
                     <div className="text-white text-xs self-center ml-2">+{player.cardCount - 5}</div>
                 )}
            </div>
        </div>
    );
}
