-- ============================================================
-- Row Level Security Policies
-- ============================================================
-- Run this SQL AFTER 001_initial_schema.sql
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE app_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_risk_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_trade_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_trade_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_trade_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Strategies Policies
-- ============================================================
CREATE POLICY "Users can view their own strategies"
  ON app_strategies FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own strategies"
  ON app_strategies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies"
  ON app_strategies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies"
  ON app_strategies FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Risk Rules Policies
-- ============================================================
CREATE POLICY "Users can view their own risk rules"
  ON app_risk_rules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own risk rules"
  ON app_risk_rules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own risk rules"
  ON app_risk_rules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own risk rules"
  ON app_risk_rules FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Trades Policies
-- ============================================================
CREATE POLICY "Users can view their own trades"
  ON app_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
  ON app_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
  ON app_trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trades"
  ON app_trades FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Trade Errors Policies
-- ============================================================
CREATE POLICY "Users can view their own trade errors"
  ON app_trade_errors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade errors"
  ON app_trade_errors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade errors"
  ON app_trade_errors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trade errors"
  ON app_trade_errors FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Trade Tags Policies
-- ============================================================
CREATE POLICY "Users can view their own trade tags"
  ON app_trade_tags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade tags"
  ON app_trade_tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade tags"
  ON app_trade_tags FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trade tags"
  ON app_trade_tags FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Attachments Policies
-- ============================================================
CREATE POLICY "Users can view their own attachments"
  ON app_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attachments"
  ON app_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attachments"
  ON app_attachments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attachments"
  ON app_attachments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Trade Reviews Policies
-- ============================================================
CREATE POLICY "Users can view their own trade reviews"
  ON app_trade_reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trade reviews"
  ON app_trade_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trade reviews"
  ON app_trade_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trade reviews"
  ON app_trade_reviews FOR DELETE
  USING (auth.uid() = user_id);