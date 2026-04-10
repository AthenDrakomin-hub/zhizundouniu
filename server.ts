import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDB } from './src/server/db.js';
import { setupRoutes } from './src/server/routes.js';
import { setupGameServer } from './src/server/game.js';

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

  // Initialize SQLite database
  await initDB();

  // Setup Express routes (and Vite middleware)
  await setupRoutes(app);

  // Setup Socket.IO game logic
  await setupGameServer(io);

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
