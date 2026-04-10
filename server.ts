import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Game State
  const rooms = new Map<string, any>();

  // Global Timeout Checker
  setInterval(() => {
    const now = Date.now();
    rooms.forEach((room, roomId) => {
      if (['bidding', 'betting', 'playing'].includes(room.status)) {
        const elapsed = (now - room.phaseStartTime) / 1000;
        if (elapsed >= room.config.timeoutSeconds) {
          if (room.status === 'bidding') {
            room.players.forEach((p: any) => {
              if (!p.hasBid) {
                p.bidMultiplier = 0;
                p.hasBid = true;
              }
            });
            if (room.players.every((p: any) => p.hasBid)) determineDealer(roomId);
            else io.to(roomId).emit('roomUpdate', room);
          } else if (room.status === 'betting') {
            room.players.forEach((p: any) => {
              if (!p.isDealer && !p.hasBet) {
                p.betMultiplier = 1;
                p.hasBet = true;
              }
            });
            const nonDealers = room.players.filter((p: any) => !p.isDealer);
            if (nonDealers.every((p: any) => p.hasBet)) startPhase5(roomId);
            else io.to(roomId).emit('roomUpdate', room);
          } else if (room.status === 'playing') {
            room.players.forEach((p: any) => {
              if (!p.finish) {
                const hand = calculateHand(p.cards);
                p.bull = hand.type;
                p.finish = true;
              }
            });
            if (room.players.every((p: any) => p.finish)) calculateScores(roomId);
            else io.to(roomId).emit('roomUpdate', room);
          }
        }
      }
    });
  }, 1000);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinRoom', ({ roomId, user }) => {
      socket.join(roomId);
      if (!rooms.has(roomId)) {
        rooms.set(roomId, { 
          id: roomId, 
          players: [], 
          status: 'waiting', 
          dealerId: null,
          lastWinnerId: null,
          prevRoundNoBull: false,
          currentRound: 0,
          phaseStartTime: Date.now(),
          totalRake: 0,
          serialNumber: `SN-${Date.now().toString(36).toUpperCase()}`,
          config: {
            maxPlayers: 5,
            multiplierRule: 'competitive',
            dealerRule: 'winner',
            allowPushBet: true,
            noBullLimit: false,
            gameMode: 'rounds',
            totalRounds: 20,
            timeoutSeconds: 15,
            taxRate: 0.01,
            roomKey: `SFB-${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}`,
            controlMode: 'none',
            baseScore: 1
          }
        });
      }
      const room = rooms.get(roomId);
      
      const existingPlayer = room.players.find((p: any) => p.id === user.id);
      if (!existingPlayer) {
        if (room.players.length >= room.config.maxPlayers) {
          socket.emit('error', '房间已满');
          return;
        }
        const isHost = room.players.length === 0;
        room.players.push({ 
          ...user, 
          socketId: socket.id, 
          ready: false, 
          cards: [], 
          bull: -1, 
          score: 1000, 
          finish: false,
          bidMultiplier: 0,
          betMultiplier: 0,
          isDealer: false,
          hasBid: false,
          hasBet: false,
          lastWin: 0,
          lastTax: 0,
          maxAllowedBet: 5,
          isHost: isHost,
          originalProfit: 0,
          totalTaxPaid: 0,
          stats: {
            bullBullCount: 0,
            noBullCount: 0,
            maxWin: 0,
            bigWinCount: 0,
            luckCount: 0,
            charityCount: 0
          }
        });
      } else {
        existingPlayer.socketId = socket.id;
      }

      io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('updateConfig', ({ roomId, config }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      
      // If switching to rounds mode, reset scores to 0
      if (config.gameMode === 'rounds' && room.config.gameMode !== 'rounds') {
        room.players.forEach((p: any) => p.score = 0);
      } else if (config.gameMode === 'endless' && room.config.gameMode !== 'endless') {
        room.players.forEach((p: any) => p.score = 1000);
      }

      room.config = { ...room.config, ...config };
      io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('forceChangeCard', ({ roomId, targetId, cardIndex, newCard }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((p: any) => p.id === targetId);
      if (player && player.cards[cardIndex]) {
        player.cards[cardIndex] = newCard;
        // Notify the host immediately
        const host = room.players.find((p: any) => p.isHost);
        if (host) {
          io.to(host.socketId).emit('roomUpdate', room);
        }
      }
    });

    socket.on('revealFifthCard', ({ roomId, userId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;
      const player = room.players.find((p: any) => p.id === userId);
      if (player) {
        // In a real implementation, we might only send the 5th card now
        // but for simplicity with the current architecture, we'll just emit a specific event
        socket.emit('fifthCardRevealed', player.cards[4]);
      }
    });

    socket.on('kickPlayer', ({ roomId, targetId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const target = room.players.find((p: any) => p.id === targetId);
      if (target) {
        io.to(target.socketId).emit('kicked');
        room.players = room.players.filter((p: any) => p.id !== targetId);
        io.to(roomId).emit('roomUpdate', room);
      }
    });

    socket.on('ready', ({ roomId, userId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find((p: any) => p.id === userId);
      if (player) player.ready = true;

      if (room.players.length >= 2 && room.players.every((p: any) => p.ready)) {
        startPhase1(roomId);
      } else {
        io.to(roomId).emit('roomUpdate', room);
      }
    });

    socket.on('forceStart', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'waiting') return;
      
      const readyPlayers = room.players.filter((p: any) => p.ready);
      if (readyPlayers.length >= 2) {
        startPhase1(roomId);
      }
    });

    socket.on('bid', ({ roomId, userId, multiplier }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'bidding') return;

      const player = room.players.find((p: any) => p.id === userId);
      if (player) {
        player.bidMultiplier = multiplier;
        player.hasBid = true;
      }

      if (room.players.every((p: any) => p.hasBid)) {
        determineDealer(roomId);
      } else {
        io.to(roomId).emit('roomUpdate', room);
      }
    });

    socket.on('bet', ({ roomId, userId, multiplier }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'betting') return;

      const player = room.players.find((p: any) => p.id === userId);
      if (player && !player.isDealer) {
        player.betMultiplier = multiplier;
        player.hasBet = true;
      }

      const nonDealers = room.players.filter((p: any) => !p.isDealer);
      if (nonDealers.every((p: any) => p.hasBet)) {
        startPhase5(roomId);
      } else {
        io.to(roomId).emit('roomUpdate', room);
      }
    });

    socket.on('finish', ({ roomId, userId, bull }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;

      const player = room.players.find((p: any) => p.id === userId);
      if (player) {
        player.finish = true;
        player.bull = bull;
      }

      if (room.players.every((p: any) => p.finish)) {
        calculateScores(roomId);
      } else {
        io.to(roomId).emit('roomUpdate', room);
      }
    });

    socket.on('addBot', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.players.length >= room.config.maxPlayers) return;

      const botId = 'bot_' + Math.random().toString(36).substr(2, 9);
      const botNames = ['阿尔法狗', '深蓝', '小爱同学', '贾维斯', '天网'];
      const botName = botNames[Math.floor(Math.random() * botNames.length)] + '_' + Math.floor(Math.random() * 100);

      const bot = {
        id: botId,
        name: botName,
        socketId: 'bot_socket',
        ready: true,
        cards: [],
        bull: -1,
        score: 1000,
        finish: false,
        bidMultiplier: 0,
        betMultiplier: 0,
        isDealer: false,
        isBot: true,
        hasBid: false,
        hasBet: false,
        lastWin: 0,
        lastTax: 0,
        maxAllowedBet: 5,
        isHost: false,
        originalProfit: 0,
        totalTaxPaid: 0,
        stats: {
          bullBullCount: 0,
          noBullCount: 0,
          maxWin: 0,
          bigWinCount: 0,
          luckCount: 0,
          charityCount: 0
        }
      };

      room.players.push(bot);
      io.to(roomId).emit('roomUpdate', room);

      // If all ready, start game
      if (room.players.length >= 2 && room.players.every((p: any) => p.ready)) {
        startPhase1(roomId);
      }
    });
  });

  function startPhase1(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'dealing_4';
    room.dealerId = null;
    room.phaseStartTime = Date.now();
    const deck = createDeck();
    shuffle(deck);

    room.players.forEach((p: any) => {
      p.cards = deck.splice(0, 5); // Deal 5 cards
      p.ready = false;
      p.finish = false;
      p.hasBid = false;
      p.hasBet = false;
      p.isDealer = false;
      p.bidMultiplier = 0;
      p.betMultiplier = 0;
    });

    io.to(roomId).emit('roomUpdate', room);
    
    setTimeout(() => {
      room.status = 'bidding';
      room.phaseStartTime = Date.now();
      io.to(roomId).emit('roomUpdate', room);
      processBotTurns(roomId);
    }, 2000);
  }

  function determineDealer(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const maxBid = Math.max(...room.players.map((p: any) => p.bidMultiplier));
    let candidates;
    
    if (maxBid === 0) {
      // Custom Dealer Rules
      if (room.config.dealerRule === 'winner' && room.lastWinnerId) {
        candidates = room.players.filter((p: any) => p.id === room.lastWinnerId);
      } else if (room.config.dealerRule === 'host') {
        candidates = room.players.filter((p: any) => p.isHost);
      } else {
        // Default: Wealthiest
        const maxScore = Math.max(...room.players.map((p: any) => p.score));
        candidates = room.players.filter((p: any) => p.score === maxScore);
      }
      
      if (!candidates || candidates.length === 0) {
        candidates = [room.players[0]];
      }
    } else {
      candidates = room.players.filter((p: any) => p.bidMultiplier === maxBid);
    }
    
    const dealer = candidates[Math.floor(Math.random() * candidates.length)];
    
    room.dealerId = dealer.id;
    dealer.isDealer = true;
    room.status = 'betting';
    room.phaseStartTime = Date.now();
    
    // Calculate max allowed bet for each player to prevent bankruptcy
    const base = 10;
    const maxHandMultiplier = 8; // Five Small Bull
    const dealerBid = dealer.bidMultiplier || 1;
    const numIdles = room.players.length - 1;
    const dealerLimitPerPlayer = Math.floor(dealer.score / numIdles);

    room.players.forEach((p: any) => {
      if (!p.isDealer) {
        const playerLimit = p.score;
        const totalLimit = Math.min(dealerLimitPerPlayer, playerLimit);
        let maxBet = Math.max(1, Math.floor(totalLimit / (base * dealerBid * maxHandMultiplier)));
        
        // No-Bull Limit Rule
        if (room.config.noBullLimit && room.prevRoundNoBull) {
          maxBet = 1;
        }
        
        p.maxAllowedBet = maxBet;
      }
    });
    
    io.to(roomId).emit('roomUpdate', room);
    processBotTurns(roomId);
  }

  function startPhase5(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'dealing_5';
    const deck = createDeck();
    const dealtCards = room.players.flatMap((p: any) => p.cards);
    const remainingDeck = deck.filter(c => !dealtCards.some(dc => dc.suit === c.suit && dc.value === c.value));
    shuffle(remainingDeck);

    // God Mode: Intervention (Swap the 5th card if needed)
    if (room.config.controlMode !== 'none') {
      const dealer = room.players.find((p: any) => p.isDealer);
      const nonDealers = room.players.filter((p: any) => !p.isDealer);
      
      if (room.config.controlMode === 'dealer_win') {
        const highCards = remainingDeck.filter(c => ['10', 'J', 'Q', 'K'].includes(c.value));
        if (highCards.length > 0) {
          const newCard = highCards[0];
          dealer.cards[4] = newCard; // Swap 5th card
        }
      } else if (room.config.controlMode === 'dealer_lose') {
        const lowCards = remainingDeck.filter(c => ['A', '2', '3', '4'].includes(c.value));
        if (lowCards.length > 0) {
          const newCard = lowCards[0];
          dealer.cards[4] = newCard; // Swap 5th card
        }
      }
    }

    room.phaseStartTime = Date.now();
    io.to(roomId).emit('roomUpdate', room);

    setTimeout(() => {
      room.status = 'playing';
      room.phaseStartTime = Date.now();
      io.to(roomId).emit('roomUpdate', room);
      processBotTurns(roomId);
    }, 2000);
  }

  function processBotTurns(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    const bots = room.players.filter((p: any) => p.isBot);
    if (bots.length === 0) return;

    setTimeout(() => {
      if (room.status === 'bidding') {
        bots.forEach((bot: any) => {
          if (!bot.hasBid) {
            // Simple bot logic: bid based on cards
            const hand = calculateHand(bot.cards);
            let multiplier = 0;
            if (hand.type >= 7) multiplier = 3;
            else if (hand.type > 0) multiplier = 2;
            else multiplier = Math.random() > 0.5 ? 1 : 0;
            
            bot.bidMultiplier = multiplier;
            bot.hasBid = true;
          }
        });
        if (room.players.every((p: any) => p.hasBid)) {
          determineDealer(roomId);
        } else {
          io.to(roomId).emit('roomUpdate', room);
        }
      } else if (room.status === 'betting') {
        bots.forEach((bot: any) => {
          if (!bot.isDealer && !bot.hasBet) {
            const hand = calculateHand(bot.cards);
            let multiplier = 1;
            if (hand.type >= 7) multiplier = 5;
            else if (hand.type > 0) multiplier = 3;
            else multiplier = Math.random() > 0.5 ? 2 : 1;

            // Respect maxAllowedBet
            bot.betMultiplier = Math.min(multiplier, bot.maxAllowedBet || 5);
            bot.hasBet = true;
          }
        });
        const nonDealers = room.players.filter((p: any) => !p.isDealer);
        if (nonDealers.every((p: any) => p.hasBet)) {
          startPhase5(roomId);
        } else {
          io.to(roomId).emit('roomUpdate', room);
        }
      } else if (room.status === 'playing') {
        bots.forEach((bot: any) => {
          if (!bot.finish) {
            const hand = calculateHand(bot.cards);
            bot.bull = hand.type;
            bot.finish = true;
          }
        });
        if (room.players.every((p: any) => p.finish)) {
          calculateScores(roomId);
        } else {
          io.to(roomId).emit('roomUpdate', room);
        }
      }
    }, 1500 + Math.random() * 1000);
  }

  function calculateScores(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'finished';
    room.currentRound++;
    room.phaseStartTime = Date.now();
    const dealer = room.players.find((p: any) => p.isDealer);
    const dealerHand = calculateHand(dealer.cards);
    
    let totalDealerLoss = 0;
    let totalDealerGain = 0;
    const results: any[] = [];

    room.players.forEach((p: any) => {
      if (p.isDealer) return;
      
      const playerHand = calculateHand(p.cards);
      const base = room.config.baseScore || 1;
      const dealerBid = dealer.bidMultiplier || 1;
      const playerBet = p.betMultiplier || 1;
      
      const playerWins = compareHands(p.cards, dealer.cards);
      
      // Multiplier Rule
      let handMultiplier = 1;
      const targetHand = playerWins ? playerHand : dealerHand;
      
      if (room.config.multiplierRule === 'pro') {
        if (targetHand.type >= 10) handMultiplier = 4;
        else if (targetHand.type >= 7) handMultiplier = 3;
        else if (targetHand.type >= 1) handMultiplier = 2;
        else handMultiplier = 1;
      } else if (room.config.multiplierRule === 'competitive') {
        if (targetHand.type >= 13) handMultiplier = 8; // Five Small
        else if (targetHand.type >= 11) handMultiplier = 5; // Bomb/Flower
        else if (targetHand.type >= 10) handMultiplier = 3; // Bull Bull
        else if (targetHand.type >= 7) handMultiplier = 2; // Bull 7-9
        else handMultiplier = 1;
      } else {
        handMultiplier = targetHand.multiplier;
      }

      const amount = base * dealerBid * playerBet * handMultiplier;
      results.push({ playerId: p.id, playerWins, amount });
      
      if (playerWins) totalDealerLoss += amount;
      else totalDealerGain += amount;
    });

    // Handle "不够赔" (Proportional Payout)
    // In rounds mode, we allow negative scores, so "不够赔" only applies if dealer score is positive and we want to protect it,
    // but the user said "所有人积分相加是否为 0", implying a zero-sum game with negative scores allowed.
    // However, to keep it consistent with "不够赔" logic, we'll only apply it if it's NOT endless mode OR if we want to enforce bankruptcy.
    // Actually, for "0分起步", we should probably allow negative scores freely.
    
    const isZeroSum = room.config.gameMode === 'rounds';
    const availableToPay = isZeroSum ? Infinity : (dealer.score + totalDealerGain);
    const payoutRatio = totalDealerLoss > availableToPay ? availableToPay / totalDealerLoss : 1;

    let roundMaxWin = -Infinity;
    let roundWinnerId = null;

    room.players.forEach((p: any) => {
      if (p.isDealer) return;
      const res = results.find(r => r.playerId === p.id);
      let finalAmount = res.amount;

      if (res.playerWins) {
        finalAmount = isZeroSum ? res.amount : Math.floor(res.amount * payoutRatio);
        const tax = Math.floor(finalAmount * room.config.taxRate);
        const net = finalAmount - tax;
        
        p.score += net;
        p.lastWin = net;
        p.lastTax = tax;
        p.originalProfit += finalAmount;
        p.totalTaxPaid += tax;
        
        dealer.score -= finalAmount;
        dealer.originalProfit -= finalAmount;
        room.totalRake += tax;
      } else {
        finalAmount = isZeroSum ? res.amount : Math.min(res.amount, p.score);
        p.score -= finalAmount;
        p.lastWin = -finalAmount;
        p.lastTax = 0;
        p.originalProfit -= finalAmount;
        
        dealer.score += finalAmount;
        dealer.originalProfit += finalAmount;
      }

      if (p.lastWin > roundMaxWin) {
        roundMaxWin = p.lastWin;
        roundWinnerId = p.id;
      }
    });

    // Deduct tax from dealer if they won the round overall
    const dealerRoundProfit = room.players.filter((p: any) => !p.isDealer).reduce((acc: number, p: any) => acc - p.lastWin - p.lastTax, 0);
    if (dealerRoundProfit > 0) {
      const tax = Math.floor(dealerRoundProfit * room.config.taxRate);
      dealer.score -= tax;
      dealer.lastTax = tax;
      dealer.totalTaxPaid += tax;
      room.totalRake += tax;
    }

    // If dealer won overall, they might be the winner
    const dealerRoundWin = isZeroSum ? (totalDealerGain - totalDealerLoss) : (totalDealerGain - (totalDealerLoss * payoutRatio));
    if (dealerRoundWin > roundMaxWin) {
      roundWinnerId = dealer.id;
    }

    room.lastWinnerId = roundWinnerId;
    room.prevRoundNoBull = dealerHand.type === 0;

    // Update stats
    room.players.forEach((p: any) => {
      const hand = calculateHand(p.cards);
      if (!p.stats) {
        p.stats = {
          bullBullCount: 0,
          noBullCount: 0,
          maxWin: 0,
          bigWinCount: 0,
          luckCount: 0,
          charityCount: 0
        };
      }
      if (hand.type >= 10) p.stats.bullBullCount++;
      if (hand.type === 0) p.stats.noBullCount++;
      if (hand.type >= 7) p.stats.luckCount++;
      if (p.lastWin > p.stats.maxWin) p.stats.maxWin = p.lastWin;
      if (p.lastWin > 0) p.stats.bigWinCount++;
      if (p.lastWin < 0) p.stats.charityCount++;
    });

    // Check for game over
    if (room.config.gameMode === 'rounds' && room.currentRound >= room.config.totalRounds) {
      room.status = 'game_over';
    }

    io.to(roomId).emit('roomUpdate', room);
  }

  // Helper for server-side calculation
  function calculateHand(cards: any[]) {
    // This should match gameLogic.ts
    // For simplicity, we'll just use the type sent by client or re-calculate
    // Re-calculating is safer
    const values = cards.map(c => {
      const v = c.value;
      if (['J', 'Q', 'K'].includes(v)) return 10;
      if (v === 'A') return 1;
      return parseInt(v);
    });

    const rawValues = cards.map(c => {
      if (c.value === 'A') return 1;
      if (c.value === 'J') return 11;
      if (c.value === 'Q') return 12;
      if (c.value === 'K') return 13;
      return parseInt(c.value);
    });

    if (rawValues.every(v => v < 5) && rawValues.reduce((a, b) => a + b, 0) <= 10) return { type: 13, multiplier: 8 };
    if (cards.every(c => ['J', 'Q', 'K'].includes(c.value))) return { type: 12, multiplier: 5 };
    const counts: Record<string, number> = {};
    cards.forEach(c => counts[c.value] = (counts[c.value] || 0) + 1);
    if (Object.values(counts).some(count => count === 4)) return { type: 11, multiplier: 4 };

    let maxBull = -1;
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        for (let k = j + 1; k < 5; k++) {
          const sum3 = values[i] + values[j] + values[k];
          if (sum3 % 10 === 0) {
            const remainingIndices = [0, 1, 2, 3, 4].filter(idx => idx !== i && idx !== j && idx !== k);
            const sum2 = values[remainingIndices[0]] + values[remainingIndices[1]];
            const bullValue = sum2 % 10 === 0 ? 10 : sum2 % 10;
            if (bullValue > maxBull) maxBull = bullValue;
          }
        }
      }
    }
    if (maxBull === -1) return { type: 0, multiplier: 1 };
    if (maxBull === 10) return { type: 10, multiplier: 3 };
    if (maxBull >= 7) return { type: maxBull, multiplier: 2 };
    return { type: maxBull, multiplier: 1 };
  }

  function compareHands(p1Cards: any[], p2Cards: any[]) {
    const h1 = calculateHand(p1Cards);
    const h2 = calculateHand(p2Cards);
    if (h1.type > h2.type) return true;
    if (h1.type < h2.type) return false;
    
    // If same type, compare max card
    const getCardRank = (c: any) => {
      const v = c.value;
      const ranks: any = { 'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13 };
      const suitRanks: any = { '♠': 4, '♥': 3, '♣': 2, '♦': 1 };
      return ranks[v] * 10 + suitRanks[c.suit];
    };
    
    const max1 = Math.max(...p1Cards.map(getCardRank));
    const max2 = Math.max(...p2Cards.map(getCardRank));
    return max1 > max2;
  }

  function createDeck() {
    const suits = ['♠', '♥', '♣', '♦'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value });
      }
    }
    return deck;
  }

  function shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
