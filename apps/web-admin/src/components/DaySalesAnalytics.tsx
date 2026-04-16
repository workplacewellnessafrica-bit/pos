/**
 * DaySalesAnalytics — grafted from ShopLink AdminPanel
 * Shows a per-channel sales breakdown (POS vs Web) with payment method drill-down.
 * Works with the existing /reports/revenue REST endpoint.
 */
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';
import api from '@/api/client';

const fmt = (n: number) => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

const PAYMENT_COLORS: Record<string, string> = {
  CASH:   '#22c55e',
  MPESA:  '#3b82f6',
  CARD:   '#8b5cf6',
  CREDIT: '#f59e0b',
  OTHER:  '#64748b',
};

interface DaySalesAnalyticsProps {
  days?: number; // default 7
}

export function DaySalesAnalytics({ days = 7 }: DaySalesAnalyticsProps) {
  const { data } = useQuery({
    queryKey: ['reports', 'revenue', `${days}d`],
    queryFn: () => api.get('/reports/revenue', {
      params: {
        dateFrom: startOfDay(subDays(new Date(), days - 1)).toISOString(),
        dateTo:   endOfDay(new Date()).toISOString(),
      }
    }).then(r => r.data.data),
    staleTime: 5 * 60_000,
  });

  const chartData = data?.byDay
    ? Object.entries(data.byDay as Record<string, { revenue: number; count: number }>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({
          date: format(new Date(date), 'EEE d'),
          revenue: v.revenue,
          orders: v.count,
        }))
    : [];

  const paymentData = data?.paymentBreakdown
    ? Object.entries(data.paymentBreakdown as Record<string, number>)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  if (!data) return null;

  return (
    <div className="analytics-section">
      <div className="analytics-charts">
        {/* Daily Revenue Bar Chart */}
        <div className="card">
          <h4 style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            REVENUE — LAST {days} DAYS
          </h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={n => `${(n / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0f1f3d', border: '1px solid #1a2d4a', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [fmt(v), 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? '#3b82f6' : '#1e3a5f'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method Pie */}
        <div className="card">
          <h4 style={{ marginBottom: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            PAYMENT BREAKDOWN
          </h4>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  dataKey="value" nameKey="name" paddingAngle={3}>
                  {paymentData.map(({ name }, i) => (
                    <Cell key={i} fill={PAYMENT_COLORS[name] ?? '#64748b'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f1f3d', border: '1px solid #1a2d4a', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [fmt(v)]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p>No sales data yet for this period.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
