import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { authRepo, riskRulesRepo } from '@/lib/repository';
import type { RiskRule } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Shield, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<RiskRule | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await authRepo.getSession();
        if (!session?.user) return;
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');
        const riskRules = await riskRulesRepo.getAll(session.user.id);
        setRules(riskRules);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveRule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ruleData: Partial<RiskRule> = {
      max_risk_per_trade: parseFloat(fd.get('max_risk_per_trade') as string),
      max_daily_loss: fd.get('max_daily_loss') ? parseFloat(fd.get('max_daily_loss') as string) : null,
      max_weekly_loss: fd.get('max_weekly_loss') ? parseFloat(fd.get('max_weekly_loss') as string) : null,
      max_consecutive_losses: fd.get('max_consecutive_losses') ? parseInt(fd.get('max_consecutive_losses') as string) : 3,
      notes: (fd.get('notes') as string) || null,
    };

    try {
      if (editingRule) {
        const updated = await riskRulesRepo.update(editingRule.id, ruleData);
        setRules(rules.map((r) => (r.id === editingRule.id ? updated : r)));
        toast.success('Risk rule updated');
      } else {
        const created = await riskRulesRepo.create(userId, ruleData);
        setRules([...rules, created]);
        toast.success('Risk rule created');
      }
      setShowRuleForm(false);
      setEditingRule(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Delete this risk rule?')) return;
    try {
      await riskRulesRepo.delete(id);
      setRules(rules.filter((r) => r.id !== id));
      toast.success('Risk rule deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-[#8B8BA7] text-sm mt-1">Manage your account and risk rules</p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#8B8BA7]">Loading...</div>
        ) : (
          <>
            {/* Account Info */}
            <Card className="bg-[#111118] border-[#1E1E2E]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-[#8B8BA7] uppercase tracking-wider flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" /> Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-3 bg-[#0A0A0F] rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-indigo-400">{userEmail.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{userEmail}</p>
                    <p className="text-xs text-[#8B8BA7]">User ID: {userId.slice(0, 8)}...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Rules */}
            <Card className="bg-[#111118] border-[#1E1E2E]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-[#8B8BA7] uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Risk Rules
                </CardTitle>
                <Button size="sm" onClick={() => { setEditingRule(null); setShowRuleForm(true); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-1" /> Add Rule
                </Button>
              </CardHeader>
              <CardContent>
                {rules.length === 0 ? (
                  <p className="text-[#8B8BA7] text-sm text-center py-8">
                    No risk rules defined. Add one to track your risk compliance.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-4 bg-[#0A0A0F] rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={rule.is_active ? 'text-[#00C896] border-[#00C896]/30' : 'text-[#8B8BA7] border-[#8B8BA7]/30'}>
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-[#8B8BA7] text-xs">Max Risk/Trade</span>
                              <p className="font-mono text-white">{rule.max_risk_per_trade}%</p>
                            </div>
                            {rule.max_daily_loss && (
                              <div>
                                <span className="text-[#8B8BA7] text-xs">Max Daily Loss</span>
                                <p className="font-mono text-white">{rule.max_daily_loss}%</p>
                              </div>
                            )}
                            {rule.max_weekly_loss && (
                              <div>
                                <span className="text-[#8B8BA7] text-xs">Max Weekly Loss</span>
                                <p className="font-mono text-white">{rule.max_weekly_loss}%</p>
                              </div>
                            )}
                            <div>
                              <span className="text-[#8B8BA7] text-xs">Max Cons. Losses</span>
                              <p className="font-mono text-white">{rule.max_consecutive_losses}</p>
                            </div>
                          </div>
                          {rule.notes && <p className="text-xs text-[#8B8BA7]">{rule.notes}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0 ml-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8B8BA7] hover:text-white"
                            onClick={() => { setEditingRule(rule); setShowRuleForm(true); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8B8BA7] hover:text-red-400"
                            onClick={() => handleDeleteRule(rule.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Risk Rule Form Dialog */}
        <Dialog open={showRuleForm} onOpenChange={() => { setShowRuleForm(false); setEditingRule(null); }}>
          <DialogContent className="bg-[#111118] border-[#1E1E2E] text-white">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Risk Rule' : 'New Risk Rule'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#8B8BA7]">Max Risk per Trade (%) *</Label>
                  <Input name="max_risk_per_trade" type="number" step="0.01" required
                    defaultValue={editingRule?.max_risk_per_trade || 1}
                    className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-[#8B8BA7]">Max Daily Loss (%)</Label>
                  <Input name="max_daily_loss" type="number" step="0.01"
                    defaultValue={editingRule?.max_daily_loss || ''}
                    className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-[#8B8BA7]">Max Weekly Loss (%)</Label>
                  <Input name="max_weekly_loss" type="number" step="0.01"
                    defaultValue={editingRule?.max_weekly_loss || ''}
                    className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1" />
                </div>
                <div>
                  <Label className="text-xs text-[#8B8BA7]">Max Consecutive Losses</Label>
                  <Input name="max_consecutive_losses" type="number"
                    defaultValue={editingRule?.max_consecutive_losses || 3}
                    className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#8B8BA7]">Notes</Label>
                <Textarea name="notes" rows={2} defaultValue={editingRule?.notes || ''}
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowRuleForm(false); setEditingRule(null); }}
                  className="border-[#1E1E2E] text-[#8B8BA7] bg-transparent">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}