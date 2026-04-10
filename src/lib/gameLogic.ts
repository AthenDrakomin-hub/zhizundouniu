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

  // 1. 五小牛 (Five Small Bull): 5 cards < 5, sum <= 10
  if (rawValues.every(v => v < 5) && rawValues.reduce((a, b) => a + b, 0) <= 10) {
    return { type: 13, multiplier: 8 };
  }

  // 2. 五花牛 (Five Flower Bull): All J, Q, K
  if (cards.every(c => ['J', 'Q', 'K'].includes(c.value))) {
    return { type: 12, multiplier: 5 };
  }

  // 3. 四炸 (Four Bombs): 4 cards of same value
  const counts: Record<string, number> = {};
  cards.forEach(c => counts[c.value] = (counts[c.value] || 0) + 1);
  if (Object.values(counts).some(count => count === 4)) {
    return { type: 11, multiplier: 4 };
  }

  // Standard Bull logic
  let maxBull = -1;
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      for (let k = j + 1; k < 5; k++) {
        const sum3 = values[i] + values[j] + values[k];
        if (sum3 % 10 === 0) {
          const remainingIndices = [0, 1, 2, 3, 4].filter(idx => idx !== i && idx !== j && idx !== k);
          const sum2 = values[remainingIndices[0]] + values[remainingIndices[1]];
          const bullValue = sum2 % 10 === 0 ? 10 : sum2 % 10;
          if (bullValue > maxBull) {
            maxBull = bullValue;
          }
        }
      }
    }
  }

  if (maxBull === -1) return { type: 0, multiplier: 1 };
  if (maxBull === 10) return { type: 10, multiplier: 3 };
  if (maxBull >= 7) return { type: maxBull, multiplier: 2 };
  return { type: maxBull, multiplier: 1 };
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
