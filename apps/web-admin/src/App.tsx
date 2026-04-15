import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { Layout } from '@/components/Layout/Layout';
import { LoginPage }     from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { ProductsRouter }  from '@/pages/Products/ProductsRouter';
import { InventoryPage } from '@/pages/Inventory';
import { OrdersPage }    from '@/pages/Orders';
import { ReportsPage }   from '@/pages/Reports';
import { TeamPage }      from '@/pages/Team';
import { SettingsPage }  from '@/pages/Settings';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const token = useAuthStore(s => s.accessToken);
  if (token) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <RequireGuest><LoginPage /></RequireGuest>
        } />
        <Route element={
          <RequireAuth><Layout /></RequireAuth>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="products/*" element={<ProductsRouter />} />
          <Route path="inventory"  element={<InventoryPage />} />
          <Route path="orders"     element={<OrdersPage />} />
          <Route path="reports"    element={<ReportsPage />} />
          <Route path="team"       element={<TeamPage />} />
          <Route path="settings"   element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
