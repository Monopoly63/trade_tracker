// ==================== CONSTANTS ====================

export const TRADE_DIRECTIONS = ['LONG', 'SHORT'] as const;
export const TRADE_SESSIONS = ['ASIA', 'LONDON', 'NEW_YORK', 'OVERLAP'] as const;
export const TRADE_STATUSES = ['OPEN', 'CLOSED', 'CANCELLED'] as const;
export const EMOTIONAL_STATES = ['CALM', 'ANXIOUS', 'CONFIDENT', 'FOMO', 'REVENGE', 'NEUTRAL'] as const;
export const ERROR_TYPES = [
  'FOMO_ENTRY', 'EARLY_EXIT', 'LATE_EXIT', 'OVERSIZE_POSITION',
  'NO_CLEAR_SETUP', 'MOVED_STOP_LOSS', 'REVENGE_TRADE',
  'IGNORED_RISK_RULE', 'POOR_TIMING', 'OTHER',
] as const;
export const TIMEFRAMES = ['1M', '5M', '15M', '1H', '4H', '1D', '1W'] as const;
export const ATTACHMENT_TYPES = ['BEFORE', 'AFTER', 'DURING', 'NOTE'] as const;

export type TradeDirection = (typeof TRADE_DIRECTIONS)[number];
export type TradeSession = (typeof TRADE_SESSIONS)[number];
export type TradeStatus = (typeof TRADE_STATUSES)[number];
export type EmotionalState = (typeof EMOTIONAL_STATES)[number];
export type ErrorType = (typeof ERROR_TYPES)[number];
export type Timeframe = (typeof TIMEFRAMES)[number];
export type AttachmentType = (typeof ATTACHMENT_TYPES)[number];

// ==================== DATABASE TYPES ====================

export interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  rules: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RiskRule {
  id: string;
  user_id: string;
  max_risk_per_trade: number;
  max_daily_loss: number | null;
  max_weekly_loss: number | null;
  max_consecutive_losses: number;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  strategy_id: string | null;
  instrument: string;
  direction: TradeDirection;
  status: TradeStatus;
  entry_time: string;
  exit_time: string | null;
  session: TradeSession | null;
  timeframe: string | null;
  entry_price: number;
  exit_price: number | null;
  stop_loss: number;
  take_profit: number | null;
  position_size: number | null;
  planned_risk_percent: number | null;
  actual_risk_percent: number | null;
  planned_rr: number | null;
  actual_rr: number | null;
  pnl_usd: number | null;
  pnl_r: number | null;
  entry_reason: string | null;
  exit_reason: string | null;
  market_condition: string | null;
  setup_quality: number | null;
  emotional_state: EmotionalState | null;
  followed_plan: boolean;
  psychological_notes: string | null;
  is_reviewed: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  strategy?: { id: string; name: string } | null;
}

export interface TradeError {
  id: string;
  trade_id: string;
  user_id: string;
  error_type: ErrorType;
  description: string | null;
  created_at: string;
}

export interface TradeTag {
  id: string;
  trade_id: string;
  user_id: string;
  tag: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  trade_id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  attachment_type: AttachmentType | null;
  created_at: string;
  signed_url?: string;
}

export interface TradeReview {
  id: string;
  user_id: string;
  review_type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  period_start: string;
  period_end: string;
  total_trades: number | null;
  win_rate: number | null;
  pnl_usd: number | null;
  pnl_r: number | null;
  lessons_learned: string | null;
  improvement_goals: string | null;
  risk_compliance_percent: number | null;
  overall_rating: number | null;
  created_at: string;
}

// ==================== FORM TYPES ====================

export interface TradeFormData {
  instrument: string;
  direction: TradeDirection;
  entry_time: string;
  exit_time?: string;
  session?: TradeSession;
  timeframe?: string;
  entry_price: number;
  exit_price?: number;
  stop_loss: number;
  take_profit?: number;
  position_size?: number;
  planned_risk_percent?: number;
  strategy_id?: string;
  entry_reason?: string;
  exit_reason?: string;
  market_condition?: string;
  setup_quality?: number;
  emotional_state?: EmotionalState;
  followed_plan?: boolean;
  psychological_notes?: string;
}

export interface TradeFilters {
  status?: TradeStatus;
  direction?: TradeDirection;
  session?: TradeSession;
  instrument?: string;
  strategy_id?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ==================== ANALYTICS TYPES ====================

export interface AnalyticsSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  avgWinR: number;
  avgLossR: number;
  totalPnlUsd: number;
  totalPnlR: number;
  maxDrawdownR: number;
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  expectancy: number;
}

export interface StrategyPerformance {
  strategyId: string;
  strategyName: string;
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  avgR: number;
  totalPnlR: number;
}

export interface MonthlyPnl {
  month: string;
  pnlUsd: number;
  pnlR: number;
  trades: number;
  winRate: number;
}

export interface SessionPerformance {
  session: string;
  trades: number;
  winRate: number;
  avgR: number;
}

export interface ErrorAnalysis {
  errorType: ErrorType;
  count: number;
  label: string;
}