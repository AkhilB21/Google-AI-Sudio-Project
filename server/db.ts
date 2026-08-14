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

    CREATE TABLE IF NOT EXISTS ipo_stocks (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL UNIQUE,
      company_name TEXT,
      issue_price REAL NOT NULL,
      listing_date TEXT NOT NULL,
      listing_price REAL,
      all_time_high REAL NOT NULL DEFAULT 0,
      all_time_low REAL NOT NULL DEFAULT 999999,
      ipo_size TEXT,
      sector TEXT,
      exchange TEXT DEFAULT 'NSE',
      promoter_stake REAL,
      current_pe REAL,
      zone TEXT DEFAULT 'UNDER_PRESSURE',
      ipo_baseline REAL,
      days_since_listing INTEGER DEFAULT 0,
      listing_stage TEXT DEFAULT 'FRESH',
      last_zone_update TEXT,
      fetched_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ipo_zone_history (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      old_zone TEXT NOT NULL,
      new_zone TEXT NOT NULL,
      transition_type TEXT DEFAULT 'DOWNGRADE',
      cmp_at_transition REAL,
      baseline_at_transition REAL,
      transition_timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ipo_archive (
      id TEXT PRIMARY KEY,
      symbol TEXT NOT NULL,
      company_name TEXT,
      issue_price REAL NOT NULL,
      listing_date TEXT,
      listing_price REAL,
      all_time_high REAL,
      all_time_low REAL,
      ipo_size TEXT,
      sector TEXT,
      exchange TEXT,
      promoter_stake REAL,
      current_pe REAL,
      zone TEXT,
      ipo_baseline REAL,
      days_since_listing INTEGER,
      listing_stage TEXT,
      last_zone_update TEXT,
      fetched_at TEXT,
      graduated_at TEXT NOT NULL
    );
  `);

  // Seed default IPO stocks if empty (bootstrap demo data with realistic baseline prices until live scraper/signal feed updates CMP)
  const ipoCount = dbInstance.exec("SELECT COUNT(*) FROM ipo_stocks")[0]?.values[0][0] || 0;
  if (ipoCount === 0) {
    dbInstance.exec(`
      INSERT INTO ipo_stocks VALUES
      ('IPO_TATATECH', 'TATATECH', 'Tata Technologies Limited', 500.0, '2024-11-30', 1200.0, 1400.0, 920.0, '₹3,042 Cr', 'IT Services & ER&D', 'NSE', 55.3, 62.4, 'RECOVERY', 950.0, 180, 'MATURE', datetime('now', '-2 days'), datetime('now')),
      ('IPO_IREDA', 'IREDA', 'Indian Renewable Energy Dev Agency', 32.0, '2024-11-29', 50.0, 310.0, 48.0, '₹2,150 Cr', 'Renewable Financial Services', 'NSE', 75.0, 38.2, 'RECOVERY', 171.0, 185, 'MATURE', datetime('now', '-5 days'), datetime('now')),
      ('IPO_BAJAJHFL', 'BAJAJHFL', 'Bajaj Housing Finance Ltd', 70.0, '2025-09-16', 150.0, 188.5, 122.0, '₹6,560 Cr', 'Housing Finance', 'NSE', 88.7, 58.6, 'UNDER_PRESSURE', 129.25, 95, 'FRESH', datetime('now', '-1 days'), datetime('now')),
      ('IPO_PREMIERENE', 'PREMIERENE', 'Premier Energies Limited', 450.0, '2025-09-03', 991.0, 1260.0, 802.0, '₹2,830 Cr', 'Solar PV Manufacturing', 'NSE', 72.3, 44.8, 'RECOVERY', 855.0, 105, 'FRESH', datetime('now', '-4 days'), datetime('now')),
      ('IPO_WAAREEENER', 'WAAREEENER', 'Waaree Energies Limited', 1503.0, '2025-10-28', 2550.0, 3740.0, 2300.0, '₹4,321 Cr', 'Solar Energy', 'NSE', 64.2, 65.1, 'RECOVERY', 2621.5, 55, 'FRESH', datetime('now', '-3 days'), datetime('now')),
      ('IPO_SWIGGY', 'SWIGGY', 'Swiggy Limited', 390.0, '2025-11-13', 420.0, 610.0, 385.0, '₹11,327 Cr', 'E-Commerce & Quick Commerce', 'NSE', 0.0, NULL, 'UNDER_PRESSURE', 500.0, 40, 'FRESH', datetime('now', '-2 days'), datetime('now')),
      ('IPO_HYUNDAI', 'HYUNDAI', 'Hyundai Motor India Ltd', 1960.0, '2025-10-22', 1934.0, 1970.0, 1680.0, '₹27,870 Cr', 'Automobile Passenger Vehicles', 'NSE', 82.5, 24.2, 'BROKEN_IPO', 1965.0, 60, 'FRESH', datetime('now', '-10 days'), datetime('now')),
      ('IPO_NTPCGREEN', 'NTPCGREEN', 'NTPC Green Energy Ltd', 108.0, '2025-11-27', 111.5, 154.0, 102.0, '₹10,000 Cr', 'Green Energy Utilities', 'NSE', 89.0, 72.0, 'UNDER_PRESSURE', 131.0, 25, 'FRESH', datetime('now', '-1 days'), datetime('now')),
      ('IPO_OLAELEC', 'OLAELEC', 'Ola Electric Mobility Limited', 76.0, '2025-08-09', 76.0, 157.4, 62.5, '₹6,145 Cr', 'Electric 2-Wheelers', 'NSE', 36.9, NULL, 'BROKEN_IPO', 116.7, 130, 'MATURE', datetime('now', '-15 days'), datetime('now')),
      ('IPO_JYOTICNC', 'JYOTICNC', 'Jyoti CNC Automation Ltd', 331.0, '2025-01-16', 372.0, 1390.0, 370.0, '₹1,000 Cr', 'Industrial Machinery & CNC', 'NSE', 62.8, 78.4, 'RECOVERY', 860.5, 175, 'MATURE', datetime('now', '-7 days'), datetime('now')),
      ('IPO_KRNHEAT', 'KRNHEAT', 'KRN Heat Exchanger and Refrig', 220.0, '2025-10-03', 480.0, 590.0, 410.0, '₹342 Cr', 'HVAC & Heat Exchangers', 'NSE', 71.2, 52.3, 'RECOVERY', 405.0, 80, 'FRESH', datetime('now', '-2 days'), datetime('now')),
      ('IPO_DIFFUSION', 'DIFFUSION', 'Diffusion Engineers Ltd', 168.0, '2025-10-04', 188.0, 430.0, 180.0, '₹158 Cr', 'Heavy Engineering', 'NSE', 68.0, 32.5, 'NEW_HIGH', 299.0, 78, 'FRESH', datetime('now', '-1 days'), datetime('now'));
    `);

    // Seed sample zone history
    dbInstance.exec(`
      INSERT INTO ipo_zone_history VALUES
      ('ZH1', 'DIFFUSION', 'RECOVERY', 'NEW_HIGH', 'UPGRADE', 432.0, 299.0, datetime('now', '-1 days')),
      ('ZH2', 'PREMIERENE', 'UNDER_PRESSURE', 'RECOVERY', 'UPGRADE', 1140.0, 855.0, datetime('now', '-4 days')),
      ('ZH3', 'HYUNDAI', 'UNDER_PRESSURE', 'BROKEN_IPO', 'DOWNGRADE', 1740.0, 1965.0, datetime('now', '-10 days')),
      ('ZH4', 'BAJAJHFL', 'RECOVERY', 'UNDER_PRESSURE', 'DOWNGRADE', 128.0, 129.25, datetime('now', '-12 days')),
      ('ZH5', 'TATATECH', 'UNDER_PRESSURE', 'RECOVERY', 'UPGRADE', 980.5, 950.0, datetime('now', '-18 days'));
    `);
  }

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
      ('T110', 'TITAN', '2026-07-22', '2026-08-05', 3450.0, 3720.0, 7.83, 14, 'Target Hit'),
      ('T111', 'MARUTI', '2026-07-23', '2026-08-02', 12100.0, 12950.0, 7.02, 10, 'Target Hit'),
      ('T112', 'TATAMOTORS', '2026-07-24', '2026-07-30', 980.0, 935.0, -4.59, 6, 'Stop Loss'),
      ('T113', 'SUNPHARMA', '2026-07-25', '2026-08-08', 1680.0, 1810.0, 7.74, 14, 'Target Hit'),
      ('T114', 'NTPC', '2026-07-26', '2026-08-10', 390.0, 422.0, 8.21, 15, 'Target Hit'),
      ('T115', 'POWERGRID', '2026-07-27', '2026-08-07', 320.0, 312.0, -2.50, 11, 'Time Exit'),
      ('T116', 'ULTRACEMCO', '2026-07-28', '2026-08-09', 11200.0, 12050.0, 7.59, 12, 'Target Hit'),
      ('T117', 'JSWSTEEL', '2026-07-29', '2026-08-04', 920.0, 885.0, -3.80, 6, 'Stop Loss'),
      ('T118', 'COALINDIA', '2026-07-30', '2026-08-11', 490.0, 528.0, 7.76, 12, 'Target Hit'),
      ('T119', 'HCLTECH', '2026-07-31', '2026-08-12', 1580.0, 1565.0, -0.95, 12, 'Signal Exit'),
      ('T120', 'WIPRO', '2026-08-01', '2026-08-12', 510.0, 548.0, 7.45, 11, 'Target Hit');
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
