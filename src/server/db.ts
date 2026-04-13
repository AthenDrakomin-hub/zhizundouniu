import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
// __dirname of src/server/db.ts is src/server, but we want the db in the project root or same as before.
// In original server.ts, __dirname was the project root (where server.ts is).
const __dirname = path.dirname(path.dirname(path.dirname(__filename)));

let dbInstance: Database | null = null;

export async function initDB(): Promise<Database> {
  if (dbInstance) return dbInstance;

  dbInstance = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT,
      room_cards INTEGER DEFAULT 0,
      target_profit INTEGER DEFAULT 0,
      current_profit INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  return dbInstance;
}

export function getDB(): Database {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDB first.");
  }
  return dbInstance;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  avatar: string | null;
  room_cards: number;
  target_profit: number;
  current_profit: number;
  role: string;
  created_at: string;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const db = getDB();
  return await db.get<User>('SELECT * FROM users WHERE username = ?', [username]);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = getDB();
  return await db.get<User>('SELECT id, username, avatar, room_cards, target_profit, current_profit, role, created_at FROM users WHERE id = ?', [id]);
}

export async function createUser(user: Omit<User, 'created_at' | 'room_cards' | 'target_profit' | 'current_profit'> & Partial<User>): Promise<void> {
  const db = getDB();
  await db.run(
    `INSERT INTO users (id, username, password, avatar, room_cards, target_profit, current_profit, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.username,
      user.password,
      user.avatar || null,
      user.room_cards ?? 0,
      user.target_profit ?? 0,
      user.current_profit ?? 0,
      user.role || 'user'
    ]
  );
}

export async function updateUserCards(id: string, amount: number): Promise<void> {
  const db = getDB();
  await db.run('UPDATE users SET room_cards = room_cards + ? WHERE id = ?', [amount, id]);
}

export async function updateUserTargetProfit(id: string, targetProfit: number): Promise<void> {
  const db = getDB();
  await db.run('UPDATE users SET target_profit = ? WHERE id = ?', [targetProfit, id]);
}

export async function updateUserCurrentProfit(id: string, profitDelta: number): Promise<void> {
  const db = getDB();
  await db.run('UPDATE users SET current_profit = current_profit + ? WHERE id = ?', [profitDelta, id]);
}

export async function getAllUsers(): Promise<User[]> {
  const db = getDB();
  return await db.all<User[]>('SELECT id, username, avatar, room_cards, target_profit, current_profit, role, created_at FROM users ORDER BY created_at DESC');
}
