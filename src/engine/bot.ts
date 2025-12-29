import { GameState, Card, CardKind, CardColor, GamePhase } from './types';
import { GameAction, ActionType } from './actions';
import { isValidMove } from './logic';

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 3000;

export function calculateBotDelay(cardCount: number) {
  const clamped = Math.max(1, Math.min(cardCount, 10));
  const ratio = (clamped - 1) / 9;
  return Math.round(MIN_DELAY_MS + ratio * (MAX_DELAY_MS - MIN_DELAY_MS));
}

// Helper: Count colors in hand
export function getMostAbundantColor(hand: Card[]): CardColor { // Exported for testing/logic re-use if needed
  const counts: Record<string, number> = {
    [CardColor.RED]: 0,
    [CardColor.GREEN]: 0,
    [CardColor.BLUE]: 0,
    [CardColor.YELLOW]: 0,
  };

  for (const card of hand) {
    if (card.color && card.color !== CardColor.WILD) {
      counts[card.color]++;
    }
  }

  // Sort by count desc, then by fixed order for determinism (Red > Green > Blue > Yellow)
  const sortedColors = [CardColor.RED, CardColor.GREEN, CardColor.BLUE, CardColor.YELLOW].sort((a, b) => {
    if (counts[b] !== counts[a]) {
      return counts[b] - counts[a];
    }
    return 0; // Keep original priority if tie
  });

  return sortedColors[0];
}

export function calculateBotMove(state: GameState, botId: string): GameAction | null {
  const { public: pub, players } = state;
  const botPlayer = players[botId];

  // 1. Basic Validation: Is it my turn?
  if (pub.order[pub.currentPlayerIndex] !== botId) return null;

  // 2. Handle Color Choice (Wild played previously or by bot)
  if (pub.phase === GamePhase.CHOOSE_COLOR_REQUIRED) {
    // Choose most abundant color
    const color = getMostAbundantColor(botPlayer.hand);
    return {
      type: ActionType.CHOOSE_COLOR,
      playerId: botId,
      color
    };
  }

  if (pub.phase !== GamePhase.TURN) return null;

  const hand = botPlayer.hand;
  const { pendingDraw } = pub;

  // 3. Pending Draw Logic (Stacking)
  if (pendingDraw > 0) {
    // Find cards that can stack
    const stackingCards = hand.filter(c => isValidMove(c, pub, hand));

    if (stackingCards.length > 0) {
      // Prioritize:
      // 1. +2 over +4 (Validation already filters valid stacks, so we just pick preference)
      // Spec 10.1: Preferir +2 antes que +4

      const drawTwo = stackingCards.find(c => c.kind === CardKind.DRAW_TWO);
      if (drawTwo) {
        return { type: ActionType.PLAY_CARD, playerId: botId, cardId: drawTwo.id };
      }

      const wildDrawFour = stackingCards.find(c => c.kind === CardKind.WILD_DRAW_FOUR);
      if (wildDrawFour) {
        return { type: ActionType.PLAY_CARD, playerId: botId, cardId: wildDrawFour.id };
      }
    }

    // Cannot stack -> Must Draw
    return { type: ActionType.DRAW_CARD, playerId: botId };
  }

  // 4. Normal Turn Logic
  const validMoves = hand.filter(c => isValidMove(c, pub, hand));

  if (validMoves.length === 0) {
    return { type: ActionType.DRAW_CARD, playerId: botId };
  }

  // Heuristics (Spec 10.1)
  // 1) Jugar carta que reduzca su mano en el color más abundante
  // 2) Preferir acciones (Skip/Reverse) si el oponente tiene pocas cartas (TODO: check opponent hand size)
  // 3) Conservar Wild/+4 si hay otra jugable

  const bestColor = getMostAbundantColor(hand);

  // Check next player hand size for aggression
  // (Simplified: if anyone has <= 2 cards, be aggressive?)
  // Or specifically next player.
  // Spec says: "si el oponente tiene pocas cartas". Assuming "next player".
  // ... logic to find next player ...
  // let nextIndex = (pub.currentPlayerIndex + pub.direction + pub.order.length) % pub.order.length;
  // const nextPlayerId = pub.order[nextIndex];
  // const nextPlayerCount = pub.players.find(p => p.id === nextPlayerId)?.cardCount || 0;
  // const beAggressive = nextPlayerCount <= 3;

  // To sort logic:
  // Create a scoring function ?

  const scoredMoves = validMoves.map(card => {
    let score = 0;

    // Priority 1: Actions (Skip/Reverse/Draw2) -- but wait, spec says "Preferir acciones... SI oponente tiene pocas cartas"
    // Let's assume generic "good play" for now if not strictly aggressive.

    // Determine "Color Match" score
    if (card.color === bestColor) {
      score += 10;
    }

    // Demote Wilds (Store Wilds for last)
    if (card.kind === CardKind.WILD || card.kind === CardKind.WILD_DRAW_FOUR) {
      score -= 100;
    }

    // Promote Actions (Skip/Reverse) slightly?
    if (card.kind === CardKind.SKIP || card.kind === CardKind.REVERSE || card.kind === CardKind.DRAW_TWO) {
      score += 5;
    }

    return { card, score };
  });

  // Sort descending
  scoredMoves.sort((a, b) => b.score - a.score);

  return {
    type: ActionType.PLAY_CARD,
    playerId: botId,
    cardId: scoredMoves[0].card.id
  };
}
