export interface Card {
  suit: string;
  value: string;
}

export interface RoomConfig {
  maxPlayers: number;
  multiplierRule: 'standard' | 'pro' | 'competitive'; // standard: 1/1/1/2/2/3, pro: 1/2/3/4, competitive: 1/2/3/8
  dealerRule: 'wealthiest' | 'winner' | 'host';
  allowPushBet: boolean;
  noBullLimit: boolean;
  gameMode: 'endless' | 'rounds';
  totalRounds: number;
  timeoutSeconds: number;
  roomKey?: string;
  controlMode: 'none' | 'dealer_win' | 'dealer_lose';
  baseScore: number;
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
  ready: boolean;
  cards: Card[];
  bull: number; // -1: none, 0: no bull, 1-9: bull 1-9, 10: bull bull, 11: four bombs, 12: five flower, 13: five small
  score: number;
  finish: boolean;
  bidMultiplier: number; // 0: no bid, 1, 2, 3, 4
  betMultiplier: number; // For non-dealers
  isDealer: boolean;
  hasBid: boolean;
  hasBet: boolean;
  lastWin: number;
  maxAllowedBet: number;
  isHost: boolean;
  isBot?: boolean;
  stats: {
    bullBullCount: number;
    noBullCount: number;
    maxWin: number;
    bigWinCount: number; // For "至尊之神"
    luckCount: number;   // For "运气之王"
    charityCount: number; // For "慈善大使"
  };
  fifthCardRequested: boolean;
  presetFifthCard?: Card;
}

export interface Room {
  id: string;
  players: Player[];
  status: 'waiting' | 'dealing_4' | 'bidding' | 'betting' | 'dealing_5' | 'playing' | 'finished' | 'game_over';
  dealerId: string | null;
  config: RoomConfig;
  lastWinnerId: string | null;
  prevRoundNoBull: boolean;
  currentRound: number;
  phaseStartTime: number;
  serialNumber: string;
  remainingDeck: Card[];
}
