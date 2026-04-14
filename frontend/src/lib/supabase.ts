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
// Tables use a session ID prefix for environment isolation.
// Set VITE_SESSION_ID in your .env file.
// Format: app_{SESSION_ID}_{entity_name}
// ============================================================

const SESSION_ID = import.meta.env.VITE_SESSION_ID || 'your_session_id';

export const TABLES = {
  strategies: `app_${SESSION_ID}_strategies`,
  risk_rules: `app_${SESSION_ID}_risk_rules`,
  trades: `app_${SESSION_ID}_trades`,
  trade_errors: `app_${SESSION_ID}_trade_errors`,
  trade_tags: `app_${SESSION_ID}_trade_tags`,
  attachments: `app_${SESSION_ID}_attachments`,
  trade_reviews: `app_${SESSION_ID}_trade_reviews`,
} as const;

// ============================================================
// Storage Configuration
// ============================================================
export const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'trade-attachments';
export const MAX_FILE_SIZE_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB || 5);