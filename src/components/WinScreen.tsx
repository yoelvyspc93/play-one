'use client'

import { motion } from 'framer-motion'
import { TEXTS } from '../engine/texts'

interface WinScreenProps {
	winnerName: string
	onRestart: () => void
}

export function WinScreen({ winnerName, onRestart }: WinScreenProps) {
	return (
		<div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
			<motion.div
				initial={{ scale: 0, rotate: -180 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{ type: 'spring', stiffness: 220, damping: 20 }}
				className="bg-white p-1 rounded-[3rem] shadow-[0_0_100px_rgba(255,215,0,0.4)]"
			>
				<div className="bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 p-10 md:p-12 rounded-[2.9rem] text-center border-8 border-white">
					<div className="text-7xl md:text-8xl mb-6 filter drop-shadow-lg">
						🏆
					</div>
					<h1 className="text-5xl md:text-6xl font-black text-white mb-2 italic tracking-tighter drop-shadow-md">
						{TEXTS.game.victory}
					</h1>

					<div className="text-2xl md:text-3xl font-black text-black bg-white/90 rounded-2xl py-3 px-10 mb-9 md:mb-10 shadow-inner">
						{winnerName}
					</div>

					<button
						onClick={onRestart}
						className="w-full bg-white text-orange-600 font-black text-xl md:text-2xl py-4 md:py-5 px-10 rounded-2xl shadow-2xl hover:scale-[1.03] hover:bg-gray-100 active:scale-[0.98] transition-all uppercase tracking-tight"
					>
						{TEXTS.game.playAgain}
					</button>
				</div>
			</motion.div>
		</div>
	)
}
