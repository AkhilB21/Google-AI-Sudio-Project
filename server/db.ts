import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const dbFilePath = path.join(process.cwd(), 'data', 'apollo_layer.db');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  // Ensure data directory exists
  const dataDir = path.dirname(dbFilePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(dbFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(dbFilePath);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Failed to load existing SQLite database file, initializing fresh database:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Initialize tables
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      entryDate TEXT NOT NULL,
      exitDate TEXT NOT NULL,
      entryPrice REAL NOT NULL,
      exitPrice REAL NOT NULL,
      pnlPct REAL NOT NULL,
      holdingDays INTEGER NOT NULL,
      exitMode TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT NOT NULL,
      target REAL NOT NULL,
      stopLoss REAL NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      condition TEXT NOT NULL,
      channel TEXT NOT NULL,
      enabled INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alert_logs (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      type TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      symbol TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      time TEXT NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL
    );
  `);

  // Seed default trades if empty
  const tradesCount = dbInstance.exec("SELECT COUNT(*) FROM trades")[0]?.values[0][0] || 0;
  if (tradesCount === 0) {
    dbInstance.exec(`
      INSERT INTO trades VALUES
      ('T101', 'RELIANCE', '2026-07-01', '2026-07-12', 2850.0, 3080.0, 8.07, 11, 'Target Hit'),
      ('T102', 'TCS', '2026-07-03', '2026-07-15', 3820.0, 4120.0, 7.85, 12, 'Target Hit'),
      ('T103', 'INFY', '2026-07-05', '2026-07-10', 1780.0, 1690.0, -5.06, 5, 'Stop Loss'),
      ('T104', 'HDFCBANK', '2026-07-08', '2026-07-22', 1620.0, 1750.0, 8.02, 14, 'Target Hit'),
      ('T105', 'ICICIBANK', '2026-07-10', '2026-07-25', 1150.0, 1240.0, 7.83, 15, 'Target Hit'),
      ('T106', 'BHARTIARTL', '2026-07-12', '2026-07-18', 1420.0, 1360.0, -4.23, 6, 'Stop Loss'),
      ('T107', 'SBIN', '2026-07-15', '2026-07-28', 840.0, 910.0, 8.33, 13, 'Target Hit'),
      ('T108', 'LT', '2026-07-18', '2026-08-01', 3620.0, 3910.0, 8.01, 14, 'Target Hit'),
      ('T109', 'AXISBANK', '2026-07-20', '2026-07-26', 1240.0, 1190.0, -4.03, 6, 'Stop Loss'),
      ('T110', 'TITAN', '2026-07-22', '2026-08-05', 3450.0, 3720.0, 7.83, 14, 'Target Hit');
    `);
  }

  // Seed default rules if empty
  const rulesCount = dbInstance.exec("SELECT COUNT(*) FROM alert_rules")[0]?.values[0][0] || 0;
  if (rulesCount === 0) {
    dbInstance.exec(`
      INSERT INTO alert_rules VALUES
      ('r1', 'L1 Breakout Alert', 'Stock enters L1 Bucket && RSI21 > 60', 'Push, Email', 1),
      ('r2', 'Throwback Pattern Alert', 'Stock in L2 Bucket && Price pullback <= 2%', 'Push', 1),
      ('r3', 'Market Regime Shift', 'Nifty Index crosses 50D SMA', 'Email, Telegram', 1);
    `);
  }

  // Seed default alerts if empty
  const alertsCount = dbInstance.exec("SELECT COUNT(*) FROM alert_logs")[0]?.values[0][0] || 0;
  if (alertsCount === 0) {
    dbInstance.exec(`
      INSERT INTO alert_logs VALUES
      ('A001', 'LayerSignal', 'Entry', '14:30:12', 'RELIANCE', 'L1 Primary Breakout Signal', 'RELIANCE cleared 20D SMA with RSI21 at 68.4. Score: 88.5/100', 0),
      ('A002', 'Apollo', 'Regime', '14:22:05', 'TCS', 'Apollo Regime Upgrade', 'TCS backtest profile validated. 5-Gate checks passed.', 0),
      ('A003', 'LayerSignal', 'Entry', '13:58:40', 'INFY', 'L2 Throwback Re-entry', 'INFY confirmed support at 50D SMA with volume turnover surge.', 1),
      ('A004', 'System', 'System', '13:45:00', NULL, 'Database Sync Completed', '297 symbols ingested from live Google Sheet feed.', 1);
    `);
  }

  saveDb();
  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}
