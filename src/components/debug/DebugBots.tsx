'use client';

import { useEffect, useReducer, useState } from 'react';
import {
  ActionType,
  Card,
  CardColor,
  calculateBotMove,
  createInitialState,
  gameReducer,
} from '../../engine';
import { calculateBotDelay } from '../../network/botDelay';
import { text } from '../../content/texts';

const DEFAULT_PLAYERS = ['player1', 'player2', 'player3'];
const DEFAULT_NAMES = text.debug.defaultPlayers;
const DEFAULT_BOTS = {
  player2: true,
  player3: true,
};

export function DebugBots() {
  const [botEnabled, setBotEnabled] = useState<Record<string, boolean>>(DEFAULT_BOTS);

  const [state, dispatch] = useReducer(gameReducer, null, () =>
    createInitialState(DEFAULT_PLAYERS, DEFAULT_NAMES)
  );

  useEffect(() => {
    if (state.public.phase === 'LOBBY') {
      dispatch({ type: ActionType.START_GAME });
    }
  }, [state.public.phase]);

  useEffect(() => {
    const currentPlayerId = state.public.order[state.public.currentPlayerIndex];

    if (botEnabled[currentPlayerId] && state.public.winnerId === undefined) {
      const delay = calculateBotDelay(state.players[currentPlayerId]?.hand.length ?? 1);
      const timer = setTimeout(() => {
        const action = calculateBotMove(state, currentPlayerId);
        if (action) {
          dispatch(action);
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [state.public.stateVersion, state.public.phase, botEnabled, state]);

  const currentPlayerId = state.public.order[state.public.currentPlayerIndex];
  const currentPlayer = state.players[currentPlayerId];

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>{text.debug.title}</h1>

      <div style={{ marginBottom: 10 }}>
        <label>
          <input
            type="checkbox"
            checked={botEnabled['player2']}
            onChange={(e) => setBotEnabled((p) => ({ ...p, player2: e.target.checked }))}
          />
          {text.debug.enableBot(text.debug.botNames[0])}
        </label>
        <label style={{ marginLeft: 10 }}>
          <input
            type="checkbox"
            checked={botEnabled['player3']}
            onChange={(e) => setBotEnabled((p) => ({ ...p, player3: e.target.checked }))}
          />
          {text.debug.enableBot(text.debug.botNames[1])}
        </label>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1, border: '1px solid #ccc', padding: 10 }}>
          <h2>{text.debug.publicState}</h2>
          <pre>
            {JSON.stringify(
              state.public,
              (key, value) => {
                if (key === 'players') return value.map((p: any) => ({ ...p, hand: 'HIDDEN' }));
                return value;
              },
              2
            )}
          </pre>
        </div>

        <div style={{ flex: 1, border: '1px solid #ccc', padding: 10 }}>
          <h2>{text.debug.controls(currentPlayer.name)}</h2>
          <p>
            {text.debug.pendingDraw}: {state.public.pendingDraw}
          </p>
          <p>
            {text.debug.topCard}: {state.public.topCard?.kind} {state.public.topCard?.color}{' '}
            {state.public.topCard?.number}
          </p>
          <p>
            {text.debug.currentColor}: {state.public.currentColor}
          </p>

          <h3>{text.debug.hand(currentPlayer.hand.length)}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {currentPlayer.hand.map((card: Card) => (
              <button
                key={card.id}
                disabled={botEnabled[currentPlayer.id]}
                onClick={() =>
                  dispatch({
                    type: ActionType.PLAY_CARD,
                    playerId: currentPlayer.id,
                    cardId: card.id,
                  })
                }
                style={{
                  padding: 5,
                  border: '1px solid black',
                  background:
                    card.color === CardColor.RED
                      ? '#ffcccc'
                      : card.color === CardColor.BLUE
                        ? '#ccccff'
                        : card.color === CardColor.GREEN
                          ? '#ccffcc'
                          : card.color === CardColor.YELLOW
                            ? '#ffffcc'
                            : '#eee',
                }}
              >
                {card.kind} {card.number} {card.color === CardColor.WILD ? '🌈' : ''}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              disabled={botEnabled[currentPlayer.id]}
              onClick={() => dispatch({ type: ActionType.DRAW_CARD, playerId: currentPlayer.id })}
            >
              {text.debug.drawCard}
            </button>
          </div>

          {state.public.phase === 'CHOOSE_COLOR_REQUIRED' && (
            <div style={{ marginTop: 20, border: '1px solid red', padding: 10 }}>
              <h3>{text.debug.chooseColor}</h3>
              {['RED', 'GREEN', 'BLUE', 'YELLOW'].map((color) => (
                <button
                  key={color}
                  disabled={botEnabled[currentPlayer.id]}
                  onClick={() =>
                    dispatch({
                      type: ActionType.CHOOSE_COLOR,
                      playerId: currentPlayer.id,
                      color: color as CardColor,
                    })
                  }
                >
                  {color}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <button onClick={() => dispatch({ type: ActionType.START_GAME })}>
              {text.debug.restartGame}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
