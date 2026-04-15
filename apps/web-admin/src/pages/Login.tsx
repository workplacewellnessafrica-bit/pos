import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';
import './Login.css';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const { mutate: login, isPending } = useMutation({
    mutationFn: () =>
      api.post<{ data: { accessToken: string; expiresIn: number; user: Parameters<typeof setAuth>[1] } }>(
        '/auth/login', form
      ),
    onSuccess: (res) => {
      setAuth(res.data.data.accessToken, res.data.data.user);
      navigate('/');
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      toast.error(err.response?.data?.message ?? 'Login failed');
    },
  });

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); login(); };

  return (
    <div className="login-page">
      {/* Background grid */}
      <div className="login-bg-grid" />
      <div className="login-bg-glow" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon"><Zap size={22} /></div>
          <span className="login-brand">DukaPOS</span>
        </div>

        <div className="login-header">
          <h1>Welcome back</h1>
          <p>Sign in to your admin dashboard</p>
        </div>

        <form onSubmit={onSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@business.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                style={{ paddingRight: 42 }}
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={isPending}>
            {isPending ? <Loader2 size={18} className="spin" /> : 'Sign in'}
          </button>
        </form>

        <p className="login-footer">
          Don't have an account?{' '}
          <a href="https://dukapos.com#register" target="_blank" rel="noreferrer">
            Register your business
          </a>
        </p>
      </div>
    </div>
  );
}
