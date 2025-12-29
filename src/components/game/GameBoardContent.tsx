import { ActionType, Card as CardType, PublicState } from '../../engine';
import { Hand } from '../Hand';
import { ColorChooser } from './ColorChooser';
import { TableLayout } from './TableLayout';
import { WinnerModal } from './WinnerModal';

interface GameBoardContentProps {
  state: PublicState;
  myHand: CardType[];
  onAction: (action: any) => void;
  isMyTurn: boolean;
  myId: string;
}

export function GameBoardContent({ state, myHand, onAction, isMyTurn, myId }: GameBoardContentProps) {
  return (
    <>
      <TableLayout
        state={state}
        isMyTurn={isMyTurn}
        myId={myId}
        myHand={myHand}
        onDraw={() => onAction({ type: ActionType.DRAW_CARD, playerId: myId })}
      >
        <div className="justify-self-center w-full pb-[calc(env(safe-area-inset-bottom)+14px)] md:pb-[calc(env(safe-area-inset-bottom)+28px)]">
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
      </TableLayout>

      <ColorChooser
        isOpen={isMyTurn && state.phase === 'CHOOSE_COLOR_REQUIRED'}
        onChoose={(color) =>
          onAction({ type: ActionType.CHOOSE_COLOR, playerId: myId, color })
        }
      />

      <WinnerModal state={state} onRestart={() => window.location.reload()} />
    </>
  );
}
