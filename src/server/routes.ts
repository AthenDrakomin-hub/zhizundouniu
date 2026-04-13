import express, { Express } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import jwt from 'jsonwebtoken';
import {
  getUserByUsername,
  getUserById,
  createUser,
  updateUserCards,
  updateUserTargetProfit,
  getAllUsers
} from './db.js';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
const ADMIN_KEY = process.env.ADMIN_KEY || 'admin123';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function setupRoutes(app: Express) {
  app.use(express.json());

  const apiRouter = express.Router();
  
  apiRouter.get('/status', (req, res) => {
    res.json({ status: 'ok' });
  });

  apiRouter.post('/wechat-login', async (req, res) => {
    try {
      const isBoy = Math.random() > 0.5;
      const avatarUrl = isBoy ? '/images/ui/head_boy.png' : '/images/ui/head_girl.png';
      
      const randomId = Math.random().toString(36).substring(2, 8);
      const username = `微信用户_${randomId}`;
      const password = Math.random().toString(36).substring(2, 10);
      const userId = 'user_' + Date.now().toString() + '_' + randomId;

      await createUser({
        id: userId,
        username,
        password: hashPassword(password),
        avatar: avatarUrl,
        room_cards: 0,
        target_profit: 0,
        current_profit: 0,
        role: 'user'
      });

      const user = await getUserByUsername(username);
      if (!user) throw new Error('Failed to create wechat user');

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({ message: 'Login successful', token, user });
    } catch (error: any) {
      console.error('WeChat login error:', error);
      res.status(500).json({ error: error.message || 'Server error' });
    }
  });

  // --- Auth APIs ---
  apiRouter.post('/register', async (req, res) => {
    try {
      const { username, password, avatar } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const existingUser = await getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const userId = Math.random().toString(36).substring(2, 10);
      const hashedPassword = hashPassword(password);
      
      await createUser({
        id: userId,
        username,
        password: hashedPassword,
        avatar: avatar || null,
        role: 'user'
      });

      const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ token, user: { id: userId, username, avatar, role: 'user', room_cards: 0 } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post('/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }

      const user = await getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const hashedPassword = hashPassword(password);
      if (user.password !== hashedPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      const { password: _, ...userWithoutPassword } = user;
      res.json({ token, user: userWithoutPassword });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.get('/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      const user = await getUserById(decoded.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ user });
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  });

  // --- Admin APIs ---
  const adminAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
    if (adminKey !== ADMIN_KEY) {
      return res.status(403).json({ error: 'Forbidden: Invalid Admin Key' });
    }
    next();
  };

  apiRouter.get('/admin/users', adminAuthMiddleware, async (req, res) => {
    try {
      const users = await getAllUsers();
      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post('/admin/users/:id/cards', adminAuthMiddleware, async (req, res) => {
    try {
      const userId = req.params.id;
      const { amount } = req.body;
      if (typeof amount !== 'number') {
        return res.status(400).json({ error: 'Amount must be a number' });
      }
      
      const user = await getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await updateUserCards(userId, amount);
      const updatedUser = await getUserById(userId);
      res.json({ user: updatedUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  apiRouter.post('/admin/users/:id/target-profit', adminAuthMiddleware, async (req, res) => {
    try {
      const userId = req.params.id;
      const { targetProfit } = req.body;
      if (typeof targetProfit !== 'number') {
        return res.status(400).json({ error: 'targetProfit must be a number' });
      }

      const user = await getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await updateUserTargetProfit(userId, targetProfit);
      const updatedUser = await getUserById(userId);
      res.json({ user: updatedUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

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
