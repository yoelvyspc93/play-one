import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../Card';
import { PublicState } from '../../engine';
import { text } from '../../content/texts';

interface DiscardPileProps {
  state: PublicState;
}

export function DiscardPile({ state }: DiscardPileProps) {
  return (
    <AnimatePresence mode="popLayout">
      <div className="relative">
        {state.topCard ? (
          <motion.div
            key={state.topCard.id}
            initial={{ scale: 1.2, opacity: 0, rotate: state.direction * 35, y: -40 }}
            animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="relative z-10"
          >
            <Card
              card={state.topCard}
              activeColor={state.currentColor}
              className="w-16 h-24 md:w-24 md:h-36 shadow-2xl"
            />
          </motion.div>
        ) : (
          <div className="w-16 h-24 md:w-24 md:h-36 border-4 border-dashed border-white/20 rounded-xl flex items-center justify-center text-white/20 font-black">
            {text.game.start}
          </div>
        )}

        <div className="absolute -bottom-4 inset-x-4 h-4 bg-black/25 blur-xl rounded-full" />
      </div>
    </AnimatePresence>
  );
}
