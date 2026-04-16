import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ShoppingCart, Loader2, Lock, Mail, Key } from 'lucide-react';
import api from '../api/client';
import { toast } from 'sonner';

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  const { mutate: login, isPending: loginPending } = useMutation({
    mutationFn: () =>
      api.post<{ data: { accessToken: string; user: any } }>(
        '/auth/login', form
      ),
    onSuccess: (res) => {
      localStorage.setItem('pos_token', res.data.data.accessToken);
      localStorage.setItem('pos_user', JSON.stringify(res.data.data.user));
      toast.success(`Authorized: ${res.data.data.user.name}`);
      navigate('/');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message ?? 'Authorization failed');
    },
  });

  const { mutate: getGoogleUrl, isPending: googlePending } = useMutation({
    mutationFn: () => api.get<{ data: { url: string } }>('/auth/google'),
    onSuccess: (res) => {
      window.location.href = res.data.data.url;
    },
    onError: (err: any) => {
      toast.error('Google SSO currently unavailable');
    },
  });

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); login(); };

  return (
    <div className="min-h-screen bg-[#050c18] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full" />
      
      <div className="relative w-full max-w-md bg-[#0a1628]/80 backdrop-blur-xl border border-slate-800 p-8 rounded-[40px] shadow-2xl">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6">
            <ShoppingCart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Terminal Access</h1>
          <p className="text-slate-400 font-medium">ShopLink Hardware Station</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Terminal ID (Email)</label>
              <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input 
                   type="email" 
                   required
                   value={form.email}
                   onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                   className="w-full h-14 bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 text-white font-bold focus:border-blue-500 outline-none transition-all"
                   placeholder="pos-01@store.com"
                 />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Terminal Password</label>
              <div className="relative">
                 <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                 <input 
                   type="password" 
                   required
                   value={form.password}
                   onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                   className="w-full h-14 bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 text-white font-bold focus:border-blue-500 outline-none transition-all"
                   placeholder="••••••••"
                 />
              </div>
           </div>

           <button 
             type="submit"
             disabled={loginPending}
             className="w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
           >
              {loginPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>
                  <Lock className="w-5 h-5" />
                  Grant Access
                </>
              )}
           </button>
        </form>

        <div className="relative my-10">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
           <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-slate-600 bg-[#0a1628] px-3 mx-auto w-fit">
              Handshake
           </div>
        </div>

        <button 
          onClick={() => getGoogleUrl()}
          disabled={googlePending}
          className="w-full flex items-center justify-center gap-4 bg-slate-900 border border-slate-800 text-slate-300 h-16 rounded-2xl font-bold transition-all hover:bg-slate-800 disabled:opacity-50"
        >
          {googlePending ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google SSO
            </>
          )}
        </button>
      </div>
    </div>
  );
}
