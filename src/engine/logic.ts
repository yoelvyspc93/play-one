import { GameState, Card, CardKind, PublicState, CardColor } from './types';

export function getNextPlayerIndex(
  currentIndex: number,
  numPlayers: number,
  direction: 1 | -1
): number {
  let next = (currentIndex + direction) % numPlayers;
  if (next < 0) next += numPlayers;
  return next;
}

export function isValidMove(
  card: Card,
  state: PublicState,
  hand: Card[] // Needed to validate if they must stack
): boolean {
  const { topCard, currentColor, pendingDraw } = state;

  // 1. Pending Draw Logic (Stacking rule)
  if (pendingDraw > 0) {
    // Must be +2 on +2
    if (topCard?.kind === CardKind.DRAW_TWO && card.kind === CardKind.DRAW_TWO) {
      return true;
    }
    // Must be +4 on +4
    if (topCard?.kind === CardKind.WILD_DRAW_FOUR && card.kind === CardKind.WILD_DRAW_FOUR) {
      return true;
    }
    // Cross-stacking:
    // +4 on +2 ? (Allowed)
    if (topCard?.kind === CardKind.DRAW_TWO && card.kind === CardKind.WILD_DRAW_FOUR) {
      return true;
    }
    // +2 on +4 ? (Allowed)
    if (topCard?.kind === CardKind.WILD_DRAW_FOUR && card.kind === CardKind.DRAW_TWO) {
      return true;
    }

    return false;
  }

  // 2. Wilds are always playable (if no pending draw)
  if (card.kind === CardKind.WILD || card.kind === CardKind.WILD_DRAW_FOUR) {
    return true;
  }

  // 3. Match color or match value/kind
  if (card.color === currentColor) {
    return true;
  }

  // Match Kind/Value
  // If topCard is null (start of game, should be handled but just in case)
  if (!topCard) return true;

  if (card.kind === topCard.kind) {
    // If generic match (Skip on Skip), ok
    // If Number, strictly match number? Spec says: "Coincide con el valor/acción".
    // Number cards have 'number' field.
    if (card.kind === CardKind.NUMBER) {
      return card.number === topCard.number;
    }
    return true; // Action matches Action
  }

  return false;
}

export function canPlayAny(hand: Card[], state: PublicState): boolean {
  return hand.some(c => isValidMove(c, state, hand));
}

// Logic for calculating new state fields after a card is played
export interface CardEffectResult {
  pendingDraw: number;
  direction: 1 | -1;
  skipNext: boolean;
  requiresColorChoice: boolean;
}

export function evaluateCardEffect(card: Card, currentPending: number, currentDirection: 1 | -1, playerCount: number): CardEffectResult {
  let pendingDraw = currentPending;
  let direction = currentDirection;
  let skipNext = false;
  let requiresColorChoice = false;

  switch (card.kind) {
    case CardKind.SKIP:
      skipNext = true;
      break;
    case CardKind.REVERSE:
      if (playerCount === 2) {
        skipNext = true;
      } else {
        direction = (direction * -1) as 1 | -1;
      }
      break;
    case CardKind.DRAW_TWO:
      pendingDraw += 2;
      break;
    case CardKind.WILD:
      requiresColorChoice = true;
      break;
    case CardKind.WILD_DRAW_FOUR:
      pendingDraw += 4;
      requiresColorChoice = true;
      break;
  }

  return { pendingDraw, direction, skipNext, requiresColorChoice };
}
