import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDB } from './src/server/db.js';
import { setupRoutes } from './src/server/routes.js';
import { setupGameServer } from './src/server/game.js';

async function startServer() {
  const app = express();

  const httpServer = createServer(app);
  
  // We MUST configure CORS in Socket.IO because Socket.IO engine itself 
  // validates the origin and will reject requests if not explicitly allowed,
  // regardless of what Nginx does at the HTTP layer.
  const io = new Server(httpServer, {
    cors: {
      origin: ["https://admin.yefeng.us.cc", "https://app.yefeng.us.cc"],
      methods: ["GET", "POST"],
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
