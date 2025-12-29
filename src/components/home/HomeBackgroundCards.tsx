import { Card } from '../Card';
import { CardKind, CardColor } from '../../engine';

export function HomeBackgroundCards() {
  return (
    <div className="absolute inset-0 opacity-20 pointer-events-none">
      <div className="absolute top-1/4 left-1/4 transform -rotate-12">
        <Card
          card={{ id: '1', kind: CardKind.NUMBER, color: CardColor.RED, number: 1 }}
          className="scale-150"
        />
      </div>
      <div className="absolute bottom-1/4 right-1/4 transform rotate-12">
        <Card
          card={{ id: '2', kind: CardKind.NUMBER, color: CardColor.BLUE, number: 9 }}
          className="scale-150"
        />
      </div>
    </div>
  );
}
