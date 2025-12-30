'use client'

import { motion } from 'framer-motion'
import { Card as CardType, CardColor, CardKind } from '../engine'
import { clsx } from 'clsx'
import { TEXTS } from '../engine/texts'

interface CardProps {
	card: CardType
	onClick?: () => void
	disabled?: boolean
	hidden?: boolean
	className?: string
	style?: React.CSSProperties
	activeColor?: CardColor | null
	hoverable?: boolean
}

const colorStyles = {
	[CardColor.RED]: 'bg-red-500 from-red-400 to-red-600',
	[CardColor.GREEN]: 'bg-green-500 from-green-400 to-green-600',
	[CardColor.BLUE]: 'bg-blue-500 from-blue-400 to-blue-600',
	[CardColor.YELLOW]: 'bg-yellow-400 from-yellow-300 to-yellow-500',
	[CardColor.WILD]: 'bg-gray-800 from-gray-700 to-black',
}

const textStyles = {
	[CardColor.RED]: 'text-white',
	[CardColor.GREEN]: 'text-white',
	[CardColor.BLUE]: 'text-white',
	[CardColor.YELLOW]: 'text-black',
	[CardColor.WILD]: 'text-white',
}

function CardBack({ onClick, hoverable, className, style }: any) {
	return (
		<motion.div
			layout
			onClick={onClick}
			whileHover={onClick && hoverable ? { scale: 1.05 } : {}}
			className={clsx(
				'relative rounded-xl border-4 border-white shadow-xl bg-black flex items-center justify-center relative overflow-hidden',
				className || 'w-20 h-32 md:w-24 md:h-36'
			)}
			style={style}
		>
			<div className="absolute inset-1 bg-gradient-to-br from-red-800 to-red-900 rounded-full transform -skew-x-10 flex items-center justify-center shadow-inner transform rotate-[25deg]" />
			<span className="absolute text-white font-black text-xl md:text-1xl transform -rotate-[52deg] italic tracking-tighter">
				{TEXTS.app.cardBackLabel}
			</span>
		</motion.div>
	)
}

function CornerMark({ kind, number }: { kind: CardKind; number?: number }) {
	const content =
		kind === CardKind.NUMBER
			? number
			: {
					[CardKind.SKIP]: '⊘',
					[CardKind.REVERSE]: '⇄',
					[CardKind.DRAW_TWO]: '+2',
					[CardKind.WILD]: 'W',
					[CardKind.WILD_DRAW_FOUR]: '+4',
			  }[kind]
	return <span className="font-bold text-sm italic">{content}</span>
}

function CardContent({ kind, number }: { kind: CardKind; number?: number }) {
	if (kind === CardKind.WILD_DRAW_FOUR)
		return (
			<div className="grid grid-cols-2 gap-1">
				{[CardColor.RED, CardColor.BLUE, CardColor.GREEN, CardColor.YELLOW].map(
					(c) => (
						<div
							key={c}
							className={clsx('w-3 h-5 rounded-sm shadow-sm', colorStyles[c])}
						/>
					)
				)}
			</div>
		)
	if (kind === CardKind.WILD)
		return (
			<div
				className="w-12 h-12 rounded-full border-4 border-white shadow-lg"
				style={{ background: 'conic-gradient(red, yellow, green, blue, red)' }}
			/>
		)
	if (kind === CardKind.NUMBER)
		return (
			<span className="text-5xl md:text-7xl font-bold italic tracking-tighter">
				{number}
			</span>
		)
	if (kind === CardKind.SKIP)
		return <span className="text-4xl font-bold">⊘</span>
	if (kind === CardKind.REVERSE)
		return <span className="text-4xl font-bold">⇄</span>
	if (kind === CardKind.DRAW_TWO)
		return (
			<div className="flex flex-col items-center">
				{['+2', '+2'].map((t, i) => (
					<div
						key={i}
						className={clsx(
							'text-4xl border-2 border-current rounded px-1',
							i === 0 && '-mb-4 rotate-12'
						)}
					>
						{t}
					</div>
				))}
			</div>
		)
	return null
}

export function Card({
	card,
	onClick,
	disabled,
	hidden,
	className,
	style,
	activeColor,
	hoverable = true,
}: CardProps) {
	if (hidden)
		return (
			<CardBack
				onClick={onClick}
				hoverable={hoverable}
				className={className}
				style={style}
			/>
		)
	const baseColor =
		(card.kind === CardKind.WILD || card.kind === CardKind.WILD_DRAW_FOUR) &&
		activeColor
			? activeColor
			: card.color || CardColor.WILD
	return (
		<motion.div
			layout
			onClick={!disabled ? onClick : undefined}
			whileHover={
				!disabled && hoverable ? { y: -20, scale: 1.1, zIndex: 10 } : {}
			}
			whileTap={!disabled && hoverable ? { scale: 0.95 } : {}}
			className={clsx(
				'relative rounded-xl shadow-md border-4 border-white select-none overflow-hidden bg-gradient-to-br',
				colorStyles[baseColor],
				textStyles[baseColor],
				!disabled && 'cursor-pointer',
				className || 'w-20 h-32 md:w-24 md:h-36'
			)}
			style={style}
		>
			<div className="absolute inset-2 rounded-full bg-white opacity-20 transform -skew-x-12" />
			<div className="absolute top-1 left-1.5 leading-none">
				<CornerMark kind={card.kind} number={card.number} />
			</div>
			<div className="absolute bottom-1 right-1.5 leading-none transform rotate-180">
				<CornerMark kind={card.kind} number={card.number} />
			</div>
			<div
				className={clsx(
					'absolute inset-0 flex items-center justify-center',
					card.kind !== CardKind.WILD &&
						card.kind !== CardKind.WILD_DRAW_FOUR &&
						'-left-2'
				)}
			>
				<CardContent kind={card.kind} number={card.number} />
			</div>
		</motion.div>
	)
}
