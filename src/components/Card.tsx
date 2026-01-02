'use client'

import { motion } from 'framer-motion'
import { Card as CardType, CardColor, CardKind } from '../engine'
import { clsx } from 'clsx'
import { useTexts } from '@/lib/i18n'

export type CardSize = 'sm' | 'md' | 'lg'

interface CardProps {
	card: CardType
	onClick?: () => void
	disabled?: boolean
	hidden?: boolean
	className?: string
	style?: React.CSSProperties
	activeColor?: CardColor | null
	hoverable?: boolean
	size?: CardSize
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

// Configuration for card sizes
const sizeConfig = {
	sm: {
		dimensions: 'w-10 md:w-10', // Small for opponents
		cornerText: 'text-[0.6rem]',
		centerText: 'text-xl',
		iconSize: 'text-lg',
		wildGrid: 'gap-0.5',
		wildPip: 'w-1.5 h-2.5',
		backLabel: 'text-[0.6rem] md:text-xs',
		border: 'border-2',
	},
	md: {
		dimensions: 'w-16 md:w-20', // Medium for deck/discard
		cornerText: 'text-xs',
		centerText: 'text-3xl md:text-4xl',
		iconSize: 'text-2xl',
		wildGrid: 'gap-1',
		wildPip: 'w-2.5 h-4',
		backLabel: 'text-sm md:text-base',
		border: 'border-[3px]',
	},
	lg: {
		dimensions: 'w-18 md:w-28', // Large for hand
		cornerText: 'text-sm md:text-base',
		centerText: 'text-5xl md:text-7xl',
		iconSize: 'text-4xl',
		wildGrid: 'gap-1',
		wildPip: 'w-3 h-5',
		backLabel: 'text-xl md:text-2xl',
		border: 'border-4',
	},
}

function CardBack({
	onClick,
	hoverable,
	className,
	style,
	size = 'md',
}: {
	onClick?: () => void
	hoverable?: boolean
	className?: string
	style?: React.CSSProperties
	size?: CardSize
}) {
	const texts = useTexts()
	const config = sizeConfig[size]

	return (
		<motion.div
			layout
			onClick={onClick}
			whileHover={onClick && hoverable ? { scale: 1.05 } : {}}
			className={clsx(
				'relative rounded-xl shadow-xl bg-black flex items-center justify-center overflow-hidden aspect-[5/7]',
				config.dimensions,
				config.border,
				'border-white',
				className
			)}
			style={style}
		>
			<div className="absolute inset-1 rounded-full bg-gradient-to-br from-red-600 to-red-800 shadow-inner transform rotate-[20deg]" />
			<div className="absolute inset-3 rounded-full bg-black/60 border border-white/15 transform rotate-[20deg]" />
			<span
				className={clsx(
					'absolute text-yellow-300 font-black transform -rotate-[22deg] italic tracking-tight drop-shadow-lg',
					config.backLabel
				)}
			>
				{texts.app.cardBackLabel}
			</span>
		</motion.div>
	)
}

function CornerMark({
	kind,
	number,
	size,
}: {
	kind: CardKind
	number?: number
	size: CardSize
}) {
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
	return (
		<span className={clsx('font-bold italic', sizeConfig[size].cornerText)}>
			{content}
		</span>
	)
}

function CardContent({
	kind,
	number,
	size,
}: {
	kind: CardKind
	number?: number
	size: CardSize
}) {
	const config = sizeConfig[size]

	if (kind === CardKind.WILD_DRAW_FOUR)
		return (
			<div className={clsx('grid grid-cols-2', config.wildGrid)}>
				{[CardColor.RED, CardColor.BLUE, CardColor.GREEN, CardColor.YELLOW].map(
					(c) => (
						<div
							key={c}
							className={clsx(
								'rounded-sm shadow-sm',
								colorStyles[c],
								config.wildPip
							)}
						/>
					)
				)}
			</div>
		)
	if (kind === CardKind.WILD)
		return (
			<div
				className={clsx(
					'rounded-full border-2 border-white shadow-lg',
					size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12'
				)}
				style={{ background: 'conic-gradient(red, yellow, green, blue, red)' }}
			/>
		)
	if (kind === CardKind.NUMBER)
		return (
			<span className={clsx('font-bold italic tracking-tighter', config.centerText)}>
				{number}
			</span>
		)
	
	// Icons for special cards
	return (
		<span className={clsx('font-bold', config.iconSize)}>
			{kind === CardKind.SKIP && '⊘'}
			{kind === CardKind.REVERSE && '⇄'}
			{kind === CardKind.DRAW_TWO && (
				<div className="flex flex-col items-center">
					{['+2', '+2'].map((t, i) => (
						<div
							key={i}
							className={clsx(
								'border-2 border-current rounded px-0.5 leading-none',
								size === 'sm' ? 'text-[0.6rem]' : size === 'md' ? 'text-lg' : 'text-2xl',
								i === 0 && '-mb-2 rotate-12 bg-inherit z-10'
							)}
						>
							{t}
						</div>
					))}
				</div>
			)}
		</span>
	)
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
	size = 'md',
}: CardProps) {
	if (hidden)
		return (
			<CardBack
				onClick={onClick}
				hoverable={hoverable}
				className={className}
				style={style}
				size={size}
			/>
		)
	
	const config = sizeConfig[size]

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
				'relative rounded-xl shadow-md select-none overflow-hidden bg-gradient-to-br aspect-[5/7]',
				config.dimensions,
				config.border,
				colorStyles[baseColor],
				textStyles[baseColor],
				!disabled && 'cursor-pointer',
				'border-white',
				className
			)}
			style={style}
		>
			<div className="absolute inset-2 rounded-full bg-white opacity-20 transform -skew-x-12" />
			<div className={clsx("absolute leading-none", size === 'sm' ? 'top-0.5 left-1' : 'top-1 left-1.5')}>
				<CornerMark kind={card.kind} number={card.number} size={size} />
			</div>
			<div className={clsx("absolute leading-none transform rotate-180", size === 'sm' ? 'bottom-0.5 right-1' : 'bottom-1 right-1.5')}>
				<CornerMark kind={card.kind} number={card.number} size={size} />
			</div>
			<div
				className={clsx(
					'absolute inset-0 flex items-center justify-center',
					card.kind !== CardKind.WILD &&
						card.kind !== CardKind.WILD_DRAW_FOUR &&
						(size === 'sm' ? '-left-1' : '-left-2')
				)}
			>
				<CardContent kind={card.kind} number={card.number} size={size} />
			</div>
		</motion.div>
	)
}
