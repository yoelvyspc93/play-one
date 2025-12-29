'use client';

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Card } from './Card';
import { Avatar } from './Avatar';

export function Opponent({
  player,
  active,
  position,
}: {
  player: any;
  active: boolean;
  position: 'top' | 'left' | 'right';
}) {
  const count = Math.max(0, Number(player?.cardCount ?? 0));
  const name = String(player?.name ?? 'Player');

  const maxRender = 10;
  const n = Math.min(count, maxRender);

  const isTop = position === 'top';
  const isLeft = position === 'left';
  const isRight = position === 'right';

  const spread = isTop ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 18 : 28) : 
                 (typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 16);
  const rotStep = isTop ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 15) : 
                  (typeof window !== 'undefined' && window.innerWidth < 768 ? 8 : 10);
  const curve = isTop ? 4.0 : 2.5;

  const baseRotate = isLeft ? 90 : isRight ? -90 : 0;
  const origin = isTop ? 'bottom center' : isLeft ? 'center right' : 'center left';

  return (
    <div
      className={clsx(
        'relative flex items-center justify-center transition-all duration-300',
        active ? 'opacity-100' : 'opacity-95'
      )}
    >
      <Avatar 
        name={name} 
        showName
        count={count} 
        active={active} 
        className={clsx(
          "absolute flex flex-col items-center shrink-0 z-50",
          isTop ? "right-[calc(100%+15px)] md:right-[calc(100%+30px)] top-1/2 -translate-y-1/2" : 
          "top-[calc(100%+15px)] md:top-[calc(100%+25px)] left-1/2 -translate-x-1/2"
        )}
      />

      <div
        className={clsx(
          'relative flex items-center justify-center',
          isTop ? 'h-[100px] md:h-[140px] w-[180px] md:w-[320px]' : 
          'h-[200px] md:h-[320px] w-[100px] md:w-[140px]'
        )}
      >
        {Array.from({ length: n }).map((_, i) => {
          const mid = (n - 1) / 2;
          const t = i - mid;

          let x = 0;
          let y = 0;
          let rot = 0;

          if (isTop) {
            rot = t * rotStep;
            x = t * spread;
            y = Math.abs(t) * curve;
          } else if (isLeft) {
            rot = baseRotate + (t * rotStep);
            x = Math.abs(t) * curve;
            y = t * spread;
          } else if (isRight) {
            rot = baseRotate + (t * rotStep);
            x = -Math.abs(t) * curve;
            y = t * spread;
          }

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.16, delay: i * 0.012 }}
              className="absolute"
              style={{
                transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
                transformOrigin: origin,
                zIndex: i,
              }}
            >
              <Card
                hidden
                card={{} as any}
                className="w-10 h-14 md:w-16 md:h-24 border-2 border-white/90 shadow-2xl rounded-lg md:rounded-xl"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
