import { motion } from 'framer-motion';
import { CardColor } from '../../engine';
import { text } from '../../content/texts';

interface ColorChooserProps {
  isOpen: boolean;
  onChoose: (color: CardColor) => void;
}

const colorOptions = [
  { name: text.game.colors.red, color: 'bg-red-500', value: CardColor.RED },
  { name: text.game.colors.green, color: 'bg-green-500', value: CardColor.GREEN },
  { name: text.game.colors.blue, color: 'bg-blue-500', value: CardColor.BLUE },
  { name: text.game.colors.yellow, color: 'bg-yellow-400', value: CardColor.YELLOW },
];

export function ColorChooser({ isOpen, onChoose }: ColorChooserProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="bg-white/90 p-7 md:p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center border-4 border-white"
      >
        <h2 className="text-2xl md:text-3xl font-black mb-5 md:mb-6 text-black tracking-tight uppercase">
          {text.game.chooseColor}
        </h2>
        <div className="grid grid-cols-2 gap-5 md:gap-6">
          {colorOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => onChoose(option.value)}
              className={`w-24 h-24 md:w-28 md:h-28 rounded-[2rem] shadow-xl ring-4 ring-transparent hover:ring-white transition-all hover:scale-110 active:scale-95 ${option.color}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
