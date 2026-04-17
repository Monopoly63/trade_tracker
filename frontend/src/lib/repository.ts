import { supabase, isSupabaseConfigured, TABLES, STORAGE_BUCKET, MAX_FILE_SIZE_MB } from './supabase';
import type {
  Trade, Strategy, RiskRule, TradeError, TradeTag,
  Attachment, TradeReview, TradeFormData, TradeFilters,
} from './types';

function checkConnection() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not connected. Please add your Supabase credentials to the .env file. See .env.example for details.');
  }
}

// ==================== AUTH ====================

export const authRepo = {
  async signUp(email: string, password: string) {
    checkConnection();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    checkConnection();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

   async signInWithGoogle() {
    checkConnection();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });
    if (error) throw error;
  },

  async signOut() {
    checkConnection();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    if (!isSupabaseConfigured) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getUser() {
    checkConnection();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    if (!isSupabaseConfigured) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ==================== TRADES ====================

export const tradesRepo = {
  async getAll(userId: string, filters?: TradeFilters, page = 0, limit = 50): Promise<{ data: Trade[]; count: number }> {
    checkConnection();

    // If tag filter is set, first get trade IDs with that tag
    let tagTradeIds: string[] | null = null;
    if (filters?.tag) {
      tagTradeIds = await tradeTagsRepo.getTradeIdsByTag(userId, filters.tag);
      if (tagTradeIds.length === 0) {
        return { data: [], count: 0 };
      }
    }

    let query = supabase
      .from(TABLES.trades)
      .select(`*, strategy:${TABLES.strategies}(id, name)`, { count: 'exact' })
      .eq('user_id', userId)
      .order('entry_time', { ascending: false });

    if (tagTradeIds) query = query.in('id', tagTradeIds);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.direction) query = query.eq('direction', filters.direction);
    if (filters?.session) query = query.eq('session', filters.session);
    if (filters?.instrument) query = query.ilike('instrument', `%${filters.instrument}%`);
    if (filters?.strategy_id) query = query.eq('strategy_id', filters.strategy_id);
    if (filters?.dateFrom) query = query.gte('entry_time', filters.dateFrom);
    if (filters?.dateTo) query = query.lte('entry_time', filters.dateTo);

    query = query.range(page * limit, (page + 1) * limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data as Trade[]) || [], count: count || 0 };
  },

  async getById(id: string): Promise<Trade | null> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trades)
      .select(`*, strategy:${TABLES.strategies}(id, name)`)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Trade;
  },

  async create(userId: string, form: TradeFormData): Promise<Trade> {
    checkConnection();
    const entryPrice = Number(form.entry_price);
    const exitPrice = form.exit_price ? Number(form.exit_price) : null;
    const stopLoss = Number(form.stop_loss);
    const takeProfit = form.take_profit ? Number(form.take_profit) : null;
    const positionSize = form.position_size ? Number(form.position_size) : null;

    // Calculate P&L
    let pnlUsd: number | null = null;
    let pnlR: number | null = null;
    let actualRr: number | null = null;
    const riskPerUnit = Math.abs(entryPrice - stopLoss);

    if (exitPrice && positionSize && riskPerUnit > 0) {
      const rawPnl = form.direction === 'LONG'
        ? (exitPrice - entryPrice) * positionSize
        : (entryPrice - exitPrice) * positionSize;
      pnlUsd = parseFloat(rawPnl.toFixed(2));
      pnlR = parseFloat((rawPnl / (riskPerUnit * positionSize)).toFixed(2));
      actualRr = parseFloat((Math.abs(exitPrice - entryPrice) / riskPerUnit).toFixed(2));
      if ((form.direction === 'LONG' && exitPrice < entryPrice) || (form.direction === 'SHORT' && exitPrice > entryPrice)) {
        actualRr = -actualRr;
      }
    }

    // Calculate planned R:R
    let plannedRr: number | null = null;
    if (takeProfit && riskPerUnit > 0) {
      plannedRr = parseFloat((Math.abs(takeProfit - entryPrice) / riskPerUnit).toFixed(2));
    }

    const status = exitPrice ? 'CLOSED' : 'OPEN';

    const { data, error } = await supabase
      .from(TABLES.trades)
      .insert({
        user_id: userId,
        instrument: form.instrument,
        direction: form.direction,
        status,
        entry_time: form.entry_time,
        exit_time: form.exit_time || null,
        session: form.session || null,
        timeframe: form.timeframe || null,
        entry_price: entryPrice,
        exit_price: exitPrice,
        stop_loss: stopLoss,
        take_profit: takeProfit,
        position_size: positionSize,
        planned_risk_percent: form.planned_risk_percent || null,
        actual_risk_percent: form.planned_risk_percent || null,
        planned_rr: plannedRr,
        actual_rr: actualRr,
        pnl_usd: pnlUsd,
        pnl_r: pnlR,
        strategy_id: form.strategy_id || null,
        entry_reason: form.entry_reason || null,
        exit_reason: form.exit_reason || null,
        market_condition: form.market_condition || null,
        setup_quality: form.setup_quality || null,
        emotional_state: form.emotional_state || null,
        followed_plan: form.followed_plan ?? true,
        psychological_notes: form.psychological_notes || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Trade;
  },

  async update(id: string, updates: Partial<TradeFormData & { status: string; pnl_usd: number; pnl_r: number; actual_rr: number; is_reviewed: boolean }>): Promise<Trade> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trades)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Trade;
  },

  async delete(id: string): Promise<void> {
    checkConnection();
    const { error } = await supabase.from(TABLES.trades).delete().eq('id', id);
    if (error) throw error;
  },
};

// ==================== STRATEGIES ====================

export const strategiesRepo = {
  async getAll(userId: string): Promise<Strategy[]> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.strategies)
      .select('*')
      .eq('user_id', userId)
      .order('name');
    if (error) throw error;
    return (data as Strategy[]) || [];
  },

  async create(userId: string, name: string, description: string, rules?: string): Promise<Strategy> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.strategies)
      .insert({ user_id: userId, name, description, rules: rules || null })
      .select()
      .single();
    if (error) throw error;
    return data as Strategy;
  },

  async update(id: string, updates: Partial<Strategy>): Promise<Strategy> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.strategies)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Strategy;
  },

  async delete(id: string): Promise<void> {
    checkConnection();
    const { error } = await supabase.from(TABLES.strategies).delete().eq('id', id);
    if (error) throw error;
  },
};

// ==================== RISK RULES ====================

export const riskRulesRepo = {
  async getAll(userId: string): Promise<RiskRule[]> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.risk_rules)
      .select('*')
      .eq('user_id', userId)
      .order('created_at');
    if (error) throw error;
    return (data as RiskRule[]) || [];
  },

  async create(userId: string, rule: Partial<RiskRule>): Promise<RiskRule> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.risk_rules)
      .insert({ user_id: userId, ...rule })
      .select()
      .single();
    if (error) throw error;
    return data as RiskRule;
  },

  async update(id: string, updates: Partial<RiskRule>): Promise<RiskRule> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.risk_rules)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as RiskRule;
  },

  async delete(id: string): Promise<void> {
    checkConnection();
    const { error } = await supabase.from(TABLES.risk_rules).delete().eq('id', id);
    if (error) throw error;
  },
};

// ==================== TRADE ERRORS ====================

export const tradeErrorsRepo = {
  async getByTradeId(tradeId: string): Promise<TradeError[]> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trade_errors)
      .select('*')
      .eq('trade_id', tradeId)
      .order('created_at');
    if (error) throw error;
    return (data as TradeError[]) || [];
  },

  async getAllByUser(userId: string): Promise<TradeError[]> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trade_errors)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as TradeError[]) || [];
  },

  async create(userId: string, tradeId: string, errorType: string, description?: string): Promise<TradeError> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trade_errors)
      .insert({ user_id: userId, trade_id: tradeId, error_type: errorType, description: description || null })
      .select()
      .single();
    if (error) throw error;
    return data as TradeError;
  },

  async delete(id: string): Promise<void> {
    checkConnection();
    const { error } = await supabase.from(TABLES.trade_errors).delete().eq('id', id);
    if (error) throw error;
  },
};

// ==================== TRADE TAGS ====================

export const tradeTagsRepo = {
  async getByTradeId(tradeId: string): Promise<TradeTag[]> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trade_tags)
      .select('*')
      .eq('trade_id', tradeId);
    if (error) throw error;
    return (data as TradeTag[]) || [];
  },

  async getAllByUser(userId: string): Promise<TradeTag[]> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trade_tags)
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return (data as TradeTag[]) || [];
  },

  async getTradeIdsByTag(userId: string, tag: string): Promise<string[]> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trade_tags)
      .select('trade_id')
      .eq('user_id', userId)
      .eq('tag', tag);
    if (error) throw error;
    return (data || []).map((d: { trade_id: string }) => d.trade_id);
  },

  async create(userId: string, tradeId: string, tag: string): Promise<TradeTag> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trade_tags)
      .insert({ user_id: userId, trade_id: tradeId, tag })
      .select()
      .single();
    if (error) throw error;
    return data as TradeTag;
  },

  async delete(id: string): Promise<void> {
    checkConnection();
    const { error } = await supabase.from(TABLES.trade_tags).delete().eq('id', id);
    if (error) throw error;
  },
};

// ==================== ATTACHMENTS ====================

export const attachmentsRepo = {
  async getByTradeId(tradeId: string): Promise<Attachment[]> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.attachments)
      .select('*')
      .eq('trade_id', tradeId)
      .order('created_at');
    if (error) throw error;
    return (data as Attachment[]) || [];
  },

  async upload(userId: string, tradeId: string, file: File, attachmentType: string): Promise<Attachment> {
    checkConnection();
    const maxSize = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSize) throw new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) throw new Error('Only JPEG, PNG, and WebP images are allowed');

    const path = `${userId}/${tradeId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file);
    if (uploadError) throw uploadError;

    const { data, error } = await supabase
      .from(TABLES.attachments)
      .insert({
        user_id: userId,
        trade_id: tradeId,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
        attachment_type: attachmentType,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Attachment;
  },

  async getSignedUrl(filePath: string): Promise<string> {
    checkConnection();
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 3600);
    if (error) throw error;
    return data.signedUrl;
  },

  async delete(id: string, filePath: string): Promise<void> {
    checkConnection();
    await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
    const { error } = await supabase.from(TABLES.attachments).delete().eq('id', id);
    if (error) throw error;
  },
};

// ==================== TRADE REVIEWS ====================

export const tradeReviewsRepo = {
  async getAll(userId: string): Promise<TradeReview[]> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trade_reviews)
      .select('*')
      .eq('user_id', userId)
      .order('period_start', { ascending: false });
    if (error) throw error;
    return (data as TradeReview[]) || [];
  },

  async create(userId: string, review: Omit<TradeReview, 'id' | 'user_id' | 'created_at'>): Promise<TradeReview> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trade_reviews)
      .insert({ user_id: userId, ...review })
      .select()
      .single();
    if (error) throw error;
    return data as TradeReview;
  },

  async update(id: string, updates: Partial<TradeReview>): Promise<TradeReview> {
    checkConnection();
    const { data, error } = await supabase
      .from(TABLES.trade_reviews)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as TradeReview;
  },

  async delete(id: string): Promise<void> {
    checkConnection();
    const { error } = await supabase.from(TABLES.trade_reviews).delete().eq('id', id);
    if (error) throw error;
  },
};
