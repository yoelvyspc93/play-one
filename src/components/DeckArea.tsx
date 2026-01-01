'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card } from './Card'
import { Card as CardType, CardColor } from '../engine'
import { useTexts } from '@/lib/i18n'

interface DeckAreaProps {
	topCard: CardType | null
	currentColor: CardColor | null
	pendingDraw: number
	isMyTurn: boolean
	canPlay: boolean
	onDraw: () => void
	direction: number
}

export function DeckArea({
	topCard,
	currentColor,
	pendingDraw,
	isMyTurn,
	canPlay,
	onDraw,
	direction,
}: DeckAreaProps) {
	const texts = useTexts()

	return (
		<div className="relative flex items-center justify-center gap-6 md:gap-10">
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
			<AnimatePresence mode="popLayout">
				<div className="relative">
					{topCard ? (
						<motion.div
							key={topCard.id}
							initial={{
								scale: 1.2,
								opacity: 0,
								rotate: direction * 35,
								y: -40,
							}}
							animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
							exit={{ opacity: 0, scale: 0.9 }}
							transition={{ type: 'spring', stiffness: 280, damping: 22 }}
							className="relative z-10"
						>
							<div className="relative w-20 h-32 md:w-24 md:h-36">
								{[
									{ rotate: -10, x: -10, y: 6, opacity: 0.5 },
									{ rotate: 6, x: 10, y: 10, opacity: 0.7 },
									{ rotate: 0, x: 0, y: 0, opacity: 1 },
								].map((style, index) => (
									<div
										key={`discard-${index}`}
										className="absolute inset-0"
										style={{
											transform: `translate(${style.x}px, ${style.y}px) rotate(${style.rotate}deg)`,
											opacity: style.opacity,
										}}
									>
										<Card
											card={topCard}
											activeColor={currentColor}
											hoverable={false}
											className="w-20 h-32 md:w-24 md:h-36 shadow-2xl"
										/>
									</div>
								))}
							</div>
						</motion.div>
					) : (
						<div className="w-16 h-24 md:w-24 md:h-36 border-4 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/20 font-black">
							{texts.game.start}
						</div>
					)}

					<div className="absolute -bottom-4 inset-x-4 h-4 bg-black/25 blur-xl rounded-full" />
				</div>
			</AnimatePresence>
		</div>
	)
}
