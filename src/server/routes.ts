import express, { Express } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';

export async function setupRoutes(app: Express) {
  // --- Placeholder for HTTP API routes (Lobby / Login / File Upload) ---
  const apiRouter = express.Router();
  apiRouter.get('/status', (req, res) => {
    res.json({ status: 'ok' });
  });
  // You can add more API routes here as needed:
  // apiRouter.post('/login', ...);
  // apiRouter.post('/upload', ...);

  app.use('/api', apiRouter);

  // --- Serve frontend ---
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
}
