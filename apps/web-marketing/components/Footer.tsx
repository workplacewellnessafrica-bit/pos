'use client';
import { useState } from 'react';
import { Zap, ArrowRight, Loader2 } from 'lucide-react';
import styles from './Footer.module.css';

const COUNTRIES = ['Kenya','Uganda','Tanzania','Rwanda','Ghana','Nigeria','Ethiopia','South Africa'];
const CATEGORIES = ['Retail / General','Clothing & Apparel','Electronics','Food & Grocery','Pharmacy','Beauty & Cosmetics','Hardware','Other'];

export function Footer() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    businessName: '', ownerName: '', email: '', phone: '', country: 'Kenya', category: 'Retail / General', password: '',
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, country: form.country.slice(0,2).toUpperCase() }),
      });
      if (!res.ok) throw new Error((await res.json() as { message: string }).message);
      setDone(true);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          {/* Brand */}
          <div className={styles.brand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}><Zap size={14}/></div>
              <span className={styles.logoText}>DukaPOS</span>
            </div>
            <p className={styles.tagline}>The operating system for African retail. Built in Africa, for Africa.</p>
          </div>

          {/* Links */}
          <div className={styles.links}>
            <h4>Product</h4>
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/download">Download</a>
            <a href="/changelog">Changelog</a>
          </div>
          <div className={styles.links}>
            <h4>Company</h4>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>

          {/* Registration form */}
          <div className={styles.regBox} id="register">
            <h3>Register Your Business</h3>
            <p className={styles.regSub}>Set up your store in under 20 minutes — free to start.</p>

            {done ? (
              <div className={styles.success}>
                <p>🎉 Business registered! Check your email to verify your account.</p>
              </div>
            ) : (
              <form onSubmit={submit} className={styles.form}>
                {step === 1 && (
                  <>
                    <input className={styles.input} placeholder="Business name *" value={form.businessName} onChange={f('businessName')} required />
                    <input className={styles.input} placeholder="Your full name *" value={form.ownerName} onChange={f('ownerName')} required />
                    <input type="email" className={styles.input} placeholder="Email address *" value={form.email} onChange={f('email')} required />
                    <input type="tel" className={styles.input} placeholder="Phone number *" value={form.phone} onChange={f('phone')} required />
                    <button type="button" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}
                      onClick={() => { if (form.businessName && form.ownerName && form.email && form.phone) setStep(2); }}>
                      Continue <ArrowRight size={15}/>
                    </button>
                  </>
                )}
                {step === 2 && (
                  <>
                    <select className={styles.input} value={form.country} onChange={f('country')}>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select className={styles.input} value={form.category} onChange={f('category')}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <input type="password" className={styles.input} placeholder="Create password (min 8 chars) *" value={form.password} onChange={f('password')} required minLength={8} />
                    <div className={styles.step2Btns}>
                      <button type="button" className="btn btn-outline" onClick={() => setStep(1)} style={{ flex:1, justifyContent:'center' }}>Back</button>
                      <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex:2, justifyContent:'center' }}>
                        {loading ? <Loader2 size={16} style={{ animation:'spin .7s linear infinite' }}/> : 'Create account'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>
        </div>

        <div className={styles.bottom}>
          <p>© {new Date().getFullYear()} DukaPOS. All rights reserved.</p>
          <p className={styles.bottomRight}>Made with ♥ in Nairobi</p>
        </div>
      </div>
    </footer>
  );
}
