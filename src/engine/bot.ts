import { GameState, Card, CardKind, CardColor, GamePhase, PublicState } from './types';
import { GameAction, ActionType } from './actions';
import { evaluateCardEffect, getNextPlayerIndex, isValidMove } from './logic';

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 3000;

export function calculateBotDelay(cardCount: number) {
  const clamped = Math.max(1, Math.min(cardCount, 10));
  const ratio = (clamped - 1) / 9;
  return Math.round(MIN_DELAY_MS + ratio * (MAX_DELAY_MS - MIN_DELAY_MS));
}

type PlayableColor = Exclude<CardColor, CardColor.WILD>;

type ColorScore = Record<PlayableColor, number>;

function makeColorScore(value = 1): ColorScore {
  return {
    [CardColor.RED]: value,
    [CardColor.GREEN]: value,
    [CardColor.BLUE]: value,
    [CardColor.YELLOW]: value,
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function stableHash(input: string): number {
  // Simple non-crypto hash for deterministic tie-breaking.
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickDeterministically<T>(items: T[], seed: string): T {
  if (items.length === 0) {
    throw new Error('pickDeterministically requires at least one item');
  }
  const idx = stableHash(seed) % items.length;
  return items[idx];
}

function countColors(hand: Card[]): ColorScore {
  const counts = makeColorScore(0);
  for (const c of hand) {
    if (c.color && c.color !== CardColor.WILD) {
      counts[c.color as PlayableColor]++;
    }
  }
  return counts;
}

function getMostAbundantColorFromCounts(counts: ColorScore): PlayableColor {
  const colors: PlayableColor[] = [CardColor.RED, CardColor.GREEN, CardColor.BLUE, CardColor.YELLOW];
  colors.sort((a, b) => {
    if (counts[b] !== counts[a]) return counts[b] - counts[a];
    // Deterministic tie-break
    const order: Record<PlayableColor, number> = {
      [CardColor.RED]: 0,
      [CardColor.GREEN]: 1,
      [CardColor.BLUE]: 2,
      [CardColor.YELLOW]: 3,
    };
    return order[a] - order[b];
  });
  return colors[0];
}

export function getMostAbundantColor(hand: Card[]): CardColor {
  return getMostAbundantColorFromCounts(countColors(hand));
}

function getTurnDistance(pub: PublicState, fromPlayerId: string, toPlayerId: string): number {
  const order = pub.order;
  const fromIndex = order.indexOf(fromPlayerId);
  const toIndex = order.indexOf(toPlayerId);
  if (fromIndex === -1 || toIndex === -1) return Number.MAX_SAFE_INTEGER;

  let idx = fromIndex;
  for (let d = 0; d < order.length; d++) {
    if (idx === toIndex) return d;
    idx = getNextPlayerIndex(idx, order.length, pub.direction);
  }
  return Number.MAX_SAFE_INTEGER;
}

function getCriticalOpponentId(pub: PublicState, botId: string): string | null {
  const opponents = pub.players.filter(p => p.id !== botId && p.connected);
  if (opponents.length === 0) return null;

  const minCount = Math.min(...opponents.map(p => p.cardCount));
  const tied = opponents.filter(p => p.cardCount === minCount);
  if (tied.length === 1) return tied[0].id;

  // Tie-break: who plays sooner after the bot (in current direction)
  tied.sort((a, b) => getTurnDistance(pub, botId, a.id) - getTurnDistance(pub, botId, b.id));
  return tied[0].id;
}

type BotProfileName = 'aggressive' | 'controller' | 'conservative' | 'chaotic';

interface BotProfile {
  name: BotProfileName;
  aggression: number; // How much to prioritize attacks when there is a threat
  conserveWild: number; // Penalty for using wilds early
  chaos: number; // How wide we allow near-ties before picking randomly
}

function getBotProfile(botName: string, botId: string): BotProfile {
  const seed = stableHash(`${botName}|${botId}`);
  const profile = seed % 4;

  switch (profile) {
    case 0:
      return { name: 'aggressive', aggression: 1.25, conserveWild: 0.7, chaos: 0.15 };
    case 1:
      return { name: 'controller', aggression: 1.0, conserveWild: 1.15, chaos: 0.1 };
    case 2:
      return { name: 'conservative', aggression: 0.8, conserveWild: 1.4, chaos: 0.06 };
    default:
      return { name: 'chaotic', aggression: 1.05, conserveWild: 0.95, chaos: 0.28 };
  }
}

interface PlayerModel {
  colorScore: ColorScore; // Higher means more likely they can follow that color
  wildSuspicion: number; // 0..1
}

interface RoomMemory {
  lastStateVersion: number;
  lastPublic: PublicState | null;
  models: Record<string, PlayerModel>;
}

const roomMemoryStore = new Map<string, RoomMemory>();

function getRoomKey(pub: PublicState): string {
  // Prefer roomId if present; fall back to hostId for safety.
  return pub.roomId || pub.hostId || 'local';
}

function ensurePlayerModel(mem: RoomMemory, playerId: string): PlayerModel {
  if (!mem.models[playerId]) {
    mem.models[playerId] = {
      colorScore: makeColorScore(1),
      wildSuspicion: 0,
    };
  }
  return mem.models[playerId];
}

function updateRoomMemoryFromState(state: GameState) {
  const pub = state.public;
  const key = getRoomKey(pub);
  const existing = roomMemoryStore.get(key);

  if (!existing) {
    const mem: RoomMemory = {
      lastStateVersion: pub.stateVersion,
      lastPublic: JSON.parse(JSON.stringify(pub)) as PublicState,
      models: {},
    };
    for (const p of pub.players) ensurePlayerModel(mem, p.id);
    roomMemoryStore.set(key, mem);
    return;
  }

  // Reset memory if stateVersion moved backwards (new game / hot reload)
  if (pub.stateVersion < existing.lastStateVersion) {
    existing.lastStateVersion = pub.stateVersion;
    existing.lastPublic = JSON.parse(JSON.stringify(pub)) as PublicState;
    existing.models = {};
    for (const p of pub.players) ensurePlayerModel(existing, p.id);
    return;
  }

  if (pub.stateVersion === existing.lastStateVersion) return;

  const prev = existing.lastPublic;
  // If we don't have a previous snapshot, just store it.
  if (!prev) {
    existing.lastPublic = JSON.parse(JSON.stringify(pub)) as PublicState;
    existing.lastStateVersion = pub.stateVersion;
    for (const p of pub.players) ensurePlayerModel(existing, p.id);
    return;
  }

  // Ensure all players exist
  for (const p of pub.players) ensurePlayerModel(existing, p.id);

  // Infer actor from previous turn owner (best approximation without action log)
  const prevActorId = prev.order[prev.currentPlayerIndex];

  const prevTopId = prev.topCard?.id ?? null;
  const nextTopId = pub.topCard?.id ?? null;

  const prevColor = prev.currentColor;
  const nextColor = pub.currentColor;

  const prevPhase = prev.phase;
  const nextPhase = pub.phase;

  const prevActor = prev.players.find(p => p.id === prevActorId);
  const nextActor = pub.players.find(p => p.id === prevActorId);

  const actorModel = ensurePlayerModel(existing, prevActorId);

  // Wild color choice inference
  if (prevPhase === GamePhase.CHOOSE_COLOR_REQUIRED && nextPhase === GamePhase.TURN) {
    if (nextColor && nextColor !== CardColor.WILD) {
      actorModel.colorScore[nextColor as PlayableColor] += 3.0;
      actorModel.wildSuspicion = clamp01(actorModel.wildSuspicion + 0.05);
    }
  }

  // If top card changed, assume actor played (or auto-played after draw)
  if (prevTopId !== nextTopId && pub.topCard) {
    const played = pub.topCard;
    if (played.color && played.color !== CardColor.WILD) {
      actorModel.colorScore[played.color as PlayableColor] += 1.5;
    } else {
      actorModel.wildSuspicion = clamp01(actorModel.wildSuspicion + 0.1);
    }
  }

  // Evidence negative: actor drew cards while a color was active and top card stayed the same
  // (in this ruleset, a draw with no autoplay implies they had nothing playable under that color)
  if (prevPhase === GamePhase.TURN && nextPhase === GamePhase.TURN && prevTopId === nextTopId) {
    if (prevActor && nextActor && nextActor.cardCount > prevActor.cardCount) {
      if (prevColor && prevColor !== CardColor.WILD) {
        actorModel.colorScore[prevColor as PlayableColor] = Math.max(0.1, actorModel.colorScore[prevColor as PlayableColor] - 0.75);
      }
    }
  }

  // Keep snapshot updated
  existing.lastPublic = JSON.parse(JSON.stringify(pub)) as PublicState;
  existing.lastStateVersion = pub.stateVersion;
}

function getRoomMemory(pub: PublicState): RoomMemory {
  const key = getRoomKey(pub);
  const mem = roomMemoryStore.get(key);
  if (!mem) {
    const created: RoomMemory = { lastStateVersion: pub.stateVersion, lastPublic: JSON.parse(JSON.stringify(pub)) as PublicState, models: {} };
    for (const p of pub.players) ensurePlayerModel(created, p.id);
    roomMemoryStore.set(key, created);
    return created;
  }
  return mem;
}

function getLeastLikelyColorForOpponent(model: PlayerModel): PlayableColor {
  const colors: PlayableColor[] = [CardColor.RED, CardColor.GREEN, CardColor.BLUE, CardColor.YELLOW];
  colors.sort((a, b) => model.colorScore[a] - model.colorScore[b]);
  return colors[0];
}

function pickColorAfterWild(
  botHandAfterPlay: Card[],
  pub: PublicState,
  mem: RoomMemory,
  botId: string
): PlayableColor {
  const counts = countColors(botHandAfterPlay);
  const dominant = getMostAbundantColorFromCounts(counts);

  const criticalId = getCriticalOpponentId(pub, botId);
  const criticalModel = criticalId ? mem.models[criticalId] : null;

  const colors: PlayableColor[] = [CardColor.RED, CardColor.GREEN, CardColor.BLUE, CardColor.YELLOW];

  const scored = colors.map(color => {
    let score = 0;

    // Prefer continuity in own hand (rule 6 + rule 8)
    score += counts[color] * 4;

    // If we have no cards of that color, it's risky unless it's a strong trap color
    if (counts[color] === 0) score -= 6;

    // Hurt critical opponent by choosing a color they are less likely to have (rule 8)
    if (criticalModel) {
      const max = Math.max(...Object.values(criticalModel.colorScore));
      const rel = max - criticalModel.colorScore[color];
      score += rel * 3;
    }

    // Slight preference for dominant color on ties
    if (color === dominant) score += 1.5;

    return { color, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].color;
}

function simulateNextPlayerAfterPlay(pub: PublicState, card: Card): string {
  const effect = evaluateCardEffect(card, pub.pendingDraw, pub.direction, pub.order.length);
  const direction = effect.direction;

  // Who becomes current after the play is resolved?
  let nextIdx = getNextPlayerIndex(pub.currentPlayerIndex, pub.order.length, direction);
  if (effect.skipNext) {
    nextIdx = getNextPlayerIndex(nextIdx, pub.order.length, direction);
  }
  return pub.order[nextIdx];
}

function willHavePlayableFollowUp(handAfterPlay: Card[], assumedColor: CardColor | null): boolean {
  // Rough risk heuristic: can we play something next turn without relying on drawing?
  if (!assumedColor) return true;
  return handAfterPlay.some(c => c.kind === CardKind.WILD || c.kind === CardKind.WILD_DRAW_FOUR || (c.color === assumedColor) || c.color === CardColor.WILD);
}

export function calculateBotMove(state: GameState, botId: string): GameAction | null {
  const { public: pub, players } = state;
  const botPlayer = players[botId];

  // Keep room memory in sync before deciding
  updateRoomMemoryFromState(state);
  const mem = getRoomMemory(pub);

  // 1. Basic Validation: Is it my turn?
  if (pub.order[pub.currentPlayerIndex] !== botId) return null;

  // 2. Handle Color Choice (Wild played previously or by bot)
  if (pub.phase === GamePhase.CHOOSE_COLOR_REQUIRED) {
    // Choose color strategically (rule 8)
    const color = pickColorAfterWild(botPlayer.hand, pub, mem, botId);
    return {
      type: ActionType.CHOOSE_COLOR,
      playerId: botId,
      color
    };
  }

  if (pub.phase !== GamePhase.TURN) return null;

  const hand = botPlayer.hand;
  const { pendingDraw } = pub;
  const profile = getBotProfile(botPlayer.name, botId);

  // 3. Pending Draw Logic (Stacking)
  if (pendingDraw > 0) {
    // Find cards that can stack
    const stackingCards = hand.filter(c => isValidMove(c, pub, hand));

    if (stackingCards.length > 0) {
      // Policy (rule 9): stack if it helps avoid punishment AND ideally punishes the leader.
      // Prefer +2 over +4 unless using +4 is strategically critical (rule 7.2 / 9).
      const criticalId = getCriticalOpponentId(pub, botId);
      const urgentThreat = pub.players.some(p => p.id !== botId && p.connected && p.cardCount <= 2);
      const nextAfterStack = pub.order[getNextPlayerIndex(pub.currentPlayerIndex, pub.order.length, pub.direction)];

      const canPlayDrawTwo = stackingCards.some(c => c.kind === CardKind.DRAW_TWO);
      const canPlayDrawFour = stackingCards.some(c => c.kind === CardKind.WILD_DRAW_FOUR);

      if (canPlayDrawTwo) {
        const drawTwo = stackingCards.find(c => c.kind === CardKind.DRAW_TWO)!;
        // If next player is the critical opponent, prioritize +2 hard.
        if (criticalId && nextAfterStack === criticalId) {
          return { type: ActionType.PLAY_CARD, playerId: botId, cardId: drawTwo.id };
        }
        // Otherwise, still prefer +2 by default.
        if (!urgentThreat || !canPlayDrawFour) {
          return { type: ActionType.PLAY_CARD, playerId: botId, cardId: drawTwo.id };
        }
      }

      if (canPlayDrawFour) {
        // Use +4 mainly when there's an urgent threat or it helps target the critical opponent.
        const drawFour = stackingCards.find(c => c.kind === CardKind.WILD_DRAW_FOUR)!;
        if (urgentThreat || (criticalId && nextAfterStack === criticalId)) {
          return { type: ActionType.PLAY_CARD, playerId: botId, cardId: drawFour.id };
        }
        // Otherwise, fall back to +4 only if it's the only stack option.
        if (!canPlayDrawTwo) {
          return { type: ActionType.PLAY_CARD, playerId: botId, cardId: drawFour.id };
        }
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

  const myCountsBefore = countColors(hand);
  const myDominantBefore = getMostAbundantColorFromCounts(myCountsBefore);
  const myHandCount = hand.length;

  const criticalId = getCriticalOpponentId(pub, botId);
  const criticalCount = criticalId ? (pub.players.find(p => p.id === criticalId)?.cardCount ?? 99) : 99;
  const urgentThreat = pub.players.some(p => p.id !== botId && p.connected && p.cardCount <= 2);

  const scoredMoves = validMoves.map(card => {
    let score = 0;

    const isWild = card.kind === CardKind.WILD || card.kind === CardKind.WILD_DRAW_FOUR;
    const isAttack = card.kind === CardKind.DRAW_TWO || card.kind === CardKind.WILD_DRAW_FOUR;
    const isTempo = card.kind === CardKind.SKIP || card.kind === CardKind.REVERSE;

    // Base preference: numbers first, keep wilds for later (rule 7.2 / 10)
    if (card.kind === CardKind.NUMBER) score += 6;
    if (isTempo) score += 3;
    if (isAttack) score += 4;
    if (isWild) score -= 18 * profile.conserveWild;

    // Compute hand after play
    const handAfterPlay = hand.filter(c => c.id !== card.id);
    const countsAfter = countColors(handAfterPlay);

    // Color management (rule 6): stay in dominant colors and avoid creating isolated singletons
    if (card.color && card.color !== CardColor.WILD) {
      const playedColor = card.color as PlayableColor;
      if (playedColor === myDominantBefore) score += 7;

      // Avoid eliminating a color when it leaves other singletons (risk of future blocks)
      const beforeCount = myCountsBefore[playedColor];
      const afterCount = countsAfter[playedColor];
      const singletonColorsAfter = Object.values(countsAfter).filter(v => v === 1).length;
      if (beforeCount === 1 && afterCount === 0 && singletonColorsAfter >= 2) {
        score -= 6;
      }
    }

    // Identify who will be next after this play (for targeted aggression)
    const nextPlayerId = simulateNextPlayerAfterPlay(pub, card);
    const targetsCritical = criticalId !== null && nextPlayerId === criticalId;

    // Urgency rules (rule 4): if someone has 1–2 cards, prioritize stopping them
    if (urgentThreat && criticalId) {
      const aggressionBoost = profile.aggression;
      if (card.kind === CardKind.DRAW_TWO) score += (targetsCritical ? 34 : 12) * aggressionBoost;
      if (card.kind === CardKind.WILD_DRAW_FOUR) score += (targetsCritical ? 44 : 16) * aggressionBoost;
      if (card.kind === CardKind.SKIP) score += (targetsCritical ? 26 : 10) * aggressionBoost;
      if (card.kind === CardKind.REVERSE) {
        // Reverse is a skip in 2 players; otherwise it can reposition pressure (rule 7.4)
        if (pub.order.length === 2) score += (targetsCritical ? 26 : 10) * aggressionBoost;
        else score += 12 * aggressionBoost;
      }
    }

    // If bot is close to winning, be more willing to use wilds for closure (rule 4.2)
    if (myHandCount <= 2) {
      score += 10;
      if (isWild) score += 12;
      if (card.kind === CardKind.WILD_DRAW_FOUR) score += 8;
    }

    // Anti-kingmaking / anti-victory unfairness (rule 11): always prioritize hitting the leader
    const leaderCount = Math.min(...pub.players.filter(p => p.id !== botId && p.connected).map(p => p.cardCount));
    if (leaderCount <= 2 && criticalId) {
      if (targetsCritical && (isAttack || isTempo)) score += 10;
    }

    // Wild color planning (rule 8): choose a color that continues our hand but is awkward for critical opponent
    let assumedColorAfterPlay: CardColor | null = card.color;
    if (isWild) {
      const chosen = pickColorAfterWild(handAfterPlay, pub, mem, botId);
      assumedColorAfterPlay = chosen;

      if (criticalId) {
        const model = mem.models[criticalId];
        const leastLikely = getLeastLikelyColorForOpponent(model);
        if (chosen === leastLikely) score += 14;
        // If chosen color is very likely for critical opponent, penalize.
        const max = Math.max(...Object.values(model.colorScore));
        const rel = model.colorScore[chosen] / Math.max(1, max);
        score -= rel * 10;
      }
    }

    // Risk management (rule 10): avoid leaving ourselves with no follow-up unless it wins immediately
    if (handAfterPlay.length > 0) {
      const hasFollowUp = willHavePlayableFollowUp(handAfterPlay, assumedColorAfterPlay);
      if (!hasFollowUp) score -= 12;
    }

    // Micro-optimization: slightly favor shedding duplicates to reduce future block risk
    const dominantAfter = getMostAbundantColorFromCounts(countsAfter);
    if (dominantAfter === myDominantBefore) score += 1.5;

    // Tiny nudge: when not urgent, avoid spending +4 too early (rule 7.2)
    if (!urgentThreat && card.kind === CardKind.WILD_DRAW_FOUR && myHandCount > 3) score -= 12 * profile.conserveWild;

    // If critical opponent is about to win (1 card), be even more aggressive
    if (criticalCount <= 1 && (isAttack || isTempo)) score += 10 * profile.aggression;

    return { card, score };
  });

  scoredMoves.sort((a, b) => b.score - a.score);

  const best = scoredMoves[0];
  const bestScore = best.score;

  // Controlled randomness (rule 13): if close scores, pick among top few based on profile
  const window = Math.max(1, Math.ceil(validMoves.length * profile.chaos));
  const threshold = bestScore - 2.25; // near-tie band
  const candidates = scoredMoves
    .slice(0, Math.min(scoredMoves.length, Math.max(2, window)))
    .filter(m => m.score >= threshold);

  const chosen = candidates.length > 1
    ? pickDeterministically(candidates, `${getRoomKey(pub)}|${botId}|${pub.stateVersion}`).card
    : best.card;

  return { type: ActionType.PLAY_CARD, playerId: botId, cardId: chosen.id };
}
