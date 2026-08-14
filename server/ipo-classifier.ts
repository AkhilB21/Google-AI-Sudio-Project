export type IPOZone = 'NEW_HIGH' | 'RECOVERY' | 'UNDER_PRESSURE' | 'BROKEN_IPO';
export type IPOStage = 'FRESH' | 'MATURE';

export interface ComputedIPOMetrics {
  ipo_baseline: number;
  zone: IPOZone;
  listing_stage: IPOStage;
  days_since_listing: number;
  distance_to_baseline_pct: number;
  distance_to_ath_pct: number;
  return_from_issue_pct: number;
  baseline_ratio: number;
  ath_recovery_pct: number;
}

/**
 * 2.3 Four-Zone Classification System
 * NEW HIGH: CMP > ATH
 * RECOVERY: Baseline < CMP <= ATH
 * UNDER PRESSURE: Issue_Price < CMP <= Baseline
 * BROKEN IPO: CMP <= Issue_Price
 */
export function classifyZone(cmp: number, issuePrice: number, ath: number): IPOZone {
  const baseline = (issuePrice + ath) / 2;
  if (cmp > ath) {
    return 'NEW_HIGH';
  } else if (cmp > baseline && cmp <= ath) {
    return 'RECOVERY';
  } else if (cmp > issuePrice && cmp <= baseline) {
    return 'UNDER_PRESSURE';
  } else {
    return 'BROKEN_IPO';
  }
}

/**
 * 2.2 Derived Metrics Calculation
 * Computes all 6 derived metrics + zone + listing stage
 */
export function computeIpoMetrics(stock: any, cmpOverride?: number): ComputedIPOMetrics {
  const issuePrice = Number(stock.issue_price) || 1;
  const ath = Math.max(Number(stock.all_time_high) || issuePrice, issuePrice);
  const cmp = cmpOverride !== undefined ? cmpOverride : Number(stock.cmp ?? stock.Close ?? stock.listing_price ?? issuePrice);

  const ipo_baseline = Number(((issuePrice + ath) / 2).toFixed(2));
  const zone = classifyZone(cmp, issuePrice, ath);

  let days_since_listing = Number(stock.days_since_listing);
  if (isNaN(days_since_listing) || days_since_listing === 0) {
    if (stock.listing_date) {
      const listDate = new Date(stock.listing_date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - listDate.getTime());
      const calendarDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      // Convert calendar days to approximate trading days (~5 trading days per 7 calendar days, approx 240 trading days/year)
      days_since_listing = Math.max(1, Math.floor(calendarDays * (5 / 7)));
    } else {
      days_since_listing = 30;
    }
  }

  const freshWindow = Number(process.env.IPO_FRESH_WINDOW_DAYS) || 120;
  const listing_stage: IPOStage = days_since_listing <= freshWindow ? 'FRESH' : 'MATURE';

  const distance_to_baseline_pct = Number((((cmp - ipo_baseline) / ipo_baseline) * 100).toFixed(1));
  const distance_to_ath_pct = Number((((cmp - ath) / ath) * 100).toFixed(1));
  const return_from_issue_pct = Number((((cmp - issuePrice) / issuePrice) * 100).toFixed(1));
  const baseline_ratio = Number((cmp / (ipo_baseline || 1)).toFixed(2));
  const ath_recovery_pct = Number(((cmp / (ath || 1)) * 100).toFixed(1));

  return {
    ipo_baseline,
    zone,
    listing_stage,
    days_since_listing,
    distance_to_baseline_pct,
    distance_to_ath_pct,
    return_from_issue_pct,
    baseline_ratio,
    ath_recovery_pct,
  };
}

export function getZoneRank(zone: IPOZone): number {
  switch (zone) {
    case 'NEW_HIGH':
      return 4;
    case 'RECOVERY':
      return 3;
    case 'UNDER_PRESSURE':
      return 2;
    case 'BROKEN_IPO':
      return 1;
    default:
      return 0;
  }
}
