'use client'

import { clsx } from 'clsx'

interface AvatarProps {
	name: string
	showName?: boolean
	count?: number
	active?: boolean
	className?: string
	size?: 'sm' | 'md' | 'lg'
}

export function Avatar({
	name,
	count,
	active,
	className,
	size = 'md',
	showName = false,
}: AvatarProps) {
	const initial = (name?.[0] ?? '?').toUpperCase()

	const sizes = {
		sm: 'w-10 h-10 text-sm border-2',
		md: 'w-12 h-12 md:w-16 md:h-16 text-lg md:text-xl border-4',
		lg: 'w-16 h-16 text-2xl border-4',
	}

	return (
		<div
			className={clsx('flex flex-col items-center shrink-0 z-50', className)}
		>
			<div className="relative">
				<div
					className={clsx(
						'rounded-full flex items-center justify-center transition-all shadow-2xl',
						'bg-gray-700 text-white font-black',
						sizes[size],
						active
							? 'border-yellow-400 ring-4 ring-yellow-400/25 shadow-[0_0_22px_rgba(250,204,21,0.45)]'
							: 'border-white/35'
					)}
				>
					{initial}

					{count !== undefined && (
						<div className="absolute -bottom-1 -right-1 bg-red-600 border-2 border-white text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
							{count}
						</div>
					)}

					{active && (
						<div className="absolute -top-1 -right-1">
							<span className="flex h-4 w-4">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-70"></span>
								<span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 border-2 border-white"></span>
							</span>
						</div>
					)}
				</div>
			</div>

			{showName && (
				<div className="mt-1.5 md:mt-2 text-white font-black bg-black/45 backdrop-blur-lg px-2.5 py-1 rounded-lg border border-white/10 uppercase text-[9px] md:text-[10px] tracking-widest shadow-md whitespace-nowrap">
					{name}
				</div>
			)}
		</div>
	)
}
