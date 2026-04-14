# Trading Journal & Risk Analysis System - Development Plan

## Design Guidelines

### Design References
- **TradingView.com**: Dark terminal-style interface with financial data
- **Style**: Professional Dark Terminal + Financial Dashboard

### Color Palette
- Background: #0A0A0F (Deep Dark)
- Card BG: #111118 (Dark Card)
- Border: #1E1E2E (Subtle Border)
- Profit Green: #00C896
- Loss Red: #FF4D6D
- Neutral Gold: #F0A500
- Primary: #6366F1 (Indigo)
- Text Primary: #FFFFFF
- Text Secondary: #8B8BA7

### Typography
- Numbers/Data: JetBrains Mono (monospace)
- Body/UI: Inter (sans-serif)

### Key Component Styles
- Cards: Dark bg (#111118), border (#1E1E2E), rounded-xl
- KPI Cards: With colored accent borders (green/red/gold)
- Buttons: Primary indigo, destructive red
- Tables: Dark rows with hover highlight
- Charts: Green/Red color scheme for profit/loss

## Supabase Configuration
- Project URL: https://lhbeygchjyloxzlzdosc.supabase.co
- Session ID: 4688919154
- Table prefix: app_4688919154_

## Database Tables
- app_4688919154_strategies
- app_4688919154_risk_rules
- app_4688919154_trades
- app_4688919154_trade_errors
- app_4688919154_trade_tags
- app_4688919154_attachments
- app_4688919154_trade_reviews

## Storage
- Bucket: trade-attachments (private, signed URLs)

## Files to Create/Update (8 files max)

1. **src/lib/supabase.ts** - Supabase client with env vars from template config
2. **src/lib/types.ts** - All TypeScript types, constants, interfaces
3. **src/lib/repository.ts** - Data access layer for all tables (trades, strategies, risk_rules, errors, attachments)
4. **src/lib/services.ts** - Business logic: analytics calculations, risk compliance, CSV export
5. **src/components/DashboardLayout.tsx** - Sidebar layout with navigation
6. **src/pages/Login.tsx** - Auth page (sign in / sign up)
7. **src/pages/Dashboard.tsx** - Main dashboard with KPIs, recent trades, P&L chart
8. **src/pages/Trades.tsx** - Full trade management: list, filters, add/edit form, detail view
9. **src/pages/Analytics.tsx** - Performance charts, win rate, P&L curve
10. **src/pages/Strategies.tsx** - Strategy CRUD and performance comparison
11. **src/pages/RiskReview.tsx** - Risk compliance, violations
12. **src/pages/Settings.tsx** - Account settings, risk rules management
13. **src/pages/Index.tsx** - Entry point / redirect
14. **src/App.tsx** - Router setup

Note: Combining TradeDetail into Trades page to stay within file limits.
The app uses Vite + React + shadcn/ui + Tailwind (NOT Next.js).