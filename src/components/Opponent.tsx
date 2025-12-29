'use client';

import { clsx } from 'clsx';
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
        className="flex flex-col items-center shrink-0 z-50"
      />
    </div>
  );
}
