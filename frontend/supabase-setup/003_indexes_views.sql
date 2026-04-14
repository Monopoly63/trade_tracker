-- ============================================================
-- Performance Indexes & Analytics Views
-- ============================================================
-- Run this SQL AFTER 002_rls_policies.sql
-- ============================================================

-- ============================================================
-- INDEXES for Query Performance
-- ============================================================

-- Trades indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id
  ON app_trades(user_id);

CREATE INDEX IF NOT EXISTS idx_trades_entry_time
  ON app_trades(entry_time DESC);

CREATE INDEX IF NOT EXISTS idx_trades_strategy_id
  ON app_trades(strategy_id);

CREATE INDEX IF NOT EXISTS idx_trades_status
  ON app_trades(status);

CREATE INDEX IF NOT EXISTS idx_trades_user_status
  ON app_trades(user_id, status);

CREATE INDEX IF NOT EXISTS idx_trades_user_entry_time
  ON app_trades(user_id, entry_time DESC);

-- Trade errors indexes
CREATE INDEX IF NOT EXISTS idx_trade_errors_trade_id
  ON app_trade_errors(trade_id);

CREATE INDEX IF NOT EXISTS idx_trade_errors_user_id
  ON app_trade_errors(user_id);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_attachments_trade_id
  ON app_attachments(trade_id);

-- Trade tags indexes
CREATE INDEX IF NOT EXISTS idx_trade_tags_trade_id
  ON app_trade_tags(trade_id);

-- Trade reviews indexes
CREATE INDEX IF NOT EXISTS idx_trade_reviews_user_id
  ON app_trade_reviews(user_id);

CREATE INDEX IF NOT EXISTS idx_trade_reviews_type
  ON app_trade_reviews(user_id, review_type);

-- Strategies indexes
CREATE INDEX IF NOT EXISTS idx_strategies_user_id
  ON app_strategies(user_id);

-- Risk rules indexes
CREATE INDEX IF NOT EXISTS idx_risk_rules_user_id
  ON app_risk_rules(user_id);

-- ============================================================
-- ANALYTICS VIEW: Trade Summary
-- ============================================================
-- This view pre-computes key analytics per user for fast dashboard loading.
-- Usage: SELECT * FROM app_trade_summary WHERE user_id = '<uid>';

CREATE OR REPLACE VIEW app_trade_summary AS
SELECT
  user_id,
  COUNT(*) AS total_trades,
  COUNT(*) FILTER (WHERE pnl_r > 0) AS winning_trades,
  COUNT(*) FILTER (WHERE pnl_r < 0) AS losing_trades,
  COUNT(*) FILTER (WHERE pnl_r = 0 OR pnl_r IS NULL) AS breakeven_trades,
  ROUND(
    COUNT(*) FILTER (WHERE pnl_r > 0)::DECIMAL /
    NULLIF(COUNT(*) FILTER (WHERE status = 'CLOSED'), 0) * 100, 2
  ) AS win_rate,
  ROUND(AVG(pnl_r) FILTER (WHERE pnl_r > 0), 2) AS avg_win_r,
  ROUND(AVG(ABS(pnl_r)) FILTER (WHERE pnl_r < 0), 2) AS avg_loss_r,
  ROUND(SUM(pnl_usd), 2) AS total_pnl_usd,
  ROUND(SUM(pnl_r), 2) AS total_pnl_r,
  ROUND(
    CASE
      WHEN SUM(ABS(pnl_r)) FILTER (WHERE pnl_r < 0) > 0
      THEN SUM(pnl_r) FILTER (WHERE pnl_r > 0) / SUM(ABS(pnl_r)) FILTER (WHERE pnl_r < 0)
      ELSE NULL
    END, 2
  ) AS profit_factor
FROM app_trades
WHERE status = 'CLOSED'
GROUP BY user_id;