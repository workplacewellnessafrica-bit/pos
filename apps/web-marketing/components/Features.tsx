import { Package, Warehouse, ShoppingCart, BarChart3, Users, Wifi } from 'lucide-react';
import styles from './Features.module.css';

const FEATURES = [
  { icon: Package,     color: '#8b5cf6', title: 'Product Variants',  desc: 'Build products with up to 3 variant dimensions (Colour × Size × Material). Each combination gets its own SKU, price, stock level, and images.' },
  { icon: Warehouse,   color: '#06b6d4', title: 'Live Inventory',    desc: 'Per-variant stock tracking with configurable alert thresholds. Get notified the moment stock dips below your minimum.' },
  { icon: ShoppingCart,color: '#10b981', title: 'Mobile POS',        desc: 'Scan barcodes with the camera, swipe to manage cart items, accept M-Pesa and cash — all optimised for one-handed phone use.' },
  { icon: BarChart3,   color: '#3b82f6', title: 'Desktop POS',       desc: 'Keyboard-first counter interface with USB barcode scanner, thermal receipt printer, and cash drawer support.' },
  { icon: Users,       color: '#f59e0b', title: 'Role-Based Access', desc: 'Owner, Manager, Cashier, Stock Clerk, and Viewer roles. Fine-grained permission control so each team member sees only what they need.' },
  { icon: Wifi,        color: '#f43f5e', title: 'Offline Mode',       desc: 'Work without internet. Sales queue in local SQLite and sync automatically when connectivity returns — with conflict resolution.' },
];

export function Features() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className="badge badge-blue">Features</span>
          <h2 className={styles.heading}>Everything your store needs</h2>
          <p className={styles.sub}>Built for the realities of African retail — intermittent connectivity, mobile-first teams, and M-Pesa payments.</p>
        </div>
        <div className={styles.grid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.card} style={{ '--accent': f.color } as React.CSSProperties}>
              <div className={styles.icon} style={{ background: `${f.color}18`, border: `1px solid ${f.color}30`, color: f.color }}>
                <f.icon size={22} />
              </div>
              <h3 className={styles.title}>{f.title}</h3>
              <p className={styles.desc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
