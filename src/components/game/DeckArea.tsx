import { Card } from '../Card';
import { canPlayAny, PublicState, Card as CardType } from '../../engine';
import { text } from '../../content/texts';

interface DeckAreaProps {
  isMyTurn: boolean;
  pendingDraw: number;
  myHand: CardType[];
  state: PublicState;
  onDraw: () => void;
}

export function DeckArea({ isMyTurn, pendingDraw, myHand, state, onDraw }: DeckAreaProps) {
  const showDrawStack = isMyTurn && pendingDraw > 0;
  const showDrawOne = isMyTurn && pendingDraw === 0 && !canPlayAny(myHand, state);

  return (
    <div className="relative group">
      <Card
        hidden
        card={{} as any}
        onClick={onDraw}
        className="w-16 h-24 md:w-24 md:h-36 cursor-pointer shadow-2xl transform transition-transform group-hover:scale-[1.04] group-active:scale-[0.98]"
      />
      <div className="absolute top-1 left-1 -z-10 w-full h-full bg-black/35 rounded-xl" />

      {showDrawStack && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 w-max bg-red-600 text-white font-black text-xs md:text-sm rounded-full px-4 py-1.5 shadow-lg ring-2 ring-white/80 animate-bounce z-50">
          {text.game.drawStack(pendingDraw)}
        </div>
      )}

      {showDrawOne && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max flex flex-col items-center gap-1 z-50">
          <div className="bg-yellow-500 text-black font-black text-xs md:text-sm rounded-full px-4 py-1.5 shadow-lg ring-2 ring-white animate-bounce">
            {text.game.drawOne}
          </div>
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-yellow-500" />
        </div>
      )}
    </div>
  );
}
