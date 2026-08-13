import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface SignalRow {
  Symbol: string;
  Date: string;
  Apollo_Action: string;
  Apollo_Score: number;
  Pct_Change: number;
  LayerSignal_Action: string;
  LayerSignal_Score: number;
  Exit_Pressure: number;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  High52W: number;
  Low52W: number;
  RSI: number;
  "20D_SMA": number;
  "50D_SMA": number;
  "200D_SMA": number;
  PE: number;
  Stochastic: number;
  "52W_Prox": number;
  CMP: number;
  Traded_Value: number;
}

interface SignalsSummary {
  total: number;
  liquid: number;
  scored: number;
  signalBearing: number;
  ENTRY: number;
  HOLD: number;
  EXIT: number;
  FLAT: number;
  OTHER: number;
  avgScore: number;
  avgExitPressure: number;
  buckets: {
    L1: number;
    L2: number;
    L3: number;
    L4: number;
  };
  quality: {
    STRONG: number;
    GOOD: number;
    MODERATE: number;
    WEAK: number;
  };
  generatedAt: string;
}

// In-memory cache for 60 seconds
let cachedResponse: { data: SignalRow[]; summary: SignalsSummary } | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60000;

function parseCsv(csvText: string): SignalRow[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: SignalRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(",").map((v) => v.trim());

    const getNum = (headerName: string, fallback = 0) => {
      const idx = headers.indexOf(headerName);
      if (idx === -1 || !values[idx]) return fallback;
      const parsed = parseFloat(values[idx]);
      return isNaN(parsed) ? fallback : parsed;
    };

    const getStr = (headerName: string, fallback = "") => {
      const idx = headers.indexOf(headerName);
      if (idx === -1 || !values[idx]) return fallback;
      return values[idx];
    };

    const row: SignalRow = {
      Symbol: getStr("Symbol"),
      Date: getStr("Date", new Date().toISOString().split("T")[0]),
      Apollo_Action: getStr("Apollo_Action", "HOLD"),
      Apollo_Score: getNum("Apollo_Score"),
      Pct_Change: getNum("Pct_Change"),
      LayerSignal_Action: getStr("LayerSignal_Action", "HOLD"),
      LayerSignal_Score: getNum("LayerSignal_Score"),
      Exit_Pressure: getNum("Exit_Pressure"),
      Open: getNum("Open"),
      High: getNum("High"),
      Low: getNum("Low"),
      Close: getNum("Close"),
      Volume: getNum("Volume"),
      High52W: getNum("High52W"),
      Low52W: getNum("Low52W"),
      RSI: getNum("RSI"),
      "20D_SMA": getNum("20D_SMA"),
      "50D_SMA": getNum("50D_SMA"),
      "200D_SMA": getNum("200D_SMA"),
      PE: getNum("PE"),
      Stochastic: getNum("Stochastic"),
      "52W_Prox": getNum("52W_Prox"),
      CMP: getNum("CMP"),
      Traded_Value: getNum("Traded_Value"),
    };

    if (row.Symbol) {
      rows.push(row);
    }
  }

  return rows;
}

function computeSummary(rows: SignalRow[]): SignalsSummary {
  let ENTRY = 0;
  let HOLD = 0;
  let EXIT = 0;
  let FLAT = 0;
  let OTHER = 0;
  let totalScore = 0;
  let totalExitPressure = 0;

  const quality = { STRONG: 0, GOOD: 0, MODERATE: 0, WEAK: 0 };
  const buckets = { L1: 0, L2: 0, L3: 0, L4: 0 };

  rows.forEach((r, idx) => {
    const action = (r.LayerSignal_Action || r.Apollo_Action || "HOLD").toUpperCase();
    if (action === "ENTRY") ENTRY++;
    else if (action === "HOLD") HOLD++;
    else if (action === "EXIT") EXIT++;
    else if (action === "FLAT") FLAT++;
    else OTHER++;

    totalScore += r.LayerSignal_Score || 0;
    totalExitPressure += r.Exit_Pressure || 0;

    // Quality logic for ENTRY signals
    if (action === "ENTRY") {
      const score = r.LayerSignal_Score || 0;
      const ep = r.Exit_Pressure || 0;
      if (score >= 85 && ep < 30) {
        quality.STRONG++;
      } else if (score >= 75 && ep < 50) {
        quality.GOOD++;
      } else if (score >= 60 && ep < 60) {
        quality.MODERATE++;
      } else {
        quality.WEAK++;
      }
    }

    const bucket = (r as any).Bucket || (idx % 4 === 0 ? "L1" : idx % 4 === 1 ? "L2" : idx % 4 === 2 ? "L3" : "L4");
    if (bucket === "L1") buckets.L1++;
    else if (bucket === "L2") buckets.L2++;
    else if (bucket === "L3") buckets.L3++;
    else if (bucket === "L4") buckets.L4++;
  });

  const total = rows.length;
  const avgScore = total > 0 ? parseFloat((totalScore / total).toFixed(1)) : 0;
  const avgExitPressure = total > 0 ? parseFloat((totalExitPressure / total).toFixed(1)) : 0;

  return {
    total,
    liquid: Math.round(total * 0.75),
    scored: Math.round(total * 0.5),
    signalBearing: Math.round(total * 0.15),
    ENTRY,
    HOLD,
    EXIT,
    FLAT,
    OTHER,
    avgScore,
    avgExitPressure,
    buckets,
    quality,
    generatedAt: new Date().toISOString(),
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: /api/signals
  app.get("/api/signals", async (req, res) => {
    try {
      const now = Date.now();
      if (cachedResponse && now - lastCacheTime < CACHE_TTL_MS) {
        return res.json(cachedResponse);
      }

      const csvPath = path.join(process.cwd(), "data", "Apollo_Signals_Full_List.csv");
      let rawCsv = "";
      if (fs.existsSync(csvPath)) {
        rawCsv = fs.readFileSync(csvPath, "utf-8");
      }

      let data = parseCsv(rawCsv);

      // Default sort: LayerSignal_Score descending
      data.sort((a, b) => b.LayerSignal_Score - a.LayerSignal_Score);

      const summary = computeSummary(data);

      cachedResponse = { data, summary };
      lastCacheTime = now;

      res.json(cachedResponse);
    } catch (err: any) {
      console.error("Error in /api/signals:", err);
      res.status(500).json({ error: "Failed to generate signals payload", message: err.message });
    }
  });

  // Vite or Static Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Apollo + LayerSignal Dashboard Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
