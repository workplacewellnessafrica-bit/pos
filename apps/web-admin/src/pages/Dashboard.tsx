import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp, ShoppingCart, Package, AlertTriangle,
  ArrowUpRight, Plus, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { format, subDays } from 'date-fns';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button,
  Badge
} from '@shoplink/ui';
import { formatCurrency } from '@shoplink/shared';

interface RevenueData {
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  byDay: Record<string, { revenue: number; count: number }>;
  paymentBreakdown: Record<string, number>;
}

interface Alert { id: string; stockQuantity: number; alertThreshold: number; product: { name: string }; }

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
      value: revenue ? formatCurrency(revenue.totalRevenue, user?.currency) : '—',
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      change: '+12%',
      up: true,
    },
    {
      label: 'Total Orders',
      value: revenue?.orderCount.toLocaleString() ?? '—',
      icon: ShoppingCart,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      change: '+8%',
      up: true,
    },
    {
      label: 'Avg. Order',
      value: revenue ? formatCurrency(revenue.avgOrderValue, user?.currency) : '—',
      icon: Activity,
      color: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
      change: '+3%',
      up: true,
    },
    {
      label: 'Stock Alerts',
      value: alerts?.length.toString() ?? '0',
      icon: AlertTriangle,
      color: alerts?.length ? 'text-rose-400' : 'text-slate-400',
      bg: alerts?.length ? 'bg-rose-400/10' : 'bg-slate-800/50',
      change: alerts?.length ? 'Needs attention' : 'All good',
      up: !alerts?.length,
    },
  ];

  return (
    <div className="space-y-8 p-6 lg:p-10 bg-[#050c18] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">System Overview</h1>
          <p className="text-slate-400 mt-2 font-medium">
            Welcome back, <span className="text-blue-400">{user?.name}</span>. Performance is up this month.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild className="border-slate-800 bg-slate-900/50 text-slate-300">
            <Link to="/reports">Insights</Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-500/20">
            <Link to="/products/new"><Plus className="w-4 h-4 mr-2" /> New Product</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <Card key={s.label} className="bg-slate-900/40 border-slate-800/80 hover:border-slate-700 transition-all rounded-3xl overflow-hidden backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{s.label}</CardTitle>
              <div className={`${s.bg} p-2 rounded-xl`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-white">
                {revLoading ? <div className="h-8 w-24 bg-slate-800 animate-pulse rounded" /> : s.value}
              </div>
              <div className="flex items-center gap-2 mt-4">
                <Badge variant="outline" className={`text-[10px] font-bold ${s.up ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                  {s.change}
                </Badge>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">vs last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue chart */}
        <Card className="lg:col-span-2 bg-slate-900/40 border-slate-800/80 rounded-3xl overflow-hidden">
          <CardHeader className="pb-8">
            <div className="flex justify-between items-start">
               <div>
                  <CardTitle className="text-xl font-bold text-white">Revenue Analysis</CardTitle>
                  <CardDescription className="text-slate-500">Sales volume performance across the last 30 days</CardDescription>
               </div>
               <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 font-bold">{user?.currency || 'KES'}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={n => n >= 1000 ? `${(n/1000).toFixed(0)}k` : n}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ background: '#0a1628', border: '1px solid #1e293b', borderRadius: '16px', fontSize: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Low stock alerts */}
        <Card className="bg-emerald-500/5 border-slate-800/80 rounded-3xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
               <CardTitle className="text-lg font-bold text-white">Inventory Alerts</CardTitle>
               <CardDescription className="text-slate-500">Critical stock notifications</CardDescription>
            </div>
            <Link to="/inventory">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white"><ArrowUpRight className="w-5 h-5"/></Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {!alerts?.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-600 opacity-30">
                <Package size={48} className="mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">All labels healthy</p>
              </div>
            ) : (
              alerts.slice(0, 6).map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/50">
                  <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{a.product.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{a.stockQuantity} remaining</p>
                  </div>
                  <Badge variant="destructive" className="bg-rose-500/10 text-rose-400 border-none px-2 py-0 text-[10px]">{a.stockQuantity}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent orders */}
        <Card className="lg:col-span-3 bg-slate-900/40 border-slate-800/80 rounded-3xl overflow-hidden">
           <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                 <div>
                    <CardTitle className="text-xl font-bold text-white">Fulfillment Stream</CardTitle>
                    <CardDescription className="text-slate-500">Real-time order activity across all terminals</CardDescription>
                 </div>
                 <Link to="/orders">
                   <Button variant="outline" className="border-slate-800 hover:bg-slate-800 text-slate-400">View Full Ledger</Button>
                 </Link>
              </div>
           </CardHeader>
           <CardContent className="pt-6">
              <div className="overflow-x-auto">
                 <table className="w-full text-left border-separate border-spacing-y-2">
                    <thead>
                       <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                          <th className="px-4 pb-2">Reference</th>
                          <th className="px-4 pb-2">Terminal / Cashier</th>
                          <th className="px-4 pb-2">Revenue</th>
                          <th className="px-4 pb-2">Method</th>
                          <th className="px-4 pb-2">Timestamp</th>
                       </tr>
                    </thead>
                    <tbody className="space-y-4">
                       {(ordersData as any[] ?? []).map(o => (
                         <tr key={o.id} className="bg-slate-900/40 border border-slate-800 group hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-4 rounded-l-2xl font-mono text-xs text-blue-400">{o.receiptNo || 'POS-AUTO'}</td>
                            <td className="px-4 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">{o.cashier.name[0]}</div>
                                  <span className="text-sm font-bold text-slate-200">{o.cashier.name}</span>
                               </div>
                            </td>
                            <td className="px-4 py-4 font-black text-white">{formatCurrency(Number(o.total), user?.currency)}</td>
                            <td className="px-4 py-4">
                               <Badge variant="outline" className="border-slate-800 text-[10px] font-bold text-slate-400">{o.paymentMethod}</Badge>
                            </td>
                            <td className="px-4 py-4 rounded-r-2xl text-xs text-slate-500 font-medium">
                               {format(new Date(o.createdAt), 'hh:mm a')}
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
