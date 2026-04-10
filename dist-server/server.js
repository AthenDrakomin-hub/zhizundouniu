// server.ts
import express2 from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// src/server/db.ts
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(path.dirname(path.dirname(__filename)));
var dbInstance = null;
async function initDB() {
  if (dbInstance) return dbInstance;
  dbInstance = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database
  });
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  return dbInstance;
}
function getDB() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDB first.");
  }
  return dbInstance;
}

// src/server/routes.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import path2 from "path";
async function setupRoutes(app) {
  const apiRouter = express.Router();
  apiRouter.get("/status", (req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api", apiRouter);
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
}

// src/server/game.ts
import crypto from "crypto";

// src/lib/gameLogic.ts
function getCardValue(card) {
  const v = card.value;
  if (["J", "Q", "K"].includes(v)) return 10;
  if (v === "A") return 1;
  return parseInt(v);
}
function calculateBull(cards) {
  if (cards.length !== 5) return { type: -1, multiplier: 0 };
  const values = cards.map(getCardValue);
  const rawValues = cards.map((c) => {
    if (c.value === "A") return 1;
    if (c.value === "J") return 11;
    if (c.value === "Q") return 12;
    if (c.value === "K") return 13;
    return parseInt(c.value);
  });
  if (rawValues.every((v) => v < 5) && rawValues.reduce((a, b) => a + b, 0) <= 10) {
    return { type: 13, multiplier: 8 };
  }
  if (cards.every((c) => ["J", "Q", "K"].includes(c.value))) {
    return { type: 12, multiplier: 5 };
  }
  const counts = {};
  cards.forEach((c) => counts[c.value] = (counts[c.value] || 0) + 1);
  if (Object.values(counts).some((count) => count === 4)) {
    return { type: 11, multiplier: 4 };
  }
  let maxBull = -1;
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      for (let k = j + 1; k < 5; k++) {
        const sum3 = values[i] + values[j] + values[k];
        if (sum3 % 10 === 0) {
          const remainingIndices = [0, 1, 2, 3, 4].filter((idx) => idx !== i && idx !== j && idx !== k);
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
function pickGoodCard(current4Cards, remainingDeck) {
  if (remainingDeck.length === 0) return null;
  const outcomes = remainingDeck.map((card) => {
    const testCards = [...current4Cards, card];
    const bullResult = calculateBull(testCards);
    return { card, bull: bullResult.type };
  });
  outcomes.sort((a, b) => b.bull - a.bull);
  const poolSize = Math.min(3, outcomes.length);
  const randomIndex = Math.floor(Math.random() * poolSize);
  return outcomes[randomIndex].card;
}
function pickBadCard(current4Cards, remainingDeck) {
  if (remainingDeck.length === 0) return null;
  const outcomes = remainingDeck.map((card) => {
    const testCards = [...current4Cards, card];
    const bullResult = calculateBull(testCards);
    return { card, bull: bullResult.type };
  });
  outcomes.sort((a, b) => a.bull - b.bull);
  const poolSize = Math.min(3, outcomes.length);
  const randomIndex = Math.floor(Math.random() * poolSize);
  return outcomes[randomIndex].card;
}

// src/server/game.ts
var rooms = /* @__PURE__ */ new Map();
async function setupGameServer(io) {
  const db = getDB();
  const savedRooms = await db.all("SELECT * FROM rooms");
  for (const row of savedRooms) {
    try {
      const roomData = JSON.parse(row.data);
      if (roomData.status !== "game_over") {
        roomData.players.forEach((p) => {
          p.socketId = "";
          if (roomData.status === "waiting") p.ready = false;
        });
        rooms.set(roomData.id, roomData);
      }
    } catch (e) {
      console.error("Failed to parse room data from DB:", e);
    }
  }
  async function saveRoomToDB(room) {
    try {
      await db.run(
        "INSERT OR REPLACE INTO rooms (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
        [room.id, JSON.stringify(room)]
      );
    } catch (e) {
      console.error("Failed to save room to DB:", e);
    }
  }
  setInterval(() => {
    const now = Date.now();
    rooms.forEach((room, roomId) => {
      if (["bidding", "betting", "playing"].includes(room.status)) {
        const elapsed = (now - room.phaseStartTime) / 1e3;
        if (elapsed >= room.config.timeoutSeconds) {
          if (room.status === "bidding") {
            room.players.forEach((p) => {
              if (!p.hasBid) {
                p.bidMultiplier = 0;
                p.hasBid = true;
              }
            });
            if (room.players.every((p) => p.hasBid)) determineDealer(roomId);
            else broadcastRoomUpdate(roomId);
          } else if (room.status === "betting") {
            room.players.forEach((p) => {
              if (!p.isDealer && !p.hasBet) {
                p.betMultiplier = 1;
                p.hasBet = true;
              }
            });
            const nonDealers = room.players.filter((p) => !p.isDealer);
            if (nonDealers.every((p) => p.hasBet)) startPhase5(roomId);
            else broadcastRoomUpdate(roomId);
          } else if (room.status === "playing") {
            room.players.forEach((p) => {
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
            if (room.players.every((p) => p.finish)) calculateScores(roomId);
            else broadcastRoomUpdate(roomId);
          }
        }
      }
    });
  }, 1e3);
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("adminLogin", ({ adminKey }) => {
      if (adminKey === "admin123") {
        socket.join("admin_global");
        socket.emit("adminLoginSuccess", Array.from(rooms.values()));
      } else {
        socket.emit("error", "\u7BA1\u7406\u5458\u5BC6\u7801\u9519\u8BEF");
      }
    });
    socket.on("adminSetWinRate", ({ roomId, userId, winRate }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((p) => p.id === userId);
      if (player) {
        player.targetWinRate = winRate;
        broadcastRoomUpdate(roomId);
      }
    });
    socket.on("adminSetFifthCard", ({ roomId, userId, card }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((p) => p.id === userId);
      if (player && (room.status === "dealing_5" || room.status === "playing")) {
        const cardIndex = room.remainingDeck.findIndex((c) => c.suit === card.suit && c.value === card.value);
        if (cardIndex !== -1) {
          room.remainingDeck.splice(cardIndex, 1);
        }
        player.presetFifthCard = card;
        broadcastRoomUpdate(roomId);
      }
    });
    socket.on("adminResetAll", async () => {
      rooms.clear();
      try {
        const db2 = getDB();
        await db2.run("DELETE FROM rooms");
      } catch (e) {
      }
      io.to("admin_global").emit("adminRoomsUpdate", []);
      io.emit("roomUpdate", null);
    });
    socket.on("adminCreateRoom", () => {
      const roomId = Math.floor(1e5 + Math.random() * 899999).toString();
      const roomKey = Math.floor(1e5 + Math.random() * 899999).toString();
      const newRoom = {
        id: roomId,
        players: [],
        spectators: [],
        status: "waiting",
        // waiting, dealing_4, bidding, betting, dealing_5, playing, rolling_dice, finished, game_over
        dealerId: null,
        lastWinnerId: null,
        prevRoundNoBull: false,
        currentRound: 0,
        phaseStartTime: Date.now(),
        serialNumber: `SN-${Date.now().toString(36).toUpperCase()}`,
        remainingDeck: [],
        config: {
          maxPlayers: 5,
          multiplierRule: "competitive",
          dealerRule: "winner",
          allowPushBet: true,
          noBullLimit: false,
          gameMode: "rounds",
          totalRounds: 20,
          timeoutSeconds: 15,
          roomKey,
          controlMode: "none",
          autoBalanceThreshold: 500,
          baseScore: 1
        }
      };
      rooms.set(roomId, newRoom);
      saveRoomToDB(newRoom);
      io.to("admin_global").emit("adminRoomsUpdate", Array.from(rooms.values()));
    });
    socket.on("adminJoinRoom", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        socket.join(`admin_${roomId}`);
        socket.emit("roomUpdate", room);
      }
    });
    socket.on("disconnect", () => {
      for (const [roomId, room] of rooms.entries()) {
        const playerIndex = room.players.findIndex((p) => p.socketId === socket.id);
        if (playerIndex !== -1) {
          if (room.status !== "waiting" && room.status !== "finished") {
            room.players[playerIndex].isDisconnected = true;
          } else {
            room.players.splice(playerIndex, 1);
            if (room.players.length === 0 && (!room.spectators || room.spectators.length === 0)) {
              rooms.delete(roomId);
            }
          }
          broadcastRoomUpdate(roomId);
          io.to("admin_global").emit("adminRoomsUpdate", Array.from(rooms.values()));
        } else if (room.spectators) {
          const specIndex = room.spectators.findIndex((s) => s.socketId === socket.id);
          if (specIndex !== -1) {
            room.spectators.splice(specIndex, 1);
            if (room.players.length === 0 && room.spectators.length === 0) {
              rooms.delete(roomId);
            }
            broadcastRoomUpdate(roomId);
            io.to("admin_global").emit("adminRoomsUpdate", Array.from(rooms.values()));
          }
        }
      }
    });
    socket.on("joinRoom", ({ roomId, user }) => {
      let room = rooms.get(roomId);
      const ip = socket.handshake.address;
      if (room) {
        const existingPlayerByName = room.players.find((p) => p.name === user.name);
        const existingSpectatorByName = room.spectators && room.spectators.find((p) => p.name === user.name);
        if (existingPlayerByName) {
          if (existingPlayerByName.isDisconnected) {
            existingPlayerByName.isDisconnected = false;
            existingPlayerByName.socketId = socket.id;
            existingPlayerByName.ip = ip;
            socket.join(roomId);
            socket.emit("reconnectSuccess", existingPlayerByName);
            broadcastRoomUpdate(roomId);
            return;
          } else {
            socket.emit("joinError", "\u8BE5\u5927\u540D\u5DF2\u5728\u623F\u95F4\u5185\uFF0C\u4E0D\u80FD\u91CD\u540D");
            return;
          }
        }
        if (existingSpectatorByName) {
          if (existingSpectatorByName.isDisconnected) {
            existingSpectatorByName.isDisconnected = false;
            existingSpectatorByName.socketId = socket.id;
            existingSpectatorByName.ip = ip;
            socket.join(roomId);
            socket.emit("joinSuccess", existingSpectatorByName);
            broadcastRoomUpdate(roomId);
            return;
          } else {
            socket.emit("joinError", "\u8BE5\u5927\u540D\u5DF2\u5728\u623F\u95F4\u5185\uFF0C\u4E0D\u80FD\u91CD\u540D");
            return;
          }
        }
        if (!room.spectators) room.spectators = [];
        if (room.players.length >= room.config.maxPlayers) {
          socket.join(roomId);
          const newSpectatorId = user.id || Math.random().toString(36).substr(2, 9);
          const newSpectator = {
            ...user,
            id: newSpectatorId,
            socketId: socket.id,
            isSpectator: true,
            ip,
            isDisconnected: false
          };
          room.spectators.push(newSpectator);
          socket.emit("joinSuccess", newSpectator);
          broadcastRoomUpdate(roomId);
          return;
        }
      }
      socket.join(roomId);
      if (!room) {
        room = {
          id: roomId,
          players: [],
          spectators: [],
          status: "waiting",
          dealerId: null,
          lastWinnerId: null,
          prevRoundNoBull: false,
          currentRound: 0,
          phaseStartTime: Date.now(),
          serialNumber: `SN-${Date.now().toString(36).toUpperCase()}`,
          remainingDeck: [],
          config: {
            maxPlayers: 5,
            multiplierRule: "competitive",
            dealerRule: "winner",
            allowPushBet: true,
            noBullLimit: false,
            gameMode: "rounds",
            totalRounds: 20,
            timeoutSeconds: 15,
            roomKey: `SFB-${Math.floor(100 + Math.random() * 899)}-${Math.floor(100 + Math.random() * 899)}`,
            controlMode: "none",
            autoBalanceThreshold: 500,
            baseScore: 1
          }
        };
        rooms.set(roomId, room);
      }
      const newPlayerId = user.id || Math.random().toString(36).substr(2, 9);
      const isHost = room.players.length === 0;
      const newPlayer = {
        ...user,
        id: newPlayerId,
        socketId: socket.id,
        ip,
        ready: false,
        cards: [],
        bull: -1,
        score: 0,
        finish: false,
        bidMultiplier: 0,
        betMultiplier: 0,
        isDealer: false,
        hasBid: false,
        hasBet: false,
        lastWin: 0,
        maxAllowedBet: 5,
        isHost,
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
        totalScore: 0,
        isDisconnected: false
      };
      room.players.push(newPlayer);
      socket.emit("joinSuccess", newPlayer);
      broadcastRoomUpdate(roomId);
      io.to("admin_global").emit("adminRoomsUpdate", Array.from(rooms.values()));
    });
    socket.on("updateConfig", ({ roomId, config }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      if (config.gameMode === "rounds" && room.config.gameMode !== "rounds") {
        room.players.forEach((p) => p.score = 0);
      } else if (config.gameMode === "endless" && room.config.gameMode !== "endless") {
        room.players.forEach((p) => p.score = 0);
      }
      room.config = { ...room.config, ...config };
      broadcastRoomUpdate(roomId);
    });
    socket.on("forceChangeCard", ({ roomId, targetId, newCard }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((p) => p.id === targetId);
      if (player && !player.fifthCardRequested) {
        const cardIndex = room.remainingDeck.findIndex((c) => c.suit === newCard.suit && c.value === newCard.value);
        if (cardIndex !== -1) {
          room.remainingDeck.splice(cardIndex, 1);
        }
        if (player.presetFifthCard) {
          room.remainingDeck.push(player.presetFifthCard);
          player.presetFifthCard = newCard;
        } else {
          player.presetFifthCard = newCard;
        }
        broadcastRoomUpdate(roomId);
      }
    });
    socket.on("revealFifthCard", ({ roomId, userId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing") return;
      const player = room.players.find((p) => p.id === userId);
      if (player) {
        socket.emit("fifthCardRevealed", player.cards[4]);
      }
    });
    socket.on("0x05", (payload) => {
      const roomId = payload.r;
      const userId = payload.u;
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing") return;
      const player = room.players.find((p) => p.id === userId);
      if (player && !player.fifthCardRequested) {
        player.fifthCardRequested = true;
        dealFifthCard(room, player);
        broadcastRoomUpdate(roomId);
      }
    });
    socket.on("kickPlayer", ({ roomId, targetId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const target = room.players.find((p) => p.id === targetId);
      if (target) {
        io.to(target.socketId).emit("kicked");
        room.players = room.players.filter((p) => p.id !== targetId);
        broadcastRoomUpdate(roomId);
      }
    });
    socket.on("ready", ({ roomId, userId }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find((p) => p.id === userId);
      if (player) player.ready = true;
      if (room.players.length >= 2 && room.players.every((p) => p.ready)) {
        room.autoReadyTimeout = null;
        startPhase1(roomId);
      } else {
        broadcastRoomUpdate(roomId);
      }
    });
    socket.on("forceStart", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "waiting") return;
      const readyPlayers = room.players.filter((p) => p.ready);
      if (readyPlayers.length >= 2) {
        startPhase1(roomId);
      }
    });
    socket.on("bid", ({ roomId, userId, multiplier }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "bidding") return;
      const player = room.players.find((p) => p.id === userId);
      if (player) {
        player.bidMultiplier = multiplier;
        player.hasBid = true;
      }
      if (room.players.every((p) => p.hasBid)) {
        determineDealer(roomId);
      } else {
        broadcastRoomUpdate(roomId);
      }
    });
    socket.on("bet", ({ roomId, userId, multiplier }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "betting") return;
      const player = room.players.find((p) => p.id === userId);
      if (player && !player.isDealer) {
        player.betMultiplier = multiplier;
        player.hasBet = true;
      }
      const nonDealers = room.players.filter((p) => !p.isDealer);
      if (nonDealers.every((p) => p.hasBet)) {
        startPhase5(roomId);
      } else {
        broadcastRoomUpdate(roomId);
      }
    });
    socket.on("finish", ({ roomId, userId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "playing") return;
      const player = room.players.find((p) => p.id === userId);
      if (player) {
        if (!player.fifthCardRequested) {
          player.fifthCardRequested = true;
          dealFifthCard(room, player);
        }
        player.finish = true;
        const hand = calculateHand(player.cards);
        player.bull = hand.type;
      }
      if (room.players.every((p) => p.finish)) {
        calculateScores(roomId);
      } else {
        broadcastRoomUpdate(roomId);
      }
    });
    socket.on("sendEmote", ({ roomId, fromId, targetId, emote }) => {
      io.to(roomId).emit("emoteReceived", { fromId, targetId, emote });
      io.to(`admin_${roomId}`).emit("emoteReceived", { fromId, targetId, emote });
    });
    socket.on("chatMessage", ({ roomId, userId, message }) => {
      io.to(roomId).emit("chatMessage", { userId, message, timestamp: Date.now() });
      io.to(`admin_${roomId}`).emit("chatMessage", { userId, message, timestamp: Date.now() });
    });
    socket.on("addBot", ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room || room.players.length >= room.config.maxPlayers) return;
      const botId = "bot_" + Math.random().toString(36).substr(2, 9);
      const botNames = ["\u963F\u5C14\u6CD5\u72D7", "\u6DF1\u84DD", "\u5C0F\u7231\u540C\u5B66", "\u8D3E\u7EF4\u65AF", "\u5929\u7F51"];
      const botName = botNames[Math.floor(Math.random() * botNames.length)] + "_" + Math.floor(Math.random() * 100);
      const bot = {
        id: botId,
        name: botName,
        socketId: "bot_socket",
        ready: true,
        cards: [],
        bull: -1,
        score: 0,
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
      if (room.players.length >= 2 && room.players.every((p) => p.ready)) {
        startPhase1(roomId);
      }
    });
  });
  function broadcastRoomUpdate(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    io.to(`admin_${roomId}`).emit("roomUpdate", room);
    io.to("admin_global").emit("adminRoomsUpdate", Array.from(rooms.values()));
    const safeRoom = JSON.parse(JSON.stringify(room));
    safeRoom.remainingDeck = [];
    const ipCounts = /* @__PURE__ */ new Map();
    safeRoom.players.forEach((p) => {
      if (p.ip && !p.isDisconnected && !p.isBot) {
        ipCounts.set(p.ip, (ipCounts.get(p.ip) || 0) + 1);
      }
    });
    safeRoom.hasDuplicateIp = Array.from(ipCounts.values()).some((count) => count > 1);
    safeRoom.players.forEach((p) => {
      delete p.presetFifthCard;
      if (p.cards && p.cards.length === 5 && !p.fifthCardRequested) {
        p.cards.pop();
      }
    });
    io.to(roomId).emit("roomUpdate", safeRoom);
    saveRoomToDB(room);
  }
  function dealFifthCard(room, player) {
    if (player.presetFifthCard) {
      player.cards.push(player.presetFifthCard);
    } else if (player.cards.length === 4 && room.remainingDeck.length > 0) {
      let card;
      const winRate = player.targetWinRate !== void 0 ? player.targetWinRate : 50;
      const r = Math.random() * 100;
      if (r < winRate) {
        card = pickGoodCard(player.cards, room.remainingDeck) || room.remainingDeck[0];
      } else {
        card = pickBadCard(player.cards, room.remainingDeck) || room.remainingDeck[0];
      }
      const cardIndex = room.remainingDeck.findIndex((c) => c.suit === card.suit && c.value === card.value);
      if (cardIndex !== -1) {
        room.remainingDeck.splice(cardIndex, 1);
      }
      player.cards.push(card);
    }
  }
  function startPhase1(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.status = "dealing_4";
    room.dealerId = null;
    room.phaseStartTime = Date.now();
    const deck = createDeck();
    shuffle(deck);
    room.players.forEach((p) => {
      p.cards = deck.splice(0, 4);
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
    room.remainingDeck = deck;
    broadcastRoomUpdate(roomId);
    setTimeout(() => {
      room.status = "bidding";
      room.phaseStartTime = Date.now();
      broadcastRoomUpdate(roomId);
      processBotTurns(roomId);
    }, 2e3);
  }
  function determineDealer(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    const maxBid = Math.max(...room.players.map((p) => p.bidMultiplier));
    let candidates;
    if (maxBid === 0) {
      if (room.config.dealerRule === "winner" && room.lastWinnerId) {
        candidates = room.players.filter((p) => p.id === room.lastWinnerId);
      } else if (room.config.dealerRule === "host") {
        candidates = room.players.filter((p) => p.isHost);
      } else {
        const maxScore = Math.max(...room.players.map((p) => p.score));
        candidates = room.players.filter((p) => p.score === maxScore);
      }
      if (!candidates || candidates.length === 0) {
        candidates = [room.players[0]];
      }
    } else {
      candidates = room.players.filter((p) => p.bidMultiplier === maxBid);
    }
    if (candidates.length > 1) {
      room.status = "rolling_dice";
      room.diceRoll = Math.floor(Math.random() * 6) + 1;
      room.tiedPlayerIds = candidates.map((c) => c.id);
      const dealerIndex = (room.diceRoll - 1) % candidates.length;
      const dealer = candidates[dealerIndex];
      room.dealerId = dealer.id;
      dealer.isDealer = true;
      room.phaseStartTime = Date.now();
      broadcastRoomUpdate(roomId);
      setTimeout(() => {
        const r = rooms.get(roomId);
        if (r && r.status === "rolling_dice") {
          r.status = "betting";
          r.phaseStartTime = Date.now();
          r.players.forEach((p) => {
            if (!p.isDealer) {
              p.maxAllowedBet = 4;
              if (r.config.noBullLimit && r.prevRoundNoBull) p.maxAllowedBet = 1;
            }
          });
          broadcastRoomUpdate(roomId);
          processBotTurns(roomId);
        }
      }, 4e3);
    } else {
      const dealer = candidates[0];
      room.dealerId = dealer.id;
      dealer.isDealer = true;
      room.status = "betting";
      room.phaseStartTime = Date.now();
      room.players.forEach((p) => {
        if (!p.isDealer) {
          p.maxAllowedBet = 4;
          if (room.config.noBullLimit && room.prevRoundNoBull) p.maxAllowedBet = 1;
        }
      });
      broadcastRoomUpdate(roomId);
      processBotTurns(roomId);
    }
  }
  function startPhase5(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.status = "dealing_5";
    if (room.config.controlMode === "auto_balance") {
      const threshold = room.config.autoBalanceThreshold || 500;
      room.players.forEach((p) => {
        if (!p.presetFifthCard && p.cards.length === 4) {
          if (p.score >= threshold) {
            const badCards = room.remainingDeck.filter((c) => ["A", "2", "3", "4"].includes(c.value));
            if (badCards.length > 0) {
              const targetCard = badCards[0];
              const idx = room.remainingDeck.findIndex((c) => c.suit === targetCard.suit && c.value === targetCard.value);
              if (idx !== -1) {
                p.presetFifthCard = room.remainingDeck.splice(idx, 1)[0];
              }
            }
          } else if (p.score <= -threshold) {
            const goodCards = room.remainingDeck.filter((c) => ["10", "J", "Q", "K"].includes(c.value));
            if (goodCards.length > 0) {
              const targetCard = goodCards[0];
              const idx = room.remainingDeck.findIndex((c) => c.suit === targetCard.suit && c.value === targetCard.value);
              if (idx !== -1) {
                p.presetFifthCard = room.remainingDeck.splice(idx, 1)[0];
              }
            }
          }
        }
      });
    }
    room.phaseStartTime = Date.now();
    broadcastRoomUpdate(roomId);
    setTimeout(() => {
      room.status = "playing";
      room.phaseStartTime = Date.now();
      broadcastRoomUpdate(roomId);
      processBotTurns(roomId);
    }, 2e3);
  }
  function processBotTurns(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    const bots = room.players.filter((p) => p.isBot);
    if (bots.length === 0) return;
    setTimeout(() => {
      if (room.status === "bidding") {
        bots.forEach((bot) => {
          if (!bot.hasBid) {
            const hand = calculateHand(bot.cards);
            let multiplier = 0;
            if (hand.type >= 7) multiplier = 3;
            else if (hand.type > 0) multiplier = 2;
            else multiplier = Math.random() > 0.5 ? 1 : 0;
            bot.bidMultiplier = multiplier;
            bot.hasBid = true;
          }
        });
        if (room.players.every((p) => p.hasBid)) {
          determineDealer(roomId);
        } else {
          broadcastRoomUpdate(roomId);
        }
      } else if (room.status === "betting") {
        bots.forEach((bot) => {
          if (!bot.isDealer && !bot.hasBet) {
            const hand = calculateHand(bot.cards);
            let multiplier = 1;
            if (hand.type >= 7) multiplier = 5;
            else if (hand.type > 0) multiplier = 3;
            else multiplier = Math.random() > 0.5 ? 2 : 1;
            bot.betMultiplier = Math.min(multiplier, bot.maxAllowedBet || 5);
            bot.hasBet = true;
          }
        });
        const nonDealers = room.players.filter((p) => !p.isDealer);
        if (nonDealers.every((p) => p.hasBet)) {
          startPhase5(roomId);
        } else {
          broadcastRoomUpdate(roomId);
        }
      } else if (room.status === "playing") {
        bots.forEach((bot) => {
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
        if (room.players.every((p) => p.finish)) {
          calculateScores(roomId);
        } else {
          broadcastRoomUpdate(roomId);
        }
      }
    }, 1500 + Math.random() * 1e3);
  }
  function calculateScores(roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    room.status = "finished";
    room.currentRound++;
    room.phaseStartTime = Date.now();
    const dealer = room.players.find((p) => p.isDealer);
    const dealerHand = calculateHand(dealer.cards);
    let totalDealerLoss = 0;
    let totalDealerGain = 0;
    const results = [];
    dealer.lastWin = 0;
    room.players.forEach((p) => {
      if (p.isDealer) return;
      const playerHand = calculateHand(p.cards);
      const base = room.config.baseScore || 1;
      const dealerBid = dealer.bidMultiplier || 1;
      const playerBet = p.betMultiplier || 1;
      const playerWins = compareHands(p.cards, dealer.cards);
      let handMultiplier = 1;
      const targetHand = playerWins ? playerHand : dealerHand;
      if (room.config.multiplierRule === "pro") {
        if (targetHand.type >= 10) handMultiplier = 4;
        else if (targetHand.type >= 7) handMultiplier = 3;
        else if (targetHand.type >= 1) handMultiplier = 2;
        else handMultiplier = 1;
      } else if (room.config.multiplierRule === "competitive") {
        if (targetHand.type === 13) handMultiplier = 8;
        else if (targetHand.type >= 11) handMultiplier = 5;
        else if (targetHand.type === 10) handMultiplier = 3;
        else if (targetHand.type >= 7) handMultiplier = 2;
        else handMultiplier = 1;
      } else {
        if (targetHand.type === 13) handMultiplier = 8;
        else if (targetHand.type === 12) handMultiplier = 5;
        else if (targetHand.type === 11) handMultiplier = 4;
        else if (targetHand.type === 10) handMultiplier = 3;
        else if (targetHand.type >= 7) handMultiplier = 2;
        else handMultiplier = 1;
      }
      const amount = base * dealerBid * playerBet * handMultiplier;
      results.push({ playerId: p.id, playerWins, amount });
      if (playerWins) totalDealerLoss += amount;
      else totalDealerGain += amount;
    });
    let roundMaxWin = -Infinity;
    let roundWinnerId = null;
    room.players.forEach((p) => {
      if (p.isDealer) return;
      const res = results.find((r) => r.playerId === p.id);
      let finalAmount = res.amount;
      if (res.playerWins) {
        p.score += finalAmount;
        p.lastWin = finalAmount;
        p.totalScore += finalAmount;
        dealer.score -= finalAmount;
        dealer.lastWin = (dealer.lastWin || 0) - finalAmount;
        dealer.totalScore -= finalAmount;
      } else {
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
    const dealerRoundWin = totalDealerGain - totalDealerLoss;
    if (dealerRoundWin > roundMaxWin) {
      roundWinnerId = dealer.id;
    }
    room.lastWinnerId = roundWinnerId;
    room.prevRoundNoBull = dealerHand.type === 0;
    room.players.forEach((p) => {
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
    if (room.config.gameMode === "rounds" && room.currentRound >= room.config.totalRounds) {
      room.status = "game_over";
      const reportData = room.players.map((p) => `${p.id}:${p.score}`).sort().join("|");
      const hash = crypto.createHash("sha256").update(`${room.id}|${room.serialNumber}|${reportData}`).digest("hex").substring(0, 16).toUpperCase();
      room.reportHash = hash;
    } else {
      room.autoReadyTimeout = Date.now() + 15e3;
      setTimeout(() => {
        const r = rooms.get(roomId);
        if (r && r.status === "finished" && r.autoReadyTimeout) {
          r.players.forEach((p) => p.ready = true);
          startPhase1(roomId);
        }
      }, 15e3);
    }
    broadcastRoomUpdate(roomId);
  }
  function calculateHand(cards) {
    const values = cards.map((c) => {
      const v = c.value;
      if (["J", "Q", "K"].includes(v)) return 10;
      if (v === "A") return 1;
      return parseInt(v);
    });
    const rawValues = cards.map((c) => {
      if (c.value === "A") return 1;
      if (c.value === "J") return 11;
      if (c.value === "Q") return 12;
      if (c.value === "K") return 13;
      return parseInt(c.value);
    });
    if (rawValues.every((v) => v < 5) && rawValues.reduce((a, b) => a + b, 0) <= 10) return { type: 13, multiplier: 8 };
    if (cards.every((c) => ["J", "Q", "K"].includes(c.value))) return { type: 12, multiplier: 5 };
    const counts = {};
    cards.forEach((c) => counts[c.value] = (counts[c.value] || 0) + 1);
    if (Object.values(counts).some((count) => count === 4)) return { type: 11, multiplier: 4 };
    let maxBull = -1;
    for (let i = 0; i < 5; i++) {
      for (let j = i + 1; j < 5; j++) {
        for (let k = j + 1; k < 5; k++) {
          const sum3 = values[i] + values[j] + values[k];
          if (sum3 % 10 === 0) {
            const remainingIndices = [0, 1, 2, 3, 4].filter((idx) => idx !== i && idx !== j && idx !== k);
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
  function compareHands(p1Cards, p2Cards) {
    const h1 = calculateHand(p1Cards);
    const h2 = calculateHand(p2Cards);
    if (h1.type > h2.type) return true;
    if (h1.type < h2.type) return false;
    const getCardRank = (c) => {
      const v = c.value;
      const ranks = { "A": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13 };
      const suitRanks = { "\u2660": 4, "\u2665": 3, "\u2663": 2, "\u2666": 1 };
      return ranks[v] * 10 + suitRanks[c.suit];
    };
    const max1 = Math.max(...p1Cards.map(getCardRank));
    const max2 = Math.max(...p2Cards.map(getCardRank));
    return max1 > max2;
  }
  function createDeck() {
    const suits = ["\u2660", "\u2665", "\u2663", "\u2666"];
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const deck = [];
    for (const suit of suits) {
      for (const value of values) {
        deck.push({ suit, value });
      }
    }
    return deck;
  }
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}

// server.ts
async function startServer() {
  const app = express2();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = process.env.PORT || 3e3;
  await initDB();
  await setupRoutes(app);
  await setupGameServer(io);
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer().catch(console.error);
