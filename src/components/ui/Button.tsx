'use client'

import { clsx } from 'clsx'
import { motion, HTMLMotionProps } from 'framer-motion'

interface ButtonProps
	extends Omit<HTMLMotionProps<'button'>, 'children' | 'ref'> {
	children?: React.ReactNode
	variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost'
	size?: 'sm' | 'md' | 'lg' | 'xl'
	isLoading?: boolean
}

export function Button({
	children,
	variant = 'primary',
	size = 'md',
	isLoading,
	className,
	disabled,
	...props
}: ButtonProps) {
	const baseStyles =
		'font-bold rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg'

	const variants = {
		primary: 'bg-yellow-500 hover:bg-yellow-400 text-black',
		secondary: 'bg-gray-600 hover:bg-gray-500 text-white',
		danger: 'bg-red-500 hover:bg-red-400 text-white',
		success: 'bg-green-500 hover:bg-green-400 text-black',
		outline:
			'bg-transparent border-2 border-white/20 hover:bg-white/10 text-white',
		ghost: 'bg-transparent hover:bg-white/10 text-white shadow-none',
	}

	const sizes = {
		sm: 'px-3 py-1.5 text-sm',
		md: 'px-4 py-2 text-base',
		lg: 'px-6 py-3 text-lg',
		xl: 'px-8 py-4 text-xl font-black',
	}

	return (
		<motion.button
			whileHover={!disabled && !isLoading ? { scale: 1.05 } : {}}
			whileTap={!disabled && !isLoading ? { scale: 0.95 } : {}}
			className={clsx(
				baseStyles,
				variants[variant],
				sizes[size],
				(disabled || isLoading) && 'opacity-50 cursor-not-allowed grayscale',
				className
			)}
			disabled={disabled || isLoading}
			{...props}
		>
			{isLoading ? (
				<span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
			) : null}
			{children}
		</motion.button>
	)
}
