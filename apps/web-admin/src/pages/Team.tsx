import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, UserX, LogOut, Loader2, Shield } from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { format } from 'date-fns';
import type { Role } from '@dukapos/shared';

interface Staff {
  id: string; name: string; email: string; role: Role; isActive: boolean;
  lastLoginAt: string | null; createdAt: string;
}

const ROLE_COLORS: Record<Role, string> = {
  OWNER: 'badge-amber', MANAGER: 'badge-violet', CASHIER: 'badge-blue',
  STOCK_CLERK: 'badge-cyan', VIEWER: 'badge-muted',
};

export function TeamPage() {
  const [showCreate, setShowCreate] = useState(false);
  const role = useAuthStore(s => s.user?.role);
  const myId = useAuthStore(s => s.user?.id);
  const qc = useQueryClient();
  const isOwner = role === 'OWNER';

  const { data: staff, isLoading } = useQuery<Staff[]>({
    queryKey: ['team'],
    queryFn: () => api.get('/team').then(r => r.data.data),
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => api.delete(`/team/${id}`),
    onSuccess: () => { toast.success('Staff member deactivated'); void qc.invalidateQueries({ queryKey: ['team'] }); },
    onError: () => toast.error('Failed to deactivate'),
  });

  const { mutate: kick } = useMutation({
    mutationFn: (id: string) => api.post(`/team/${id}/kick`),
    onSuccess: () => toast.success('Session terminated'),
    onError: () => toast.error('Failed to kick session'),
  });

  return (
    <div className="page">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Team</h1>
          <p className="text-muted text-sm">Manage staff accounts and role permissions</p>
        </div>
        {isOwner && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Staff
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted" style={{ padding: '40px 0' }}>
          <Loader2 size={20} className="spin" /> Loading team…
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Email</th><th>Role</th>
                  <th>Last Login</th><th>Status</th>
                  {isOwner && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {staff?.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="user-avatar" style={{ width:28,height:28,fontSize:11,borderRadius:7 }}>
                          {s.name[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                        {s.id === myId && <span className="badge badge-muted" style={{ fontSize: 9 }}>You</span>}
                      </div>
                    </td>
                    <td className="text-muted text-sm">{s.email}</td>
                    <td><span className={`badge ${ROLE_COLORS[s.role]}`}><Shield size={10}/> {s.role}</span></td>
                    <td className="text-muted text-sm">
                      {s.lastLoginAt ? format(new Date(s.lastLoginAt), 'MMM d, HH:mm') : 'Never'}
                    </td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-green' : 'badge-rose'}`}>
                        {s.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    {isOwner && s.id !== myId && (
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn btn-ghost btn-icon btn-sm"
                            title="Kick session"
                            onClick={() => kick(s.id)}
                          >
                            <LogOut size={14} />
                          </button>
                          {s.isActive && (
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Deactivate"
                              style={{ color: 'var(--rose)' }}
                              onClick={() => { if (confirm(`Deactivate ${s.name}?`)) deactivate(s.id); }}
                            >
                              <UserX size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                    {isOwner && s.id === myId && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && <CreateStaffModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function CreateStaffModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', role: 'CASHIER', password: '', pin: '' });

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/team', form),
    onSuccess: () => { toast.success('Staff account created'); void qc.invalidateQueries({ queryKey: ['team'] }); onClose(); },
    onError: (e: { response?: { data?: { message?: string } } }) => toast.error(e.response?.data?.message ?? 'Failed'),
  });

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: 20 }}>Add Staff Member</h2>
        <div className="flex-col gap-3">
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Full Name *</label>
              <input className="input" value={form.name} onChange={f('name')} placeholder="Jane Doe" />
            </div>
            <div className="input-group">
              <label className="input-label">Email *</label>
              <input type="email" className="input" value={form.email} onChange={f('email')} placeholder="jane@store.com" />
            </div>
          </div>
          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Role *</label>
              <select className="input select" value={form.role} onChange={f('role')}>
                <option value="CASHIER">Cashier</option>
                <option value="STOCK_CLERK">Stock Clerk</option>
                <option value="MANAGER">Manager</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">PIN (4–6 digits)</label>
              <input type="password" className="input" value={form.pin} onChange={f('pin')} placeholder="••••" maxLength={6} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Temporary Password *</label>
            <input type="password" className="input" value={form.password} onChange={f('password')} placeholder="Min. 8 characters" />
          </div>
        </div>
        <div className="flex gap-2" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => mutate()}
            disabled={isPending || !form.name || !form.email || !form.password}>
            {isPending ? <Loader2 size={16} className="spin" /> : 'Create Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
