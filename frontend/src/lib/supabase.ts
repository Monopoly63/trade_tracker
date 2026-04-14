import { createClient } from '@supabase/supabase-js';

// ============================================================
// Supabase Client Configuration
// ============================================================
// These values come from your .env file.
// See .env.example for the required variables.
// Get your credentials from: Supabase Dashboard > Settings > API
// ============================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// ============================================================
// Table Names
// ============================================================
// Fixed table names with "app_" prefix.
// No session ID needed — just run the SQL files and you're ready.
// ============================================================

export const TABLES = {
  strategies: 'app_strategies',
  risk_rules: 'app_risk_rules',
  trades: 'app_trades',
  trade_errors: 'app_trade_errors',
  trade_tags: 'app_trade_tags',
  attachments: 'app_attachments',
  trade_reviews: 'app_trade_reviews',
} as const;

// ============================================================
// Storage Configuration
// ============================================================
export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'trade-attachments';
export const MAX_FILE_SIZE_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB || 5);