import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Loader2, ShieldCheck } from 'lucide-react';
import api from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';

export function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  const { mutate: finalizeLogin } = useMutation({
    mutationFn: (code: string) =>
      api.get<{ data: { accessToken: string; expiresIn: number; user: any } }>(
        `/auth/google/callback?code=${code}`
      ),
    onSuccess: (res) => {
      setAuth(res.data.data.accessToken, res.data.data.user);
      toast.success(`Welcome back, ${res.data.data.user.name}`);
      navigate('/');
    },
    onError: (err: any) => {
       const msg = err.response?.data?.message || 'Authentication failed';
       toast.error(msg);
       navigate('/login');
    }
  });

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      finalizeLogin(code);
    } else {
      navigate('/login');
    }
  }, [searchParams, finalizeLogin, navigate]);

  return (
    <div className="min-h-screen bg-[#050c18] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
           <div className="relative w-20 h-20 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-blue-400" />
           </div>
        </div>

        <h1 className="text-2xl font-black text-white mb-2">Verifying Identity</h1>
        <p className="text-slate-400 mb-8 max-w-xs mx-auto font-medium">
           Finalizing your secure session with Google. This will only take a moment.
        </p>

        <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 px-6 py-3 rounded-2xl">
           <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
           <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Handshaking...</span>
        </div>
    </div>
  );
}
