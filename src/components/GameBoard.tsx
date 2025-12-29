'use client';

import { PublicState, Card as CardType } from '../engine';
import { GameBoardContent } from './game/GameBoardContent';

interface GameBoardProps {
  state: PublicState;
  myHand: CardType[];
  onAction: (action: any) => void;
  isMyTurn: boolean;
  myId: string;
}

export function GameBoard({ state, myHand, onAction, isMyTurn, myId }: GameBoardProps) {
  return (
    <div className="relative w-full h-[100dvh] bg-[#065f46] overflow-hidden font-sans select-none">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.35)_0%,_transparent_55%)]" />
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_10%,_rgba(255,255,255,0.18)_0%,_transparent_40%)]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_20%,_rgba(0,0,0,0.35)_0%,_transparent_45%)]" />
      </div>

      <GameBoardContent
        state={state}
        myHand={myHand}
        onAction={onAction}
        isMyTurn={isMyTurn}
        myId={myId}
      />
    </div>
  );
}
