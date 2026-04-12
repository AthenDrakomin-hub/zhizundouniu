import type { Card } from '../types';

export function getCardValue(card: Card): number {
  const v = card.value;
  if (['J', 'Q', 'K'].includes(v)) return 10;
  if (v === 'A') return 1;
  return parseInt(v);
}

export function calculateBull(cards: Card[]): { type: number; multiplier: number } {
  if (cards.length !== 5) return { type: -1, multiplier: 0 };

  const values = cards.map(getCardValue);
  const rawValues = cards.map(c => {
    if (c.value === 'A') return 1;
    if (c.value === 'J') return 11;
    if (c.value === 'Q') return 12;
    if (c.value === 'K') return 13;
    return parseInt(c.value);
  });

  // 1. 五小牛 (Five Small Bull): 5 cards sum <= 10
  if (rawValues.reduce((a, b) => a + b, 0) <= 10) {
    return { type: 13, multiplier: 8 };
  }

  // 2. 五花牛 (Five Flower Bull): All J, Q, K
  if (cards.every(c => ['J', 'Q', 'K'].includes(c.value))) {
    return { type: 12, multiplier: 6 };
  }

  // 3. 四炸 (Four Bombs): 4 cards of same value
  const counts: Record<string, number> = {};
  cards.forEach(c => counts[c.value] = (counts[c.value] || 0) + 1);
  if (Object.values(counts).some(count => count === 4)) {
    return { type: 11, multiplier: 4 }; // Assuming 四炸 is 4倍
  }

  // Standard Bull logic
  let maxBull = -1;
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 4; j++) {
      for (let k = j + 1; k < 5; k++) {
        if ((values[i] + values[j] + values[k]) % 10 === 0) {
          const remaining = values.filter((_, idx) => idx !== i && idx !== j && idx !== k);
          let bull = (remaining[0] + remaining[1]) % 10;
          if (bull === 0) bull = 10;
          maxBull = Math.max(maxBull, bull);
        }
      }
    }
  }

  if (maxBull === -1) return { type: 0, multiplier: 1 };
  if (maxBull === 10) return { type: 10, multiplier: 5 }; // 牛牛 5倍
  if (maxBull === 9) return { type: maxBull, multiplier: 3 }; // 牛九 3倍
  if (maxBull === 8 || maxBull === 7) return { type: maxBull, multiplier: 2 }; // 牛七 牛八 2倍
  return { type: maxBull, multiplier: 1 }; // 牛一到牛六 1倍
}

export function getBullName(bull: number): string {
  if (bull === -1) return '计算中...';
  if (bull === 0) return '无牛';
  if (bull === 10) return '牛牛';
  if (bull === 11) return '四炸';
  if (bull === 12) return '五花牛';
  if (bull === 13) return '五小牛';
  return `牛${bull}`;
}

export function getWinningCards(current4Cards: Card[], remainingDeck: Card[]): { card: Card, bull: number }[] {
  if (current4Cards.length !== 4) return [];
  const result: { card: Card, bull: number }[] = [];
  
  for (const card of remainingDeck) {
    const testCards = [...current4Cards, card];
    const bullResult = calculateBull(testCards);
    if (bullResult.type >= 10) { // Only suggest Bull Bull and above (10, 11, 12, 13)
      result.push({ card, bull: bullResult.type });
    }
  }
  
  return result;
}

export function pickGoodCard(current4Cards: Card[], remainingDeck: Card[]): Card | null {
  if (remainingDeck.length === 0) return null;
  const outcomes = remainingDeck.map(card => {
    const testCards = [...current4Cards, card];
    const bullResult = calculateBull(testCards);
    return { card, bull: bullResult.type };
  });
  
  // Sort by bull descending (best first)
  outcomes.sort((a, b) => b.bull - a.bull);
  
  // Pick randomly from the top 3 best possible cards to add some randomness
  const poolSize = Math.min(3, outcomes.length);
  const randomIndex = Math.floor(Math.random() * poolSize);
  return outcomes[randomIndex].card;
}

export function pickBadCard(current4Cards: Card[], remainingDeck: Card[]): Card | null {
  if (remainingDeck.length === 0) return null;
  const outcomes = remainingDeck.map(card => {
    const testCards = [...current4Cards, card];
    const bullResult = calculateBull(testCards);
    return { card, bull: bullResult.type };
  });
  
  // Sort by bull ascending (worst first)
  outcomes.sort((a, b) => a.bull - b.bull);
  
  // Pick randomly from the top 3 worst possible cards
  const poolSize = Math.min(3, outcomes.length);
  const randomIndex = Math.floor(Math.random() * poolSize);
  return outcomes[randomIndex].card;
}
