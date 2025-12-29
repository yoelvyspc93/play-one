'use client';

import { PublicState, Card as CardType, ActionType, canPlayAny } from '../engine';
import { Hand } from './Hand';
import { Opponent } from './Opponent';
import { ColorChooser } from './ColorChooser';
import { WinScreen } from './WinScreen';
import { DeckArea } from './DeckArea';
import { motion, AnimatePresence } from 'framer-motion';


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
  playersAtPos[0] = getPlayerAtRel(0); // Me

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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.35)_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_10%,_rgba(255,255,255,0.18)_0%,_transparent_40%)]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,_rgba(0,0,0,0.35)_0%,_transparent_45%)]" />
      </div>

      <div className="relative mx-auto h-full w-full max-w-[1200px] px-2 md:px-10">
        <div className="grid h-full grid-rows-[auto_1fr_auto] grid-cols-[60px_1fr_60px] md:grid-cols-[1fr_2fr_1fr] items-center">
          <div className="row-start-1 col-start-2 justify-self-center self-start pt-6 md:pt-10">
            {playersAtPos[2] && (
              <Opponent
                player={playersAtPos[2]}
                active={currentPlayerId === playersAtPos[2].id}
                position="top"
              />
            )}
          </div>

          <div className="row-start-2 col-start-1 justify-self-start self-center">
            {playersAtPos[3] && (
              <Opponent
                player={playersAtPos[3]}
                active={currentPlayerId === playersAtPos[3].id}
                position="left"
              />
            )}
          </div>

          <div className="row-start-2 col-start-2 justify-self-center self-center">
            <DeckArea
              topCard={state.topCard}
              currentColor={state.currentColor}
              pendingDraw={state.pendingDraw}
              isMyTurn={isMyTurn}
              canPlay={canPlayAny(myHand, state)}
              direction={state.direction}
              onDraw={() => onAction({ type: ActionType.DRAW_CARD, playerId: myId })}
            />
          </div>

          <div className="row-start-2 col-start-3 justify-self-end self-center">
            {playersAtPos[1] && (
              <Opponent
                player={playersAtPos[1]}
                active={currentPlayerId === playersAtPos[1].id}
                position="right"
              />
            )}
          </div>

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

      {isMyTurn && state.phase === 'CHOOSE_COLOR_REQUIRED' && (
        <ColorChooser onSelect={(color) => onAction({ type: ActionType.CHOOSE_COLOR, playerId: myId, color })} />
      )}

      {state.phase === 'ROUND_END' && (
        <WinScreen 
          winnerName={state.players.find((p) => p.id === state.winnerId)?.name || 'Unknown'} 
          onRestart={() => window.location.reload()} 
        />
      )}
    </div>
  );
}

