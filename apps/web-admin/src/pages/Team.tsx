import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, Plus, LogOut, Loader2, Shield, 
  Mail, Trash2, Clock, CheckCircle2,
  MoreVertical,
  X
} from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { format } from 'date-fns';
import type { Role } from '@shoplink/shared';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@shoplink/ui';

interface Staff {
  id: string; name: string; email: string; role: Role; isActive: boolean;
  lastLoginAt: string | null; createdAt: string;
}

interface Invitation {
  id: string; email: string; role: Role; createdAt: string; expiresAt: string;
}

const ROLE_COLORS: Record<Role, string> = {
  OWNER: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  MANAGER: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
  CASHIER: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  STOCK_CLERK: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  VIEWER: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
};

export function TeamPage() {
  const [showInvite, setShowInvite] = useState(false);
  const role = useAuthStore(s => s.user?.role);
  const myId = useAuthStore(s => s.user?.id);
  const qc = useQueryClient();
  const isOwner = role === 'OWNER';
  const isManager = role === 'MANAGER';

  const { data: staff, isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data.data),
  });

  const { data: invites, isLoading: invitesLoading } = useQuery<Invitation[]>({
    queryKey: ['team', 'invites'],
    queryFn: () => api.get('/team/invites').then(r => r.data.data),
    enabled: isOwner || isManager,
  });

  const { mutate: revokeInvite } = useMutation({
    mutationFn: (id: string) => api.delete(`/team/invites/${id}`),
    onSuccess: () => {
      toast.success('Invitation revoked');
      void qc.invalidateQueries({ queryKey: ['team', 'invites'] });
    },
    onError: () => toast.error('Failed to revoke invitation'),
  });

  const { mutate: kickSession } = useMutation({
    mutationFn: (id: string) => api.post(`/team/${id}/kick`),
    onSuccess: () => toast.success('Session terminated'),
    onError: () => toast.error('Failed to kick session'),
  });

  return (
    <div className="space-y-8 p-6 lg:p-10 bg-[#050c18] min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Team Management</h1>
          <p className="text-slate-400 mt-2 font-medium">Control access levels and monitor active sessions</p>
        </div>
        {(isOwner || isManager) && (
          <Button 
            className="bg-blue-600 hover:bg-blue-500 font-bold shadow-lg shadow-blue-500/20 rounded-2xl h-12 px-6"
            onClick={() => setShowInvite(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Invite Member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Active Staff Table */}
        <Card className="xl:col-span-2 bg-slate-900/40 border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-sm">
          <CardHeader className="pb-0">
             <div className="flex justify-between items-center">
                <div>
                   <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      Active Staff
                   </CardTitle>
                   <CardDescription className="text-slate-500">Currently authorized members of this store</CardDescription>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-none">{staff?.length || 0} Members</Badge>
             </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-y-2">
                 <thead>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                       <th className="px-4 pb-2">Member</th>
                       <th className="px-4 pb-2">Role</th>
                       <th className="px-4 pb-2">Last Activity</th>
                       <th className="px-4 pb-2">Status</th>
                       {(isOwner || isManager) && <th className="px-4 pb-2 text-right">Actions</th>}
                    </tr>
                 </thead>
                 <tbody>
                    {staffLoading ? (
                      [...Array(3)].map((_, i) => (
                        <tr key={i} className="animate-pulse bg-slate-800/20 h-16 rounded-2xl" />
                      ))
                    ) : (
                      staff?.map(s => (
                        <tr key={s.id} className="bg-slate-900/40 border border-slate-800 hover:bg-slate-800/40 transition-colors">
                           <td className="px-4 py-4 rounded-l-2xl">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                                    {s.name[0]?.toUpperCase()}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">{s.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">{s.email}</span>
                                 </div>
                              </div>
                           </td>
                           <td className="px-4 py-4">
                              <Badge variant="outline" className={`text-[10px] font-bold ${ROLE_COLORS[s.role]}`}>
                                 <Shield className="w-3 h-3 mr-1" /> {s.role}
                              </Badge>
                           </td>
                           <td className="px-4 py-4 text-xs text-slate-400 font-medium">
                              {s.lastLoginAt ? format(new Date(s.lastLoginAt), 'MMM d, HH:mm') : 'Never'}
                           </td>
                           <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                 <div className={`w-2 h-2 rounded-full ${s.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
                                 <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-500">{s.isActive ? 'Active' : 'Suspended'}</span>
                              </div>
                           </td>
                           {(isOwner || isManager) && (
                              <td className="px-4 py-4 rounded-r-2xl text-right">
                                 <div className="flex items-center justify-end gap-1">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      disabled={s.id === myId}
                                      onClick={() => kickSession(s.id)}
                                      className="text-slate-500 hover:text-white hover:bg-slate-800"
                                    >
                                       <LogOut className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white hover:bg-slate-800">
                                       <MoreVertical className="w-4 h-4" />
                                    </Button>
                                 </div>
                              </td>
                           )}
                        </tr>
                      ))
                    )}
                 </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invitations Sidebar */}
        <div className="space-y-8">
           <Card className="bg-blue-500/5 border-blue-500/20 rounded-3xl overflow-hidden backdrop-blur-sm">
             <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                   <div>
                      <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-400" />
                        Pending Invites
                      </CardTitle>
                      <CardDescription className="text-slate-500 italic">Waitng for user Google sign-on</CardDescription>
                   </div>
                </div>
             </CardHeader>
             <CardContent className="space-y-4">
                {invitesLoading ? (
                   <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-blue-400 animate-spin" /></div>
                ) : !invites?.length ? (
                   <div className="py-12 text-center text-slate-600 opacity-30">
                      <Mail className="w-10 h-10 mx-auto mb-2" />
                      <p className="font-bold uppercase tracking-widest text-[10px]">No active invitations</p>
                   </div>
                ) : (
                  invites.map(inv => (
                    <div key={inv.id} className="relative group p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/30 transition-all">
                       <div className="flex items-start justify-between">
                          <div className="space-y-1 pr-8">
                             <p className="text-sm font-bold text-slate-200 truncate">{inv.email}</p>
                             <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-[9px] h-4 py-0 font-bold ${ROLE_COLORS[inv.role]}`}>
                                   {inv.role}
                                </Badge>
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                   <Clock className="w-3 h-3" />
                                   Exp: {format(new Date(inv.expiresAt), 'MMM d')}
                                </span>
                             </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => revokeInvite(inv.id)}
                            className="absolute top-2 right-2 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 h-8 w-8"
                          >
                             <Trash2 className="w-4 h-4" />
                          </Button>
                       </div>
                    </div>
                  ))
                )}
             </CardContent>
           </Card>

           <Card className="bg-slate-900/40 border-slate-800 rounded-3xl p-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Enterprise Security</h4>
              <ul className="space-y-4">
                 <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Invited members use Google OAuth for verified single sign-on.</p>
                 </li>
                 <li className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">Invitations expire automatically after 7 days for security.</p>
                 </li>
              </ul>
           </Card>
        </div>
      </div>

      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
    </div>
  );
}

function InviteModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('CASHIER');

  const { mutate: invite, isPending } = useMutation({
    mutationFn: () => api.post('/team/invites', { email, role }),
    onSuccess: () => {
      toast.success(`Invitation sent to ${email}`);
      void qc.invalidateQueries({ queryKey: ['team', 'invites'] });
      onClose();
      setEmail('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a1628] border-slate-800 max-w-md rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-white">Invite Team Member</DialogTitle>
          <CardDescription className="text-slate-400 mt-2">
            The member will receive a secure link to join via Google SSO.
          </CardDescription>
        </DialogHeader>

        <div className="space-y-6 pt-6">
           <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Google Email Address</label>
              <input 
                type="email" 
                className="w-full h-14 bg-slate-900 border border-slate-800 rounded-2xl px-4 text-white font-bold focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-700"
                placeholder="colleague@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
           </div>

           <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Access Role</label>
              <div className="grid grid-cols-2 gap-2">
                 {(['MANAGER', 'CASHIER', 'STOCK_CLERK', 'VIEWER'] as Role[]).map(r => (
                   <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${
                      role === r 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                   >
                     {r.replace('_', ' ')}
                   </button>
                 ))}
              </div>
           </div>

           <div className="pt-4 flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-14 rounded-2xl border-slate-800 text-slate-400 font-bold"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold shadow-xl shadow-blue-500/20"
                onClick={() => invite()}
                disabled={!email || isPending}
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Invite'}
              </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
