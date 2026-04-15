import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, Loader2 } from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';

interface SettingsData {
  taxRate: string; taxInclusive: boolean;
  receiptFooter: string; receiptPhone: string;
  enableCash: boolean; enableMpesa: boolean; enableCard: boolean;
  lowStockEmailAlert: boolean; lowStockSmsAlert: boolean; autoPrintReceipt: boolean;
}

interface BusinessProfile {
  name: string; email: string; phone: string; address: string; taxNumber: string; currency: string;
}

export function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ business: BusinessProfile; settings: SettingsData }>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data.data),
  });

  const [biz, setBiz] = useState<BusinessProfile>({ name:'', email:'', phone:'', address:'', taxNumber:'', currency:'KES' });
  const [cfg, setCfg] = useState<SettingsData>({ taxRate:'16', taxInclusive:false, receiptFooter:'', receiptPhone:'', enableCash:true, enableMpesa:true, enableCard:false, lowStockEmailAlert:true, lowStockSmsAlert:false, autoPrintReceipt:true });

  useEffect(() => {
    if (data?.business) setBiz(data.business);
    if (data?.settings)  setCfg(prev => ({ ...prev, ...data.settings }));
  }, [data]);

  const { mutate: saveBiz, isPending: bizPending } = useMutation({
    mutationFn: () => api.patch('/settings/business', biz),
    onSuccess: () => { toast.success('Business profile saved'); void qc.invalidateQueries({ queryKey: ['settings'] }); },
    onError: () => toast.error('Failed to save'),
  });

  const { mutate: saveCfg, isPending: cfgPending } = useMutation({
    mutationFn: () => api.patch('/settings', cfg),
    onSuccess: () => { toast.success('Settings saved'); void qc.invalidateQueries({ queryKey: ['settings'] }); },
    onError: () => toast.error('Failed to save'),
  });

  const bf = (k: keyof BusinessProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setBiz(p => ({ ...p, [k]: e.target.value }));
  const cf = (k: keyof SettingsData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCfg(p => ({ ...p, [k]: (e.target as HTMLInputElement).type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  if (isLoading) return (
    <div className="page flex items-center gap-2 text-muted" style={{ paddingTop: 60 }}>
      <Loader2 size={20} className="spin" /> Loading settings…
    </div>
  );

  return (
    <div className="page">
      <div className="page-header flex items-center gap-3">
        <Settings size={22} />
        <div>
          <h1>Settings</h1>
          <p className="text-muted text-sm">Configure your business profile and POS behaviour</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Business profile */}
        <div className="card">
          <h3 style={{ marginBottom: 18 }}>Business Profile</h3>
          <div className="flex-col gap-3">
            <div className="grid-2">
              <div className="input-group"><label className="input-label">Business Name</label>
                <input className="input" value={biz.name} onChange={bf('name')} /></div>
              <div className="input-group"><label className="input-label">Email</label>
                <input type="email" className="input" value={biz.email} onChange={bf('email')} /></div>
            </div>
            <div className="grid-2">
              <div className="input-group"><label className="input-label">Phone</label>
                <input className="input" value={biz.phone} onChange={bf('phone')} /></div>
              <div className="input-group"><label className="input-label">Tax / VAT Number</label>
                <input className="input" value={biz.taxNumber} onChange={bf('taxNumber')} /></div>
            </div>
            <div className="input-group"><label className="input-label">Address</label>
              <input className="input" value={biz.address} onChange={bf('address')} /></div>
          </div>
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => saveBiz()} disabled={bizPending}>
              {bizPending ? <Loader2 size={16} className="spin" /> : <><Save size={15}/> Save Profile</>}
            </button>
          </div>
        </div>

        {/* Tax & payments */}
        <div className="card">
          <h3 style={{ marginBottom: 18 }}>Tax & Payments</h3>
          <div className="flex-col gap-3">
            <div className="grid-2">
              <div className="input-group"><label className="input-label">VAT Rate (%)</label>
                <input type="number" className="input" value={cfg.taxRate} onChange={cf('taxRate')} min="0" max="100" /></div>
              <div className="input-group">
                <label className="input-label">Tax Mode</label>
                <select className="input select" value={cfg.taxInclusive ? 'inclusive' : 'exclusive'} onChange={e => setCfg(p => ({ ...p, taxInclusive: e.target.value === 'inclusive' }))}>
                  <option value="exclusive">Exclusive (added on top)</option>
                  <option value="inclusive">Inclusive (embedded in price)</option>
                </select>
              </div>
            </div>
            <h4 style={{ marginTop: 4 }}>Payment Methods</h4>
            {(['enableCash','enableMpesa','enableCard'] as const).map(k => (
              <label key={k} className="toggle-row">
                <input type="checkbox" checked={cfg[k]} onChange={cf(k)} />
                <span className="toggle-label">{k.replace('enable','')}</span>
              </label>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => saveCfg()} disabled={cfgPending}>
              {cfgPending ? <Loader2 size={16} className="spin" /> : <><Save size={15}/> Save Settings</>}
            </button>
          </div>
        </div>

        {/* Receipt & notifications */}
        <div className="card">
          <h3 style={{ marginBottom: 18 }}>Receipt & Notifications</h3>
          <div className="flex-col gap-3">
            <div className="input-group"><label className="input-label">Receipt Footer Message</label>
              <input className="input" value={cfg.receiptFooter} onChange={cf('receiptFooter')} placeholder="Thank you for shopping with us!" /></div>
            <div className="input-group"><label className="input-label">Receipt Phone</label>
              <input className="input" value={cfg.receiptPhone} onChange={cf('receiptPhone')} placeholder="+254…" /></div>
            <h4 style={{ marginTop: 4 }}>Alerts</h4>
            {(['lowStockEmailAlert','lowStockSmsAlert','autoPrintReceipt'] as const).map(k => (
              <label key={k} className="toggle-row">
                <input type="checkbox" checked={cfg[k]} onChange={cf(k)} />
                <span className="toggle-label">{k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase())}</span>
              </label>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <button className="btn btn-primary" onClick={() => saveCfg()} disabled={cfgPending}>
              {cfgPending ? <Loader2 size={16} className="spin" /> : <><Save size={15}/> Save</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
