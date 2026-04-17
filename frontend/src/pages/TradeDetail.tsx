import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import {
  authRepo, tradesRepo, tradeErrorsRepo, tradeTagsRepo, attachmentsRepo,
} from '@/lib/repository';
import { formatCurrency, formatR, formatDateTime } from '@/lib/services';
import type { Trade, TradeError, TradeTag, Attachment } from '@/lib/types';
import { ERROR_TYPES, ATTACHMENT_TYPES } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Tag, Image,
  Plus, Trash2, Upload, X, DollarSign,
} from 'lucide-react';

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [trade, setTrade] = useState<Trade | null>(null);
  const [errors, setErrors] = useState<TradeError[]>([]);
  const [tags, setTags] = useState<TradeTag[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showErrorForm, setShowErrorForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closingTrade, setClosingTrade] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const session = await authRepo.getSession();
        if (!session?.user) { navigate('/'); return; }
        setUserId(session.user.id);

        const [tradeData, errs, tgs, atts] = await Promise.all([
          tradesRepo.getById(id),
          tradeErrorsRepo.getByTradeId(id),
          tradeTagsRepo.getByTradeId(id),
          attachmentsRepo.getByTradeId(id),
        ]);
        setTrade(tradeData);
        setErrors(errs);
        setTags(tgs);

        const attsWithUrls = await Promise.all(
          atts.map(async (att) => {
            try {
              const signedUrl = await attachmentsRepo.getSignedUrl(att.file_path);
              return { ...att, signed_url: signedUrl };
            } catch {
              return att;
            }
          })
        );
        setAttachments(attsWithUrls);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load trade details');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleCloseTrade = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!trade || !id) return;
    setClosingTrade(true);

    const fd = new FormData(e.currentTarget);
    const exitPrice = parseFloat(fd.get('exit_price') as string);
    const exitTime = (fd.get('exit_time') as string) || new Date().toISOString();
    const exitReason = (fd.get('exit_reason') as string) || null;

    const entryPrice = trade.entry_price;
    const stopLoss = trade.stop_loss;
    const positionSize = trade.position_size;
    const riskPerUnit = Math.abs(entryPrice - stopLoss);

    let pnlUsd: number | null = null;
    let pnlR: number | null = null;
    let actualRr: number | null = null;

    if (positionSize && riskPerUnit > 0) {
      const rawPnl = trade.direction === 'LONG'
        ? (exitPrice - entryPrice) * positionSize
        : (entryPrice - exitPrice) * positionSize;
      pnlUsd = parseFloat(rawPnl.toFixed(2));
      pnlR = parseFloat((rawPnl / (riskPerUnit * positionSize)).toFixed(2));
      actualRr = parseFloat((Math.abs(exitPrice - entryPrice) / riskPerUnit).toFixed(2));
      if ((trade.direction === 'LONG' && exitPrice < entryPrice) || (trade.direction === 'SHORT' && exitPrice > entryPrice)) {
        actualRr = -actualRr;
      }
    }

    try {
      const updated = await tradesRepo.update(id, {
        exit_price: exitPrice,
        exit_time: exitTime,
        exit_reason: exitReason ?? undefined,
        status: 'CLOSED',
        pnl_usd: pnlUsd ?? 0,
        pnl_r: pnlR ?? 0,
        actual_rr: actualRr ?? 0,
      });
      setTrade(updated);
      setShowCloseForm(false);
      toast.success('Trade closed successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to close trade');
    } finally {
      setClosingTrade(false);
    }
  };

  const handleAddError = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const err = await tradeErrorsRepo.create(
        userId, id!, fd.get('error_type') as string, fd.get('description') as string
      );
      setErrors([...errors, err]);
      setShowErrorForm(false);
      toast.success('Error logged');
    } catch {
      toast.error('Failed to add error');
    }
  };

  const handleDeleteError = async (errId: string) => {
    try {
      await tradeErrorsRepo.delete(errId);
      setErrors(errors.filter((e) => e.id !== errId));
      toast.success('Error removed');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleAddTag = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const tag = await tradeTagsRepo.create(userId, id!, fd.get('tag') as string);
      setTags([...tags, tag]);
      setShowTagForm(false);
      toast.success('Tag added');
    } catch {
      toast.error('Failed to add tag');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await tradeTagsRepo.delete(tagId);
      setTags(tags.filter((t) => t.id !== tagId));
    } catch {
      toast.error('Failed to delete tag');
    }
  };

  const handleUploadAttachment = async (file: File, attachmentType: string) => {
    setUploading(true);
    try {
      const att = await attachmentsRepo.upload(userId, id!, file, attachmentType);
      const signedUrl = await attachmentsRepo.getSignedUrl(att.file_path);
      setAttachments([...attachments, { ...att, signed_url: signedUrl }]);
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (att: Attachment) => {
    if (!confirm('Delete this attachment?')) return;
    try {
      await attachmentsRepo.delete(att.id, att.file_path);
      setAttachments(attachments.filter((a) => a.id !== att.id));
      toast.success('Attachment deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 theme-text-secondary">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!trade) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="theme-text-secondary">Trade not found</p>
          <Link to="/trades" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">Back to Trades</Link>
        </div>
      </DashboardLayout>
    );
  }

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2.5 border-b theme-border last:border-0">
      <span className="theme-text-secondary text-sm">{label}</span>
      <span className="theme-text-primary text-sm font-mono">{value || '\u2014'}</span>
    </div>
  );

  const errorLabels: Record<string, string> = {
    FOMO_ENTRY: 'FOMO Entry', EARLY_EXIT: 'Early Exit', LATE_EXIT: 'Late Exit',
    OVERSIZE_POSITION: 'Oversize Position', NO_CLEAR_SETUP: 'No Clear Setup',
    MOVED_STOP_LOSS: 'Moved Stop Loss', REVENGE_TRADE: 'Revenge Trade',
    IGNORED_RISK_RULE: 'Ignored Risk Rule', POOR_TIMING: 'Poor Timing', OTHER: 'Other',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/trades')} className="theme-text-secondary hover:theme-text-primary">
              <ArrowLeft className="w-5 h-5" />
            </Button>
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
                <h1 className="text-2xl font-bold theme-text-primary font-mono">{trade.instrument}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={trade.direction === 'LONG' ? 'text-[#00C896] border-[#00C896]/30' : 'text-[#FF4D6D] border-[#FF4D6D]/30'}>
                    {trade.direction}
                  </Badge>
                  <Badge variant="outline" className={
                    trade.status === 'CLOSED' ? 'theme-text-secondary border-current/30' :
                    trade.status === 'OPEN' ? 'text-[#F0A500] border-[#F0A500]/30' :
                    'theme-text-secondary border-current/30'
                  }>{trade.status}</Badge>
                  {trade.pnl_r !== null && (
                    <Badge variant="outline" className={`font-mono ${(trade.pnl_r ?? 0) >= 0 ? 'text-[#00C896] border-[#00C896]/30' : 'text-[#FF4D6D] border-[#FF4D6D]/30'}`}>
                      {formatR(trade.pnl_r)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {trade.status === 'OPEN' && (
            <Button size="sm" onClick={() => setShowCloseForm(true)}
              className="bg-[#F0A500] hover:bg-[#F0A500]/80 text-black font-semibold">
              <DollarSign className="w-4 h-4 mr-1" /> Close Trade
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="theme-bg-secondary theme-border border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider">Trade Details</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Entry Time" value={formatDateTime(trade.entry_time)} />
              <DetailRow label="Exit Time" value={trade.exit_time ? formatDateTime(trade.exit_time) : null} />
              <DetailRow label="Entry Price" value={trade.entry_price} />
              <DetailRow label="Exit Price" value={trade.exit_price} />
              <DetailRow label="Stop Loss" value={trade.stop_loss} />
              <DetailRow label="Take Profit" value={trade.take_profit} />
              <DetailRow label="Position Size" value={trade.position_size} />
              <DetailRow label="Session" value={trade.session?.replace('_', ' ')} />
              <DetailRow label="Timeframe" value={trade.timeframe} />
              <DetailRow label="Strategy" value={trade.strategy?.name} />
            </CardContent>
          </Card>

          <Card className="theme-bg-secondary theme-border border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider">P&amp;L &amp; Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="P&amp;L (USD)" value={trade.pnl_usd !== null ? (
                <span className={(trade.pnl_usd ?? 0) >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}>{formatCurrency(trade.pnl_usd!)}</span>
              ) : null} />
              <DetailRow label="P&amp;L (R)" value={trade.pnl_r !== null ? (
                <span className={(trade.pnl_r ?? 0) >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}>{formatR(trade.pnl_r!)}</span>
              ) : null} />
              <DetailRow label="Planned R:R" value={trade.planned_rr} />
              <DetailRow label="Actual R:R" value={trade.actual_rr} />
              <DetailRow label="Planned Risk %" value={trade.planned_risk_percent ? `${trade.planned_risk_percent}%` : null} />
              <DetailRow label="Actual Risk %" value={trade.actual_risk_percent ? `${trade.actual_risk_percent}%` : null} />
              <DetailRow label="Setup Quality" value={trade.setup_quality ? `${trade.setup_quality}/5` : null} />
              <DetailRow label="Emotional State" value={trade.emotional_state} />
              <DetailRow label="Followed Plan" value={trade.followed_plan ? 'Yes' : 'No'} />
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {(trade.entry_reason || trade.exit_reason || trade.psychological_notes || trade.market_condition) && (
          <Card className="theme-bg-secondary theme-border border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider">Notes &amp; Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trade.entry_reason && (
                <div>
                  <p className="text-xs theme-text-secondary mb-1">Entry Reason</p>
                  <p className="text-sm theme-text-primary theme-bg-tertiary p-3 rounded-lg whitespace-pre-wrap">{trade.entry_reason}</p>
                </div>
              )}
              {trade.exit_reason && (
                <div>
                  <p className="text-xs theme-text-secondary mb-1">Exit Reason</p>
                  <p className="text-sm theme-text-primary theme-bg-tertiary p-3 rounded-lg whitespace-pre-wrap">{trade.exit_reason}</p>
                </div>
              )}
              {trade.market_condition && (
                <div>
                  <p className="text-xs theme-text-secondary mb-1">Market Condition</p>
                  <p className="text-sm theme-text-primary theme-bg-tertiary p-3 rounded-lg">{trade.market_condition}</p>
                </div>
              )}
              {trade.psychological_notes && (
                <div>
                  <p className="text-xs theme-text-secondary mb-1">Psychological Notes</p>
                  <p className="text-sm theme-text-primary theme-bg-tertiary p-3 rounded-lg whitespace-pre-wrap">{trade.psychological_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        <Card className="theme-bg-secondary theme-border border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4" /> Tags
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowTagForm(true)} className="theme-text-secondary hover:theme-text-primary">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {tags.length === 0 ? (
              <p className="theme-text-secondary text-sm">No tags added yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="theme-text-primary theme-border gap-1 pr-1">
                    {tag.tag}
                    <button onClick={() => handleDeleteTag(tag.id)} className="ml-1 theme-text-secondary hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Errors */}
        <Card className="theme-bg-secondary theme-border border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Trading Errors
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowErrorForm(true)} className="theme-text-secondary hover:theme-text-primary">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <p className="theme-text-secondary text-sm">No errors logged</p>
            ) : (
              <div className="space-y-2">
                {errors.map((err) => (
                  <div key={err.id} className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg">
                    <div>
                      <Badge variant="outline" className="text-[#FF4D6D] border-[#FF4D6D]/30 text-[10px]">
                        {errorLabels[err.error_type] || err.error_type}
                      </Badge>
                      {err.description && <p className="text-sm theme-text-primary mt-1">{err.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 theme-text-secondary hover:text-red-400"
                      onClick={() => handleDeleteError(err.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card className="theme-bg-secondary theme-border border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Image className="w-4 h-4" /> Attachments
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}
              disabled={uploading} className="theme-text-secondary hover:theme-text-primary">
              <Upload className="w-4 h-4 mr-1" /> {uploading ? 'Uploading...' : 'Upload'}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadAttachment(file, 'SCREENSHOT');
                e.target.value = '';
              }} />
          </CardHeader>
          <CardContent>
            {attachments.length === 0 ? (
              <p className="theme-text-secondary text-sm">No attachments yet</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {attachments.map((att) => (
                  <div key={att.id} className="relative group">
                    {(att as any).signed_url ? (
                      <img
                        src={(att as any).signed_url}
                        alt={att.file_name}
                        className="w-full h-32 object-cover rounded-lg cursor-pointer theme-border border"
                        onClick={() => setPreviewUrl((att as any).signed_url)}
                      />
                    ) : (
                      <div className="w-full h-32 theme-bg-tertiary rounded-lg flex items-center justify-center theme-text-secondary text-xs">
                        {att.file_name}
                      </div>
                    )}
                    <Button variant="ghost" size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteAttachment(att)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <Badge variant="outline" className="absolute bottom-1 left-1 text-[8px] bg-black/50 text-white border-transparent">
                      {att.attachment_type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Close Trade Dialog */}
        <Dialog open={showCloseForm} onOpenChange={setShowCloseForm}>
          <DialogContent className="theme-bg-secondary theme-border border theme-text-primary">
            <DialogHeader>
              <DialogTitle>Close Trade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCloseTrade} className="space-y-4">
              <div>
                <Label className="text-xs theme-text-secondary">Exit Price *</Label>
                <Input name="exit_price" type="number" step="any" required className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
              </div>
              <div>
                <Label className="text-xs theme-text-secondary">Exit Time</Label>
                <Input name="exit_time" type="datetime-local" className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
              </div>
              <div>
                <Label className="text-xs theme-text-secondary">Exit Reason</Label>
                <Textarea name="exit_reason" rows={2} className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCloseForm(false)}
                  className="theme-border border theme-text-secondary !bg-transparent">Cancel</Button>
                <Button type="submit" disabled={closingTrade} className="bg-[#F0A500] hover:bg-[#F0A500]/80 text-black font-semibold">
                  {closingTrade ? 'Closing...' : 'Close Trade'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Error Dialog */}
        <Dialog open={showErrorForm} onOpenChange={setShowErrorForm}>
          <DialogContent className="theme-bg-secondary theme-border border theme-text-primary">
            <DialogHeader>
              <DialogTitle>Log Trading Error</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddError} className="space-y-4">
              <div>
                <Label className="text-xs theme-text-secondary">Error Type *</Label>
                <Select name="error_type" defaultValue="OTHER">
                  <SelectTrigger className="theme-bg-tertiary theme-border border theme-text-primary mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="theme-bg-secondary theme-border border">
                    {ERROR_TYPES.map((e) => <SelectItem key={e} value={e}>{errorLabels[e] || e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs theme-text-secondary">Description</Label>
                <Textarea name="description" rows={2} className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowErrorForm(false)}
                  className="theme-border border theme-text-secondary !bg-transparent">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Error</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Tag Dialog */}
        <Dialog open={showTagForm} onOpenChange={setShowTagForm}>
          <DialogContent className="theme-bg-secondary theme-border border theme-text-primary">
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTag} className="space-y-4">
              <div>
                <Label className="text-xs theme-text-secondary">Tag *</Label>
                <Input name="tag" required placeholder="e.g. breakout, reversal" className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowTagForm(false)}
                  className="theme-border border theme-text-secondary !bg-transparent">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Add Tag</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Image Preview Dialog */}
        {previewUrl && (
          <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
            <DialogContent className="theme-bg-secondary theme-border border max-w-3xl p-2">
              <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}