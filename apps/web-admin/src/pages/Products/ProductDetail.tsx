import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Plus, X, Loader2, AlertTriangle, Layers } from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { ImageUpload } from '@/components/Upload/ImageUpload';
import './ProductDetail.css';

interface Cat { id: string; name: string; }
interface OptionValue { displayOrder?: number; value: string; }
interface Group { displayOrder?: number; name: string; optionValues: OptionValue[]; }

export function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery<any>({
    queryKey: ['product', id],
    queryFn: () => api.get(`/products/${id}`).then(r => r.data.data),
  });
  const { data: categories } = useQuery<Cat[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then(r => r.data.data),
  });

  const [form, setForm] = useState<any>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [variants, setVariants] = useState<any[]>([]);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name, basePrice: product.basePrice,
        description: product.description || '', barcode: product.barcode || '',
        categoryId: product.categoryId || '', images: product.images,
      });
      setGroups(product.variantGroups || []);
      setVariants(product.variants || []);
    }
  }, [product]);

  const { mutate: saveDetails, isPending: isSaving } = useMutation({
    mutationFn: () => api.patch(`/products/${id}`, {
      ...form, basePrice: Number(form.basePrice),
      categoryId: form.categoryId || null,
    }),
    onSuccess: () => { toast.success('Details saved'); qc.invalidateQueries({ queryKey: ['product', id] }); },
  });

  const { mutate: saveGroups, isPending: isSavingGroups } = useMutation({
    mutationFn: () => api.put(`/products/${id}/variant-groups`, { groups }),
    onSuccess: () => { toast.success('Variant matrix generated'); qc.invalidateQueries({ queryKey: ['product', id] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update groups'),
  });

  const { mutate: saveMatrix, isPending: isSavingMatrix } = useMutation({
    mutationFn: () => api.patch('/products/variants/bulk', { variants: variants.map(v => ({...v, price: Number(v.price), stockQuantity: Number(v.stockQuantity), alertThreshold: Number(v.alertThreshold)})) }),
    onSuccess: () => { toast.success('Matrix saved'); qc.invalidateQueries({ queryKey: ['product', id] }); },
  });

  const f = (k: string) => (e: any) => setForm((p: any) => ({ ...p, [k]: e.target.value }));

  // Variant Builders
  const addGroup = () => setGroups([...groups, { name: '', optionValues: [], displayOrder: groups.length }]);
  const updateGroup = (idx: number, name: string) => {
    const clone = [...groups]; clone[idx].name = name; setGroups(clone);
  };
  const removeGroup = (idx: number) => setGroups(groups.filter((_, i) => i !== idx));

  const addOption = (gIdx: number, val: string) => {
    if (!val) return;
    const clone = [...groups];
    if (!clone[gIdx].optionValues.find(o => o.value === val)) {
      clone[gIdx].optionValues.push({ value: val, displayOrder: clone[gIdx].optionValues.length });
    }
    setGroups(clone);
  };
  const removeOption = (gIdx: number, oIdx: number) => {
    const clone = [...groups]; clone[gIdx].optionValues.splice(oIdx, 1); setGroups(clone);
  };

  const updateVariant = (idx: number, field: string, val: any) => {
    const clone = [...variants]; clone[idx][field] = val; setVariants(clone);
  };

  if (isLoading) return <div className="page" style={{ paddingTop: 60 }}><Loader2 className="spin" /></div>;

  return (
    <div className="page">
      <div className="page-header flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div className="flex items-center gap-3">
          <Link to="/products" className="btn btn-ghost btn-icon"><ArrowLeft size={18} /></Link>
          <div>
            <h1>{product?.name}</h1>
            <p className="text-muted text-sm">Product Detail Configuration</p>
          </div>
        </div>
      </div>

      <div className="product-detail-grid">
        {/* Core details */}
        <div className="card flex-col gap-4">
          <h3 style={{ marginBottom: 8 }}>Basic Details</h3>
          <div className="grid-2">
            <div className="input-group"><label className="input-label">Product Name</label>
              <input className="input" value={form.name} onChange={f('name')} /></div>
            <div className="input-group"><label className="input-label">Base Price (KES)</label>
              <input type="number" className="input" value={form.basePrice} onChange={f('basePrice')} min="0"/></div>
          </div>
          <div className="grid-2">
            <div className="input-group"><label className="input-label">Category</label>
              <select className="input select" value={form.categoryId} onChange={f('categoryId')}>
                <option value="">None</option>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div className="input-group"><label className="input-label">Barcode / EAN</label>
              <input className="input" value={form.barcode} onChange={f('barcode')} /></div>
          </div>
          <div className="input-group"><label className="input-label">Description</label>
            <textarea className="textarea" value={form.description} onChange={f('description')} style={{minHeight:80}}/></div>
          
          <div style={{ marginTop: 8 }}>
            <button className="btn btn-primary" onClick={() => saveDetails()} disabled={isSaving}>
              {isSaving ? <Loader2 size={15} className="spin"/> : <Save size={15}/>} Save Details
            </button>
          </div>
        </div>

        {/* Images */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Images</h3>
          <ImageUpload
            productId={id!}
            images={form.images || []}
            onChange={(imgs) => setForm((p: any) => ({ ...p, images: imgs }))}
          />
        </div>

        {/* Variant Builder */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div className="flex items-center gap-2">
              <Layers size={20} />
              <h3 style={{ margin: 0 }}>Variant Groups</h3>
            </div>
            {variants.length > 0 && <span className="badge badge-amber"><AlertTriangle size={12}/> Editing groups regenerates matrix</span>}
          </div>

          <div className="variant-groups">
            {groups.map((g, gi) => (
              <div key={gi} className="v-group-card">
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <input className="input group-name-input" placeholder="Group Name (e.g. Size, Color)" value={g.name} onChange={e => updateGroup(gi, e.target.value)} />
                  <button className="btn btn-ghost btn-sm" onClick={() => removeGroup(gi)} style={{ color: 'var(--rose)' }}><X size={14}/></button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {g.optionValues.map((ov, oi) => (
                    <div key={oi} className="v-tag">
                      {ov.value}
                      <button onClick={() => removeOption(gi, oi)}><X size={10}/></button>
                    </div>
                  ))}
                  <input
                    className="input v-tag-input"
                    placeholder="Type & press Enter..."
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addOption(gi, e.currentTarget.value); e.currentTarget.value = ''; }
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button className="btn btn-outline btn-sm" onClick={addGroup} disabled={groups.length >= 3}>
              <Plus size={14}/> Add Group
            </button>
            {groups.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={() => saveGroups()} disabled={isSavingGroups || groups.some(g => !g.name || g.optionValues.length === 0)}>
                {isSavingGroups ? <Loader2 size={14} className="spin"/> : 'Generate Combinations'}
              </button>
            )}
          </div>
        </div>

        {/* Matrix */}
        {variants.length > 0 && (
          <div className="card" style={{ gridColumn: '1 / -1', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Variant Matrix ({variants.length})</h3>
              <button className="btn btn-primary btn-sm" onClick={() => saveMatrix()} disabled={isSavingMatrix}>
                {isSavingMatrix ? <Loader2 size={14} className="spin" /> : 'Save Overview'}
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Variant</th>
                    <th style={{ width: 140 }}>Price (KES)</th>
                    <th style={{ width: 140 }}>SKU</th>
                    <th style={{ width: 100 }}>Stock Qty</th>
                    <th style={{ width: 100 }}>Alert Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, vi) => (
                    <tr key={v.id || vi}>
                      <td style={{ fontWeight: 600 }}>
                        {v.variantOptions?.map((o: any) => o.optionValue.value).join(' / ') || 'Base'}
                      </td>
                      <td>
                        <input type="number" className="input table-input" value={v.price} onChange={e => updateVariant(vi, 'price', e.target.value)} />
                      </td>
                      <td>
                        <input className="input table-input" value={v.sku || ''} onChange={e => updateVariant(vi, 'sku', e.target.value)} placeholder="Auto or Custom" />
                      </td>
                      <td>
                        <input type="number" className="input table-input" value={v.stockQuantity} onChange={e => updateVariant(vi, 'stockQuantity', e.target.value)} />
                      </td>
                      <td>
                        <input type="number" className="input table-input" value={v.alertThreshold} onChange={e => updateVariant(vi, 'alertThreshold', e.target.value)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
