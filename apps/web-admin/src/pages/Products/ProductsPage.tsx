import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Package, Pencil, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';

interface Product {
  id: string; name: string; basePrice: string; isActive: boolean;
  hasVariants: boolean; images: string[];
  category: { name: string } | null;
  _count: { variants: number };
}

const fmt = (n: string | number) =>
  `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const role = useAuthStore(s => s.user?.role);
  const qc = useQueryClient();
  const canEdit = role === 'OWNER' || role === 'MANAGER';

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products', search],
    queryFn: () => api.get('/products', { params: { search: search || undefined } }).then(r => r.data.data),
  });

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/products/${id}`, { isActive: !isActive }),
    onSuccess: () => { toast.success('Product updated'); void qc.invalidateQueries({ queryKey: ['products'] }); },
    onError: () => toast.error('Failed to update product'),
  });

  return (
    <div className="page">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Products</h1>
          <p className="text-muted text-sm">Manage your product catalogue and variants</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> New Product
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="input-wrapper" style={{ maxWidth: 340, marginBottom: 20 }}>
        <span className="input-icon"><Search size={16} /></span>
        <input
          type="search"
          className="input"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted" style={{ padding: '40px 0' }}>
          <Loader2 size={20} className="spin" /> Loading products…
        </div>
      ) : !products?.length ? (
        <div className="empty-state">
          <Package size={48} />
          <h3>No products yet</h3>
          <p>Add your first product to start selling through DukaPOS</p>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 56 }}>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Variants</th>
                  <th>Status</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      {p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Package size={16} style={{ opacity: .4 }} />
                        </div>
                      )}
                    </td>
                    <td>
                      <Link to={`/products/${p.id}`} style={{ fontWeight: 600, color: 'var(--text)' }}>
                        {p.name}
                      </Link>
                    </td>
                    <td className="text-muted text-sm">{p.category?.name ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>{fmt(p.basePrice)}</td>
                    <td>
                      {p.hasVariants
                        ? <span className="badge badge-blue">{p._count.variants} variants</span>
                        : <span className="badge badge-muted">Simple</span>}
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? 'badge-green' : 'badge-rose'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <div className="flex gap-2">
                          <Link to={`/products/${p.id}`} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                            <Pencil size={14} />
                          </Link>
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title={p.isActive ? 'Deactivate' : 'Activate'}
                            onClick={() => toggleActive({ id: p.id, isActive: p.isActive })}
                          >
                            {p.isActive
                              ? <ToggleRight size={16} style={{ color: 'var(--green)' }} />
                              : <ToggleLeft  size={16} style={{ color: 'var(--text-muted)' }} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick-create modal */}
      {showModal && <CreateProductModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function CreateProductModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', basePrice: '', description: '' });

  const { mutate: create, isPending } = useMutation({
    mutationFn: () => api.post('/products', { ...form, basePrice: Number(form.basePrice) }),
    onSuccess: () => {
      toast.success('Product created');
      void qc.invalidateQueries({ queryKey: ['products'] });
      onClose();
    },
    onError: () => toast.error('Failed to create product'),
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: 20 }}>New Product</h2>
        <div className="flex-col gap-3">
          <div className="input-group">
            <label className="input-label">Product Name *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Classic T-Shirt" />
          </div>
          <div className="input-group">
            <label className="input-label">Base Price (KES) *</label>
            <input type="number" className="input" value={form.basePrice} onChange={e => setForm(f => ({ ...f, basePrice: e.target.value }))} placeholder="0.00" min="0" />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description…" style={{ minHeight: 72 }} />
          </div>
        </div>
        <div className="flex gap-2" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => create()} disabled={isPending || !form.name || !form.basePrice}>
            {isPending ? <Loader2 size={16} className="spin" /> : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}
