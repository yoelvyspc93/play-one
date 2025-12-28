'use client';

import { Card as CardType, PublicState, isValidMove } from '../engine';
import { Card } from './Card';
import { motion, AnimatePresence } from 'framer-motion';

interface HandProps {
    cards: CardType[];
    onPlay: (card: CardType) => void;
    active: boolean; // Is it my turn?
    state: PublicState; // Needed to check playable cards
}

export function Hand({ cards, onPlay, active, state }: HandProps) {
    return (
        <div className="flex justify-center items-end h-28 md:h-40">
            <div className="relative flex items-center w-full max-w-2xl justify-center">
                <AnimatePresence>
                    {cards.map((card, index) => {
                        // Responsive overlapping
                        const overlap = cards.length > 12 ? '-ml-12 md:-ml-16' : cards.length > 6 ? '-ml-10 md:-ml-12' : '-ml-4 md:-ml-8';
                        
                        const isPlayable = active && isValidMove(card, state, cards);
                        const rotation = (index - cards.length/2) * 2;

                        return (
                            <motion.div
                                key={card.id}
                                layout
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ 
                                    y: isPlayable ? -30 : 0, 
                                    opacity: 1, 
                                    rotate: rotation,
                                    scale: isPlayable ? 1.05 : 1
                                }} 
                                whileHover={isPlayable ? { 
                                    y: -40, 
                                    scale: 1.1, 
                                    zIndex: 100,
                                    transition: { duration: 0.2 }
                                } : {}}
                                exit={{ y: 100, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={`relative ${index > 0 ? overlap : ''}`}
                                style={{ zIndex: index }}
                            >
                                <Card 
                                    card={card} 
                                    onClick={() => active && isPlayable && onPlay(card)}
                                    disabled={!isPlayable}
                                    className={'w-16 h-24 md:w-24 md:h-36 transition-shadow shadow-xl'}
                                />
                                {isPlayable && (
                                    <motion.div 
                                        layoutId={`glow-${card.id}`}
                                        className="absolute inset-0 bg-yellow-400/10 blur-xl -z-10 rounded-xl"
                                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
