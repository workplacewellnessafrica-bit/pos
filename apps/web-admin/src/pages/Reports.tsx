import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, Loader2, TrendingUp, Users, Package, PieChart as PieIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '@/api/client';
import { subDays, format } from 'date-fns';
import { DaySalesAnalytics } from '@/components/DaySalesAnalytics';

const fmt = (n: number) => `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

export function ReportsPage() {
  const [tab, setTab] = useState<'overview' | 'revenue' | 'products' | 'staff'>('overview');
  const [range, setRange] = useState('30');

  const dateFrom = subDays(new Date(), Number(range)).toISOString();
  const dateTo   = new Date().toISOString();

  const { data: revData, isLoading: revLoading } = useQuery({
    queryKey: ['reports', 'revenue', range],
    queryFn: () => api.get('/reports/revenue', { params: { dateFrom, dateTo } }).then(r => r.data.data),
  });

  const { data: prodData, isLoading: prodLoading } = useQuery({
    queryKey: ['reports', 'products', range],
    queryFn: () => api.get('/reports/products', { params: { dateFrom, dateTo } }).then(r => r.data.data),
    enabled: tab === 'products',
  });

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ['reports', 'staff', range],
    queryFn: () => api.get('/reports/staff', { params: { dateFrom, dateTo } }).then(r => r.data.data),
    enabled: tab === 'staff',
  });

  const handleExport = async () => {
    const res = await api.get('/reports/export', {
      params: { type: tab, dateFrom, dateTo },
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([res.data as BlobPart]));
    const a = document.createElement('a'); a.href = url;
    a.download = `shoplink-${tab}-${format(new Date(),'yyyy-MM-dd')}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
  };

  const chartData = revData?.byDay
    ? Object.entries(revData.byDay as Record<string, { revenue: number }>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date: format(new Date(date), 'MMM d'), revenue: v.revenue }))
    : [];

  return (
    <div className="page">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Analytics</h1>
          <p className="text-muted text-sm">Financial summaries and exportable reports</p>
        </div>
        <div className="flex gap-2">
          <select className="input select" style={{ width: 140 }} value={range} onChange={e => setRange(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </select>
          <button className="btn btn-outline" onClick={handleExport}>
            <Download size={15} /> Export XLS
          </button>
        </div>
      </div>

      {/* Summary stats */}
      {revData && (
        <div className="grid-3" style={{ marginBottom: 20 }}>
          {[
            { label: 'Total Revenue', value: fmt(revData.totalRevenue), icon: TrendingUp, color: 'var(--blue)' },
            { label: 'Orders',        value: revData.orderCount,        icon: BarChart3,  color: 'var(--green)' },
            { label: 'Avg. Order',    value: fmt(revData.avgOrderValue), icon: Package,   color: 'var(--violet)' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ '--accent-color': s.color } as React.CSSProperties}>
              <div className="flex items-center justify-between">
                <span className="stat-label">{s.label}</span>
                <s.icon size={18} style={{ color: s.color, opacity: .7 }} />
              </div>
              <div className="stat-value" style={{ color: s.color, fontSize: 22 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2" style={{ marginBottom: 20 }}>
        {(['overview','revenue','products','staff'] as const).map(t => (
          <button
            key={t}
            className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'} btn-sm`}
            onClick={() => setTab(t)}
            style={{ textTransform: 'capitalize' }}
          >
            {t === 'overview' ? <PieIcon size={14} /> : t === 'revenue' ? <TrendingUp size={14} /> : t === 'products' ? <Package size={14} /> : <Users size={14} />}
            {t}
          </button>
        ))}
      </div>

      {/* Overview — Day Analytics (grafted from ShopLink) */}
      {tab === 'overview' && <DaySalesAnalytics days={7} />}

      {/* Revenue chart */}
      {tab === 'revenue' && (
        <div className="card">
          <h3 style={{ marginBottom: 20 }}>Daily Revenue</h3>
          {revLoading ? <div className="spinner" /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={n => `${(n/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#0f1f3d', border: '1px solid #1a2d4a', borderRadius: 10, fontSize: 12 }}
                  formatter={(v: number) => [fmt(v), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Top products table */}
      {tab === 'products' && (
        <div className="card" style={{ padding: 0 }}>
          {prodLoading ? (
            <div className="flex items-center gap-2 text-muted" style={{ padding: 24 }}>
              <Loader2 size={20} className="spin" /> Loading…
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Product</th><th>Qty Sold</th><th>Revenue</th></tr></thead>
                <tbody>
                  {(prodData as { id:string; name:string; quantity:number; revenue:number }[] ?? []).map((p, i) => (
                    <tr key={p.id}>
                      <td className="text-muted text-sm">{i+1}</td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>{p.quantity.toLocaleString()}</td>
                      <td style={{ fontWeight: 700 }}>{fmt(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Staff performance table */}
      {tab === 'staff' && (
        <div className="card" style={{ padding: 0 }}>
          {staffLoading ? (
            <div className="flex items-center gap-2 text-muted" style={{ padding: 24 }}>
              <Loader2 size={20} className="spin" /> Loading…
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Staff Member</th><th>Orders</th><th>Revenue</th></tr></thead>
                <tbody>
                  {(staffData as { id:string; name:string; count:number; revenue:number }[] ?? [])
                    .sort((a,b) => b.revenue - a.revenue)
                    .map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.count.toLocaleString()}</td>
                        <td style={{ fontWeight: 700 }}>{fmt(s.revenue)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
