import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Warehouse, ArrowUpDown, Plus, Loader2, AlertTriangle } from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';

interface StockVariant {
  id: string; sku: string | null; stockQuantity: number; alertThreshold: number;
  product: { name: string };
  variantOptions: Array<{ optionValue: { value: string; variantGroup: { name: string } } }>;
}

export function InventoryPage() {
  const [showAdjust, setShowAdjust] = useState(false);
  const [sel, setSel] = useState<StockVariant | null>(null);
  const role = useAuthStore(s => s.user?.role);
  const canAdjust = role === 'OWNER' || role === 'MANAGER' || role === 'STOCK_CLERK';

  const { data: stock, isLoading } = useQuery<StockVariant[]>({
    queryKey: ['inventory', 'stock'],
    queryFn: () => api.get('/inventory/stock').then(r => r.data.data),
    refetchInterval: 30_000,
  });

  const lowStock = stock?.filter(v => v.stockQuantity <= v.alertThreshold) ?? [];

  return (
    <div className="page">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Inventory</h1>
          <p className="text-muted text-sm">Stock levels across all variants</p>
        </div>
        {canAdjust && (
          <button className="btn btn-primary" onClick={() => setShowAdjust(true)}>
            <ArrowUpDown size={16} /> Adjust Stock
          </button>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span><strong>{lowStock.length}</strong> variant{lowStock.length !== 1 ? 's' : ''} at or below alert threshold</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted" style={{ padding: '40px 0' }}>
          <Loader2 size={20} className="spin" /> Loading stock…
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Variant</th><th>SKU</th>
                  <th>Stock</th><th>Alert At</th><th>Status</th>
                  {canAdjust && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {stock?.map(v => {
                  const label = v.variantOptions.map(o => o.optionValue.value).join(' / ') || '—';
                  const isLow = v.stockQuantity <= v.alertThreshold;
                  return (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600 }}>{v.product.name}</td>
                      <td className="text-muted text-sm">{label}</td>
                      <td className="font-mono text-xs text-muted">{v.sku ?? '—'}</td>
                      <td style={{ fontWeight: 700, color: isLow ? 'var(--rose)' : 'var(--text)' }}>
                        {v.stockQuantity}
                      </td>
                      <td className="text-muted">{v.alertThreshold}</td>
                      <td>
                        <span className={`badge ${isLow ? 'badge-rose' : 'badge-green'}`}>
                          {isLow ? 'Low' : 'OK'}
                        </span>
                      </td>
                      {canAdjust && (
                        <td>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => { setSel(v); setShowAdjust(true); }}
                          >
                            <Plus size={12} /> Adjust
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAdjust && (
        <AdjustModal
          variant={sel}
          onClose={() => { setShowAdjust(false); setSel(null); }}
        />
      )}
    </div>
  );
}

function AdjustModal({ variant, onClose }: { variant: StockVariant | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ variantId: variant?.id ?? '', delta: '', reason: 'RECOUNT', notes: '' });

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/inventory/adjustments', { ...form, delta: Number(form.delta) }),
    onSuccess: () => {
      toast.success('Stock adjusted');
      void qc.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message ?? 'Adjustment failed'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: 6 }}>Adjust Stock</h2>
        {variant && <p className="text-muted text-sm" style={{ marginBottom: 20 }}>{variant.product.name}</p>}
        <div className="flex-col gap-3">
          <div className="input-group">
            <label className="input-label">Delta (+ add / − remove)</label>
            <input type="number" className="input" value={form.delta}
              onChange={e => setForm(f => ({ ...f, delta: e.target.value }))}
              placeholder="e.g. 10 or -3" />
          </div>
          <div className="input-group">
            <label className="input-label">Reason</label>
            <select className="input select" value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
              <option value="RECOUNT">Recount</option>
              <option value="DAMAGE">Damage</option>
              <option value="THEFT">Theft</option>
              <option value="OPENING_BALANCE">Opening Balance</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Notes</label>
            <input className="input" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Optional note…" />
          </div>
        </div>
        <div className="flex gap-2" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutate()}
            disabled={isPending || !form.delta || !form.variantId}>
            {isPending ? <Loader2 size={16} className="spin" /> : 'Save Adjustment'}
          </button>
        </div>
      </div>
    </div>
  );
}
