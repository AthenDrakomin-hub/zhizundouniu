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
  
  return dbInstance;
}

export function getDB(): Database {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call initDB first.");
  }
  return dbInstance;
}
