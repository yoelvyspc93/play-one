import { Card } from '../Card';
import { CardKind, CardColor } from '../../engine';

export function HomeHeroStack() {
  return (
    <div className="relative z-10 hidden md:block w-96 h-96">
      <div className="absolute top-0 left-0 transform -rotate-6 transition hover:rotate-0 z-10">
        <Card
          card={{ id: 'h1', kind: CardKind.WILD_DRAW_FOUR, color: CardColor.WILD }}
          className="scale-[2] shadow-2xl"
        />
      </div>
      <div className="absolute top-10 left-20 transform rotate-12 transition hover:rotate-6">
        <Card
          card={{ id: 'h2', kind: CardKind.DRAW_TWO, color: CardColor.GREEN }}
          className="scale-[2] shadow-2xl"
        />
      </div>
    </div>
  );
}
