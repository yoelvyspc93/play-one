'use client'

import { motion } from 'framer-motion'
import { useTexts } from '@/lib/i18n'

interface ColorChooserProps {
	onSelect: (color: string) => void
}

export function ColorChooser({ onSelect }: ColorChooserProps) {
	const texts = useTexts()
	const colorOptions = [
		{ name: 'RED', color: 'bg-red-500', label: texts.game.colors.red },
		{ name: 'GREEN', color: 'bg-green-500', label: texts.game.colors.green },
		{ name: 'BLUE', color: 'bg-blue-500', label: texts.game.colors.blue },
		{ name: 'YELLOW', color: 'bg-yellow-400', label: texts.game.colors.yellow },
	]

	return (
		<div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-lg">
			<motion.div
				initial={{ scale: 0.6, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: 'spring', stiffness: 260, damping: 18 }}
				className="bg-white/90 p-7 md:p-8 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center border-4 border-white"
			>
				<h2 className="text-2xl md:text-3xl font-black mb-5 md:mb-6 text-black tracking-tight uppercase">
					{texts.game.chooseColor}
				</h2>

				<div className="grid grid-cols-2 gap-5 md:gap-6">
					{colorOptions.map((c) => (
						<button
							key={c.name}
							onClick={() => onSelect(c.name)}
							className={`w-full h-24 rounded-lg shadow-xl ring-4 ring-transparent hover:ring-white transition-all hover:scale-110 active:scale-95 flex items-center justify-center text-[12px] font-bold text-white/50 hover:text-white ${c.color}`}
						>
							{c.label}
						</button>
					))}
				</div>
			</motion.div>
		</div>
	)
}
