import Link from 'next/link'
import Image from 'next/image'
import { TEXTS } from '../engine/texts'
import bg from '@/public/bg-home.webp'

export default function Home() {
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

			{/* Buttons at the bottom */}
			<div className="flex flex-col gap-2 w-full max-w-[400px]">
				<Link
					href="/lobby?mode=solo"
					className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-center text-black font-bold text-xl rounded-2xl shadow-lg transform transition hover:scale-105"
				>
					{TEXTS.home.playSolo}
				</Link>
				<Link
					href="/lobby?mode=online"
					className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-center text-black font-bold text-xl rounded-2xl shadow-lg transform transition hover:scale-105"
				>
					{TEXTS.home.playOnline}
				</Link>
			</div>
		</div>
	)
}
