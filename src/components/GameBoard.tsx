'use client'

import { useEffect, useRef, useState } from 'react'
import { LayoutGroup, motion } from 'framer-motion'
import {
	PublicState,
	Card as CardType,
	ActionType,
	canPlayAny,
} from '../engine'
import { Hand } from './Hand'
import { Opponent } from './Opponent'
import { ColorChooser } from './ColorChooser'
import { WinScreen } from './WinScreen'
import { DeckArea } from './DeckArea'
import { Card } from './Card'
import bg from '@/public/bg.webp'

interface GameBoardProps {
	state: PublicState
	myHand: CardType[]
	onAction: (action: any) => void
	isMyTurn: boolean
	myId: string
}

export function GameBoard({
	state,
	myHand,
	onAction,
	isMyTurn,
	myId,
}: GameBoardProps) {
	const [showWinScreen, setShowWinScreen] = useState(false)
	const [drawAnimation, setDrawAnimation] = useState<{
		card: CardType
		from: { x: number; y: number }
		to: { x: number; y: number }
	} | null>(null)
	const deckRef = useRef<HTMLDivElement | null>(null)
	const handRef = useRef<HTMLDivElement | null>(null)
	const previousHandCount = useRef(myHand.length)
	const totalPlayers = state.order.length
	const myIndex = state.order.indexOf(myId)

	const getPlayerAtRel = (rel: number) => {
		if (totalPlayers <= rel) return null
		const targetIndex = (myIndex + rel) % totalPlayers
		const targetId = state.order[targetIndex]
		return state.players.find((p) => p.id === targetId) || null
	}

	// positions: [me, right, top, left]
	const playersAtPos: (any | null)[] = [null, null, null, null]
	playersAtPos[0] = getPlayerAtRel(0) // Me

	if (totalPlayers === 2) {
		playersAtPos[2] = getPlayerAtRel(1) // Top
	} else if (totalPlayers === 3) {
		playersAtPos[1] = getPlayerAtRel(1) // Right
		playersAtPos[3] = getPlayerAtRel(2) // Left
	} else if (totalPlayers >= 4) {
		playersAtPos[1] = getPlayerAtRel(1) // Right
		playersAtPos[2] = getPlayerAtRel(2) // Top
		playersAtPos[3] = getPlayerAtRel(3) // Left
	}

	const currentPlayerId = state.order[state.currentPlayerIndex]

	useEffect(() => {
		if (state.phase !== 'ROUND_END') {
			setShowWinScreen(false)
			return
		}

		setShowWinScreen(false)
		const timer = window.setTimeout(() => setShowWinScreen(true), 1000)
		return () => window.clearTimeout(timer)
	}, [state.phase])

	useEffect(() => {
		if (myHand.length <= previousHandCount.current) {
			previousHandCount.current = myHand.length
			return
		}

		const drawnCard = myHand[myHand.length - 1]
		const deckRect = deckRef.current?.getBoundingClientRect()
		const handRect = handRef.current?.getBoundingClientRect()

		if (!drawnCard || !deckRect || !handRect) {
			previousHandCount.current = myHand.length
			return
		}

		const from = {
			x: deckRect.left + deckRect.width / 2,
			y: deckRect.top + deckRect.height / 2,
		}
		const to = {
			x: handRect.left + handRect.width / 2,
			y: handRect.top + handRect.height / 2,
		}

		setDrawAnimation({ card: drawnCard, from, to })
		const timer = window.setTimeout(() => setDrawAnimation(null), 400)

		previousHandCount.current = myHand.length
		return () => window.clearTimeout(timer)
	}, [myHand])

	return (
		<LayoutGroup>
			<div
				className="relative w-full h-[100dvh] overflow-hidden font-sans select-none"
				style={{
					backgroundImage: `url(${bg.src})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
				}}
			>
				{/* Dark overlay */}
				<div className="absolute inset-0 bg-black/15 pointer-events-none" />

				<div className="relative h-full w-full">
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="relative w-[90vw] max-w-[1200px] h-[65vw] max-h-[560px]">
							{/* DeckArea - centered on table */}
							<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
								<div className="pointer-events-auto">
									<DeckArea
										topCard={state.topCard}
										lastPlayedCards={state.lastPlayedCards || []}
										currentColor={state.currentColor}
										pendingDraw={state.pendingDraw}
										isMyTurn={isMyTurn}
										canPlay={canPlayAny(myHand, state)}
										direction={state.direction}
										onDraw={() =>
											onAction({
												type: ActionType.DRAW_CARD,
												playerId: myId,
											})
										}
										deckRef={deckRef}
									/>
								</div>
							</div>
						</div>
					</div>

					<div className="absolute top-[2%] left-1/2 -translate-x-1/2">
						{playersAtPos[2] && (
							<Opponent
								player={playersAtPos[2]}
								active={currentPlayerId === playersAtPos[2].id}
								position="top"
							/>
						)}
					</div>

					<div className="absolute left-[4%] top-1/2 -translate-y-1/2">
						{playersAtPos[3] && (
							<Opponent
								player={playersAtPos[3]}
								active={currentPlayerId === playersAtPos[3].id}
								position="left"
							/>
						)}
					</div>

					<div className="absolute right-[4%] top-1/2 -translate-y-1/2">
						{playersAtPos[1] && (
							<Opponent
								player={playersAtPos[1]}
								active={currentPlayerId === playersAtPos[1].id}
								position="right"
							/>
						)}
					</div>

					<div
						className="absolute bottom-2 left-1/2 -translate-x-1/2 w-full px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]"
						ref={handRef}
					>
						<div className="flex items-center justify-center">
							<Hand
								cards={myHand}
								state={state}
								active={isMyTurn && state.phase === 'TURN'}
								onPlay={(card) =>
									onAction({
										type: ActionType.PLAY_CARD,
										playerId: myId,
										cardId: card.id,
									})
								}
							/>
						</div>
					</div>
				</div>

				{drawAnimation && (
					<motion.div
						className="fixed inset-0 pointer-events-none z-50"
						initial={{
							x: drawAnimation.from.x,
							y: drawAnimation.from.y,
							scale: 1,
							opacity: 0.9,
						}}
						animate={{
							x: drawAnimation.to.x,
							y: drawAnimation.to.y,
							scale: 1.2,
							opacity: 0.95,
						}}
						transition={{ duration: 0.35, ease: 'easeOut' }}
					>
						<div className="absolute -translate-x-1/2 -translate-y-1/2">
							<Card
								card={drawAnimation.card}
								size="md"
								hoverable={false}
							/>
						</div>
					</motion.div>
				)}

				{isMyTurn && state.phase === 'CHOOSE_COLOR_REQUIRED' && (
					<ColorChooser
						onSelect={(color) =>
							onAction({ type: ActionType.CHOOSE_COLOR, playerId: myId, color })
						}
					/>
				)}

				{state.phase === 'ROUND_END' && showWinScreen && (
					<WinScreen
						winnerName={
							state.players.find((p) => p.id === state.winnerId)?.name ||
							'Unknown'
						}
						onRestart={() => onAction({ type: ActionType.START_GAME })}
					/>
				)}
			</div>
		</LayoutGroup>
	)
}
