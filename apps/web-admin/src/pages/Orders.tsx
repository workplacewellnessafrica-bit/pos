import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Loader2, RefreshCw } from 'lucide-react';
import api from '@/api/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';

interface Order {
  id: string; receiptNo: string; status: string; paymentMethod: string;
  total: string; createdAt: string;
  cashier: { name: string }; _count: { lines: number };
}

const fmt = (n: string | number) => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
const statusColor: Record<string, string> = {
  COMPLETED: 'badge-green', VOIDED: 'badge-rose', REFUNDED: 'badge-amber', OPEN: 'badge-muted',
};

export function OrdersPage() {
  const [status, setStatus] = useState('');
  const role = useAuthStore(s => s.user?.role);
  const canVoid = role === 'OWNER' || role === 'MANAGER';
  const qc = useQueryClient();

  const { data: orders, isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['orders', status],
    queryFn: () => api.get('/orders', { params: { status: status || undefined, limit: 50 } }).then(r => r.data.data),
  });

  const { mutate: voidOrder } = useMutation({
    mutationFn: (id: string) => api.patch(`/orders/${id}/status`, { status: 'VOIDED' }),
    onSuccess: () => { toast.success('Order voided'); void qc.invalidateQueries({ queryKey: ['orders'] }); },
    onError:   () => toast.error('Failed to void order'),
  });

  return (
    <div className="page">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Orders</h1>
          <p className="text-muted text-sm">All transactions across your team and devices</p>
        </div>
        <div className="flex gap-2">
          <select className="input select" style={{ width: 160 }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="COMPLETED">Completed</option>
            <option value="VOIDED">Voided</option>
            <option value="REFUNDED">Refunded</option>
            <option value="OPEN">Open</option>
          </select>
          <button className="btn btn-outline btn-icon" onClick={() => void refetch()} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted" style={{ padding: '40px 0' }}>
          <Loader2 size={20} className="spin" /> Loading orders…
        </div>
      ) : !orders?.length ? (
        <div className="empty-state">
          <ShoppingCart size={48} />
          <h3>No orders found</h3>
          <p>Orders will appear here as sales are processed on any device</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Receipt</th><th>Date</th><th>Cashier</th>
                  <th>Items</th><th>Total</th><th>Payment</th><th>Status</th>
                  {canVoid && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="font-mono" style={{ fontSize: 12 }}>{o.receiptNo ?? '—'}</td>
                    <td className="text-muted text-sm">{format(new Date(o.createdAt), 'MMM d, HH:mm')}</td>
                    <td>{o.cashier.name}</td>
                    <td className="text-muted">{o._count.lines}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(o.total)}</td>
                    <td><span className="badge badge-muted">{o.paymentMethod}</span></td>
                    <td><span className={`badge ${statusColor[o.status] ?? 'badge-muted'}`}>{o.status}</span></td>
                    {canVoid && (
                      <td>
                        {o.status === 'COMPLETED' && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--rose)', fontSize: 12 }}
                            onClick={() => { if (confirm('Void this order?')) voidOrder(o.id); }}
                          >
                            Void
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
