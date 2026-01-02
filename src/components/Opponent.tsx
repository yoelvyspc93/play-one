'use client'

import { clsx } from 'clsx'
import { Avatar } from './Avatar'
import { Card } from './Card'

export function Opponent({
	player,
	active,
	position,
}: {
	player: any
	active: boolean
	position: 'top' | 'left' | 'right'
}) {
	const count = Math.max(0, Number(player?.cardCount ?? 0))
	const name = String(player?.name ?? 'Player')
	const visibleCards = Math.min(5, Math.max(1, count || 3))
	const fanAngles = Array.from({ length: visibleCards }).map((_, index) => {
		const spread = 18
		const center = (visibleCards - 1) / 2
		return (index - center) * (spread / visibleCards)
	})

	const positionStyles = {
		top: {
			wrapper: 'flex-col gap-4',
			cards: 'flex-row',
			cardClass: 'w-16 h-24 md:w-20 md:h-28',
			rotation: 'rotate-0',
			overlap: '-ml-6 md:-ml-8',
		},
		left: {
			wrapper: 'flex-row gap-3',
			cards: 'flex-row',
			cardClass: 'w-14 h-20 md:w-16 md:h-24',
			rotation: '-rotate-6',
			overlap: '-ml-6 md:-ml-8',
		},
		right: {
			wrapper: 'flex-row-reverse gap-3',
			cards: 'flex-row-reverse',
			cardClass: 'w-14 h-20 md:w-16 md:h-24',
			rotation: 'rotate-6',
			overlap: '-mr-6 md:-mr-8',
		},
	}[position]

	return (
		<div
			className={clsx(
				'relative flex items-center justify-center transition-all duration-300',
				active ? 'opacity-100' : 'opacity-95'
			)}
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
					className={clsx(
						'relative flex items-center justify-center',
						positionStyles.cards,
						positionStyles.rotation
					)}
				>
					{fanAngles.map((angle, index) => (
						<div
							key={`${name}-card-${index}`}
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
								className={clsx(
									'shadow-xl border-2 border-white/80',
									positionStyles.cardClass
								)}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}
