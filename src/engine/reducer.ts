import { v4 as uuidv4 } from 'uuid';
import {
  GameState, PublicState, InternalState, Player, Card, GamePhase, CardKind, CardColor, RoundEndReason
} from './types';
import { ActionType, GameAction } from './actions';
import { createDeck, shuffle } from './utils';
import { INITIAL_HAND_SIZE } from './constants';
import { getNextPlayerIndex, isValidMove, evaluateCardEffect } from './logic';

function createInitialState(playerIds: string[], playerNames: string[]): GameState {
  const deck = createDeck();
  const players: Record<string, Player> = {};
  const playerOrder = [...playerIds]; // Determine order (random or fixed) - taking as is

  const internal: InternalState = {
    deck,
    discard: [],
  };

  // Setup players
  playerIds.forEach((id, idx) => {
    players[id] = {
      id,
      name: playerNames[idx],
      connected: true,
      hand: [],
      cardCount: 0,
    };
  });

  const publicState: PublicState = {
    roomId: 'local',
    hostId: playerIds[0],
    players: Object.values(players).map(p => ({ ...p, hand: undefined })),
    order: playerOrder,
    dealerIndex: 0,
    currentPlayerIndex: 0,
    direction: 1,
    topCard: null,
    currentColor: null,
    pendingDraw: 0,
    phase: GamePhase.LOBBY,
    version: 1,
    stateVersion: 1
  };

  return {
    public: publicState,
    internal,
    players,
  };
}

// Helper: Draw N cards
function drawCards(state: GameState, playerId: string, count: number) {
  const player = state.players[playerId];
  if (!player) return;

  for (let i = 0; i < count; i++) {
    if (state.internal.deck.length === 0) {
      if (state.internal.discard.length > 0) {
        // Recycle discard
        const top = state.internal.discard.pop(); // Keep top card? Actually logic usually keeps top card on table.
        // Spec 13: "Reposición de mazo si se agota (reciclar discard excepto topCard)."
        // In my state, 'topCard' is in publicState, 'discard' is the pile below it.
        // So I can shuffle the whole discard pile.
        state.internal.deck = shuffle([...state.internal.discard]);
        state.internal.discard = [];
      } else {
        // No cards left at all
        break;
      }
    }
    const card = state.internal.deck.pop();
    if (card) {
      player.hand.push(card);
    }
  }
}

// Helper: Advance Turn
function advanceTurn(state: GameState) {
  const { public: pub } = state;
  let nextIndex = getNextPlayerIndex(pub.currentPlayerIndex, pub.order.length, pub.direction);

  // Skip connected check loop (simple version, assuming logic handles skips elsewhere or we loop here)
  // Spec 9.1: "Si jugador actual está desconectado: avanzar al siguiente conectado."
  let loopCount = 0;
  while (!state.players[pub.order[nextIndex]].connected && loopCount < pub.order.length) {
    nextIndex = getNextPlayerIndex(nextIndex, pub.order.length, pub.direction);
    loopCount++;
  }

  // If everyone disconnected, game might end (handled in disconnect, but here assume at least 1)

  pub.currentPlayerIndex = nextIndex;
}

// Helper: Internal Play Card Logic (Used by PLAY_CARD and Auto-Play)
function applyPlayCard(state: GameState, playerId: string, cardIndex: number) {
  const player = state.players[playerId];
  const card = player.hand[cardIndex];

  // Remove from hand
  player.hand.splice(cardIndex, 1);

  // Add previous topCard to discard (if exists)
  if (state.public.topCard) {
    state.internal.discard.push(state.public.topCard);
  }

  // Update Top Card
  state.public.topCard = card;
  state.public.currentColor = card.color; // Might be WILD initially, requires choice

  // Check Win Condition
  if (player.hand.length === 0) {
    state.public.phase = GamePhase.ROUND_END;
    state.public.winnerId = playerId;
    state.public.roundEndReason = RoundEndReason.PLAYER_EMPTY_HAND;
    return;
  }

  const effect = evaluateCardEffect(
    card,
    state.public.pendingDraw,
    state.public.direction,
    state.public.order.length
  );

  state.public.pendingDraw = effect.pendingDraw;
  state.public.direction = effect.direction;

  if (effect.requiresColorChoice) {
    state.public.phase = GamePhase.CHOOSE_COLOR_REQUIRED;
    // Do NOT advance turn yet
  } else {
    // Apply Skip
    if (effect.skipNext) {
      // Advance once to skip
      advanceTurn(state);
    }
    // Advance to next player
    advanceTurn(state);
  }
}


export function gameReducer(state: GameState, action: GameAction): GameState {
  // Deep clone state to avoid mutations (naive clone for simple object)
  // In prod, use immer or structuredClone.
  const nextState = JSON.parse(JSON.stringify(state)) as GameState; // Simple/safe for this data structure

  // Increment version
  nextState.public.stateVersion++;

  switch (action.type) {
    case ActionType.START_GAME: {
      // Only valid if LOBBY or ROUND_END
      // Simplification: just reset everything
      // Deal 7 cards
      nextState.public.phase = GamePhase.TURN;
      nextState.public.pendingDraw = 0;
      nextState.public.direction = 1;
      nextState.public.topCard = null;

      // Re-shuffle deck
      nextState.internal.deck = createDeck();
      nextState.internal.discard = [];

      nextState.public.order.forEach(pid => {
        nextState.players[pid].hand = [];
        drawCards(nextState, pid, INITIAL_HAND_SIZE);
      });

      // Flip top card
      const top = nextState.internal.deck.pop();
      if (top) {
        nextState.public.topCard = top;

        // Apply Initial Card Effect (Spec 4.3)
        // Simplified: Just set color/number. 
        // If Wild, first player chooses? logic says: "El primer jugador elige el color."
        // Implementation: If Wild/+4, Phase -> CHOOSE_COLOR_REQUIRED for first player?
        // Spec 4.3: "Si es Wild: Se requiere elección de color inicial (el primer jugador)."
        // "Si es +4: ... El primer jugador elige el color."

        if (top.kind === CardKind.WILD || top.kind === CardKind.WILD_DRAW_FOUR) {
          nextState.public.phase = GamePhase.CHOOSE_COLOR_REQUIRED;
          // Current player is dealer + 1 (already 0 if dealer is last)
          // Assume idx 0 starts.
          nextState.public.currentPlayerIndex = 0; // Explicitly
          nextState.public.currentColor = null; // Waiting choice
        } else {
          nextState.public.currentColor = top.color;
          // Apply effects (Skip, Reverse, Draw2)
          // Spec 4.3 details:
          // Skip: First player loses turn.
          // Reverse: Change direction. (If 2 players, acts as skip).
          // +2: pendingDraw = 2.

          const effect = evaluateCardEffect(top, 0, 1, nextState.public.order.length);
          nextState.public.pendingDraw = effect.pendingDraw;
          nextState.public.direction = effect.direction;

          if (effect.skipNext) {
            advanceTurn(nextState); // Skip the first player
          }
        }
      }
      return nextState;
    }

    case ActionType.PLAY_CARD: {
      if (nextState.public.phase !== GamePhase.TURN) return state; // Invalid phase
      if (nextState.public.order[nextState.public.currentPlayerIndex] !== action.playerId) return state; // Not turn

      const player = nextState.players[action.playerId];
      const cardIndex = player.hand.findIndex(c => c.id === action.cardId);
      if (cardIndex === -1) return state; // Card not in hand

      const card = player.hand[cardIndex];

      // Validate Move
      if (!isValidMove(card, nextState.public, player.hand)) {
        return state;
      }

      applyPlayCard(nextState, action.playerId, cardIndex);
      return nextState;
    }

    case ActionType.CHOOSE_COLOR: {
      if (nextState.public.phase !== GamePhase.CHOOSE_COLOR_REQUIRED) return state;
      // Check if it's the right player (current player)
      // Note: For initial card (Wild), current player is indeed the one who must choose.
      if (nextState.public.order[nextState.public.currentPlayerIndex] !== action.playerId) return state;

      nextState.public.currentColor = action.color;
      nextState.public.phase = GamePhase.TURN;

      // If the card was a +4 (pendingDraw > 0), we don't skip/advance here?
      // Wait, applyPlayCard stops at CHOOSE_COLOR_REQUIRED.
      // After choosing, we must complete the "End of Turn" logic.
      // Which is: Skip if applicable (Wild doesn't skip), Advance.

      // However, we lost the context of "was it a skip card?"
      // Actually Wilds are never Skips.
      // Actions are never Wilds (except Wild Draw 4).

      // If it was Wild Draw 4: pendingDraw is already updated in applyPlayCard.
      // Card is already on top.
      // So just advance.

      advanceTurn(nextState);
      return nextState;
    }

    case ActionType.DRAW_CARD: {
      if (nextState.public.phase !== GamePhase.TURN) return state;
      if (nextState.public.order[nextState.public.currentPlayerIndex] !== action.playerId) return state;

      const { pendingDraw } = nextState.public;

      if (pendingDraw > 0) {
        // Must draw pending
        drawCards(nextState, action.playerId, pendingDraw);
        nextState.public.pendingDraw = 0;
        advanceTurn(nextState);
      } else {
        // Draw 1
        const oldHandSize = nextState.players[action.playerId].hand.length;
        drawCards(nextState, action.playerId, 1);
        const newHandSize = nextState.players[action.playerId].hand.length;

        if (newHandSize > oldHandSize) {
          const drawnCard = nextState.players[action.playerId].hand[newHandSize - 1];
          // Check Auto Play
          if (isValidMove(drawnCard, nextState.public, nextState.players[action.playerId].hand)) {
            // Auto Play!
            applyPlayCard(nextState, action.playerId, newHandSize - 1);
          } else {
            // Pass
            advanceTurn(nextState);
          }
        }
      }
      return nextState;
    }

    case ActionType.PLAYER_JOIN: {
      if (nextState.public.phase !== GamePhase.LOBBY) return state;
      // Add player loop...
      // Simplified for now
      return nextState;
    }

    default:
      return state;
  }
}

export { createInitialState };
