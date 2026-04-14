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
  Plus, Trash2, Upload, X, ExternalLink,
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

        // Get signed URLs for attachments
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
        <div className="flex items-center justify-center h-64 text-[#8B8BA7]">Loading...</div>
      </DashboardLayout>
    );
  }

  if (!trade) {
    return (
      <DashboardLayout>
        <div className="text-center py-16">
          <p className="text-[#8B8BA7]">Trade not found</p>
          <Link to="/trades" className="text-indigo-400 hover:text-indigo-300 text-sm mt-2 inline-block">← Back to Trades</Link>
        </div>
      </DashboardLayout>
    );
  }

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between py-2.5 border-b border-[#1E1E2E] last:border-0">
      <span className="text-[#8B8BA7] text-sm">{label}</span>
      <span className="text-white text-sm font-mono">{value || '—'}</span>
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/trades')} className="text-[#8B8BA7] hover:text-white">
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
              <h1 className="text-2xl font-bold text-white font-mono">{trade.instrument}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={trade.direction === 'LONG' ? 'text-[#00C896] border-[#00C896]/30' : 'text-[#FF4D6D] border-[#FF4D6D]/30'}>
                  {trade.direction}
                </Badge>
                <Badge variant="outline" className={
                  trade.status === 'CLOSED' ? 'text-[#8B8BA7] border-[#8B8BA7]/30' :
                  trade.status === 'OPEN' ? 'text-[#F0A500] border-[#F0A500]/30' :
                  'text-[#8B8BA7] border-[#8B8BA7]/30'
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Trade Details */}
          <Card className="bg-[#111118] border-[#1E1E2E]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#8B8BA7] uppercase tracking-wider">Trade Details</CardTitle>
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

          {/* P&L & Risk */}
          <Card className="bg-[#111118] border-[#1E1E2E]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#8B8BA7] uppercase tracking-wider">P&L & Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="P&L (USD)" value={trade.pnl_usd !== null ? (
                <span className={(trade.pnl_usd ?? 0) >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}>{formatCurrency(trade.pnl_usd!)}</span>
              ) : null} />
              <DetailRow label="P&L (R)" value={trade.pnl_r !== null ? (
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
          <Card className="bg-[#111118] border-[#1E1E2E]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-[#8B8BA7] uppercase tracking-wider">Notes & Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {trade.entry_reason && (
                <div>
                  <p className="text-xs text-[#8B8BA7] mb-1">Entry Reason</p>
                  <p className="text-sm text-white bg-[#0A0A0F] p-3 rounded-lg whitespace-pre-wrap">{trade.entry_reason}</p>
                </div>
              )}
              {trade.exit_reason && (
                <div>
                  <p className="text-xs text-[#8B8BA7] mb-1">Exit Reason</p>
                  <p className="text-sm text-white bg-[#0A0A0F] p-3 rounded-lg whitespace-pre-wrap">{trade.exit_reason}</p>
                </div>
              )}
              {trade.market_condition && (
                <div>
                  <p className="text-xs text-[#8B8BA7] mb-1">Market Condition</p>
                  <p className="text-sm text-white bg-[#0A0A0F] p-3 rounded-lg">{trade.market_condition}</p>
                </div>
              )}
              {trade.psychological_notes && (
                <div>
                  <p className="text-xs text-[#8B8BA7] mb-1">Psychological Notes</p>
                  <p className="text-sm text-white bg-[#0A0A0F] p-3 rounded-lg whitespace-pre-wrap">{trade.psychological_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        <Card className="bg-[#111118] border-[#1E1E2E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-[#8B8BA7] uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4" /> Tags
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowTagForm(true)} className="text-indigo-400 hover:text-indigo-300">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            {tags.length === 0 ? (
              <p className="text-[#8B8BA7] text-sm">No tags yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag.id} variant="outline" className="text-indigo-400 border-indigo-500/30 flex items-center gap-1">
                    {tag.tag}
                    <button onClick={() => handleDeleteTag(tag.id)} className="ml-1 hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Errors */}
        <Card className="bg-[#111118] border-[#1E1E2E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-[#8B8BA7] uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Errors ({errors.length})
            </CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setShowErrorForm(true)} className="text-[#FF4D6D] hover:text-[#FF4D6D]/80">
              <Plus className="w-4 h-4 mr-1" /> Log Error
            </Button>
          </CardHeader>
          <CardContent>
            {errors.length === 0 ? (
              <p className="text-[#8B8BA7] text-sm">No errors logged for this trade</p>
            ) : (
              <div className="space-y-2">
                {errors.map((err) => (
                  <div key={err.id} className="flex items-center justify-between p-3 bg-[#0A0A0F] rounded-lg">
                    <div>
                      <Badge variant="outline" className="text-[#FF4D6D] border-[#FF4D6D]/30 text-xs">
                        {errorLabels[err.error_type] || err.error_type}
                      </Badge>
                      {err.description && <p className="text-sm text-[#8B8BA7] mt-1">{err.description}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8B8BA7] hover:text-red-400"
                      onClick={() => handleDeleteError(err.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card className="bg-[#111118] border-[#1E1E2E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-[#8B8BA7] uppercase tracking-wider flex items-center gap-2">
              <Image className="w-4 h-4" /> Chart Screenshots ({attachments.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select onValueChange={(type) => fileInputRef.current?.click()}>
                <SelectTrigger className="bg-transparent border-indigo-500/30 text-indigo-400 text-xs h-8 w-32">
                  <SelectValue placeholder="Upload..." />
                </SelectTrigger>
                <SelectContent className="bg-[#111118] border-[#1E1E2E]">
                  {ATTACHMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadAttachment(file, 'BEFORE');
                  e.target.value = '';
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            {uploading && <p className="text-[#F0A500] text-sm mb-3">Uploading...</p>}
            {attachments.length === 0 ? (
              <div className="text-center py-8">
                <Upload className="w-10 h-10 text-[#8B8BA7] mx-auto mb-3" />
                <p className="text-[#8B8BA7] text-sm">No screenshots attached yet</p>
                <p className="text-[#8B8BA7] text-xs mt-1">Upload chart screenshots (JPEG, PNG, WebP — max 5MB)</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {attachments.map((att) => (
                  <div key={att.id} className="relative group rounded-lg overflow-hidden bg-[#0A0A0F] border border-[#1E1E2E]">
                    {att.signed_url ? (
                      <img
                        src={att.signed_url}
                        alt={att.file_name}
                        className="w-full h-32 object-cover cursor-pointer"
                        onClick={() => setPreviewUrl(att.signed_url || null)}
                      />
                    ) : (
                      <div className="w-full h-32 flex items-center justify-center text-[#8B8BA7]">
                        <Image className="w-8 h-8" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs text-white truncate">{att.file_name}</p>
                      <div className="flex items-center justify-between mt-1">
                        <Badge variant="outline" className="text-[10px] text-[#8B8BA7] border-[#8B8BA7]/30">
                          {att.attachment_type || 'NOTE'}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#8B8BA7] hover:text-red-400"
                          onClick={() => handleDeleteAttachment(att)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Preview Dialog */}
        {previewUrl && (
          <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
            <DialogContent className="bg-[#111118] border-[#1E1E2E] max-w-3xl p-2">
              <img src={previewUrl} alt="Preview" className="w-full rounded-lg" />
            </DialogContent>
          </Dialog>
        )}

        {/* Error Form Dialog */}
        <Dialog open={showErrorForm} onOpenChange={setShowErrorForm}>
          <DialogContent className="bg-[#111118] border-[#1E1E2E] text-white">
            <DialogHeader>
              <DialogTitle>Log Trade Error</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddError} className="space-y-4">
              <div>
                <Label className="text-xs text-[#8B8BA7]">Error Type *</Label>
                <Select name="error_type" required>
                  <SelectTrigger className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1"><SelectValue placeholder="Select error type" /></SelectTrigger>
                  <SelectContent className="bg-[#111118] border-[#1E1E2E]">
                    {ERROR_TYPES.map((et) => (
                      <SelectItem key={et} value={et}>{errorLabels[et] || et}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#8B8BA7]">Description</Label>
                <Textarea name="description" rows={3} placeholder="What happened..." className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowErrorForm(false)} className="border-[#1E1E2E] text-[#8B8BA7] bg-transparent">Cancel</Button>
                <Button type="submit" className="bg-[#FF4D6D] hover:bg-[#FF4D6D]/80 text-white">Log Error</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Tag Form Dialog */}
        <Dialog open={showTagForm} onOpenChange={setShowTagForm}>
          <DialogContent className="bg-[#111118] border-[#1E1E2E] text-white">
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTag} className="space-y-4">
              <div>
                <Label className="text-xs text-[#8B8BA7]">Tag *</Label>
                <Input name="tag" required placeholder="e.g. breakout, trend-following" className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowTagForm(false)} className="border-[#1E1E2E] text-[#8B8BA7] bg-transparent">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Add Tag</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}