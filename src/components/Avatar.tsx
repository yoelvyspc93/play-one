'use client'

import { clsx } from 'clsx'
import Image from 'next/image'
import avatar1 from '@/public/avatar-1.svg'
import avatar2 from '@/public/avatar-2.svg'
import avatar3 from '@/public/avatar-3.svg'
import avatar4 from '@/public/avatar-4.svg'

interface AvatarProps {
	name: string
	showName?: boolean
	count?: number
	active?: boolean
	className?: string
	size?: 'sm' | 'md' | 'lg'
}

const avatarImages = [avatar1, avatar2, avatar3, avatar4]

const getAvatarSrc = (name: string) => {
	const safeName = name || 'Player'
	const hash = safeName
		.split('')
		.reduce((acc, char) => acc + char.charCodeAt(0), 0)
	return avatarImages[hash % avatarImages.length]
}

export function Avatar({
	name,
	count,
	active,
	className,
	size = 'md',
	showName = false,
}: AvatarProps) {
	const avatarSrc = getAvatarSrc(name)

	const sizes = {
		sm: 'w-12 h-12 border-[3px]',
		md: 'w-16 h-16 md:w-20 md:h-20 border-[4px]',
		lg: 'w-20 h-20 md:w-24 md:h-24 border-[4px]',
	}

	return (
		<div
			className={clsx('flex flex-col items-center shrink-0 z-50', className)}
		>
			<div className="relative">
				<div
					className={clsx(
						'rounded-full flex items-center justify-center transition-all shadow-2xl overflow-hidden bg-[#f5c94c]',
						sizes[size],
						active
							? 'border-yellow-200 ring-4 ring-yellow-200/30 shadow-[0_0_20px_rgba(250,204,21,0.35)]'
							: 'border-yellow-100/80'
					)}
				>
					<Image
						src={avatarSrc}
						alt={`${name} avatar`}
						fill
						className="object-cover"
					/>

					{count !== undefined && (
						<div className="absolute -bottom-2 -right-2 bg-white/90 border-2 border-yellow-200 text-slate-800 text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
							{count}
						</div>
					)}

					{active && (
						<div className="absolute -top-2 -right-2">
							<span className="flex h-4 w-4 rounded-full bg-yellow-300 border-2 border-white shadow-md" />
						</div>
					)}
				</div>
			</div>

			{showName && (
				<div className="mt-2 text-white font-semibold bg-white/20 backdrop-blur-lg px-3 py-1 rounded-full border border-white/40 text-[10px] md:text-xs tracking-wide shadow-md whitespace-nowrap">
					{name}
				</div>
			)}
		</div>
	)
}
