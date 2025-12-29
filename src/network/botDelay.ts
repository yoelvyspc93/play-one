const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 5000;

export function calculateBotDelay(cardCount: number) {
  const clamped = Math.max(1, Math.min(cardCount, 10));
  const ratio = (clamped - 1) / 9;
  return Math.round(MIN_DELAY_MS + ratio * (MAX_DELAY_MS - MIN_DELAY_MS));
}
