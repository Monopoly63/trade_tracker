import type { Trade, AnalyticsSummary, StrategyPerformance, MonthlyPnl, SessionPerformance, ErrorAnalysis, TradeError } from './types';
import { ERROR_TYPES } from './types';

// ==================== ANALYTICS SERVICE ====================

export function computeAnalytics(trades: Trade[]): AnalyticsSummary {
  const closed = trades.filter((t) => t.status === 'CLOSED');
  const wins = closed.filter((t) => (t.pnl_r ?? 0) > 0);
  const losses = closed.filter((t) => (t.pnl_r ?? 0) < 0);

  const totalWinR = wins.reduce((s, t) => s + (t.pnl_r ?? 0), 0);
  const totalLossR = Math.abs(losses.reduce((s, t) => s + (t.pnl_r ?? 0), 0));

  // Max drawdown calculation
  let peak = 0;
  let maxDrawdown = 0;
  let cumR = 0;
  for (const t of closed.sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime())) {
    cumR += t.pnl_r ?? 0;
    if (cumR > peak) peak = cumR;
    const dd = peak - cumR;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Consecutive wins/losses
  let maxConsWins = 0;
  let maxConsLosses = 0;
  let consWins = 0;
  let consLosses = 0;
  for (const t of closed) {
    if ((t.pnl_r ?? 0) > 0) {
      consWins++;
      consLosses = 0;
      if (consWins > maxConsWins) maxConsWins = consWins;
    } else if ((t.pnl_r ?? 0) < 0) {
      consLosses++;
      consWins = 0;
      if (consLosses > maxConsLosses) maxConsLosses = consLosses;
    }
  }

  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
  const profitFactor = totalLossR > 0 ? totalWinR / totalLossR : totalWinR > 0 ? Infinity : 0;
  const avgWinR = wins.length > 0 ? totalWinR / wins.length : 0;
  const avgLossR = losses.length > 0 ? totalLossR / losses.length : 0;
  const expectancy = closed.length > 0
    ? (winRate / 100) * avgWinR - ((100 - winRate) / 100) * avgLossR
    : 0;

  return {
    totalTrades: closed.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate: parseFloat(winRate.toFixed(2)),
    profitFactor: profitFactor === Infinity ? 999 : parseFloat(profitFactor.toFixed(2)),
    avgWinR: parseFloat(avgWinR.toFixed(2)),
    avgLossR: parseFloat(avgLossR.toFixed(2)),
    totalPnlUsd: parseFloat(closed.reduce((s, t) => s + (t.pnl_usd ?? 0), 0).toFixed(2)),
    totalPnlR: parseFloat(closed.reduce((s, t) => s + (t.pnl_r ?? 0), 0).toFixed(2)),
    maxDrawdownR: parseFloat(maxDrawdown.toFixed(2)),
    maxConsecutiveWins: maxConsWins,
    maxConsecutiveLosses: maxConsLosses,
    expectancy: parseFloat(expectancy.toFixed(2)),
  };
}

export function computeStrategyPerformance(trades: Trade[]): StrategyPerformance[] {
  const closed = trades.filter((t) => t.status === 'CLOSED' && t.strategy);
  const grouped = new Map<string, Trade[]>();
  for (const t of closed) {
    const key = t.strategy_id || 'unknown';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }

  return Array.from(grouped.entries()).map(([strategyId, stTrades]) => {
    const wins = stTrades.filter((t) => (t.pnl_r ?? 0) > 0);
    const losses = stTrades.filter((t) => (t.pnl_r ?? 0) < 0);
    const totalWinR = wins.reduce((s, t) => s + (t.pnl_r ?? 0), 0);
    const totalLossR = Math.abs(losses.reduce((s, t) => s + (t.pnl_r ?? 0), 0));
    const pf = totalLossR > 0 ? totalWinR / totalLossR : totalWinR > 0 ? 999 : 0;

    return {
      strategyId,
      strategyName: stTrades[0]?.strategy?.name || 'Unknown',
      totalTrades: stTrades.length,
      winRate: parseFloat(((wins.length / stTrades.length) * 100).toFixed(2)),
      profitFactor: parseFloat(pf.toFixed(2)),
      avgR: parseFloat((stTrades.reduce((s, t) => s + (t.pnl_r ?? 0), 0) / stTrades.length).toFixed(2)),
      totalPnlR: parseFloat(stTrades.reduce((s, t) => s + (t.pnl_r ?? 0), 0).toFixed(2)),
    };
  });
}

export function computeMonthlyPnl(trades: Trade[]): MonthlyPnl[] {
  const closed = trades.filter((t) => t.status === 'CLOSED');
  const grouped = new Map<string, Trade[]>();
  for (const t of closed) {
    const d = new Date(t.entry_time);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }

  return Array.from(grouped.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, mTrades]) => {
      const wins = mTrades.filter((t) => (t.pnl_r ?? 0) > 0);
      return {
        month,
        pnlUsd: parseFloat(mTrades.reduce((s, t) => s + (t.pnl_usd ?? 0), 0).toFixed(2)),
        pnlR: parseFloat(mTrades.reduce((s, t) => s + (t.pnl_r ?? 0), 0).toFixed(2)),
        trades: mTrades.length,
        winRate: parseFloat(((wins.length / mTrades.length) * 100).toFixed(2)),
      };
    });
}

export function computeSessionPerformance(trades: Trade[]): SessionPerformance[] {
  const closed = trades.filter((t) => t.status === 'CLOSED' && t.session);
  const grouped = new Map<string, Trade[]>();
  for (const t of closed) {
    const key = t.session!;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  }

  return Array.from(grouped.entries()).map(([session, sTrades]) => {
    const wins = sTrades.filter((t) => (t.pnl_r ?? 0) > 0);
    return {
      session,
      trades: sTrades.length,
      winRate: parseFloat(((wins.length / sTrades.length) * 100).toFixed(2)),
      avgR: parseFloat((sTrades.reduce((s, t) => s + (t.pnl_r ?? 0), 0) / sTrades.length).toFixed(2)),
    };
  });
}

export function computeErrorAnalysis(errors: TradeError[]): ErrorAnalysis[] {
  const counts = new Map<string, number>();
  for (const e of errors) {
    counts.set(e.error_type, (counts.get(e.error_type) || 0) + 1);
  }

  const labels: Record<string, string> = {
    FOMO_ENTRY: 'FOMO Entry',
    EARLY_EXIT: 'Early Exit',
    LATE_EXIT: 'Late Exit',
    OVERSIZE_POSITION: 'Oversize Position',
    NO_CLEAR_SETUP: 'No Clear Setup',
    MOVED_STOP_LOSS: 'Moved Stop Loss',
    REVENGE_TRADE: 'Revenge Trade',
    IGNORED_RISK_RULE: 'Ignored Risk Rule',
    POOR_TIMING: 'Poor Timing',
    OTHER: 'Other',
  };

  return ERROR_TYPES.map((et) => ({
    errorType: et,
    count: counts.get(et) || 0,
    label: labels[et] || et,
  })).filter((e) => e.count > 0).sort((a, b) => b.count - a.count);
}

// ==================== CSV EXPORT ====================

export function exportTradesToCSV(trades: Trade[]): string {
  const headers = [
    'Date', 'Instrument', 'Direction', 'Entry Price', 'Exit Price',
    'Stop Loss', 'Take Profit', 'Position Size', 'P&L (USD)', 'P&L (R)',
    'Win/Loss', 'Strategy', 'Session', 'Setup Quality', 'Emotional State',
  ];

  const rows = trades.map((t) => [
    new Date(t.entry_time).toLocaleDateString(),
    t.instrument,
    t.direction,
    t.entry_price,
    t.exit_price ?? '',
    t.stop_loss,
    t.take_profit ?? '',
    t.position_size ?? '',
    t.pnl_usd ?? '',
    t.pnl_r ?? '',
    (t.pnl_r ?? 0) > 0 ? 'Win' : (t.pnl_r ?? 0) < 0 ? 'Loss' : 'Break Even',
    t.strategy?.name ?? '',
    t.session ?? '',
    t.setup_quality ?? '',
    t.emotional_state ?? '',
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
  return csvContent;
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ==================== FORMATTERS ====================

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatR(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}R`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}