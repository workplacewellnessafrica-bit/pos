import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Calculator, CheckCircle, Clock, DollarSign,
  Download, Loader2, AlertTriangle, TrendingUp,
} from 'lucide-react';
import api from '@/api/client';
import toast from 'react-hot-toast';
import { format, startOfDay, endOfDay } from 'date-fns';

const fmt = (n: number) => `KES ${Number(n).toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;

interface ReconciliationData {
  id: string;
  date: string;
  cashAtHand: number;
  mpesaTotal: number;
  cardTotal: number;
  credits: number;
  daySales: number;
  expenditures: number;
  openingBalance: number;
  closingBalance: number;
  status: 'PENDING' | 'VERIFIED' | 'CLOSED';
  createdAt: string;
}

interface DaySummary {
  totalRevenue: number;
  cashTotal: number;
  mpesaTotal: number;
  cardTotal: number;
  creditTotal: number;
  orderCount: number;
}

export function DayEndReconciliationPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);

  const [form, setForm] = useState({
    cashAtHand: '',
    expenditures: '',
    openingBalance: '',
    notes: '',
  });

  const { data: summary, isLoading: sumLoading } = useQuery<DaySummary>({
    queryKey: ['reports', 'day-summary', selectedDate],
    queryFn: () => api.get('/reports/revenue', {
      params: {
        dateFrom: startOfDay(new Date(selectedDate)).toISOString(),
        dateTo: endOfDay(new Date(selectedDate)).toISOString(),
      }
    }).then(r => {
      const d = r.data.data;
      const pb = d.paymentBreakdown ?? {};
      return {
        totalRevenue: d.totalRevenue ?? 0,
        cashTotal: pb.CASH ?? 0,
        mpesaTotal: pb.MPESA ?? 0,
        cardTotal: pb.CARD ?? 0,
        creditTotal: pb.CREDIT ?? 0,
        orderCount: d.orderCount ?? 0,
      };
    }),
  });

  const { data: history, refetch: refetchHistory } = useQuery<ReconciliationData[]>({
    queryKey: ['reconciliation', 'history'],
    queryFn: () => api.get('/reports/reconciliation').then(r => r.data.data ?? []).catch(() => []),
  });

  const { mutate: submitReconciliation, isPending: submitting } = useMutation({
    mutationFn: () => api.post('/reports/reconciliation', {
      date: selectedDate,
      cashAtHand: Number(form.cashAtHand),
      mpesaTotal: summary?.mpesaTotal ?? 0,
      cardTotal: summary?.cardTotal ?? 0,
      credits: summary?.creditTotal ?? 0,
      daySales: summary?.totalRevenue ?? 0,
      expenditures: Number(form.expenditures),
      openingBalance: Number(form.openingBalance),
    }),
    onSuccess: () => {
      toast.success('Day-end reconciliation submitted!');
      setForm({ cashAtHand: '', expenditures: '', openingBalance: '', notes: '' });
      refetchHistory();
    },
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Failed to submit reconciliation'),
  });

  // Expected closing = opening + daySales - expenditures
  const opening = Number(form.openingBalance) || 0;
  const daySales = summary?.totalRevenue ?? 0;
  const expenditures = Number(form.expenditures) || 0;
  const cashAtHand = Number(form.cashAtHand) || 0;
  const expectedClosing = opening + daySales - expenditures;
  const variance = cashAtHand - expectedClosing;

  const statusBadge = (s: string) => {
    if (s === 'VERIFIED') return 'badge-green';
    if (s === 'CLOSED')   return 'badge-blue';
    return 'badge-amber';
  };

  return (
    <div className="page">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1>Day-End Reconciliation</h1>
          <p className="text-muted text-sm">Close the books and verify daily takings</p>
        </div>
        <input
          type="date"
          className="input"
          style={{ width: 180 }}
          value={selectedDate}
          max={today}
          onChange={e => setSelectedDate(e.target.value)}
        />
      </div>

      <div className="recon-grid">
        {/* Day Summary */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>
            <TrendingUp size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--blue)' }} />
            Day Summary — {format(new Date(selectedDate), 'dd MMM yyyy')}
          </h3>
          {sumLoading ? (
            <div className="flex items-center gap-2 text-muted"><Loader2 size={16} className="spin" /> Fetching sales…</div>
          ) : (
            <div className="recon-summary-grid">
              {[
                { label: 'Total Revenue', value: fmt(summary?.totalRevenue ?? 0), color: 'var(--green)' },
                { label: 'Cash Sales', value: fmt(summary?.cashTotal ?? 0), color: 'var(--green)' },
                { label: 'M-Pesa', value: fmt(summary?.mpesaTotal ?? 0), color: 'var(--blue)' },
                { label: 'Card', value: fmt(summary?.cardTotal ?? 0), color: 'var(--violet)' },
                { label: 'Credit', value: fmt(summary?.creditTotal ?? 0), color: 'var(--amber)' },
                { label: 'Orders', value: (summary?.orderCount ?? 0).toString(), color: 'var(--cyan)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="recon-summary-item">
                  <span className="text-xs text-muted">{label}</span>
                  <span className="text-sm" style={{ fontWeight: 700, color }}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="card flex-col gap-4">
          <h3>
            <Calculator size={16} style={{ display: 'inline', marginRight: 8, color: 'var(--violet)' }} />
            Cash Reconciliation
          </h3>

          <div className="grid-2">
            <div className="input-group">
              <label className="input-label">Opening Balance (KES)</label>
              <input type="number" className="input" placeholder="0.00"
                value={form.openingBalance} onChange={e => setForm(p => ({ ...p, openingBalance: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Expenditures (KES)</label>
              <input type="number" className="input" placeholder="0.00"
                value={form.expenditures} onChange={e => setForm(p => ({ ...p, expenditures: e.target.value }))} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Cash at Hand (KES) — Physical count</label>
            <input type="number" className="input" placeholder="Count the till…"
              value={form.cashAtHand} onChange={e => setForm(p => ({ ...p, cashAtHand: e.target.value }))} />
          </div>

          {/* Balance Verification */}
          <div className="recon-calc-card">
            <div className="recon-calc-row">
              <span>Opening Balance</span><span>{fmt(opening)}</span>
            </div>
            <div className="recon-calc-row">
              <span>+ Day Sales</span><span style={{ color: 'var(--green)' }}>+ {fmt(daySales)}</span>
            </div>
            <div className="recon-calc-row">
              <span>- Expenditures</span><span style={{ color: 'var(--rose)' }}>- {fmt(expenditures)}</span>
            </div>
            <div className="recon-calc-divider" />
            <div className="recon-calc-row" style={{ fontWeight: 700 }}>
              <span>Expected Closing</span><span>{fmt(expectedClosing)}</span>
            </div>
            <div className="recon-calc-row" style={{ fontWeight: 700 }}>
              <span>Cash at Hand</span><span>{fmt(cashAtHand)}</span>
            </div>
            <div className="recon-calc-divider" />
            <div className="recon-calc-row" style={{ fontWeight: 700, fontSize: 15 }}>
              <span>Variance</span>
              <span style={{ color: variance === 0 ? 'var(--green)' : variance > 0 ? 'var(--blue)' : 'var(--rose)' }}>
                {variance >= 0 ? '+' : ''}{fmt(variance)}
              </span>
            </div>
          </div>

          {variance !== 0 && form.cashAtHand && (
            <div className="flex items-center gap-2" style={{ color: 'var(--amber)', fontSize: 13 }}>
              <AlertTriangle size={14} />
              {variance > 0 ? 'Cash surplus detected — double-check your count.' : 'Cash shortage — investigate before closing.'}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={() => submitReconciliation()}
            disabled={submitting || !form.cashAtHand || !form.openingBalance}
          >
            {submitting ? <Loader2 size={15} className="spin" /> : <CheckCircle size={15} />}
            Submit Reconciliation
          </button>
        </div>

        {/* History */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h3><Clock size={16} style={{ display: 'inline', marginRight: 8 }} />Reconciliation History</h3>
            <button className="btn btn-outline btn-sm">
              <Download size={14} /> Export CSV
            </button>
          </div>
          {!history?.length ? (
            <div className="empty-state"><p>No reconciliations submitted yet.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Day Sales</th><th>Cash at Hand</th>
                    <th>Expenditures</th><th>Closing Balance</th><th>Variance</th><th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => {
                    const v = r.cashAtHand - r.closingBalance;
                    return (
                      <tr key={r.id}>
                        <td className="font-mono" style={{ fontSize: 12 }}>{format(new Date(r.date), 'dd MMM yyyy')}</td>
                        <td>{fmt(r.daySales)}</td>
                        <td>{fmt(r.cashAtHand)}</td>
                        <td style={{ color: 'var(--rose)' }}>{fmt(r.expenditures)}</td>
                        <td>{fmt(r.closingBalance)}</td>
                        <td style={{ color: v === 0 ? 'var(--green)' : v > 0 ? 'var(--blue)' : 'var(--rose)', fontWeight: 600 }}>
                          {v >= 0 ? '+' : ''}{fmt(v)}
                        </td>
                        <td><span className={`badge ${statusBadge(r.status)}`}>{r.status}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
