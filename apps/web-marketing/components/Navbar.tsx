'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Zap, Menu, X } from 'lucide-react';
import styles from './Navbar.module.css';

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className={styles.navbar}>
      <div className="container">
        <nav className={styles.inner}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}><Zap size={16} /></div>
            <span className={styles.logoText}>DukaPOS</span>
          </Link>

          <ul className={`${styles.links} ${open ? styles.open : ''}`}>
            {['Features','Pricing','Download','About'].map(l => (
              <li key={l}><Link href={`/${l.toLowerCase()}`} onClick={() => setOpen(false)}>{l}</Link></li>
            ))}
          </ul>

          <div className={styles.actions}>
            <Link href="https://admin.dukapos.com" className="btn btn-outline" style={{ padding: '8px 18px', fontSize: 14 }}>
              Sign in
            </Link>
            <Link href="#register" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>
              Get started free
            </Link>
          </div>

          <button className={styles.burger} onClick={() => setOpen(v => !v)} aria-label="Menu">
            {open ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </nav>
      </div>
    </header>
  );
}
