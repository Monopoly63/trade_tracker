import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { authRepo, tradesRepo } from '@/lib/repository';
import { computeAnalytics } from '@/lib/services';
import { formatCurrency, formatR, formatPercent, formatDateTime } from '@/lib/services';
import type { Trade, AnalyticsSummary } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Target, DollarSign,
  BarChart3, Percent, Zap,
} from 'lucide-react';
import { useTheme } from '@/lib/theme';

function KpiCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string; subtitle?: string; icon: React.ElementType; color: string;
}) {
  const borderColor = color === 'green' ? 'border-l-[#00C896]' : color === 'red' ? 'border-l-[#FF4D6D]' : color === 'gold' ? 'border-l-[#F0A500]' : 'border-l-indigo-500';
  const iconColor = color === 'green' ? 'text-[#00C896]' : color === 'red' ? 'text-[#FF4D6D]' : color === 'gold' ? 'text-[#F0A500]' : 'text-indigo-500';

  return (
    <Card className={`theme-bg-secondary theme-border border border-l-4 ${borderColor}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs theme-text-secondary uppercase tracking-wider">{title}</span>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <p className="text-2xl font-bold font-mono theme-text-primary">{value}</p>
        {subtitle && <p className="text-xs theme-text-secondary mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { theme } = useTheme();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1E1E2E' : '#E2E4E9';
  const tickFill = isDark ? '#8B8BA7' : '#6B7280';
  const tooltipBg = isDark ? '#111118' : '#FFFFFF';
  const tooltipBorder = isDark ? '#1E1E2E' : '#E2E4E9';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const session = await authRepo.getSession();
      if (!session?.user) return;
      const { data } = await tradesRepo.getAll(session.user.id, undefined, 0, 200);
      setTrades(data);
      if (data.length > 0) {
        setAnalytics(computeAnalytics(data));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Prepare chart data: last 30 days P&L
  const chartData = trades
    .filter((t) => t.status === 'CLOSED' && t.pnl_r !== null)
    .sort((a, b) => new Date(a.entry_time).getTime() - new Date(b.entry_time).getTime())
    .slice(-30)
    .map((t) => ({
      date: new Date(t.entry_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pnlR: t.pnl_r ?? 0,
      fill: (t.pnl_r ?? 0) >= 0 ? '#00C896' : '#FF4D6D',
    }));

  const recentTrades = trades.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold theme-text-primary">Dashboard</h1>
          <p className="theme-text-secondary text-sm mt-1">Your trading performance overview</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 theme-text-secondary">Loading...</div>
        ) : trades.length === 0 ? (
          <Card className="theme-bg-secondary theme-border border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Activity className="w-12 h-12 theme-text-secondary mb-4" />
              <h3 className="text-lg font-semibold theme-text-primary mb-2">No trades yet</h3>
              <p className="theme-text-secondary text-sm mb-4">Start logging your trades to see analytics</p>
              <Link to="/trades" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
                Add Your First Trade
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                title="Total P&L"
                value={formatCurrency(analytics?.totalPnlUsd ?? 0)}
                subtitle={`${formatR(analytics?.totalPnlR ?? 0)} total`}
                icon={DollarSign}
                color={(analytics?.totalPnlUsd ?? 0) >= 0 ? 'green' : 'red'}
              />
              <KpiCard
                title="Win Rate"
                value={formatPercent(analytics?.winRate ?? 0)}
                subtitle={`${analytics?.winningTrades}W / ${analytics?.losingTrades}L`}
                icon={Percent}
                color={(analytics?.winRate ?? 0) >= 50 ? 'green' : 'red'}
              />
              <KpiCard
                title="Profit Factor"
                value={(analytics?.profitFactor ?? 0).toFixed(2)}
                subtitle={`${analytics?.totalTrades} closed trades`}
                icon={BarChart3}
                color={(analytics?.profitFactor ?? 0) >= 1 ? 'green' : 'red'}
              />
              <KpiCard
                title="Expectancy"
                value={formatR(analytics?.expectancy ?? 0)}
                subtitle={`Max DD: ${formatR(analytics?.maxDrawdownR ?? 0)}`}
                icon={Zap}
                color={(analytics?.expectancy ?? 0) >= 0 ? 'green' : 'red'}
              />
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <Card className="theme-bg-secondary theme-border border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider">
                    Recent P&L (R-multiples)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="date" tick={{ fill: tickFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} />
                      <YAxis tick={{ fill: tickFill, fontSize: 11 }} axisLine={{ stroke: gridStroke }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '8px' }}
                        labelStyle={{ color: tickFill }}
                        formatter={(value: number) => [`${value.toFixed(2)}R`, 'P&L']}
                      />
                      <Bar dataKey="pnlR" radius={[4, 4, 0, 0]} fill="#6366F1">
                        {chartData.map((entry, i) => (
                          <rect key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Recent Trades */}
            <Card className="theme-bg-secondary theme-border border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm theme-text-secondary uppercase tracking-wider">Recent Trades</CardTitle>
                <Link to="/trades" className="text-xs text-indigo-400 hover:text-indigo-300">View All →</Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg theme-bg-tertiary hover:opacity-90 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          trade.direction === 'LONG' ? 'bg-[#00C896]/10' : 'bg-[#FF4D6D]/10'
                        }`}>
                          {trade.direction === 'LONG'
                            ? <TrendingUp className="w-4 h-4 text-[#00C896]" />
                            : <TrendingDown className="w-4 h-4 text-[#FF4D6D]" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium theme-text-primary font-mono">{trade.instrument}</p>
                          <p className="text-xs theme-text-secondary">{formatDateTime(trade.entry_time)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`font-mono text-xs ${
                          (trade.pnl_r ?? 0) > 0 ? 'text-[#00C896] border-[#00C896]/30' :
                          (trade.pnl_r ?? 0) < 0 ? 'text-[#FF4D6D] border-[#FF4D6D]/30' :
                          'theme-text-secondary border-current/30'
                        }`}>
                          {trade.pnl_r !== null ? formatR(trade.pnl_r) : trade.status}
                        </Badge>
                        {trade.pnl_usd !== null && (
                          <p className={`text-xs font-mono mt-1 ${(trade.pnl_usd ?? 0) >= 0 ? 'text-[#00C896]' : 'text-[#FF4D6D]'}`}>
                            {formatCurrency(trade.pnl_usd)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}