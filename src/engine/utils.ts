import { v4 as uuidv4 } from 'uuid';
import { DECK_COMPOSITION, COLORS } from './constants';
import { Card, CardKind, CardColor } from './types';

// Helper to shuffle array in place (Fisher-Yates)
export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const item of DECK_COMPOSITION) {
    if (item.isWild) {
      for (let i = 0; i < item.count; i++) {
        deck.push({
          id: uuidv4(),
          kind: item.kind,
          color: CardColor.WILD, // Wilds start as WILD color
        });
      }
    } else {
      // For colored cards, iterate over all 4 colors
      for (const color of COLORS) {
        // Numbers can have specific values (0, or 1-9)
        if (item.kind === CardKind.NUMBER && item.numbers) {
          for (const num of item.numbers) {
            for (let i = 0; i < item.count; i++) {
              deck.push({
                id: uuidv4(),
                kind: item.kind,
                color: color,
                number: num
              });
            }
          }
        } else {
          // Actions
          for (let i = 0; i < item.count; i++) {
            deck.push({
              id: uuidv4(),
              kind: item.kind,
              color: color
            });
          }
        }
      }
    }
  }

  return shuffle(deck);
}
