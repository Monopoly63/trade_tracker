-- ============================================================
-- Trading Journal & Risk Analysis System
-- Initial Schema Migration
-- ============================================================
-- Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STRATEGIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS app_strategies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RISK RULES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS app_risk_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_risk_per_trade DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  max_daily_loss DECIMAL(5,2),
  max_weekly_loss DECIMAL(5,2),
  max_consecutive_losses INT DEFAULT 3,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRADES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS app_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES app_strategies(id) ON DELETE SET NULL,

  -- Basic Info
  instrument TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),

  -- Timing
  entry_time TIMESTAMPTZ NOT NULL,
  exit_time TIMESTAMPTZ,
  session TEXT CHECK (session IN ('ASIA', 'LONDON', 'NEW_YORK', 'OVERLAP')),
  timeframe TEXT,

  -- Price Data
  entry_price DECIMAL(18,8) NOT NULL,
  exit_price DECIMAL(18,8),
  stop_loss DECIMAL(18,8) NOT NULL,
  take_profit DECIMAL(18,8),
  position_size DECIMAL(18,8),

  -- Risk/Reward
  planned_risk_percent DECIMAL(5,2),
  actual_risk_percent DECIMAL(5,2),
  planned_rr DECIMAL(8,2),
  actual_rr DECIMAL(8,2),
  pnl_usd DECIMAL(18,2),
  pnl_r DECIMAL(8,2),

  -- Trade Analysis
  entry_reason TEXT,
  exit_reason TEXT,
  market_condition TEXT,
  setup_quality INT CHECK (setup_quality BETWEEN 1 AND 5),

  -- Psychological Review
  emotional_state TEXT CHECK (emotional_state IN ('CALM', 'ANXIOUS', 'CONFIDENT', 'FOMO', 'REVENGE', 'NEUTRAL')),
  followed_plan BOOLEAN DEFAULT TRUE,
  psychological_notes TEXT,

  -- Metadata
  is_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRADE ERRORS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS app_trade_errors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES app_trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  error_type TEXT NOT NULL CHECK (error_type IN (
    'FOMO_ENTRY', 'EARLY_EXIT', 'LATE_EXIT', 'OVERSIZE_POSITION',
    'NO_CLEAR_SETUP', 'MOVED_STOP_LOSS', 'REVENGE_TRADE',
    'IGNORED_RISK_RULE', 'POOR_TIMING', 'OTHER'
  )),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRADE TAGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS app_trade_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES app_trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTACHMENTS TABLE (Chart Screenshots)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES app_trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  attachment_type TEXT CHECK (attachment_type IN ('BEFORE', 'AFTER', 'DURING', 'NOTE')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRADE REVIEWS TABLE (Daily/Weekly/Monthly Reviews)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_trade_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL CHECK (review_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_trades INT,
  win_rate DECIMAL(5,2),
  pnl_usd DECIMAL(18,2),
  pnl_r DECIMAL(8,2),
  lessons_learned TEXT,
  improvement_goals TEXT,
  risk_compliance_percent DECIMAL(5,2),
  overall_rating INT CHECK (overall_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);