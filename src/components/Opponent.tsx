'use client';

import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Card } from './Card';
import { text } from '../content/texts';

interface OpponentProps {
  player: any;
  active: boolean;
  position: 'top' | 'left' | 'right';
}

export function Opponent({ player, active, position }: OpponentProps) {
  const count = Math.max(0, Number(player?.cardCount ?? 0));
  const name = String(player?.name ?? text.game.defaultPlayerName);
  const initial = (name?.[0] ?? '?').toUpperCase();

  const maxRender = 10;
  const n = Math.min(count, maxRender);

  const isTop = position === 'top';
  const isLeft = position === 'left';
  const isRight = position === 'right';

  const spread = isTop
    ? typeof window !== 'undefined' && window.innerWidth < 768
      ? 18
      : 28
    : typeof window !== 'undefined' && window.innerWidth < 768
      ? 12
      : 16;
  const rotStep = isTop
    ? typeof window !== 'undefined' && window.innerWidth < 768
      ? 12
      : 15
    : typeof window !== 'undefined' && window.innerWidth < 768
      ? 8
      : 10;
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
      <div
        className={clsx(
          'absolute flex flex-col items-center shrink-0 z-50',
          isTop
            ? 'right-[calc(100%+15px)] md:right-[calc(100%+30px)] top-1/2 -translate-y-1/2'
            : 'top-[calc(100%+15px)] md:top-[calc(100%+25px)] left-1/2 -translate-x-1/2'
        )}
      >
        <div className="relative">
          <div
            className={clsx(
              'w-12 h-12 md:w-16 md:h-16 rounded-full border-4 flex items-center justify-center',
              'bg-gray-700 text-white font-black text-lg md:text-xl shadow-2xl transition-all',
              active
                ? 'border-yellow-400 ring-4 ring-yellow-400/25 shadow-[0_0_22px_rgba(250,204,21,0.45)]'
                : 'border-white/35'
            )}
          >
            {initial}

            <div className="absolute -bottom-1 -right-1 bg-red-600 border-2 border-white text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
              {count}
            </div>

            {active && (
              <div className="absolute -top-1 -right-1">
                <span className="flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-70" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 border-2 border-white" />
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-1.5 md:mt-2 text-white font-black bg-black/45 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10 uppercase text-[9px] md:text-[10px] tracking-widest shadow-md whitespace-nowrap">
          {name}
        </div>
      </div>

      <div
        className={clsx(
          'relative flex items-center justify-center',
          isTop ? 'h-[100px] md:h-[140px] w-[180px] md:w-[320px]' : 'h-[200px] md:h-[320px] w-[100px] md:w-[140px]'
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
            rot = baseRotate + t * rotStep;
            x = Math.abs(t) * curve;
            y = t * spread;
          } else if (isRight) {
            rot = baseRotate + t * rotStep;
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
