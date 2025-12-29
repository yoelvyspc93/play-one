import type { ReactNode } from 'react';
import { Card as CardType, PublicState } from '../../engine';
import { Opponent } from '../Opponent';
import { DeckArea } from './DeckArea';
import { DiscardPile } from './DiscardPile';

interface TableLayoutProps {
  state: PublicState;
  isMyTurn: boolean;
  myId: string;
  onDraw: () => void;
  myHand: CardType[];
  children: ReactNode;
}

function getPlayerAtRel(state: PublicState, myId: string, rel: number) {
  const totalPlayers = state.order.length;
  if (totalPlayers <= rel) return null;
  const myIndex = state.order.indexOf(myId);
  const targetIndex = (myIndex + rel) % totalPlayers;
  const targetId = state.order[targetIndex];
  return state.players.find((p) => p.id === targetId) || null;
}

function getPlayersAtPositions(state: PublicState, myId: string) {
  const totalPlayers = state.order.length;
  const playersAtPos: (any | null)[] = [null, null, null, null];
  playersAtPos[0] = getPlayerAtRel(state, myId, 0);

  if (totalPlayers === 2) {
    playersAtPos[2] = getPlayerAtRel(state, myId, 1);
  } else if (totalPlayers === 3) {
    playersAtPos[1] = getPlayerAtRel(state, myId, 1);
    playersAtPos[3] = getPlayerAtRel(state, myId, 2);
  } else if (totalPlayers >= 4) {
    playersAtPos[1] = getPlayerAtRel(state, myId, 1);
    playersAtPos[2] = getPlayerAtRel(state, myId, 2);
    playersAtPos[3] = getPlayerAtRel(state, myId, 3);
  }

  return playersAtPos;
}

export function TableLayout({ state, isMyTurn, myId, onDraw, myHand, children }: TableLayoutProps) {
  const playersAtPos = getPlayersAtPositions(state, myId);
  const currentPlayerId = state.order[state.currentPlayerIndex];

  return (
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
          <div className="relative flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-12">
            <DeckArea
              isMyTurn={isMyTurn}
              pendingDraw={state.pendingDraw}
              myHand={myHand}
              state={state}
              onDraw={onDraw}
            />
            <DiscardPile state={state} />
          </div>
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

        <div className="row-start-3 col-start-1 col-span-3">{children}</div>
      </div>
    </div>
  );
}
