'use client';

import { motion } from 'framer-motion';
import { TEXTS } from '../engine/texts';

interface ColorChooserProps {
  onSelect: (color: any) => void;
}

const colorOptions = [
  { name: 'RED', color: 'bg-red-500', label: TEXTS.game.colors.red },
  { name: 'GREEN', color: 'bg-green-500', label: TEXTS.game.colors.green },
  { name: 'BLUE', color: 'bg-blue-500', label: TEXTS.game.colors.blue },
  { name: 'YELLOW', color: 'bg-yellow-400', label: TEXTS.game.colors.yellow },
];

export function ColorChooser({ onSelect }: ColorChooserProps) {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="bg-white/90 p-7 md:p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center border-4 border-white"
      >
        <h2 className="text-2xl md:text-3xl font-black mb-5 md:mb-6 text-black tracking-tight uppercase">
          {TEXTS.game.chooseColor}
        </h2>

        <div className="grid grid-cols-2 gap-5 md:gap-6">
          {[
            { name: 'RED', color: 'bg-red-500', label: TEXTS.game.colors.red },
            { name: 'GREEN', color: 'bg-green-500', label: TEXTS.game.colors.green },
            { name: 'BLUE', color: 'bg-blue-500', label: TEXTS.game.colors.blue },
            { name: 'YELLOW', color: 'bg-yellow-400', label: TEXTS.game.colors.yellow },
          ].map((c) => (
            <button
              key={c.name}
              onClick={() => onSelect(c.name)}
              className={`w-24 h-24 md:w-28 md:h-28 rounded-[2rem] shadow-xl ring-4 ring-transparent hover:ring-white transition-all hover:scale-110 active:scale-95 flex items-center justify-center text-[10px] font-bold text-white/50 hover:text-white ${c.color}`}
            >
              {c.label}
            </button>
          ))}
        </div>

      </motion.div>
    </div>
  );
}
