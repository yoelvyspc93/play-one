'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import bg from '@/public/bg.webp'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { GameDifficulty, GameLanguage, GameSettings, DEFAULT_SETTINGS, loadSettings, saveSettings } from '@/lib/settings'
import { getTextsForLanguage } from '@/lib/i18n'

const difficultyOptions: GameDifficulty[] = ['EASY', 'NORMAL', 'HARD', 'EXPERT']
const languageOptions: GameLanguage[] = ['es', 'en']

export default function SettingsPage() {
	const router = useRouter()
	const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
	const texts = useMemo(() => getTextsForLanguage(settings.language), [settings.language])

	useEffect(() => {
		setSettings(loadSettings())
	}, [])

	const updateSettings = (partial: Partial<GameSettings>) => {
		setSettings((prev) => ({ ...prev, ...partial }))
	}

	const handleSave = () => {
		saveSettings(settings)
	}

	const handlePlay = () => {
		saveSettings(settings)
		router.push('/lobby?mode=solo')
	}

	return (
		<div
			className="min-h-screen text-white flex flex-col items-center justify-center p-4"
			style={{
				backgroundImage: `url(${bg.src})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
			}}
		>
			<div className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl shadow-2xl w-full max-w-2xl border border-white/20">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-black text-gray-700">{texts.settings.title}</h1>
					<p className="text-gray-500 mt-2">{texts.settings.subtitle}</p>
				</div>

				<div className="flex flex-col gap-6">
					<Input
						label={texts.settings.playerNameLabel}
						value={settings.playerName}
						onChange={(event) => updateSettings({ playerName: event.target.value })}
						placeholder={texts.game.defaultPlayerName}
					/>
					<Input
						label={texts.settings.nicknameLabel}
						value={settings.nickname}
						onChange={(event) => updateSettings({ nickname: event.target.value })}
						placeholder={texts.settings.nicknamePlaceholder}
					/>

					<fieldset className="flex flex-col gap-3">
						<legend className="text-sm font-bold text-gray-300">
							{texts.settings.difficultyLabel}
						</legend>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{difficultyOptions.map((difficulty) => (
								<label
									key={difficulty}
									className={`cursor-pointer rounded-2xl border p-4 transition-all ${
										settings.difficulty === difficulty
											? 'border-yellow-400 bg-white/20'
											: 'border-white/20 bg-white/5 hover:bg-white/10'
									}`}
								>
									<div className="flex items-start gap-3">
										<input
											type="radio"
											name="difficulty"
											value={difficulty}
											checked={settings.difficulty === difficulty}
											onChange={() => updateSettings({ difficulty })}
											className="mt-1"
										/>
										<div>
											<div className="text-lg font-bold text-white">{difficulty}</div>
											<p className="text-sm text-white/70">
												{texts.settings.difficultyDescriptions[difficulty]}
											</p>
										</div>
									</div>
								</label>
							))}
						</div>
					</fieldset>

					<fieldset className="flex flex-col gap-3">
						<legend className="text-sm font-bold text-gray-300">
							{texts.settings.languageLabel}
						</legend>
						<div className="grid grid-cols-2 gap-3">
							{languageOptions.map((language) => (
								<label
									key={language}
									className={`cursor-pointer rounded-2xl border p-4 text-center font-bold transition-all ${
										settings.language === language
											? 'border-yellow-400 bg-white/20'
											: 'border-white/20 bg-white/5 hover:bg-white/10'
									}`}
								>
									<input
										type="radio"
										name="language"
										value={language}
										checked={settings.language === language}
										onChange={() => updateSettings({ language })}
										className="sr-only"
									/>
									{language === 'es'
										? texts.settings.languageOptions.es
										: texts.settings.languageOptions.en}
								</label>
							))}
						</div>
					</fieldset>

					<div className="flex flex-col md:flex-row gap-3">
						<Button variant="secondary" size="lg" onClick={handleSave}>
							{texts.common.save}
						</Button>
						<Button size="lg" onClick={handlePlay}>
							{texts.common.play}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
