import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { authRepo, tradesRepo, strategiesRepo, tradeTagsRepo } from '@/lib/repository';
import { formatCurrency, formatR, formatDateTime, exportTradesToCSV, downloadCSV } from '@/lib/services';
import type { Trade, TradeFormData, TradeFilters, Strategy } from '@/lib/types';
import { TRADE_DIRECTIONS, TRADE_SESSIONS, TRADE_STATUSES, EMOTIONAL_STATES, TIMEFRAMES } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus, Download, Search, TrendingUp, TrendingDown,
  Trash2, Eye, ChevronLeft, ChevronRight, Filter,
} from 'lucide-react';

const PAGE_SIZE = 20;

export default function Trades() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TradeFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<Trade | null>(null);

  const loadTrades = useCallback(async (uid: string, f: TradeFilters, p: number) => {
    try {
      const { data, count } = await tradesRepo.getAll(uid, f, p, PAGE_SIZE);
      setTrades(data);
      setTotalCount(count);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load trades');
    }
  }, []);

  useEffect(() => {
    (async () => {
      const session = await authRepo.getSession();
      if (!session?.user) { navigate('/'); return; }
      setUserId(session.user.id);
      const strats = await strategiesRepo.getAll(session.user.id);
      setStrategies(strats);

      try {
        const userTags = await tradeTagsRepo.getAllByUser(session.user.id);
        const uniqueTags = [...new Set(userTags.map((t) => t.tag))].sort();
        setAllTags(uniqueTags);
      } catch {
        // Tags loading is non-critical
      }

      await loadTrades(session.user.id, filters, page);
      setLoading(false);
    })();
  }, [navigate, loadTrades, filters, page]);

  const handleExport = () => {
    if (trades.length === 0) return;
    const csv = exportTradesToCSV(trades);
    downloadCSV(csv, `trades-export-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('CSV exported!');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this trade?')) return;
    try {
      await tradesRepo.delete(id);
      toast.success('Trade deleted');
      await loadTrades(userId, filters, page);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold theme-text-primary">Trades</h1>
            <p className="theme-text-secondary text-sm">{totalCount} total trades</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}
              className="theme-border border theme-text-secondary hover:opacity-80 !bg-transparent">
              <Filter className="w-4 h-4 mr-1" /> Filters
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}
              className="theme-border border theme-text-secondary hover:opacity-80 !bg-transparent">
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="w-4 h-4 mr-1" /> New Trade
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="theme-bg-secondary theme-border border">
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs theme-text-secondary">Instrument</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-2 top-2.5 w-3.5 h-3.5 theme-text-secondary" />
                  <Input placeholder="e.g. EURUSD" value={filters.instrument || ''}
                    onChange={(e) => { setFilters({ ...filters, instrument: e.target.value || undefined }); setPage(0); }}
                    className="pl-8 theme-bg-tertiary theme-border border theme-text-primary text-sm h-9" />
                </div>
              </div>
              <div>
                <Label className="text-xs theme-text-secondary">Status</Label>
                <Select value={filters.status || 'all'} onValueChange={(v) => { setFilters({ ...filters, status: v === 'all' ? undefined : v as TradeFilters['status'] }); setPage(0); }}>
                  <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary text-sm h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="theme-bg-secondary theme-border border">
                    <SelectItem value="all">All</SelectItem>
                    {TRADE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs theme-text-secondary">Direction</Label>
                <Select value={filters.direction || 'all'} onValueChange={(v) => { setFilters({ ...filters, direction: v === 'all' ? undefined : v as TradeFilters['direction'] }); setPage(0); }}>
                  <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary text-sm h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="theme-bg-secondary theme-border border">
                    <SelectItem value="all">All</SelectItem>
                    {TRADE_DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs theme-text-secondary">Session</Label>
                <Select value={filters.session || 'all'} onValueChange={(v) => { setFilters({ ...filters, session: v === 'all' ? undefined : v as TradeFilters['session'] }); setPage(0); }}>
                  <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary text-sm h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="theme-bg-secondary theme-border border">
                    <SelectItem value="all">All</SelectItem>
                    {TRADE_SESSIONS.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs theme-text-secondary">Tag</Label>
                <Select value={filters.tag || 'all'} onValueChange={(v) => { setFilters({ ...filters, tag: v === 'all' ? undefined : v }); setPage(0); }}>
                  <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary text-sm h-9 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="theme-bg-secondary theme-border border">
                    <SelectItem value="all">All</SelectItem>
                    {allTags.map((tag) => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trade List */}
        {loading ? (
          <div className="text-center py-16 theme-text-secondary">Loading...</div>
        ) : trades.length === 0 ? (
          <Card className="theme-bg-secondary theme-border border">
            <CardContent className="text-center py-16 theme-text-secondary">
              No trades found. Click "New Trade" to add one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {trades.map((trade) => (
              <Card key={trade.id} className="theme-bg-secondary theme-border border theme-border-hover transition-colors cursor-pointer"
                onClick={() => navigate(`/trades/${trade.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        trade.direction === 'LONG' ? 'bg-[#00C896]/10' : 'bg-[#FF4D6D]/10'
                      }`}>
                        {trade.direction === 'LONG'
                          ? <TrendingUp className="w-5 h-5 text-[#00C896]" />
                          : <TrendingDown className="w-5 h-5 text-[#FF4D6D]" />
                        }
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold theme-text-primary">{trade.instrument}</span>
                          <Badge variant="outline" className={`text-[10px] ${
                            trade.direction === 'LONG' ? 'text-[#00C896] border-[#00C896]/30' : 'text-[#FF4D6D] border-[#FF4D6D]/30'
                          }`}>{trade.direction}</Badge>
                          <Badge variant="outline" className={`text-[10px] ${
                            trade.status === 'CLOSED' ? 'theme-text-secondary border-current/30' :
                            trade.status === 'OPEN' ? 'text-[#F0A500] border-[#F0A500]/30' :
                            'theme-text-secondary border-current/30'
                          }`}>{trade.status}</Badge>
                        </div>
                        <p className="text-xs theme-text-secondary mt-0.5">
                          {formatDateTime(trade.entry_time)}
                          {trade.strategy?.name && <span className="ml-2">• {trade.strategy.name}</span>}
                          {trade.session && <span className="ml-2">• {trade.session.replace('_', ' ')}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        {trade.pnl_r !== null && (
                          <p className={`font-mono font-bold text-sm ${(trade.pnl_r ?? 0) >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}`}>
                            {formatR(trade.pnl_r)}
                          </p>
                        )}
                        {trade.pnl_usd !== null && (
                          <p className={`font-mono text-xs ${(trade.pnl_usd ?? 0) >= 0 ? 'text-[#00C896]/70' : 'text-[#FF4D6D]/70'}`}>
                            {formatCurrency(trade.pnl_usd)}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 theme-text-secondary hover:theme-text-primary"
                          onClick={() => navigate(`/trades/${trade.id}`)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 theme-text-secondary hover:text-red-400"
                          onClick={() => handleDelete(trade.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="theme-border border theme-text-secondary !bg-transparent">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm theme-text-secondary">
                  Page {page + 1} of {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="theme-border border theme-text-secondary !bg-transparent">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* New Trade Dialog */}
        <TradeFormDialog
          open={showForm}
          onClose={() => setShowForm(false)}
          strategies={strategies}
          userId={userId}
          onSaved={() => { setShowForm(false); loadTrades(userId, filters, page); }}
        />

        {/* Trade Detail Dialog */}
        {showDetail && (
          <TradeDetailDialog
            trade={showDetail}
            onClose={() => setShowDetail(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// ==================== TRADE FORM DIALOG ====================

function TradeFormDialog({ open, onClose, strategies, userId, onSaved }: {
  open: boolean; onClose: () => void; strategies: Strategy[]; userId: string; onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      const form: TradeFormData = {
        instrument: fd.get('instrument') as string,
        direction: fd.get('direction') as TradeFormData['direction'],
        entry_time: fd.get('entry_time') as string,
        exit_time: (fd.get('exit_time') as string) || undefined,
        session: (fd.get('session') as TradeFormData['session']) || undefined,
        timeframe: (fd.get('timeframe') as string) || undefined,
        entry_price: parseFloat(fd.get('entry_price') as string),
        exit_price: fd.get('exit_price') ? parseFloat(fd.get('exit_price') as string) : undefined,
        stop_loss: parseFloat(fd.get('stop_loss') as string),
        take_profit: fd.get('take_profit') ? parseFloat(fd.get('take_profit') as string) : undefined,
        position_size: fd.get('position_size') ? parseFloat(fd.get('position_size') as string) : undefined,
        planned_risk_percent: fd.get('planned_risk_percent') ? parseFloat(fd.get('planned_risk_percent') as string) : undefined,
        strategy_id: (fd.get('strategy_id') as string) || undefined,
        entry_reason: (fd.get('entry_reason') as string) || undefined,
        emotional_state: (fd.get('emotional_state') as TradeFormData['emotional_state']) || undefined,
        setup_quality: fd.get('setup_quality') ? parseInt(fd.get('setup_quality') as string) : undefined,
        psychological_notes: (fd.get('psychological_notes') as string) || undefined,
      };
      await tradesRepo.create(userId, form);
      toast.success('Trade created!');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create trade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="theme-bg-secondary theme-border border theme-text-primary max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Trade</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs theme-text-secondary">Instrument *</Label>
              <Input name="instrument" required placeholder="e.g. EURUSD" className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Direction *</Label>
              <Select name="direction" defaultValue="LONG">
                <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="theme-bg-secondary theme-border border">
                  {TRADE_DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Entry Time *</Label>
              <Input name="entry_time" type="datetime-local" required className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Exit Time</Label>
              <Input name="exit_time" type="datetime-local" className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Entry Price *</Label>
              <Input name="entry_price" type="number" step="any" required className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Exit Price</Label>
              <Input name="exit_price" type="number" step="any" className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Stop Loss *</Label>
              <Input name="stop_loss" type="number" step="any" required className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Take Profit</Label>
              <Input name="take_profit" type="number" step="any" className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Position Size</Label>
              <Input name="position_size" type="number" step="any" className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Risk %</Label>
              <Input name="planned_risk_percent" type="number" step="0.01" placeholder="e.g. 1.0" className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Session</Label>
              <Select name="session">
                <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="theme-bg-secondary theme-border border">
                  {TRADE_SESSIONS.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Timeframe</Label>
              <Select name="timeframe">
                <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="theme-bg-secondary theme-border border">
                  {TIMEFRAMES.map((tf) => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Strategy</Label>
              <Select name="strategy_id">
                <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="theme-bg-secondary theme-border border">
                  {strategies.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Emotional State</Label>
              <Select name="emotional_state">
                <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent className="theme-bg-secondary theme-border border">
                  {EMOTIONAL_STATES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs theme-text-secondary">Setup Quality (1-5)</Label>
              <Input name="setup_quality" type="number" min="1" max="5" className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs theme-text-secondary">Entry Reason</Label>
            <Textarea name="entry_reason" rows={2} className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
          </div>
          <div>
            <Label className="text-xs theme-text-secondary">Psychological Notes</Label>
            <Textarea name="psychological_notes" rows={2} className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="theme-border border theme-text-secondary !bg-transparent">Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {saving ? 'Saving...' : 'Save Trade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== TRADE DETAIL DIALOG ====================

function TradeDetailDialog({ trade, onClose }: { trade: Trade; onClose: () => void }) {
  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2 border-b theme-border">
      <span className="theme-text-secondary text-sm">{label}</span>
      <span className="theme-text-primary text-sm font-mono">{value || '—'}</span>
    </div>
  );

  return (
    <Dialog open={!!trade} onOpenChange={onClose}>
      <DialogContent className="theme-bg-secondary theme-border border theme-text-primary max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono">{trade.instrument}</span>
            <Badge variant="outline" className={trade.direction === 'LONG' ? 'text-[#00C896] border-[#00C896]/30' : 'text-[#FF4D6D] border-[#FF4D6D]/30'}>
              {trade.direction}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-0">
          <DetailRow label="Status" value={trade.status} />
          <DetailRow label="Entry Time" value={formatDateTime(trade.entry_time)} />
          <DetailRow label="Exit Time" value={trade.exit_time ? formatDateTime(trade.exit_time) : null} />
          <DetailRow label="Entry Price" value={trade.entry_price} />
          <DetailRow label="Exit Price" value={trade.exit_price} />
          <DetailRow label="Stop Loss" value={trade.stop_loss} />
          <DetailRow label="Take Profit" value={trade.take_profit} />
          <DetailRow label="Position Size" value={trade.position_size} />
          <DetailRow label="P&L (USD)" value={trade.pnl_usd !== null ? (
            <span className={(trade.pnl_usd ?? 0) >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}>{formatCurrency(trade.pnl_usd!)}</span>
          ) : null} />
          <DetailRow label="P&L (R)" value={trade.pnl_r !== null ? (
            <span className={(trade.pnl_r ?? 0) >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}>{formatR(trade.pnl_r!)}</span>
          ) : null} />
          <DetailRow label="Planned R:R" value={trade.planned_rr} />
          <DetailRow label="Actual R:R" value={trade.actual_rr} />
          <DetailRow label="Risk %" value={trade.planned_risk_percent ? `${trade.planned_risk_percent}%` : null} />
          <DetailRow label="Strategy" value={trade.strategy?.name} />
          <DetailRow label="Session" value={trade.session?.replace('_', ' ')} />
          <DetailRow label="Timeframe" value={trade.timeframe} />
          <DetailRow label="Setup Quality" value={trade.setup_quality ? `${trade.setup_quality}/5` : null} />
          <DetailRow label="Emotional State" value={trade.emotional_state} />
          <DetailRow label="Followed Plan" value={trade.followed_plan ? 'Yes' : 'No'} />
          {trade.entry_reason && (
            <div className="pt-3">
              <p className="text-xs theme-text-secondary mb-1">Entry Reason</p>
              <p className="text-sm theme-text-primary theme-bg-tertiary p-3 rounded-lg">{trade.entry_reason}</p>
            </div>
          )}
          {trade.psychological_notes && (
            <div className="pt-3">
              <p className="text-xs theme-text-secondary mb-1">Psychological Notes</p>
              <p className="text-sm theme-text-primary theme-bg-tertiary p-3 rounded-lg">{trade.psychological_notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}