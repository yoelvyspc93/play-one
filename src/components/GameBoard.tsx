'use client'

import { useEffect, useState } from 'react'
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

	return (
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
										onAction({ type: ActionType.DRAW_CARD, playerId: myId })
									}
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

				<div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-full px-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
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
	)
}
