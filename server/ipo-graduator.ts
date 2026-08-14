import { Database } from 'sql.js';
import { saveDb } from './db';

export function graduateStock(db: Database, symbol: string): { success: boolean; id: string; graduated_at: string } | null {
  try {
    const query = db.prepare('SELECT * FROM ipo_stocks WHERE symbol = ?');
    query.bind([symbol.toUpperCase()]);

    if (!query.step()) {
      query.free();
      return null;
    }

    const row = query.getAsObject();
    query.free();

    const graduated_at = new Date().toISOString();
    const id = `IPO_GRAD_${Date.now()}_${row.symbol}`;

    // Insert into ipo_archive
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO ipo_archive (
        id, symbol, company_name, issue_price, listing_date, listing_price,
        all_time_high, all_time_low, ipo_size, sector, exchange, promoter_stake,
        current_pe, zone, ipo_baseline, days_since_listing, listing_stage,
        last_zone_update, fetched_at, graduated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run([
      id,
      row.symbol,
      row.company_name || null,
      row.issue_price,
      row.listing_date,
      row.listing_price || null,
      row.all_time_high,
      row.all_time_low,
      row.ipo_size || null,
      row.sector || null,
      row.exchange || 'NSE',
      row.promoter_stake || null,
      row.current_pe || null,
      row.zone || 'RECOVERY',
      row.ipo_baseline || ((Number(row.issue_price) + Number(row.all_time_high)) / 2),
      row.days_since_listing || 240,
      row.listing_stage || 'MATURE',
      row.last_zone_update || null,
      row.fetched_at || null,
      graduated_at,
    ]);
    insertStmt.free();

    // Delete from ipo_stocks
    const delStmt = db.prepare('DELETE FROM ipo_stocks WHERE symbol = ?');
    delStmt.run([symbol.toUpperCase()]);
    delStmt.free();

    // Add alert notification
    const alertId = `A_IPO_GRAD_${Date.now()}`;
    const alertStmt = db.prepare(`
      INSERT INTO alert_logs (id, source, type, timestamp, symbol, title, message, read)
      VALUES (?, 'System', 'System', ?, ?, ?, ?, 0)
    `);
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    alertStmt.run([
      alertId,
      timeStr,
      row.symbol,
      `[IPO Graduated] ${row.symbol} graduated to main universe`,
      `${row.symbol} completed ${row.days_since_listing || 240} trading days. IPO metadata archived; stock transitioned to full Apollo & LayerSignal universe.`,
    ]);
    alertStmt.free();

    saveDb();
    return { success: true, id, graduated_at };
  } catch (err) {
    console.error('Error graduating IPO stock:', err);
    return null;
  }
}

export function checkGraduations(db: Database): number {
  try {
    const graduationDays = Number(process.env.IPO_GRADUATION_DAYS) || 240;
    const stmt = db.prepare('SELECT symbol FROM ipo_stocks WHERE days_since_listing >= ?');
    stmt.bind([graduationDays]);

    const toGraduate: string[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      if (row.symbol) toGraduate.push(String(row.symbol));
    }
    stmt.free();

    let count = 0;
    for (const sym of toGraduate) {
      const res = graduateStock(db, sym);
      if (res?.success) count++;
    }

    if (count > 0) {
      console.log(`[IPO Graduator] Auto-graduated ${count} IPO stocks to archive.`);
    }
    return count;
  } catch (err) {
    console.error('Error checking IPO graduations:', err);
    return 0;
  }
}
