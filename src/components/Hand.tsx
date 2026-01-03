'use client'

import { Card as CardType, PublicState, isValidMove } from '../engine'
import { Card } from './Card'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface HandProps {
	cards: CardType[]
	onPlay: (card: CardType) => void
	active: boolean // Is it my turn?
	state: PublicState // Needed to check playable cards
}

export function Hand({ cards, onPlay, active, state }: HandProps) {
	const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

	// Reset selection when turn ends or cards change
	useEffect(() => {
		if (!active) {
			setSelectedCardId(null)
		}
	}, [active])

	const handleCardClick = (card: CardType) => {
		if (!active) return

		const isPlayable = isValidMove(card, state, cards)
		if (!isPlayable) return

		if (selectedCardId === card.id) {
			onPlay(card)
			setSelectedCardId(null)
		} else {
			setSelectedCardId(card.id)
		}
	}

	return (
		<div
			className="flex justify-center items-end h-32 md:h-44 w-full"
			onClick={() => setSelectedCardId(null)}
		>
			<div
				className="relative flex items-center w-full max-w-4xl justify-center"
				onClick={(e) => e.stopPropagation()}
			>
				<AnimatePresence mode="popLayout">
					{cards.map((card, index) => {
						// Responsive overlapping
						const overlap =
							cards.length > 12
								? '-ml-10 md:-ml-12'
								: cards.length > 6
								? '-ml-8 md:-ml-10'
								: '-ml-2 md:-ml-6'

						const isPlayable = active && isValidMove(card, state, cards)
						const isSelected = selectedCardId === card.id
						const rotation = (index - cards.length / 2) * 1.5
						const lift = Math.abs(index - cards.length / 2) * -1.5

						// Rendering card with isolated layout wrapper
						return (
							<motion.div
								key={card.id}
								layout
								initial={{ opacity: 0, width: 0 }}
								animate={{ opacity: 1, width: 'auto' }}
								exit={{ opacity: 0, width: 0 }}
								transition={{ duration: 0.3 }}
								className={clsx(
									'relative -bottom-14 md:-bottom-12 flex-shrink-0',
									index > 0 ? overlap : ''
								)}
								style={{ zIndex: index }}
							>
								<motion.div
									data-card-id={card.id}
									initial={{ scale: 0.8, y: 100 }}
									animate={{
										y: isSelected
											? typeof window !== 'undefined' && window.innerHeight < 700
												? -50
												: -80
											: isPlayable
											? -24 + lift
											: lift,
										rotate: isSelected ? 0 : rotation,
										scale: isSelected
											? typeof window !== 'undefined' && window.innerWidth < 768
												? 1.15
												: 1.2
											: isPlayable
											? 1.06
											: 1,
									}}
									transition={{ 
										type: 'tween', 
										ease: 'easeOut', 
										duration: 0.25 
									}}
									whileHover={
										isPlayable && !isSelected
											? {
													y: -60,
													scale: 1.08,
													transition: { duration: 0.2 },
											  }
											: {}
									}
								>
									<Card
										card={card}
										onClick={() => handleCardClick(card)}
										disabled={!isPlayable}
										hoverable={false}
										size="lg"
										layout={false}
										className={clsx(
											'transition-shadow shadow-xl'
										)}
									/>
									{isPlayable && (
										<motion.div
											className="absolute inset-0 bg-yellow-400/15 blur-xl -z-10 rounded-xl"
											animate={{ opacity: [0.3, 0.6, 0.3] }}
											transition={{ duration: 2, repeat: Infinity }}
										/>
									)}
								</motion.div>
							</motion.div>
						)
					})}
				</AnimatePresence>
			</div>
		</div>
	)
}
