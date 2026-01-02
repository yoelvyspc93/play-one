'use client'

import Link from 'next/link'
import Image from 'next/image'
import bg from '@/public/bg-home.webp'
import { useTexts } from '@/lib/i18n'
import settingIcon from '@/public/setting.svg'

export default function Home() {
	const texts = useTexts()

	return (
		<div
			className="min-h-dvh flex flex-col items-center justify-center relative p-4"
			style={{
				backgroundImage: `url(${bg.src})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
			}}
		>
			{/* Icon centered */}
			<div className="flex-1">
				<Image
					src="icon.webp"
					alt="PlayOne"
					width={300}
					height={300}
					className="drop-shadow-2xl"
					priority
				/>
			</div>

			{/* Settings icon - absolute position */}
			<Link
				href="/settings"
				className="absolute top-4 right-4 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg transform transition hover:scale-110 z-10"
				aria-label={texts.home.settings}
			>
				<Image src={settingIcon.src} alt="Settings" width={18} height={18} />
			</Link>

			{/* Buttons at the bottom */}
			<div className="flex flex-row gap-2 w-full max-w-[400px]">
				<Link
					href="/lobby?mode=solo"
					className="flex-1 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-center text-black font-bold text-xl rounded-2xl shadow-lg transform transition hover:scale-105"
				>
					{texts.home.playSolo}
				</Link>
				<Link
					href="/lobby?mode=online"
					className="flex-1 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-center text-black font-bold text-xl rounded-2xl shadow-lg transform transition hover:scale-105"
				>
					{texts.home.playOnline}
				</Link>
			</div>
		</div>
	)
}
