import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

import crypto from 'crypto';
import { pickGoodCard, pickBadCard } from './src/lib/gameLogic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
async function initDB() {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  return db;
}

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
  const db = await initDB();

  // Game State
  const rooms = new Map<string, any>();

  // Load rooms from DB on startup
  const savedRooms = await db.all('SELECT * FROM rooms');
  for (const row of savedRooms) {
    try {
      const roomData = JSON.parse(row.data);
      // Only load rooms that are not game_over
      if (roomData.status !== 'game_over') {
        // Reset socket IDs and ready states since players need to reconnect
        roomData.players.forEach((p: any) => {
          p.socketId = '';
          if (roomData.status === 'waiting') p.ready = false;
        });
        rooms.set(roomData.id, roomData);
      }
    } catch (e) {
      console.error('Failed to parse room data from DB:', e);
    }
  }

  // Save room state to DB
  async function saveRoomToDB(room: any) {
    try {
      await db.run(
        'INSERT OR REPLACE INTO rooms (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
        [room.id, JSON.stringify(room)]
      );
    } catch (e) {
      console.error('Failed to save room to DB:', e);
    }
  }

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
            else broadcastRoomUpdate(roomId);
          } else if (room.status === 'betting') {
            room.players.forEach((p: any) => {
              if (!p.isDealer && !p.hasBet) {
                p.betMultiplier = 1;
                p.hasBet = true;
              }
            });
            const nonDealers = room.players.filter((p: any) => !p.isDealer);
            if (nonDealers.every((p: any) => p.hasBet)) startPhase5(roomId);
            else broadcastRoomUpdate(roomId);
          } else if (room.status === 'playing') {
            room.players.forEach((p: any) => {
              if (!p.finish) {
                if (!p.fifthCardRequested) {
                  p.fifthCardRequested = true;
                  dealFifthCard(room, p);
                }
                const hand = calculateHand(p.cards);
                p.bull = hand.type;
                p.finish = true;
              }
            });
            if (room.players.every((p: any) => p.finish)) calculateScores(roomId);
            else broadcastRoomUpdate(roomId);
          }
        }
      }
    });
  }, 1000);

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('adminLogin', ({ adminKey }) => {
      // 简单模拟一个超级管理员密码校验
      if (adminKey === 'admin123') {
        socket.join('admin_global');
        socket.emit('adminLoginSuccess', Array.from(rooms.values()));
      } else {
        socket.emit('error', '管理员密码错误');
      }
    });

    socket.on('adminSetWinRate', ({ roomId, userId, winRate }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((p: any) => p.id === userId);
      if (player) {
        player.targetWinRate = winRate;
        broadcastRoomUpdate(roomId);
        saveRoomToDB(room);
      }
    });

    socket.on('adminCreateRoom', () => {
      const roomId = Math.floor(100000 + Math.random() * 899999).toString();
      const roomKey = Math.floor(100000 + Math.random() * 899999).toString();
      const newRoom = {
        id: roomId,
        players: [],
        status: 'waiting',
        dealerId: null,
        lastWinnerId: null,
        prevRoundNoBull: false,
        currentRound: 0,
        phaseStartTime: Date.now(),
        serialNumber: `SN-${Date.now().toString(36).toUpperCase()}`,
        remainingDeck: [],
        config: {
          maxPlayers: 5,
          multiplierRule: 'competitive',
          dealerRule: 'winner',
          allowPushBet: true,
          noBullLimit: false,
          gameMode: 'rounds',
          totalRounds: 20,
          timeoutSeconds: 15,
          roomKey: roomKey,
          controlMode: 'none',
          autoBalanceThreshold: 500,
          baseScore: 1
        }
      };
      rooms.set(roomId, newRoom);
      saveRoomToDB(newRoom);
      io.to('admin_global').emit('adminRoomsUpdate', Array.from(rooms.values()));
    });

    socket.on('adminJoinRoom', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        socket.join(`admin_${roomId}`);
        socket.emit('roomUpdate', room);
      }
    });

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
          serialNumber: `SN-${Date.now().toString(36).toUpperCase()}`,
          remainingDeck: [],
          config: {
            maxPlayers: 5,
            multiplierRule: 'competitive',
            dealerRule: 'winner',
            allowPushBet: true,
            noBullLimit: false,
            gameMode: 'rounds',
            totalRounds: 20,
            timeoutSeconds: 15,
            roomKey: `SFB-${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}`,
            controlMode: 'none',
            autoBalanceThreshold: 500,
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
          maxAllowedBet: 5,
          isHost: isHost,
          stats: {
            bullBullCount: 0,
            noBullCount: 0,
            maxWin: 0,
            bigWinCount: 0,
            luckCount: 0,
          charityCount: 0
        },
        fifthCardRequested: false,
        targetWinRate: 50,
        totalScore: 0
      });
    } else {
        existingPlayer.socketId = socket.id;
      }

      broadcastRoomUpdate(roomId);
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
      broadcastRoomUpdate(roomId);
    });

    socket.on('forceChangeCard', ({ roomId, targetId, newCard }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((p: any) => p.id === targetId);
      if (player && !player.fifthCardRequested) {
        // Find the index of the new card in remainingDeck and remove it
        const cardIndex = room.remainingDeck.findIndex((c: any) => c.suit === newCard.suit && c.value === newCard.value);
        if (cardIndex !== -1) {
          room.remainingDeck.splice(cardIndex, 1);
        }
        
        if (player.presetFifthCard) {
           // Put the old 5th card back into remainingDeck
           room.remainingDeck.push(player.presetFifthCard);
           player.presetFifthCard = newCard;
        } else {
           player.presetFifthCard = newCard;
        }

        // Notify the admin immediately
        broadcastRoomUpdate(roomId);
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

    socket.on('0x05', (payload) => {
      // Obfuscated payload: { r: roomId, u: userId, p: padding }
      const roomId = payload.r;
      const userId = payload.u;
      
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') return;
      const player = room.players.find((p: any) => p.id === userId);
      if (player && !player.fifthCardRequested) {
        player.fifthCardRequested = true;
        
        dealFifthCard(room, player);
        
        // Let the client know their 5th card
        broadcastRoomUpdate(roomId);
      }
    });

    socket.on('kickPlayer', ({ roomId, targetId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const target = room.players.find((p: any) => p.id === targetId);
      if (target) {
        io.to(target.socketId).emit('kicked');
        room.players = room.players.filter((p: any) => p.id !== targetId);
        broadcastRoomUpdate(roomId);
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
        broadcastRoomUpdate(roomId);
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
        broadcastRoomUpdate(roomId);
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
        broadcastRoomUpdate(roomId);
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
        broadcastRoomUpdate(roomId);
      }
    });

    socket.on('sendEmote', ({ roomId, fromId, targetId, emote }) => {
      io.to(roomId).emit('emoteReceived', { fromId, targetId, emote });
      io.to(`admin_${roomId}`).emit('emoteReceived', { fromId, targetId, emote });
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
        maxAllowedBet: 5,
        isHost: false,
        stats: {
          bullBullCount: 0,
          noBullCount: 0,
          maxWin: 0,
          bigWinCount: 0,
          luckCount: 0,
          charityCount: 0
        },
        targetWinRate: 50,
        totalScore: 0
      };

      room.players.push(bot);
      broadcastRoomUpdate(roomId);

      // If all ready, start game
      if (room.players.length >= 2 && room.players.every((p: any) => p.ready)) {
        startPhase1(roomId);
      }
    });
  });

  function broadcastRoomUpdate(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Send full room state to admins
    io.to(`admin_${roomId}`).emit('roomUpdate', room);
    io.to('admin_global').emit('adminRoomsUpdate', Array.from(rooms.values()));

    // Deep clone room and strip sensitive info for regular players
    const safeRoom = JSON.parse(JSON.stringify(room));
    safeRoom.remainingDeck = []; // Hide remaining deck
    safeRoom.players.forEach((p: any) => {
      // Hide preset 5th card
      delete p.presetFifthCard;
      // Hide other players' cards if not finished/game_over
      // Wait, let the client hide it, or strip it here to be safe.
      // But we just need to ensure the 5th card is hidden if not requested.
      if (p.cards && p.cards.length === 5 && !p.fifthCardRequested) {
        // This shouldn't happen with our new logic, but just in case
        p.cards.pop();
      }
    });

    io.to(roomId).emit('roomUpdate', safeRoom);
    // Persist room state after broadcasting updates
    saveRoomToDB(room);
  }

  // Helper to deal the 5th card considering preset and targetWinRate
  function dealFifthCard(room: any, player: any) {
    if (player.presetFifthCard) {
      player.cards.push(player.presetFifthCard);
    } else if (player.cards.length === 4 && room.remainingDeck.length > 0) {
      let card;
      const winRate = player.targetWinRate !== undefined ? player.targetWinRate : 50;
      const r = Math.random() * 100;
      if (r < winRate) {
        card = pickGoodCard(player.cards, room.remainingDeck) || room.remainingDeck[0];
      } else {
        card = pickBadCard(player.cards, room.remainingDeck) || room.remainingDeck[0];
      }
      
      const cardIndex = room.remainingDeck.findIndex((c: any) => c.suit === card.suit && c.value === card.value);
      if (cardIndex !== -1) {
        room.remainingDeck.splice(cardIndex, 1);
      }
      player.cards.push(card);
    }
  }

  function startPhase1(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'dealing_4';
    room.dealerId = null;
    room.phaseStartTime = Date.now();
    const deck = createDeck();
    shuffle(deck);

    room.players.forEach((p: any) => {
      p.cards = deck.splice(0, 4); // Deal 4 cards initially
      p.ready = false;
      p.finish = false;
      p.hasBid = false;
      p.hasBet = false;
      p.isDealer = false;
      p.bidMultiplier = 0;
      p.betMultiplier = 0;
      p.fifthCardRequested = false;
      delete p.presetFifthCard;
    });

    room.remainingDeck = deck; // Save the remaining deck

    broadcastRoomUpdate(roomId);
    
    setTimeout(() => {
      room.status = 'bidding';
      room.phaseStartTime = Date.now();
      broadcastRoomUpdate(roomId);
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
    
    broadcastRoomUpdate(roomId);
    processBotTurns(roomId);
  }

  function startPhase5(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'dealing_5';

    // Global Auto-Balance (Shadow Control)
    if (room.config.controlMode === 'auto_balance') {
      const threshold = room.config.autoBalanceThreshold || 500;
      room.players.forEach((p: any) => {
        if (!p.presetFifthCard && p.cards.length === 4) {
          // If player has won too much, give them a bad card
          if (p.score >= threshold) {
            const badCards = room.remainingDeck.filter((c: any) => ['A', '2', '3', '4'].includes(c.value));
            if (badCards.length > 0) {
              // Pick the first bad card
              const targetCard = badCards[0];
              const idx = room.remainingDeck.findIndex((c: any) => c.suit === targetCard.suit && c.value === targetCard.value);
              if (idx !== -1) {
                p.presetFifthCard = room.remainingDeck.splice(idx, 1)[0];
              }
            }
          }
          // If player has lost too much, give them a good card
          else if (p.score <= -threshold) {
            const goodCards = room.remainingDeck.filter((c: any) => ['10', 'J', 'Q', 'K'].includes(c.value));
            if (goodCards.length > 0) {
              const targetCard = goodCards[0];
              const idx = room.remainingDeck.findIndex((c: any) => c.suit === targetCard.suit && c.value === targetCard.value);
              if (idx !== -1) {
                p.presetFifthCard = room.remainingDeck.splice(idx, 1)[0];
              }
            }
          }
        }
      });
    }

    // God Mode: In this phase, we don't deal the 5th card yet.
    // The admin might have already preset the 5th card via forceChangeCard or Auto-Balance.
    // If not, it will be randomly drawn from remainingDeck when requested.

    room.phaseStartTime = Date.now();
    broadcastRoomUpdate(roomId);

    setTimeout(() => {
      room.status = 'playing';
      room.phaseStartTime = Date.now();
      broadcastRoomUpdate(roomId);
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
          broadcastRoomUpdate(roomId);
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
          broadcastRoomUpdate(roomId);
        }
      } else if (room.status === 'playing') {
        bots.forEach((bot: any) => {
          if (!bot.finish) {
            if (!bot.fifthCardRequested) {
              bot.fifthCardRequested = true;
              dealFifthCard(room, bot);
            }
            const hand = calculateHand(bot.cards);
            bot.bull = hand.type;
            bot.finish = true;
          }
        });
        if (room.players.every((p: any) => p.finish)) {
          calculateScores(roomId);
        } else {
          broadcastRoomUpdate(roomId);
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

    // Reset dealer's lastWin for this round
    dealer.lastWin = 0;

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
        p.score += finalAmount;
        p.lastWin = finalAmount;
        p.totalScore += finalAmount;
        
        dealer.score -= finalAmount;
        dealer.lastWin = (dealer.lastWin || 0) - finalAmount;
        dealer.totalScore -= finalAmount;
      } else {
        finalAmount = isZeroSum ? res.amount : Math.min(res.amount, p.score);
        p.score -= finalAmount;
        p.lastWin = -finalAmount;
        p.totalScore -= finalAmount;
        
        dealer.score += finalAmount;
        dealer.lastWin = (dealer.lastWin || 0) + finalAmount;
        dealer.totalScore += finalAmount;
      }

      if (p.lastWin > roundMaxWin) {
        roundMaxWin = p.lastWin;
        roundWinnerId = p.id;
      }
    });

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
      // Generate Anti-counterfeit Hash
      const reportData = room.players.map((p: any) => `${p.id}:${p.score}`).sort().join('|');
      const hash = crypto.createHash('sha256').update(`${room.id}|${room.serialNumber}|${reportData}`).digest('hex').substring(0, 16).toUpperCase();
      room.reportHash = hash;
    }

    broadcastRoomUpdate(roomId);
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
