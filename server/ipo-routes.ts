import { Express, Request, Response } from 'express';
import { Database } from 'sql.js';
import { computeIpoMetrics, IPOZone } from './ipo-classifier';
import { syncIPODataToDatabase, fetchAllIPOData } from './ipo-scraper';
import { graduateStock, checkGraduations } from './ipo-graduator';
import { saveDb } from './db';

export function registerIPORoutes(app: Express, getDbInstance: () => Database, getSignalRows?: () => any[]) {
  // Helper to merge cross-system scores if stock is in Google Sheet signal rows
  const enrichWithSignalData = (ipo: any) => {
    if (!getSignalRows) return ipo;
    const signalRows = getSignalRows();
    const match = signalRows.find((s) => s.Symbol?.toUpperCase() === ipo.symbol?.toUpperCase());
    if (match) {
      return {
        ...ipo,
        Apollo_Score: match.Apollo_Score,
        LayerSignal_Score: match.LayerSignal_Score,
        Apollo_Action: match.Apollo_Action,
        LayerSignal_Action: match.LayerSignal_Action,
        Quality: match.Quality,
        Bucket: match.Bucket,
        Gates: match.Gates,
        RSI21: match.RSI21,
        RSI36: match.RSI36,
        ADX: match.ADX,
        ATR_Pct: match.ATR_Pct,
      };
    }
    return ipo;
  };

  /**
   * GET /api/ipo/stocks
   * Query params: zone, sector, stage, sort, order
   */
  app.get('/api/ipo/stocks', (req: Request, res: Response) => {
    try {
      const db = getDbInstance();
      const { zone, sector, stage, sort, order } = req.query;

      const stmt = db.prepare('SELECT * FROM ipo_stocks');
      const rows: any[] = [];

      while (stmt.step()) {
        const raw = stmt.getAsObject();
        // Live price check
        const liveCmp = Number(raw.cmp ?? raw.listing_price ?? raw.issue_price);
        const metrics = computeIpoMetrics(raw, liveCmp);

        const fullStock = enrichWithSignalData({
          id: String(raw.id || `IPO_${raw.symbol}`),
          symbol: String(raw.symbol),
          company_name: String(raw.company_name || raw.symbol),
          issue_price: Number(raw.issue_price),
          listing_date: String(raw.listing_date),
          listing_price: Number(raw.listing_price || raw.issue_price),
          all_time_high: Number(raw.all_time_high),
          all_time_low: Number(raw.all_time_low),
          ipo_size: String(raw.ipo_size || '₹1,000 Cr'),
          sector: String(raw.sector || 'Diversified'),
          exchange: String(raw.exchange || 'NSE'),
          promoter_stake: raw.promoter_stake !== null ? Number(raw.promoter_stake) : null,
          current_pe: raw.current_pe !== null ? Number(raw.current_pe) : null,
          cmp: liveCmp,
          ...metrics,
        });

        // Filter checks
        if (zone && fullStock.zone !== String(zone).toUpperCase()) continue;
        if (sector && fullStock.sector.toLowerCase() !== String(sector).toLowerCase()) continue;
        if (stage && fullStock.listing_stage !== String(stage).toUpperCase()) continue;

        rows.push(fullStock);
      }
      stmt.free();

      // Sorting
      if (sort) {
        const field = String(sort);
        const isDesc = String(order).toLowerCase() === 'desc';
        rows.sort((a, b) => {
          const valA = a[field] ?? 0;
          const valB = b[field] ?? 0;
          if (typeof valA === 'string') {
            return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
          }
          return isDesc ? valB - valA : valA - valB;
        });
      } else {
        // Default sorting: Distance to Baseline % ascending (most undervalued first)
        rows.sort((a, b) => a.distance_to_baseline_pct - b.distance_to_baseline_pct);
      }

      res.json(rows);
    } catch (err: any) {
      console.error('Error in GET /api/ipo/stocks:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/ipo/stocks/:symbol
   */
  app.get('/api/ipo/stocks/:symbol', (req: Request, res: Response) => {
    try {
      const db = getDbInstance();
      const symbol = req.params.symbol.toUpperCase();
      const stmt = db.prepare('SELECT * FROM ipo_stocks WHERE symbol = ?');
      stmt.bind([symbol]);

      if (!stmt.step()) {
        stmt.free();
        return res.status(404).json({ error: `IPO stock ${symbol} not found` });
      }

      const raw = stmt.getAsObject();
      stmt.free();

      const liveCmp = Number(raw.cmp ?? raw.listing_price ?? raw.issue_price);
      const metrics = computeIpoMetrics(raw, liveCmp);

      const fullStock = enrichWithSignalData({
        id: String(raw.id || `IPO_${raw.symbol}`),
        symbol: String(raw.symbol),
        company_name: String(raw.company_name || raw.symbol),
        issue_price: Number(raw.issue_price),
        listing_date: String(raw.listing_date),
        listing_price: Number(raw.listing_price || raw.issue_price),
        all_time_high: Number(raw.all_time_high),
        all_time_low: Number(raw.all_time_low),
        ipo_size: String(raw.ipo_size || '₹1,000 Cr'),
        sector: String(raw.sector || 'Diversified'),
        exchange: String(raw.exchange || 'NSE'),
        promoter_stake: raw.promoter_stake !== null ? Number(raw.promoter_stake) : null,
        current_pe: raw.current_pe !== null ? Number(raw.current_pe) : null,
        cmp: liveCmp,
        ...metrics,
      });

      res.json(fullStock);
    } catch (err: any) {
      console.error('Error in GET /api/ipo/stocks/:symbol:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/ipo/summary
   */
  app.get('/api/ipo/summary', (req: Request, res: Response) => {
    try {
      const db = getDbInstance();
      const stmt = db.prepare('SELECT * FROM ipo_stocks');
      const stocks: any[] = [];

      while (stmt.step()) {
        const raw = stmt.getAsObject();
        const liveCmp = Number(raw.cmp ?? raw.listing_price ?? raw.issue_price);
        const metrics = computeIpoMetrics(raw, liveCmp);
        stocks.push({
          symbol: String(raw.symbol),
          ...metrics,
        });
      }
      stmt.free();

      const total = stocks.length;
      const zones = {
        new_high: 0,
        recovery: 0,
        under_pressure: 0,
        broken_ipo: 0,
      };
      const stages = {
        fresh: 0,
        mature: 0,
      };

      let sumReturn = 0;
      let bestPerformer: { symbol: string; return_pct: number } | null = null;
      let worstPerformer: { symbol: string; return_pct: number } | null = null;

      for (const s of stocks) {
        if (s.zone === 'NEW_HIGH') zones.new_high++;
        else if (s.zone === 'RECOVERY') zones.recovery++;
        else if (s.zone === 'UNDER_PRESSURE') zones.under_pressure++;
        else if (s.zone === 'BROKEN_IPO') zones.broken_ipo++;

        if (s.listing_stage === 'FRESH') stages.fresh++;
        else stages.mature++;

        sumReturn += s.return_from_issue_pct;

        if (!bestPerformer || s.return_from_issue_pct > bestPerformer.return_pct) {
          bestPerformer = { symbol: s.symbol, return_pct: s.return_from_issue_pct };
        }
        if (!worstPerformer || s.return_from_issue_pct < worstPerformer.return_pct) {
          worstPerformer = { symbol: s.symbol, return_pct: s.return_from_issue_pct };
        }
      }

      const avg_return_from_issue = total > 0 ? Number((sumReturn / total).toFixed(1)) : 0;

      res.json({
        total,
        zones,
        stages,
        avg_return_from_issue,
        best_performer: bestPerformer,
        worst_performer: worstPerformer,
        last_updated: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Error in GET /api/ipo/summary:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/ipo/zone-history
   */
  app.get('/api/ipo/zone-history', (req: Request, res: Response) => {
    try {
      const db = getDbInstance();
      const stmt = db.prepare('SELECT * FROM ipo_zone_history ORDER BY transition_timestamp DESC LIMIT 100');
      const list: any[] = [];
      while (stmt.step()) {
        list.push(stmt.getAsObject());
      }
      stmt.free();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/ipo/zone-history/:symbol
   */
  app.get('/api/ipo/zone-history/:symbol', (req: Request, res: Response) => {
    try {
      const db = getDbInstance();
      const symbol = req.params.symbol.toUpperCase();
      const stmt = db.prepare('SELECT * FROM ipo_zone_history WHERE symbol = ? ORDER BY transition_timestamp DESC');
      stmt.bind([symbol]);
      const list: any[] = [];
      while (stmt.step()) {
        list.push(stmt.getAsObject());
      }
      stmt.free();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/ipo/refresh
   * Manual data refresh trigger
   */
  app.post('/api/ipo/refresh', async (req: Request, res: Response) => {
    const startTime = Date.now();
    try {
      const db = getDbInstance();
      const priceMap = new Map<string, number>();
      if (getSignalRows) {
        for (const row of getSignalRows()) {
          if (row.Symbol && row.CMP) {
            priceMap.set(row.Symbol.toUpperCase(), row.CMP);
          }
        }
      }

      const count = await syncIPODataToDatabase(db, priceMap);
      const duration_ms = Date.now() - startTime;

      res.json({
        success: true,
        count,
        source: process.env.IPO_PRIMARY_SOURCE || 'chittorgarh',
        duration_ms,
      });
    } catch (err: any) {
      console.error('Error refreshing IPO data:', err);
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * POST /api/ipo/graduate/:symbol
   * Force graduate single stock
   */
  app.post('/api/ipo/graduate/:symbol', (req: Request, res: Response) => {
    try {
      const db = getDbInstance();
      const symbol = req.params.symbol.toUpperCase();
      const result = graduateStock(db, symbol);
      if (!result) {
        return res.status(404).json({ error: `Stock ${symbol} not found in IPO active universe` });
      }
      res.json({
        success: true,
        id: result.id,
        symbol,
        graduated_at: result.graduated_at,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * GET /api/ipo/archive
   */
  app.get('/api/ipo/archive', (req: Request, res: Response) => {
    try {
      const db = getDbInstance();
      const stmt = db.prepare('SELECT * FROM ipo_archive ORDER BY graduated_at DESC');
      const list: any[] = [];
      while (stmt.step()) {
        list.push(stmt.getAsObject());
      }
      stmt.free();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
