'use client';

import { PublicState, Card as CardType, ActionType, canPlayAny } from '../engine';
import { Card } from './Card';
import { Hand } from './Hand';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface GameBoardProps {
  state: PublicState;
  myHand: CardType[];
  onAction: (action: any) => void;
  isMyTurn: boolean;
  myId: string;
}

export function GameBoard({ state, myHand, onAction, isMyTurn, myId }: GameBoardProps) {
  const totalPlayers = state.order.length;
  const myIndex = state.order.indexOf(myId);

  const getPlayerAtRel = (rel: number) => {
    if (totalPlayers <= rel) return null;
    const targetIndex = (myIndex + rel) % totalPlayers;
    const targetId = state.order[targetIndex];
    return state.players.find((p) => p.id === targetId) || null;
  };

  // positions: [me, right, top, left]
  const playersAtPos: (any | null)[] = [null, null, null, null];
  playersAtPos[0] = getPlayerAtRel(0); // Me (not rendered here)

  if (totalPlayers === 2) {
    playersAtPos[2] = getPlayerAtRel(1); // Top
  } else if (totalPlayers === 3) {
    playersAtPos[1] = getPlayerAtRel(1); // Right
    playersAtPos[3] = getPlayerAtRel(2); // Left
  } else if (totalPlayers >= 4) {
    playersAtPos[1] = getPlayerAtRel(1); // Right
    playersAtPos[2] = getPlayerAtRel(2); // Top
    playersAtPos[3] = getPlayerAtRel(3); // Left
  }

  const currentPlayerId = state.order[state.currentPlayerIndex];

  return (
    <div className="relative w-full h-[100dvh] bg-[#065f46] overflow-hidden font-sans select-none">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.35)_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_10%,_rgba(255,255,255,0.18)_0%,_transparent_40%)]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,_rgba(0,0,0,0.35)_0%,_transparent_45%)]" />
      </div>

      <div className="relative mx-auto h-full w-full max-w-[1200px] px-2 md:px-10">
        {/* Layout grid */}
        <div className="grid h-full grid-rows-[auto_1fr_auto] grid-cols-[60px_1fr_60px] md:grid-cols-[1fr_2fr_1fr] items-center">
          {/* TOP */}
          <div className="row-start-1 col-start-2 justify-self-center self-start pt-6 md:pt-10">
            {playersAtPos[2] && (
              <Opponent
                player={playersAtPos[2]}
                active={currentPlayerId === playersAtPos[2].id}
                position="top"
              />
            )}
          </div>

          {/* LEFT */}
          <div className="row-start-2 col-start-1 justify-self-start self-center">
            {playersAtPos[3] && (
              <Opponent
                player={playersAtPos[3]}
                active={currentPlayerId === playersAtPos[3].id}
                position="left"
              />
            )}
          </div>

          {/* CENTER TABLE */}
          <div className="row-start-2 col-start-2 justify-self-center self-center">
            <div className="relative flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12">
              {/* Deck */}
              <div className="relative group">
                <Card
                  hidden
                  card={{} as any}
                  onClick={() => {
                    if (isMyTurn) onAction({ type: ActionType.DRAW_CARD, playerId: myId });
                  }}
                  className="w-16 h-24 md:w-24 md:h-36 cursor-pointer shadow-2xl transform transition-transform group-hover:scale-[1.04] group-active:scale-[0.98]"
                />
                <div className="absolute top-1 left-1 -z-10 w-full h-full bg-black/35 rounded-xl" />

                {isMyTurn && (
                  state.pendingDraw > 0 ? (
                    <div className="absolute -top-9 left-1/2 -translate-x-1/2 w-max bg-red-600 text-white font-black text-xs md:text-sm rounded-full px-4 py-1.5 shadow-lg ring-2 ring-white/80 animate-bounce z-50">
                      DRAW {state.pendingDraw}!
                    </div>
                  ) : !canPlayAny(myHand, state) ? (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max flex flex-col items-center gap-1 z-50">
                        <div className="bg-yellow-500 text-black font-black text-xs md:text-sm rounded-full px-4 py-1.5 shadow-lg ring-2 ring-white animate-bounce">
                          DRAW 1
                        </div>
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-yellow-500"></div>
                    </div>
                  ) : null
                )}
              </div>

              {/* Discard */}
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
                      START
                    </div>
                  )}

                  <div className="absolute -bottom-4 inset-x-4 h-4 bg-black/25 blur-xl rounded-full" />
                </div>
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT */}
          <div className="row-start-2 col-start-3 justify-self-end self-center">
            {playersAtPos[1] && (
              <Opponent
                player={playersAtPos[1]}
                active={currentPlayerId === playersAtPos[1].id}
                position="right"
              />
            )}
          </div>

          {/* MY HAND */}
          <div className="row-start-3 col-start-1 col-span-3 justify-self-center w-full pb-[calc(env(safe-area-inset-bottom)+14px)] md:pb-[calc(env(safe-area-inset-bottom)+28px)]">
            <div className="flex items-center justify-center">
              <Hand
                cards={myHand}
                state={state}
                active={isMyTurn && state.phase === 'TURN'}
                onPlay={(card) =>
                  onAction({ type: ActionType.PLAY_CARD, playerId: myId, cardId: card.id })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Color chooser */}
      {isMyTurn && state.phase === 'CHOOSE_COLOR_REQUIRED' && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="bg-white/90 p-7 md:p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center border-4 border-white"
          >
            <h2 className="text-2xl md:text-3xl font-black mb-5 md:mb-6 text-black tracking-tight uppercase">
              Choose Next Color
            </h2>
            <div className="grid grid-cols-2 gap-5 md:gap-6">
              {[
                { name: 'RED', color: 'bg-red-500' },
                { name: 'GREEN', color: 'bg-green-500' },
                { name: 'BLUE', color: 'bg-blue-500' },
                { name: 'YELLOW', color: 'bg-yellow-400' },
              ].map((c) => (
                <button
                  key={c.name}
                  onClick={() =>
                    onAction({ type: ActionType.CHOOSE_COLOR, playerId: myId, color: c.name as any })
                  }
                  className={`w-24 h-24 md:w-28 md:h-28 rounded-[2rem] shadow-xl ring-4 ring-transparent hover:ring-white transition-all hover:scale-110 active:scale-95 ${c.color}`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Winner */}
      {state.phase === 'ROUND_END' && (
        <div className="absolute inset-0 z-[110] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="bg-white p-1 rounded-[3rem] shadow-[0_0_100px_rgba(255,215,0,0.4)]"
          >
            <div className="bg-gradient-to-br from-yellow-300 via-orange-500 to-red-600 p-10 md:p-12 rounded-[2.9rem] text-center border-8 border-white">
              <div className="text-7xl md:text-8xl mb-6 filter drop-shadow-lg">🏆</div>
              <h1 className="text-5xl md:text-6xl font-black text-white mb-2 italic tracking-tighter drop-shadow-md">
                VICTORY!
              </h1>

              <div className="text-2xl md:text-3xl font-black text-black bg-white/90 rounded-2xl py-3 px-10 mb-9 md:mb-10 shadow-inner">
                {state.players.find((p) => p.id === state.winnerId)?.name || 'Unknown'}
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white text-orange-600 font-black text-xl md:text-2xl py-4 md:py-5 px-10 rounded-2xl shadow-2xl hover:scale-[1.03] hover:bg-gray-100 active:scale-[0.98] transition-all uppercase tracking-tight"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function Opponent({
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
  const initial = (name?.[0] ?? '?').toUpperCase();

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
      {/* AVATAR + BADGES - Positioned absolutely relative to the fan */}
      <div 
        className={clsx(
          "absolute flex flex-col items-center shrink-0 z-50",
          isTop ? "right-[calc(100%+15px)] md:right-[calc(100%+30px)] top-1/2 -translate-y-1/2" : 
          "top-[calc(100%+15px)] md:top-[calc(100%+25px)] left-1/2 -translate-x-1/2"
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
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-70"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 border-2 border-white"></span>
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
