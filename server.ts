import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDB } from './src/server/db.js';
import { setupRoutes } from './src/server/routes.js';
import { setupGameServer } from './src/server/game.js';

async function startServer() {
  const app = express();

  // Add CORS headers to Express
  app.use((req, res, next) => {
    const origin = req.headers.origin || '*';
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true
    }
  });

  const PORT = process.env.PORT || 3000;

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
