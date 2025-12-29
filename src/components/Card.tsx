'use client';

import { motion } from 'framer-motion';
import { Card as CardType, CardColor, CardKind } from '../engine';
import { clsx } from 'clsx';
import { text } from '../content/texts';

interface CardProps {
    card: CardType;
    onClick?: () => void;
    disabled?: boolean;
    hidden?: boolean;
    className?: string; // For positioning override
    style?: React.CSSProperties;
    activeColor?: CardColor | null; // For wild cards to show selected color
    hoverable?: boolean;
}

const colorStyles = {
    [CardColor.RED]: 'bg-red-500 from-red-400 to-red-600',
    [CardColor.GREEN]: 'bg-green-500 from-green-400 to-green-600',
    [CardColor.BLUE]: 'bg-blue-500 from-blue-400 to-blue-600',
    [CardColor.YELLOW]: 'bg-yellow-400 from-yellow-300 to-yellow-500', // Yellow usually lighter
    [CardColor.WILD]: 'bg-gray-800 from-gray-700 to-black', // Gradient for wild
};

const textStyles = {
    [CardColor.RED]: 'text-white',
    [CardColor.GREEN]: 'text-white',
    [CardColor.BLUE]: 'text-white',
    [CardColor.YELLOW]: 'text-black', // Contrast
    [CardColor.WILD]: 'text-white', 
};

// Helper to render center content
function CardContent({ card }: { card: CardType }) {
    if (card.kind === CardKind.WILD_DRAW_FOUR) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                 <div className="grid grid-cols-2 gap-1">
                      <div className="w-3 h-5 bg-red-500 rounded-sm shadow-sm" />
                      <div className="w-3 h-5 bg-blue-500 rounded-sm shadow-sm" />
                      <div className="w-3 h-5 bg-green-500 rounded-sm shadow-sm" />
                      <div className="w-3 h-5 bg-yellow-400 rounded-sm shadow-sm" />
                 </div>
            </div>
        );
    }
    
    if (card.kind === CardKind.WILD) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 rounded-full conic-gradient-wild border-4 border-white shadow-lg" style={{ background: 'conic-gradient(red, yellow, green, blue, red)'}} />
            </div>
        );
    }

    // Number
    if (card.kind === CardKind.NUMBER) {
        return (
            <span className="text-5xl md:text-7xl font-bold italic tracking-tighter shadow-sm-text">
                {card.number}
            </span>
        );
    }

    // Action Symbols
    if (card.kind === CardKind.SKIP) {
        return <span className="text-4xl font-bold">⊘</span>; // Block symbol
    }
    if (card.kind === CardKind.REVERSE) {
        return <span className="text-4xl font-bold">⇄</span>;
    }
    if (card.kind === CardKind.DRAW_TWO) {
        return (
             <div className="flex flex-col items-center">
                 <div className="block -mb-4 rotate-12 text-4xl border-2 border-current rounded bg-inherit px-1">+2</div>
                 <div className="block text-4xl border-2 border-current rounded bg-inherit px-1">+2</div>
             </div>
        );
    }
    
    return <span>?</span>;
}

// Small corners
function CornerMark({ card }: { card: CardType }) {
    let content = '';
    if (card.kind === CardKind.NUMBER) content = card.number?.toString() || '';
    else if (card.kind === CardKind.SKIP) content = '⊘';
    else if (card.kind === CardKind.REVERSE) content = '⇄';
    else if (card.kind === CardKind.DRAW_TWO) content = '+2';
    else if (card.kind === CardKind.WILD) content = 'W';
    else if (card.kind === CardKind.WILD_DRAW_FOUR) content = '+4';
    
    return <span className="font-bold text-sm italic">{content}</span>;
}


export function Card({ card, onClick, disabled, hidden, className, style, activeColor, hoverable = true }: CardProps) {
    if (hidden) {
        return (
            <motion.div 
                layout
                onClick={onClick}
                whileHover={onClick && hoverable ? { scale: 1.05 } : {}}
                className={clsx(
                    "rounded-xl border-4 border-white shadow-[0_10px_20px_rgba(0,0,0,0.3)]",
                    "bg-gradient-to-br from-red-600 to-red-800", // UNO back is usually red
                    "flex items-center justify-center relative overflow-hidden",
                    className || "w-20 h-32 md:w-24 md:h-36"
                )}
                style={style}
            >
                {/* Outer black border look */}
                <div className="absolute inset-1 rounded-lg border-2 border-black/20" />
                
                {/* Central Oval */}
                <div className="w-16 h-28 md:w-20 md:h-32 bg-black rounded-full transform rotate-[35deg] flex items-center justify-center shadow-inner border-2 border-yellow-400/30">
                     <span className="text-yellow-400 font-black text-xl md:text-2xl transform -rotate-[35deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] italic tracking-tighter">
                         {text.app.cardBackLabel}
                     </span>
                </div>
            </motion.div>
        );
    }

    // Determine the base color of the card. 
    // If it's a wild card and an active color is provided, use that.
    const isWild = card.kind === CardKind.WILD || card.kind === CardKind.WILD_DRAW_FOUR;
    const baseColor = (isWild && activeColor) ? activeColor : (card.color || CardColor.WILD);
    
    return (
        <motion.div
            layout 
            onClick={!disabled ? onClick : undefined}
            whileHover={!disabled && hoverable ? { y: -20, scale: 1.1, zIndex: 10 } : {}}
            whileTap={!disabled && hoverable ? { scale: 0.95 } : {}}
            className={clsx(
                "relative rounded-xl shadow-md border-4 border-white select-none overflow-hidden",
                "bg-gradient-to-br", colorStyles[baseColor],
                textStyles[baseColor],
                disabled ? "cursor-default" : "cursor-pointer", // Removed opacity/grayscale
                className || "w-20 h-32 md:w-24 md:h-36"
            )}
            style={style}
        >
            {/* Inner Ellipse Background for classic look */}
            <div className="absolute inset-2 rounded-full bg-white opacity-20 transform -skew-x-12" />
            
            {/* Top Left Corner */}
            <div className="absolute top-1 left-1.5 leading-none">
                <CornerMark card={card} />
            </div>

            {/* Bottom Right Corner (Rotated) */}
            <div className="absolute bottom-1 right-1.5 leading-none transform rotate-180">
                <CornerMark card={card} />
            </div>

            {/* Center Content */}
            <div className={`absolute inset-0 flex items-center justify-center ${!isWild ? '-left-2' : ''}`}>
                <CardContent card={card} />
            </div>
            
        </motion.div>
    );
}
