import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { authRepo, tradesRepo, tradeErrorsRepo } from '@/lib/repository';
import {
  computeAnalytics, computeMonthlyPnl, computeSessionPerformance,
  computeErrorAnalysis, formatR, formatPercent,
} from '@/lib/services';
import type { Trade, AnalyticsSummary, MonthlyPnl, SessionPerformance, ErrorAnalysis } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useTheme } from '@/lib/theme';

const COLORS = ['#6366F1', '#00C896', '#FF4D6D', '#F0A500', '#8B5CF6', '#EC4899'];

export default function Analytics() {
  const { theme } = useTheme();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPnl[]>([]);
  const [sessions, setSessions] = useState<SessionPerformance[]>([]);
  const [errors, setErrors] = useState<ErrorAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1E1E2E' : '#E2E4E9';
  const tickFill = isDark ? '#8B8BA7' : '#6B7280';
  const tooltipBg = isDark ? '#111118' : '#FFFFFF';
  const tooltipBorder = isDark ? '#1E1E2E' : '#E2E4E9';

  useEffect(() => {
    (async () => {
      try {
        const session = await authRepo.getSession();
        if (!session?.user) return;
        const uid = session.user.id;
        const { data } = await tradesRepo.getAll(uid, undefined, 0, 1000);
        setTrades(data);
        if (data.length > 0) {
          setAnalytics(computeAnalytics(data));
          setMonthly(computeMonthlyPnl(data));
          setSessions(computeSessionPerformance(data));
        }
        const errs = await tradeErrorsRepo.getAllByUser(uid);
        if (errs.length > 0) setErrors(computeErrorAnalysis(errs));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Cumulative P&L curve
  const cumulativeData = trades
    .filter((t) => t.status === 'CLOSED')
    .sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime())
    .reduce<{ date: string; cumR: number }[]>((acc, t) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cumR : 0;
      acc.push({
        date: new Date(t.entry_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cumR: parseFloat((prev + (t.pnl_r ?? 0)).toFixed(2)),
      });
      return acc;
    }, []);

  // Win/Loss distribution for pie chart
  const winLossData = analytics ? [
    { name: 'Wins', value: analytics.winningTrades, color: '#00C896' },
    { name: 'Losses', value: analytics.losingTrades, color: '#FF4D6D' },
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold theme-text-primary">Analytics</h1>
          <p className="theme-text-secondary text-sm mt-1">Deep dive into your trading performance</p>
        </div>

        {loading ? (
          <div className="text-center py-16 theme-text-secondary">Loading...</div>
        ) : trades.length === 0 ? (
          <Card className="theme-bg-secondary theme-border border">
            <CardContent className="text-center py-16 theme-text-secondary">
              No closed trades to analyze. Start logging trades to see analytics.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Key Metrics */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Win Rate', value: formatPercent(analytics.winRate), sub: `${analytics.winningTrades}W / ${analytics.losingTrades}L` },
                  { label: 'Profit Factor', value: analytics.profitFactor.toFixed(2), sub: `Avg Win: ${formatR(analytics.avgWinR)}` },
                  { label: 'Expectancy', value: formatR(analytics.expectancy), sub: `Avg Loss: ${formatR(analytics.avgLossR)}` },
                  { label: 'Max Drawdown', value: formatR(analytics.maxDrawdownR), sub: `Cons. Losses: ${analytics.maxConsecutiveLosses}` },
                ].map((m) => (
                  <Card key={m.label} className="theme-bg-secondary theme-border border">
                    <CardContent className="p-4">
                      <p className="text-xs theme-text-secondary uppercase tracking-wider">{m.label}</p>
                      <p className="text-xl font-bold font-mono theme-text-primary mt-1">{m.value}</p>
                      <p className="text-xs theme-text-secondary mt-1">{m.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Equity Curve */}
            {cumulativeData.length > 1 && (
              <Card className="theme-bg-secondary theme-border border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider">Equity Curve (R-multiples)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={cumulativeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="date" tick={{ fill: tickFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} />
                      <YAxis tick={{ fill: tickFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} />
                      <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                        labelStyle={{ color: tickFill }} formatter={(v: number) => [`${v.toFixed(2)}R`, 'Cumulative']} />
                      <Line type="monotone" dataKey="cumR" stroke="#6366F1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {/* Monthly P&L */}
              {monthly.length > 0 && (
                <Card className="theme-bg-secondary theme-border border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider">Monthly P&L (R)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthly}>
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis dataKey="month" tick={{ fill: tickFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} />
                        <YAxis tick={{ fill: tickFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} />
                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                          labelStyle={{ color: tickFill }} />
                        <Bar dataKey="pnlR" name="P&L (R)" radius={[4, 4, 0, 0]}
                          fill="#6366F1">
                          {monthly.map((entry, i) => (
                            <Cell key={i} fill={entry.pnlR >= 0 ? '#00C896' : '#FF4D6D'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Win/Loss Pie */}
              {winLossData.length > 0 && (
                <Card className="theme-bg-secondary theme-border border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider">Win/Loss Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={winLossData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                          dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {winLossData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Session Performance */}
              {sessions.length > 0 && (
                <Card className="theme-bg-secondary theme-border border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider">Session Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sessions.map((s) => (
                        <div key={s.session} className="flex items-center justify-between p-3 theme-bg-tertiary rounded-lg">
                          <div>
                            <p className="text-sm font-medium theme-text-primary">{s.session.replace('_', ' ')}</p>
                            <p className="text-xs theme-text-secondary">{s.trades} trades</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono theme-text-primary">{formatPercent(s.winRate)} WR</p>
                            <p className={`text-xs font-mono ${s.avgR >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}`}>{formatR(s.avgR)} avg</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Error Analysis */}
              {errors.length > 0 && (
                <Card className="theme-bg-secondary theme-border border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider">Error Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={errors} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                        <XAxis type="number" tick={{ fill: tickFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} />
                        <YAxis dataKey="label" type="category" width={120} tick={{ fill: tickFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} />
                        <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }} />
                        <Bar dataKey="count" name="Occurrences" fill="#FF4D6D" radius={[0, 4, 4, 0]}>
                          {errors.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}