'use client';

import { Card as CardType, PublicState, isValidMove } from '../engine';
import { Card } from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';

interface HandProps {
    cards: CardType[];
    onPlay: (card: CardType) => void;
    active: boolean; // Is it my turn?
    state: PublicState; // Needed to check playable cards
}

export function Hand({ cards, onPlay, active, state }: HandProps) {
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

    // Reset selection when turn ends or cards change
    useEffect(() => {
        if (!active) {
            setSelectedCardId(null);
        }
    }, [active]);

    const handleCardClick = (card: CardType) => {
        if (!active) return;
        
        const isPlayable = isValidMove(card, state, cards);
        if (!isPlayable) return;

        if (selectedCardId === card.id) {
            onPlay(card);
            setSelectedCardId(null);
        } else {
            setSelectedCardId(card.id);
        }
    };

    return (
        <div className="flex justify-center items-end h-28 md:h-40 w-full" onClick={() => setSelectedCardId(null)}>
            <div className="relative flex items-center w-full max-w-2xl justify-center" onClick={(e) => e.stopPropagation()}>
                <AnimatePresence>
                    {cards.map((card, index) => {
                        // Responsive overlapping
                        const overlap = cards.length > 12 ? '-ml-12 md:-ml-16' : cards.length > 6 ? '-ml-10 md:-ml-12' : '-ml-4 md:-ml-8';
                        
                        const isPlayable = active && isValidMove(card, state, cards);
                        const isSelected = selectedCardId === card.id;
                        const rotation = (index - cards.length/2) * 2;

                        return (
                            <motion.div
                                key={card.id}
                                layout
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ 
                                    y: isSelected ? (typeof window !== 'undefined' && window.innerHeight < 700 ? -50 : -80) : (isPlayable ? -20 : 0), 
                                    opacity: 1, 
                                    rotate: isSelected ? 0 : rotation,
                                    scale: isSelected ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 1.15 : 1.2) : (isPlayable ? 1.05 : 1),
                                    zIndex: isSelected ? 100 : index
                                }} 
                                whileHover={isPlayable && !isSelected ? { 
                                    y: -50, 
                                    scale: 1.1, 
                                    zIndex: 100,
                                    transition: { duration: 0.2 }
                                } : {}}
                                exit={{ y: 100, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={`relative ${index > 0 ? overlap : ''}`}
                            >
                                <Card 
                                    card={card} 
                                    onClick={() => handleCardClick(card)}
                                    disabled={!isPlayable}
                                    hoverable={false}
                                    className={clsx(
                                        'w-16 h-24 md:w-24 md:h-36 transition-shadow shadow-xl',
                                    )}
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
