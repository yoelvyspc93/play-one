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
	const [flyAnimations, setFlyAnimations] = useState<
		{
			id: string
			card: CardType
			from: { x: number; y: number }
			to: { x: number; y: number }
			size: 'sm' | 'md' | 'lg'
			initialScale?: number
		}[]
	>([])
	const deckRef = useRef<HTMLDivElement | null>(null)
	const discardRef = useRef<HTMLDivElement | null>(null)
	const handRef = useRef<HTMLDivElement | null>(null)
	const previousHandCount = useRef(myHand.length)
	const previousPlayerCounts = useRef<Record<string, number>>({})
	const opponentTopRef = useRef<HTMLDivElement | null>(null)
	const opponentLeftRef = useRef<HTMLDivElement | null>(null)
	const opponentRightRef = useRef<HTMLDivElement | null>(null)
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

	const pushFlyAnimation = (payload: {
		card: CardType
		from: { x: number; y: number }
		to: { x: number; y: number }
		size: 'sm' | 'md' | 'lg'
		initialScale?: number
	}) => {
		const id = `${payload.card.id}-${Date.now()}`
		setFlyAnimations((prev) => [...prev, { ...payload, id }])
		window.setTimeout(() => {
			setFlyAnimations((prev) => prev.filter((item) => item.id !== id))
		}, 400)
	}

	useEffect(() => {
		if (myHand.length <= previousHandCount.current) {
			previousHandCount.current = myHand.length
			return
		}

		const newCards = myHand.slice(previousHandCount.current)
		const deckRect = deckRef.current?.getBoundingClientRect()

		if (!deckRect) {
			previousHandCount.current = myHand.length
			return
		}

		const from = {
			x: deckRect.left + deckRect.width / 2,
			y: deckRect.top + deckRect.height / 2,
		}

		newCards.forEach((drawnCard, index) => {
			setTimeout(() => {
				requestAnimationFrame(() => {
					const targetCard = document.querySelector(
						`[data-card-id="${drawnCard.id}"]`
					) as HTMLElement | null
					const targetRect = targetCard?.getBoundingClientRect()
					const fallbackRect = handRef.current?.getBoundingClientRect()
					const toRect = targetRect || fallbackRect

					if (!toRect) return

					const to = {
						x: toRect.left + toRect.width / 2,
						y: toRect.top + toRect.height / 2,
					}

					pushFlyAnimation({ 
						card: drawnCard, 
						from, 
						to, 
						size: 'lg',
						initialScale: 0.7 // Deck(md) -> Hand(lg) approx ratio
					})
				})
			}, index * 500) // Stagger 200ms
		})

		previousHandCount.current = myHand.length
	}, [myHand])

	useEffect(() => {
		const currentCounts: Record<string, number> = {}
		state.players.forEach((player) => {
			currentCounts[player.id] = player.cardCount ?? 0
		})

		const prevCounts = previousPlayerCounts.current
		if (Object.keys(prevCounts).length === 0) {
			previousPlayerCounts.current = currentCounts
			return
		}

		const deckRect = deckRef.current?.getBoundingClientRect()
		const discardRect = discardRef.current?.getBoundingClientRect()

		state.players.forEach((player) => {
			if (player.id === myId) return

			const prev = prevCounts[player.id] ?? 0
			const next = currentCounts[player.id] ?? 0
			if (prev === next) return

			const opponentRef =
				(playersAtPos[2]?.id === player.id && opponentTopRef) ||
				(playersAtPos[3]?.id === player.id && opponentLeftRef) ||
				(playersAtPos[1]?.id === player.id && opponentRightRef) ||
				null
			const opponentRect = opponentRef?.current?.getBoundingClientRect()

			if (next > prev && deckRect) {
				const from = {
					x: deckRect.left + deckRect.width / 2,
					y: deckRect.top + deckRect.height / 2,
				}
				requestAnimationFrame(() => {
					const opponentCards = document.querySelectorAll(
						`[data-opponent-id="${player.id}"] [data-opponent-card]`
					)
					const targetCard = opponentCards[opponentCards.length - 1] as
						| HTMLElement
						| undefined
					const targetRect =
						targetCard?.getBoundingClientRect() || opponentRect
					if (!targetRect) return
					const to = {
						x: targetRect.left + targetRect.width / 2,
						y: targetRect.top + targetRect.height / 2,
					}
					pushFlyAnimation({
						card: { id: `back-${player.id}-${Date.now()}` } as CardType,
						from,
						to,
						size: 'sm',
					})
				})
			}

			if (next < prev && opponentRect && discardRect && state.topCard) {
				const from = {
					x: opponentRect.left + opponentRect.width / 2,
					y: opponentRect.top + opponentRect.height / 2,
				}
				const to = {
					x: discardRect.left + discardRect.width / 2,
					y: discardRect.top + discardRect.height / 2,
				}
				pushFlyAnimation({
					card: state.topCard,
					from,
					to,
					size: 'md',
					initialScale: 0.5 // Opponent(sm) -> Discard(md) approx ratio
				})
			}
		})

		previousPlayerCounts.current = currentCounts
	}, [state.players, state.topCard, playersAtPos, myId])

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
										discardRef={discardRef}
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
								ref={opponentTopRef}
							/>
						)}
					</div>

					<div className="absolute left-[4%] top-1/2 -translate-y-1/2">
						{playersAtPos[3] && (
							<Opponent
								player={playersAtPos[3]}
								active={currentPlayerId === playersAtPos[3].id}
								position="left"
								ref={opponentLeftRef}
							/>
						)}
					</div>

					<div className="absolute right-[4%] top-1/2 -translate-y-1/2">
						{playersAtPos[1] && (
							<Opponent
								player={playersAtPos[1]}
								active={currentPlayerId === playersAtPos[1].id}
								position="right"
								ref={opponentRightRef}
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

				{flyAnimations.map((animation) => (
					<motion.div
						key={animation.id}
						className="fixed inset-0 pointer-events-none z-50"
						initial={{
							x: animation.from.x,
							y: animation.from.y,
							scale: animation.initialScale ?? 1,
							opacity: 0,
						}}
						animate={{
							x: animation.to.x,
							y: animation.to.y,
							scale: 1,
							opacity: 1,
						}}
						transition={{ duration: 0.5, ease: 'backOut' }}
					>
						<div className="absolute -translate-x-1/2 -translate-y-1/2">
							<Card
								card={animation.card}
								size={animation.size}
								hoverable={false}
								hidden={animation.card.id.startsWith('back-')}
							/>
						</div>
					</motion.div>
				))}

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
