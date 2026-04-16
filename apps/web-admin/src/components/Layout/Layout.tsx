import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart,
  BarChart3, Users, Settings, LogOut, Bell, ChevronDown,
  Zap, AlertTriangle, ClipboardList, Monitor,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/client';
import { useSocketAlerts } from '@/hooks/useSocket';
import toast from 'react-hot-toast';
import './Layout.css';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/products',   icon: Package,          label: 'Products'     },
  { to: '/inventory',  icon: Warehouse,         label: 'Inventory'   },
  { to: '/orders',     icon: ShoppingCart,      label: 'Orders'      },
  { to: '/reports',    icon: BarChart3,         label: 'Analytics'   },
  { to: '/reconcile',  icon: ClipboardList,     label: 'Reconcile'   },
  { to: '/team',       icon: Users,             label: 'Team'        },
  { to: '/settings',   icon: Settings,          label: 'Settings'    },
];

export function Layout() {
  const { user, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  // Low-stock alert count
  const { data: alertsData } = useQuery({
    queryKey: ['inventory', 'alerts'],
    queryFn: () => api.get('/inventory/alerts').then(r => r.data.data as unknown[]),
    refetchInterval: 60_000,
  });
  const alertCount = alertsData?.length ?? 0;

  // Socket.io — receive real-time stock alerts
  useSocketAlerts({
    onStockAlert: (ev) => {
      toast.custom((t) => (
        <div className={`socket-toast ${t.visible ? 'visible' : ''}`}>
          <AlertTriangle size={16} color="var(--amber)" />
          <span>Low stock: <strong>{ev.productName}</strong> — {ev.stockQuantity} left</span>
        </div>
      ), { duration: 6000 });
    },
    onSaleNew: (ev) => {
      toast.success(`New sale: ${ev.receiptNo} — KES ${ev.total}`, { duration: 4000 });
    },
  });

  const handleLogout = async () => {
    await api.post('/auth/logout').catch(() => {});
    storeLogout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon"><Zap size={18} /></div>
          <span className="logo-text">ShopLink</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Inventory' && alertCount > 0 && (
                <span className="nav-badge">{alertCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{user?.name}</p>
              <p className="user-role">{user?.role}</p>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="main-wrap">
        <header className="topbar">
          <div className="topbar-left">
            <p className="topbar-biz">{user?.businessName}</p>
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost btn-icon topbar-btn" style={{ position: 'relative' }}>
              <Bell size={18} />
              {alertCount > 0 && <span className="topbar-alert-dot" />}
            </button>
            <div className="topbar-user">
              <div className="user-avatar sm">{user?.name?.[0]?.toUpperCase()}</div>
              <span className="text-sm">{user?.name}</span>
              <ChevronDown size={14} className="text-muted" />
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
