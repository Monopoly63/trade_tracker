# Supabase Setup Guide

This guide walks you through setting up the Supabase backend for the Trading Journal & Risk Analysis System.

## Prerequisites

- A [Supabase](https://supabase.com) account (free tier works)
- Access to the Supabase Dashboard SQL Editor

## Step 1: Create a Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization, name, password, and region
4. Wait for the project to be provisioned

## Step 2: Get Your API Credentials

1. Go to **Settings > API** in your Supabase dashboard
2. Copy the following values into your `.env` file:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public key** → `VITE_SUPABASE_ANON_KEY`

## Step 3: Run Database Migrations

Execute the SQL files **in order** using the Supabase SQL Editor (**Dashboard > SQL Editor > New Query**):

1. **`001_initial_schema.sql`** — Creates all tables (strategies, risk_rules, trades, trade_errors, trade_tags, attachments, trade_reviews)
2. **`002_rls_policies.sql`** — Enables Row Level Security and creates access policies
3. **`003_indexes_views.sql`** — Creates performance indexes and the `app_trade_summary` analytics view

Simply copy and paste each file's content into the SQL Editor and click "Run". No modifications needed.

## Step 4: Set Up Storage

Follow the instructions in **`004_storage_setup.md`** to create the private storage bucket for chart screenshots.

## Step 5: Configure Authentication

1. Go to **Authentication > Providers** in your Supabase dashboard
2. Ensure **Email** provider is enabled
3. (Optional) Configure email templates under **Authentication > Email Templates**
4. (Optional) Set up a custom SMTP server under **Settings > Auth > SMTP Settings**

## Step 6: Configure Environment Variables

1. Copy `.env.example` to `.env` in the frontend root:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Supabase URL and Anon Key from Step 2

## Step 7: Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Go to [vercel.com](https://vercel.com) and import the project
3. Set the **Root Directory** to `app/frontend` (or wherever your frontend lives)
4. Add all environment variables from your `.env` file to Vercel's Environment Variables settings
5. Deploy!

## Table Names

All tables use the `app_` prefix:

| Table | Name |
|-------|------|
| strategies | `app_strategies` |
| risk_rules | `app_risk_rules` |
| trades | `app_trades` |
| trade_errors | `app_trade_errors` |
| trade_tags | `app_trade_tags` |
| attachments | `app_attachments` |
| trade_reviews | `app_trade_reviews` |
| trade_summary (view) | `app_trade_summary` |

## Troubleshooting

- **"relation does not exist"** — Make sure you ran all SQL files in order (001, 002, 003)
- **"new row violates row-level security policy"** — Make sure you're authenticated and the RLS policies were created
- **Storage upload fails** — Check that the bucket exists and storage policies are in place
- **Auth not working** — Verify your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct