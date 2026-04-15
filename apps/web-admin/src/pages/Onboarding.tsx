import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Settings as SettingsIcon, CheckCircle2 } from 'lucide-react';
import api from '@/api/client';
import { useAuthStore } from '@/stores/auth';

export function OnboardingPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore(s => s.setToken);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    taxRate: '16',
    currency: 'KES',
    receiptFooter: 'Thank you for shopping with us!',
  });

  const handleFinish = async () => {
    try {
      // Setup business settings API call implicitly creating the BusinessSettings row
      await api.post('/settings', {
        taxRate: Number(formData.taxRate),
        receiptFooter: formData.receiptFooter,
      });
      // In a real flow, checking onboarding status prevents looping back here
      navigate('/');
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Fallback navigate anyway for MVP
      navigate('/');
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617' }}>
      <div className="card" style={{ width: 500, padding: 40, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 250, height: 250, background: 'var(--blue)', filter: 'blur(100px)', opacity: 0.15 }}></div>
        
        <div className="flex items-center gap-3" style={{ marginBottom: 30 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={20} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ fontSize: 22, margin: 0 }}>Welcome to DukaPOS!</h2>
            <p className="text-muted text-sm">Let's set up your store in 30 seconds.</p>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={e => { e.preventDefault(); setStep(2); }} className="flex flex-col gap-4">
            <div className="input-group">
              <label>Currency</label>
              <select className="input select" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                <option value="KES">Kenyan Shilling (KES)</option>
                <option value="USD">US Dollar (USD)</option>
                <option value="NGN">Nigerian Naira (NGN)</option>
              </select>
            </div>
            <div className="input-group">
              <label>Default Tax Rate (%)</label>
              <input type="number" required className="input" value={formData.taxRate} onChange={e => setFormData({ ...formData, taxRate: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 10 }}>Continue</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={e => { e.preventDefault(); handleFinish(); }} className="flex flex-col gap-4">
            <div className="input-group">
              <label>Receipt Footer Message</label>
              <textarea 
                required className="input" style={{ minHeight: 80 }}
                value={formData.receiptFooter} 
                onChange={e => setFormData({ ...formData, receiptFooter: e.target.value })} 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <CheckCircle2 size={18} /> Complete Setup
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
