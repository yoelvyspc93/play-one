'use client';

import { Card as CardType } from '../engine';
import { Card } from './Card';
import { motion, AnimatePresence } from 'framer-motion';

interface HandProps {
    cards: CardType[];
    onPlay: (card: CardType) => void;
    active: boolean; // Is it my turn?
}

export function Hand({ cards, onPlay, active }: HandProps) {
    return (
        <div className="flex justify-center items-end h-40">
            <div className="relative flex items-center w-full max-w-2xl justify-center">
                <AnimatePresence>
                    {cards.map((card, index) => {
                        // Responsive overlapping
                        const overlap = cards.length > 5 ? '-ml-8 md:-ml-12' : '-ml-4 md:-ml-8';
                        
                        return (
                            <motion.div
                                key={card.id}
                                layout
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1, rotate: (index - cards.length/2) * 2 }} 
                                exit={{ y: 100, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={index > 0 ? overlap : ''}
                                style={{ zIndex: index }}
                            >
                                <Card 
                                    card={card} 
                                    onClick={() => active && onPlay(card)}
                                    disabled={!active}
                                    className="w-20 h-32 md:w-24 md:h-36"
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
