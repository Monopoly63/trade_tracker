import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { authRepo, strategiesRepo, tradesRepo } from '@/lib/repository';
import { computeStrategyPerformance, formatR, formatPercent } from '@/lib/services';
import type { Strategy, StrategyPerformance } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Target, TrendingUp } from 'lucide-react';

export default function Strategies() {
  const [userId, setUserId] = useState('');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [performance, setPerformance] = useState<StrategyPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Strategy | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const session = await authRepo.getSession();
        if (!session?.user) return;
        const uid = session.user.id;
        setUserId(uid);
        const strats = await strategiesRepo.getAll(uid);
        setStrategies(strats);
        const { data: trades } = await tradesRepo.getAll(uid, undefined, 0, 1000);
        setPerformance(computeStrategyPerformance(trades));
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
    const name = fd.get('name') as string;
    const description = fd.get('description') as string;
    const rules = fd.get('rules') as string;

    try {
      if (editing) {
        const updated = await strategiesRepo.update(editing.id, { name, description, rules });
        setStrategies(strategies.map((s) => (s.id === editing.id ? updated : s)));
        toast.success('Strategy updated');
      } else {
        const created = await strategiesRepo.create(userId, name, description, rules);
        setStrategies([...strategies, created]);
        toast.success('Strategy created');
      }
      setShowForm(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this strategy?')) return;
    try {
      await strategiesRepo.delete(id);
      setStrategies(strategies.filter((s) => s.id !== id));
      toast.success('Strategy deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const getPerf = (id: string) => performance.find((p) => p.strategyId === id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Strategies</h1>
            <p className="text-[#8B8BA7] text-sm mt-1">Manage and compare your trading strategies</p>
          </div>
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-1" /> New Strategy
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#8B8BA7]">Loading...</div>
        ) : strategies.length === 0 ? (
          <Card className="bg-[#111118] border-[#1E1E2E]">
            <CardContent className="flex flex-col items-center py-16">
              <Target className="w-12 h-12 text-[#8B8BA7] mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No strategies yet</h3>
              <p className="text-[#8B8BA7] text-sm">Create strategies to categorize and compare your trades</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {strategies.map((strategy) => {
              const perf = getPerf(strategy.id);
              return (
                <Card key={strategy.id} className="bg-[#111118] border-[#1E1E2E]">
                  <CardHeader className="flex flex-row items-start justify-between pb-2">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        {strategy.name}
                        {!strategy.is_active && <Badge variant="outline" className="text-[#8B8BA7] border-[#8B8BA7]/30 text-[10px]">Inactive</Badge>}
                      </CardTitle>
                      {strategy.description && <p className="text-sm text-[#8B8BA7] mt-1">{strategy.description}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8B8BA7] hover:text-white"
                        onClick={() => { setEditing(strategy); setShowForm(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-[#8B8BA7] hover:text-red-400"
                        onClick={() => handleDelete(strategy.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {perf ? (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-[#0A0A0F] rounded-lg p-3 text-center">
                          <p className="text-xs text-[#8B8BA7]">Win Rate</p>
                          <p className={`font-mono font-bold ${perf.winRate >= 50 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}`}>
                            {formatPercent(perf.winRate)}
                          </p>
                        </div>
                        <div className="bg-[#0A0A0F] rounded-lg p-3 text-center">
                          <p className="text-xs text-[#8B8BA7]">P&L</p>
                          <p className={`font-mono font-bold ${perf.totalPnlR >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}`}>
                            {formatR(perf.totalPnlR)}
                          </p>
                        </div>
                        <div className="bg-[#0A0A0F] rounded-lg p-3 text-center">
                          <p className="text-xs text-[#8B8BA7]">Trades</p>
                          <p className="font-mono font-bold text-white">{perf.totalTrades}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[#8B8BA7] italic">No closed trades with this strategy yet</p>
                    )}
                    {strategy.rules && (
                      <div className="mt-3 p-3 bg-[#0A0A0F] rounded-lg">
                        <p className="text-xs text-[#8B8BA7] mb-1">Rules</p>
                        <p className="text-sm text-white whitespace-pre-wrap">{strategy.rules}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Strategy Form Dialog */}
        <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setEditing(null); }}>
          <DialogContent className="bg-[#111118] border-[#1E1E2E] text-white">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Strategy' : 'New Strategy'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label className="text-xs text-[#8B8BA7]">Name *</Label>
                <Input name="name" required defaultValue={editing?.name || ''} className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-[#8B8BA7]">Description</Label>
                <Textarea name="description" rows={2} defaultValue={editing?.description || ''} className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-[#8B8BA7]">Rules</Label>
                <Textarea name="rules" rows={3} defaultValue={editing?.rules || ''} placeholder="Entry/exit rules for this strategy..." className="bg-[#0A0A0F] border-[#1E1E2E] text-white mt-1" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}
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