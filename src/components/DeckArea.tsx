'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './Card'
import { Card as CardType, CardColor } from '../engine'
import { useTexts } from '@/lib/i18n'

interface DeckAreaProps {
	topCard: CardType | null
	lastPlayedCards: CardType[]
	currentColor: CardColor | null
	pendingDraw: number
	isMyTurn: boolean
	canPlay: boolean
	onDraw: () => void
	direction: number
}


export function DeckArea({
	topCard,
	lastPlayedCards,
	currentColor,
	pendingDraw,
	isMyTurn,
	canPlay,
	onDraw,
	direction,
}: DeckAreaProps) {
	const texts = useTexts()

	// Ensure we have something to show if topCard is present but list is empty (fallback)
	// We filter out any null/undefined entries just in case
	const validStack = Array.isArray(lastPlayedCards) ? lastPlayedCards.filter(Boolean) : [];
	
	const displayCards = validStack.length > 0 
		? validStack 
		: (topCard ? [topCard] : []);

	// Helper to generate stable random-ish positions
	const getCardStyle = (id: string, index: number) => {
		if (!id) return { rotate: 0, x: 0, y: 0 };
		
		// Use simple hashing on ID
		let hash = 0;
		for (let i = 0; i < id.length; i++) {
			hash = id.charCodeAt(i) + ((hash << 5) - hash);
		}
		
		// Generate random positions between -10deg and +10deg, -8px and +8px
		const rotate = (hash % 180) - 7; 
		const x = (hash % 10) - 5;       
		const y = ((hash >> 1) % 10) - 5;
		
		return { rotate, x, y };
	}

	return (
		<div className="relative flex items-center justify-center gap-20 md:gap-40">
			{/* Deck */}
			<div className="relative group">
				<div className="absolute -top-2 -left-2 w-20 h-32 md:w-24 md:h-36 rounded-xl bg-black/20 blur-[2px]" />
				<div className="absolute top-1 left-1 -z-10 w-20 h-32 md:w-24 md:h-36 rounded-xl bg-black/35" />
				<div className="absolute top-2 left-2 -z-20 w-20 h-32 md:w-24 md:h-36 rounded-xl bg-black/25" />
				<Card
					hidden
					card={{} as any}
					onClick={() => {
						if (isMyTurn) onDraw()
					}}
					className="w-20 h-32 md:w-24 md:h-36 cursor-pointer shadow-2xl transform transition-transform group-hover:scale-[1.04] group-active:scale-[0.98]"
				/>

				{isMyTurn &&
					(pendingDraw > 0 ? (
						<div className="absolute -top-9 left-1/2 -translate-x-1/2 w-max bg-red-600 text-white font-black text-xs md:text-sm rounded-full px-4 py-1.5 shadow-lg ring-2 ring-white/80 animate-bounce z-50">
							{texts.game.drawStack(pendingDraw)}
						</div>
					) : !canPlay ? (
						<div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max flex flex-col items-center gap-1 z-50">
							<div className="bg-yellow-500 text-black font-black text-xs md:text-sm rounded-full px-4 py-1.5 shadow-lg ring-2 ring-white animate-bounce">
								{texts.game.drawStack(1)}
							</div>
							<div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-yellow-500"></div>
						</div>
					) : null)}
			</div>

			{/* Discard */}
			<div className="relative w-20 h-32 md:w-24 md:h-36">
				{displayCards.length > 0 ? (
					<AnimatePresence mode="popLayout">
						{displayCards.map((card, index) => {
							const isTop = index === displayCards.length - 1;
							const style = getCardStyle(card.id, index);
							
							return (
								<motion.div
									key={card.id}
									layout
									className="absolute inset-0"
									style={{ zIndex: index }}
									initial={isTop ? {
										scale: 1.2,
										opacity: 0,
										rotate: direction * 45, // Fly in with rotation
										y: -60,
									} : { opacity: 0 }}
									animate={{ 
										scale: 1, 
										opacity: 1, // style.opacity ?? 1 
										rotate: style.rotate,
										x: style.x,
										y: style.y
									}}
									exit={{ opacity: 0, scale: 0.9 }}
									transition={{ type: 'spring', stiffness: 260, damping: 20 }}
								>
									<Card
										card={card}
										activeColor={isTop ? currentColor : card.color} // Only top card shows active game color if wild? Or keep history?
										// Actually for Wilds, showing "currentColor" on previous wild cards might be confusing if color changed.
										// But 'card.color' is likely null/WILD.
										// Let's pass currentColor to all for visual consistency or just top?
										// If I play Wild Red. Next plays Green 2. The Wild Red is under Green 2.
										// Does the Wild show Red? 
										// Card component uses 'activeColor' to show the background for Wilds.
										// If I pass 'currentColor', all Wilds in stack show CURRENT game color.
										// This is acceptable.
										hoverable={false}
										className="w-20 h-32 md:w-24 md:h-36 shadow-2xl"
									/>
								</motion.div>
							)
						})}
					</AnimatePresence>
				) : (
					<div className="w-16 h-24 md:w-24 md:h-36 border-4 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/20 font-black">
						{texts.game.start}
					</div>
				)}

				<div className="absolute -bottom-4 inset-x-4 h-4 bg-black/25 blur-xl rounded-full -z-10" />
			</div>
		</div>
	)
}
