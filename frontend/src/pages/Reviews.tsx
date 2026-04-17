import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { authRepo, tradeReviewsRepo } from '@/lib/repository';
import { formatR, formatPercent, formatCurrency } from '@/lib/services';
import type { TradeReview } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, ClipboardList, Star } from 'lucide-react';

const REVIEW_TYPES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;

export default function Reviews() {
  const [userId, setUserId] = useState('');
  const [reviews, setReviews] = useState<TradeReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TradeReview | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await authRepo.getSession();
        if (!session?.user) return;
        setUserId(session.user.id);
        const data = await tradeReviewsRepo.getAll(session.user.id);
        setReviews(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const reviewData = {
      review_type: fd.get('review_type') as TradeReview['review_type'],
      period_start: fd.get('period_start') as string,
      period_end: fd.get('period_end') as string,
      total_trades: fd.get('total_trades') ? parseInt(fd.get('total_trades') as string) : null,
      win_rate: fd.get('win_rate') ? parseFloat(fd.get('win_rate') as string) : null,
      pnl_usd: fd.get('pnl_usd') ? parseFloat(fd.get('pnl_usd') as string) : null,
      pnl_r: fd.get('pnl_r') ? parseFloat(fd.get('pnl_r') as string) : null,
      lessons_learned: (fd.get('lessons_learned') as string) || null,
      improvement_goals: (fd.get('improvement_goals') as string) || null,
      risk_compliance_percent: fd.get('risk_compliance_percent') ? parseFloat(fd.get('risk_compliance_percent') as string) : null,
      overall_rating: fd.get('overall_rating') ? parseInt(fd.get('overall_rating') as string) : null,
    };

    try {
      if (editing) {
        const updated = await tradeReviewsRepo.update(editing.id, reviewData);
        setReviews(reviews.map((r) => (r.id === editing.id ? updated : r)));
        toast.success('Review updated');
      } else {
        const created = await tradeReviewsRepo.create(userId, reviewData as Omit<TradeReview, 'id' | 'user_id' | 'created_at'>);
        setReviews([created, ...reviews]);
        toast.success('Review created');
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    try {
      await tradeReviewsRepo.delete(id);
      setReviews(reviews.filter((r) => r.id !== id));
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const typeColors: Record<string, string> = {
    DAILY: 'text-[#00C896] border-[#00C896]/30',
    WEEKLY: 'text-[#F0A500] border-[#F0A500]/30',
    MONTHLY: 'text-indigo-400 border-indigo-500/30',
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return '—';
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 inline ${i < rating ? 'text-[#F0A500] fill-[#F0A500]' : 'theme-text-secondary'}`} />
    ));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold theme-text-primary">Trade Reviews</h1>
            <p className="theme-text-secondary text-sm mt-1">Daily, weekly, and monthly performance reviews</p>
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> New Review
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-16 theme-text-secondary">Loading...</div>
        ) : reviews.length === 0 ? (
          <Card className="theme-bg-secondary theme-border border">
            <CardContent className="flex flex-col items-center py-16">
              <ClipboardList className="w-12 h-12 theme-text-secondary mb-4" />
              <h3 className="text-lg font-semibold theme-text-primary mb-2">No reviews yet</h3>
              <p className="theme-text-secondary text-sm">Create periodic reviews to track your progress and lessons learned</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="theme-bg-secondary theme-border border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={typeColors[review.review_type] || 'theme-text-secondary border-current/30'}>
                          {review.review_type}
                        </Badge>
                        <span className="text-sm theme-text-secondary font-mono">
                          {review.period_start} → {review.period_end}
                        </span>
                        <span className="text-sm">{renderStars(review.overall_rating)}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {review.total_trades !== null && (
                          <div className="theme-bg-tertiary rounded-lg p-2.5">
                            <p className="text-[10px] theme-text-secondary uppercase">Trades</p>
                            <p className="font-mono font-bold theme-text-primary">{review.total_trades}</p>
                          </div>
                        )}
                        {review.win_rate !== null && (
                          <div className="theme-bg-tertiary rounded-lg p-2.5">
                            <p className="text-[10px] theme-text-secondary uppercase">Win Rate</p>
                            <p className={`font-mono font-bold ${review.win_rate >= 50 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}`}>
                              {formatPercent(review.win_rate)}
                            </p>
                          </div>
                        )}
                        {review.pnl_usd !== null && (
                          <div className="theme-bg-tertiary rounded-lg p-2.5">
                            <p className="text-[10px] theme-text-secondary uppercase">P&L (USD)</p>
                            <p className={`font-mono font-bold ${review.pnl_usd >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}`}>
                              {formatCurrency(review.pnl_usd)}
                            </p>
                          </div>
                        )}
                        {review.pnl_r !== null && (
                          <div className="theme-bg-tertiary rounded-lg p-2.5">
                            <p className="text-[10px] theme-text-secondary uppercase">P&L (R)</p>
                            <p className={`font-mono font-bold ${review.pnl_r >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}`}>
                              {formatR(review.pnl_r)}
                            </p>
                          </div>
                        )}
                        {review.risk_compliance_percent !== null && (
                          <div className="theme-bg-tertiary rounded-lg p-2.5">
                            <p className="text-[10px] theme-text-secondary uppercase">Compliance</p>
                            <p className={`font-mono font-bold ${review.risk_compliance_percent >= 80 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}`}>
                              {formatPercent(review.risk_compliance_percent)}
                            </p>
                          </div>
                        )}
                      </div>

                      {review.lessons_learned && (
                        <div>
                          <p className="text-xs theme-text-secondary mb-1">Lessons Learned</p>
                          <p className="text-sm theme-text-primary theme-bg-tertiary p-3 rounded-lg whitespace-pre-wrap">{review.lessons_learned}</p>
                        </div>
                      )}
                      {review.improvement_goals && (
                        <div>
                          <p className="text-xs theme-text-secondary mb-1">Improvement Goals</p>
                          <p className="text-sm theme-text-primary theme-bg-tertiary p-3 rounded-lg whitespace-pre-wrap">{review.improvement_goals}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-1 ml-4 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 theme-text-secondary hover:theme-text-primary"
                        onClick={() => { setEditing(review); setShowForm(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 theme-text-secondary hover:text-red-400"
                        onClick={() => handleDelete(review.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Review Form Dialog */}
        <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditing(null); }}>
          <DialogContent className="theme-bg-secondary theme-border border theme-text-primary max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Review' : 'New Review'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs theme-text-secondary">Review Type *</Label>
                  <Select name="review_type" defaultValue={editing?.review_type || 'WEEKLY'}>
                    <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="theme-bg-secondary theme-border border">
                      {REVIEW_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">Period Start *</Label>
                  <Input name="period_start" type="date" required defaultValue={editing?.period_start || ''}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">Period End *</Label>
                  <Input name="period_end" type="date" required defaultValue={editing?.period_end || ''}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">Total Trades</Label>
                  <Input name="total_trades" type="number" defaultValue={editing?.total_trades ?? ''}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">Win Rate (%)</Label>
                  <Input name="win_rate" type="number" step="0.01" defaultValue={editing?.win_rate ?? ''}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">P&L (USD)</Label>
                  <Input name="pnl_usd" type="number" step="0.01" defaultValue={editing?.pnl_usd ?? ''}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">P&L (R)</Label>
                  <Input name="pnl_r" type="number" step="0.01" defaultValue={editing?.pnl_r ?? ''}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">Risk Compliance (%)</Label>
                  <Input name="risk_compliance_percent" type="number" step="0.01" defaultValue={editing?.risk_compliance_percent ?? ''}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">Overall Rating (1-5)</Label>
                  <Input name="overall_rating" type="number" min="1" max="5" defaultValue={editing?.overall_rating ?? ''}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs theme-text-secondary">Lessons Learned</Label>
                <Textarea name="lessons_learned" rows={3} defaultValue={editing?.lessons_learned || ''}
                  placeholder="What did you learn this period..." className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
              </div>
              <div>
                <Label className="text-xs theme-text-secondary">Improvement Goals</Label>
                <Textarea name="improvement_goals" rows={3} defaultValue={editing?.improvement_goals || ''}
                  placeholder="What to improve next period..." className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}
                  className="theme-border border theme-text-secondary !bg-transparent">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Review</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}