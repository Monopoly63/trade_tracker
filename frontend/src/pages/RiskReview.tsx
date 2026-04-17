import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { authRepo, tradesRepo, riskRulesRepo } from '@/lib/repository';
import { formatPercent, formatDateTime } from '@/lib/services';
import type { Trade, RiskRule } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface ViolationItem {
  tradeId: string;
  instrument: string;
  date: string;
  type: string;
  detail: string;
}

export default function RiskReview() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [rules, setRules] = useState<RiskRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const session = await authRepo.getSession();
        if (!session?.user) return;
        const uid = session.user.id;
        const [{ data }, riskRules] = await Promise.all([
          tradesRepo.getAll(uid, undefined, 0, 1000),
          riskRulesRepo.getAll(uid),
        ]);
        setTrades(data);
        setRules(riskRules);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const closedTrades = trades.filter((t) => t.status === 'CLOSED');
  const activeRule = rules.find((r) => r.is_active) || null;

  const compliantTrades = activeRule
    ? closedTrades.filter((t) => {
        if (!t.actual_risk_percent || !activeRule.max_risk_per_trade) return true;
        return t.actual_risk_percent <= activeRule.max_risk_per_trade;
      })
    : closedTrades;

  const complianceRate = closedTrades.length > 0
    ? (compliantTrades.length / closedTrades.length) * 100
    : 100;

  const plannedRisks = closedTrades.filter((t) => t.planned_risk_percent).map((t) => t.planned_risk_percent!);
  const actualRisks = closedTrades.filter((t) => t.actual_risk_percent).map((t) => t.actual_risk_percent!);
  const avgPlannedRisk = plannedRisks.length > 0 ? plannedRisks.reduce((a, b) => a + b, 0) / plannedRisks.length : 0;
  const avgActualRisk = actualRisks.length > 0 ? actualRisks.reduce((a, b) => a + b, 0) / actualRisks.length : 0;

  const violations: ViolationItem[] = [];
  if (activeRule) {
    for (const t of closedTrades) {
      if (t.actual_risk_percent && t.actual_risk_percent > activeRule.max_risk_per_trade) {
        violations.push({
          tradeId: t.id, instrument: t.instrument, date: t.entry_time,
          type: 'Oversize Risk',
          detail: `Risk ${t.actual_risk_percent}% exceeded limit ${activeRule.max_risk_per_trade}%`,
        });
      }
      if (!t.followed_plan) {
        violations.push({
          tradeId: t.id, instrument: t.instrument, date: t.entry_time,
          type: 'Plan Deviation', detail: 'Trade did not follow the plan',
        });
      }
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold theme-text-primary">Risk Review</h1>
          <p className="theme-text-secondary text-sm mt-1">Monitor your risk compliance and discipline</p>
        </div>

        {loading ? (
          <div className="text-center py-16 theme-text-secondary">Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="theme-bg-secondary theme-border border">
                <CardContent className="p-4">
                  <p className="text-xs theme-text-secondary uppercase tracking-wider">Compliance Rate</p>
                  <p className={`text-2xl font-bold font-mono mt-1 ${complianceRate >= 80 ? 'text-[#00C896]' : complianceRate >= 60 ? 'text-[#F0A500]' : 'text-[#FF4D6D]'}`}>
                    {formatPercent(complianceRate)}
                  </p>
                  <p className="text-xs theme-text-secondary mt-1">{compliantTrades.length}/{closedTrades.length} trades</p>
                </CardContent>
              </Card>
              <Card className="theme-bg-secondary theme-border border">
                <CardContent className="p-4">
                  <p className="text-xs theme-text-secondary uppercase tracking-wider">Avg Planned Risk</p>
                  <p className="text-2xl font-bold font-mono theme-text-primary mt-1">{avgPlannedRisk.toFixed(2)}%</p>
                </CardContent>
              </Card>
              <Card className="theme-bg-secondary theme-border border">
                <CardContent className="p-4">
                  <p className="text-xs theme-text-secondary uppercase tracking-wider">Avg Actual Risk</p>
                  <p className={`text-2xl font-bold font-mono mt-1 ${avgActualRisk > avgPlannedRisk ? 'text-[#FF4D6D]' : 'text-[#00C896]'}`}>
                    {avgActualRisk.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>
              <Card className="theme-bg-secondary theme-border border">
                <CardContent className="p-4">
                  <p className="text-xs theme-text-secondary uppercase tracking-wider">Violations</p>
                  <p className={`text-2xl font-bold font-mono mt-1 ${violations.length > 0 ? 'text-[#FF4D6D]' : 'text-[#00C896]'}`}>
                    {violations.length}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="theme-bg-secondary theme-border border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Active Risk Rule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeRule ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="theme-bg-tertiary rounded-lg p-3">
                      <p className="text-xs theme-text-secondary">Max Risk/Trade</p>
                      <p className="font-mono font-bold theme-text-primary">{activeRule.max_risk_per_trade}%</p>
                    </div>
                    {activeRule.max_daily_loss && (
                      <div className="theme-bg-tertiary rounded-lg p-3">
                        <p className="text-xs theme-text-secondary">Max Daily Loss</p>
                        <p className="font-mono font-bold theme-text-primary">{activeRule.max_daily_loss}%</p>
                      </div>
                    )}
                    {activeRule.max_weekly_loss && (
                      <div className="theme-bg-tertiary rounded-lg p-3">
                        <p className="text-xs theme-text-secondary">Max Weekly Loss</p>
                        <p className="font-mono font-bold theme-text-primary">{activeRule.max_weekly_loss}%</p>
                      </div>
                    )}
                    <div className="theme-bg-tertiary rounded-lg p-3">
                      <p className="text-xs theme-text-secondary">Max Consecutive Losses</p>
                      <p className="font-mono font-bold theme-text-primary">{activeRule.max_consecutive_losses}</p>
                    </div>
                  </div>
                ) : (
                  <p className="theme-text-secondary text-sm">No active risk rule. Go to Settings to create one.</p>
                )}
              </CardContent>
            </Card>

            <Card className="theme-bg-secondary theme-border border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Recent Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {violations.length === 0 ? (
                  <div className="text-center py-8">
                    <ShieldCheck className="w-10 h-10 text-[#00C896] mx-auto mb-3" />
                    <p className="theme-text-secondary text-sm">No violations found. Great discipline!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {violations.slice(0, 20).map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-4 h-4 text-[#FF4D6D] shrink-0" />
                          <div>
                            <p className="text-sm theme-text-primary font-mono">{v.instrument}</p>
                            <p className="text-xs theme-text-secondary">{formatDateTime(v.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-[#FF4D6D] border-[#FF4D6D]/30 text-[10px]">{v.type}</Badge>
                          <p className="text-xs theme-text-secondary mt-1">{v.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}