'use client'

import { clsx } from 'clsx'
import { forwardRef } from 'react'
import { Avatar } from './Avatar'
import { Card } from './Card'

export const Opponent = forwardRef<
	HTMLDivElement,
	{
		player: any
		active: boolean
		position: 'top' | 'left' | 'right'
	}
>(function Opponent({ player, active, position }, ref) {
	const count = Math.max(0, Number(player?.cardCount ?? 0))
	const name = String(player?.name ?? 'Player')
	const visibleCards = Math.max(1, count || 3)
	const fanAngles = Array.from({ length: visibleCards }).map((_, index) => {
		const spread = 18
		const center = (visibleCards - 1) / 2
		return (index - center) * (spread / visibleCards)
	})

const positionStyles = {
		top: {
			wrapper: 'flex-row gap-8',
			cards: 'flex-row',
			rotation: 'rotate-0',
			overlap: '-ml-6 md:-ml-8',
		},
		left: {
			wrapper: 'flex-col gap-2',
			cards: 'flex-row',
			rotation: '-rotate-12',
			overlap: '-ml-6 md:-ml-8',
		},
		right: {
			wrapper: 'flex-col gap-2',
			cards: 'flex-row',
			rotation: 'rotate-12',
			overlap: '-ml-6 md:-ml-8',
		},
	}[position]

	return (
		<div
			className={clsx(
				'relative flex items-center justify-center transition-all duration-300',
				active ? 'opacity-100' : 'opacity-95'
			)}
			ref={ref}
		>
			<div className={clsx('flex items-center', positionStyles.wrapper)}>
				<Avatar
					name={name}
					showName
					size="sm"
					count={count}
					active={active}
					className="flex flex-col items-center shrink-0 z-50"
				/>
				<div
					ref={ref}
					data-opponent-id={player?.id}
					className={clsx(
						'relative flex items-center justify-center',
						positionStyles.cards,
						positionStyles.rotation
					)}
				>
					{fanAngles.map((angle, index) => (
						<div
							key={`${name}-card-${index}`}
							data-opponent-card
							className={clsx(
								'relative',
								index === 0 ? '' : positionStyles.overlap
							)}
							style={{
								transform: `rotate(${angle}deg)`,
							}}
						>
							<Card
								hidden
								hoverable={false}
								card={{} as any}
								size="sm"
								className={clsx(
									'shadow-xl border-2 border-white/80'
								)}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	)
})
