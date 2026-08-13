import { SignalStock, QualityLevel, RiskLevel } from '../types';

export function getQualityLevel(stock: SignalStock): QualityLevel {
  const action = (stock.LayerSignal_Action || stock.Apollo_Action || '').toUpperCase();
  if (action !== 'ENTRY') return 'N/A';

  const score = stock.LayerSignal_Score || 0;
  const ep = stock.Exit_Pressure || 0;

  if (score >= 85 && ep < 30) return 'STRONG';
  if (score >= 75 && ep < 50) return 'GOOD';
  if (score >= 60 && ep < 60) return 'MODERATE';
  return 'WEAK';
}

export function getRiskLevel(stock: SignalStock): RiskLevel {
  const action = (stock.LayerSignal_Action || stock.Apollo_Action || '').toUpperCase();

  if (action === 'HOLD') return 'IN TRADE';
  if (action === 'ENTRY') {
    const diff = (stock.LayerSignal_Score || 0) - (stock.Exit_Pressure || 0);
    if (diff >= 50) return 'LOW RISK';
    if (diff >= 25) return 'MEDIUM';
    return 'HIGH RISK';
  }
  return 'N/A';
}

export function formatCurrencyINR(val: number): string {
  if (isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatLargeNumber(val: number): string {
  if (isNaN(val) || val === 0) return '0';
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return val.toLocaleString('en-IN');
}
