import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { authRepo, riskRulesRepo } from '@/lib/repository';
import { useTheme } from '@/lib/theme';
import type { RiskRule } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Shield, Settings as SettingsIcon, Sun, Moon } from 'lucide-react';

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
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
      toast.success('Rule deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleToggleActive = async (rule: RiskRule) => {
    try {
      const updated = await riskRulesRepo.update(rule.id, { is_active: !rule.is_active });
      setRules(rules.map((r) => (r.id === rule.id ? updated : r)));
      toast.success(updated.is_active ? 'Rule activated' : 'Rule deactivated');
    } catch {
      toast.error('Failed to toggle');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold theme-text-primary">Settings</h1>
          <p className="theme-text-secondary text-sm mt-1">Manage your account and risk rules</p>
        </div>

        {loading ? (
          <div className="text-center py-16 theme-text-secondary">Loading...</div>
        ) : (
          <>
            {/* Account Info */}
            <Card className="theme-bg-secondary theme-border border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <SettingsIcon className="w-4 h-4" /> Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg">
                  <div>
                    <p className="text-xs theme-text-secondary">Email</p>
                    <p className="text-sm theme-text-primary font-mono">{userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg">
                  <div>
                    <p className="text-xs theme-text-secondary">User ID</p>
                    <p className="text-sm theme-text-primary font-mono text-[10px]">{userId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Toggle */}
            <Card className="theme-bg-secondary theme-border border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />} Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Sun className="w-4 h-4 theme-text-secondary" />
                    <div>
                      <p className="text-sm theme-text-primary">Dark Mode</p>
                      <p className="text-xs theme-text-secondary">Toggle between light and dark theme</p>
                    </div>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>
              </CardContent>
            </Card>

            {/* Risk Rules */}
            <Card className="theme-bg-secondary theme-border border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Risk Rules
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setEditingRule(null); setShowRuleForm(true); }}
                  className="theme-text-secondary hover:theme-text-primary">
                  <Plus className="w-4 h-4 mr-1" /> Add Rule
                </Button>
              </CardHeader>
              <CardContent>
                {rules.length === 0 ? (
                  <p className="theme-text-secondary text-sm">No risk rules configured. Add one to track your discipline.</p>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule) => (
                      <div key={rule.id} className="p-4 theme-bg-tertiary rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={rule.is_active ? 'text-[#00C896] border-[#00C896]/30' : 'theme-text-secondary border-current/30'}>
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Switch checked={rule.is_active} onCheckedChange={() => handleToggleActive(rule)} />
                            <Button variant="ghost" size="icon" className="h-7 w-7 theme-text-secondary hover:theme-text-primary"
                              onClick={() => { setEditingRule(rule); setShowRuleForm(true); }}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 theme-text-secondary hover:text-red-400"
                              onClick={() => handleDeleteRule(rule.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <p className="text-[10px] theme-text-secondary uppercase">Max Risk/Trade</p>
                            <p className="font-mono font-bold theme-text-primary">{rule.max_risk_per_trade}%</p>
                          </div>
                          {rule.max_daily_loss && (
                            <div>
                              <p className="text-[10px] theme-text-secondary uppercase">Max Daily Loss</p>
                              <p className="font-mono font-bold theme-text-primary">{rule.max_daily_loss}%</p>
                            </div>
                          )}
                          {rule.max_weekly_loss && (
                            <div>
                              <p className="text-[10px] theme-text-secondary uppercase">Max Weekly Loss</p>
                              <p className="font-mono font-bold theme-text-primary">{rule.max_weekly_loss}%</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] theme-text-secondary uppercase">Max Cons. Losses</p>
                            <p className="font-mono font-bold theme-text-primary">{rule.max_consecutive_losses}</p>
                          </div>
                        </div>
                        {rule.notes && (
                          <p className="text-sm theme-text-secondary mt-2 italic">{rule.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Rule Form Dialog */}
        <Dialog open={showRuleForm} onOpenChange={() => { setShowRuleForm(false); setEditingRule(null); }}>
          <DialogContent className="theme-bg-secondary theme-border border theme-text-primary">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Risk Rule' : 'New Risk Rule'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs theme-text-secondary">Max Risk per Trade (%) *</Label>
                  <Input name="max_risk_per_trade" type="number" step="0.01" required
                    defaultValue={editingRule?.max_risk_per_trade ?? 1}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">Max Daily Loss (%)</Label>
                  <Input name="max_daily_loss" type="number" step="0.01"
                    defaultValue={editingRule?.max_daily_loss ?? ''}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">Max Weekly Loss (%)</Label>
                  <Input name="max_weekly_loss" type="number" step="0.01"
                    defaultValue={editingRule?.max_weekly_loss ?? ''}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
                <div>
                  <Label className="text-xs theme-text-secondary">Max Consecutive Losses</Label>
                  <Input name="max_consecutive_losses" type="number"
                    defaultValue={editingRule?.max_consecutive_losses ?? 3}
                    className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-xs theme-text-secondary">Notes</Label>
                <Textarea name="notes" rows={2} defaultValue={editingRule?.notes || ''}
                  className="theme-bg-tertiary theme-border border theme-text-primary mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowRuleForm(false); setEditingRule(null); }}
                  className="theme-border border theme-text-secondary !bg-transparent">Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">Save Rule</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}