import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  ArrowUpRight, Users, Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { format, subDays } from 'date-fns';
import './Dashboard.css';

interface RevenueData {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  byDay: Record<string, { revenue: number; count: number }>;
  paymentBreakdown: Record<string, number>;
}

interface Alert { id: string; stockQuantity: number; alertThreshold: number; product: { name: string }; }

const fmt = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

export function DashboardPage() {
  const user = useAuthStore(s => s.user);

  const { data: revenue, isLoading: revLoading } = useQuery<RevenueData>({
    queryKey: ['reports', 'revenue', '30d'],
    queryFn: () => api.get('/reports/revenue', {
      params: { dateFrom: subDays(new Date(), 29).toISOString(), dateTo: new Date().toISOString() }
    }).then(r => r.data.data),
  });

  const { data: alerts } = useQuery<Alert[]>({
    queryKey: ['inventory', 'alerts'],
    queryFn: () => api.get('/inventory/alerts').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => api.get('/orders', { params: { limit: 8, status: 'COMPLETED' } }).then(r => r.data.data),
  });

  // Build chart data from byDay
  const chartData = revenue?.byDay
    ? Object.entries(revenue.byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({
          date: format(new Date(date), 'MMM d'),
          revenue: v.revenue,
          orders: v.count,
        }))
    : [];

  const stats = [
    {
      label: 'Revenue (30d)',
      value: revenue ? fmt(revenue.totalRevenue) : '—',
      icon: TrendingUp,
      color: 'var(--blue)',
      change: '+12%',
      up: true,
    },
    {
      label: 'Total Orders',
      value: revenue?.orderCount.toLocaleString() ?? '—',
      icon: ShoppingCart,
      color: 'var(--green)',
      change: '+8%',
      up: true,
    },
    {
      label: 'Avg. Order Value',
      value: revenue ? fmt(revenue.avgOrderValue) : '—',
      icon: Package,
      color: 'var(--violet)',
      change: '+3%',
      up: true,
    },
    {
      label: 'Low Stock Alerts',
      value: alerts?.length.toString() ?? '0',
      icon: AlertTriangle,
      color: alerts?.length ? 'var(--amber)' : 'var(--green)',
      change: alerts?.length ? 'Needs attention' : 'All good',
      up: !alerts?.length,
    },
  ];

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted text-sm">
            Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/orders" className="btn btn-outline btn-sm"><ShoppingCart size={14} /> Orders</Link>
          <Link to="/products" className="btn btn-primary btn-sm"><Plus size={14} /> New Product</Link>
        </div>
      </div>

      {/* Stats */}
      <div className="dashboard-stats">
        {stats.map((s) => (
          <div key={s.label} className="stat-card" style={{ '--accent-color': s.color } as React.CSSProperties}>
            <div className="flex items-center justify-between">
              <span className="stat-label">{s.label}</span>
              <div className="stat-icon" style={{ color: s.color }}>
                <s.icon size={18} />
              </div>
            </div>
            <div className="stat-value" style={{ color: s.color }}>
              {revLoading ? <div className="spinner" /> : s.value}
            </div>
            <div className={`stat-change ${s.up ? 'up' : 'down'}`}>
              <ArrowUpRight size={12} style={{ transform: s.up ? 'none' : 'rotate(90deg)' }} />
              {s.change} vs last month
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Revenue chart */}
        <div className="card dashboard-chart-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <h3>Revenue — Last 30 Days</h3>
            <span className="badge badge-blue">KES</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"   stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%"  stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
              <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={n => `${(n/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0f1f3d', border: '1px solid #1a2d4a', borderRadius: 10, fontSize: 12 }}
                labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                formatter={(v: number) => [fmt(v), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Low stock alerts */}
        <div className="card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h3>Low Stock Alerts</h3>
            <Link to="/inventory" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          {!alerts?.length ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <Package size={32} style={{ margin: '0 auto 8px', opacity: .3 }} />
              <p>All stock levels are healthy</p>
            </div>
          ) : (
            <div className="flex-col gap-2">
              {alerts.slice(0, 6).map((a) => (
                <div key={a.id} className="alert-row">
                  <div className="alert-dot" />
                  <div className="flex-col gap-2" style={{ flex: 1 }}>
                    <span className="text-sm" style={{ fontWeight: 500 }}>{a.product.name}</span>
                    <span className="text-xs text-muted">{a.stockQuantity} left · threshold {a.alertThreshold}</span>
                  </div>
                  <span className="badge badge-amber">{a.stockQuantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="card dashboard-orders-card">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h3>Recent Orders</h3>
            <Link to="/orders" className="btn btn-ghost btn-sm">View all</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Receipt</th><th>Cashier</th><th>Total</th><th>Method</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(ordersData as { id:string; receiptNo:string; cashier:{name:string}; total:string; paymentMethod:string; status:string }[] ?? []).map(o => (
                  <tr key={o.id}>
                    <td className="font-mono" style={{ fontSize: 12 }}>{o.receiptNo}</td>
                    <td>{o.cashier.name}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(Number(o.total))}</td>
                    <td><span className="badge badge-muted">{o.paymentMethod}</span></td>
                    <td><span className={`badge ${statusBadge(o.status)}`}>{o.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Payment Methods</h3>
          {revenue?.paymentBreakdown && Object.entries(revenue.paymentBreakdown).map(([method, amount]) => {
            const pct = Math.round((amount / revenue.totalRevenue) * 100);
            return (
              <div key={method} className="pay-method-row">
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span className="text-sm" style={{ fontWeight: 500 }}>{method}</span>
                  <span className="text-sm text-muted">{pct}%</span>
                </div>
                <div className="pay-bar-bg">
                  <div className="pay-bar-fill" style={{ width: `${pct}%`, background: methodColor(method) }} />
                </div>
                <span className="text-xs text-muted">{fmt(amount)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
function statusBadge(s: string) {
  if (s === 'COMPLETED') return 'badge-green';
  if (s === 'VOIDED')    return 'badge-rose';
  if (s === 'REFUNDED')  return 'badge-amber';
  return 'badge-muted';
}
function methodColor(m: string) {
  if (m === 'CASH')  return 'var(--green)';
  if (m === 'MPESA') return 'var(--blue)';
  if (m === 'CARD')  return 'var(--violet)';
  return 'var(--cyan)';
}
