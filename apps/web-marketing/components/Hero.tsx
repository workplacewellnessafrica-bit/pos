import Link from 'next/link';
import { ArrowRight, Smartphone, Monitor, BarChart3, Zap } from 'lucide-react';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero}>
      {/* Glow orbs */}
      <div className={styles.glow1} />
      <div className={styles.glow2} />
      <div className={styles.grid} />

      <div className="container">
        <div className={styles.inner}>
          <div className={styles.eyebrow}>
            <Zap size={12} /> African-first POS platform
          </div>

          <h1 className={styles.heading}>
            Turn any device into<br />
            <span className={styles.gradient}>a complete store</span>
          </h1>

          <p className={styles.sub}>
            DukaPOS gives African retail businesses a full point-of-sale, inventory
            management, and financial reporting platform — accessible from any phone,
            tablet, or laptop. M-Pesa built in. Works offline.
          </p>

          <div className={styles.ctas}>
            <Link href="#register" className="btn btn-primary btn-lg">
              Register your business free <ArrowRight size={16} />
            </Link>
            <Link href="/download" className="btn btn-outline btn-lg">
              Download the app
            </Link>
          </div>

          <div className={styles.surfaces}>
            {[
              { icon: Smartphone, label: 'Mobile POS', desc: 'iOS & Android' },
              { icon: Monitor,    label: 'Desktop POS', desc: 'Windows & macOS' },
              { icon: BarChart3,  label: 'Admin Panel', desc: 'Web browser' },
            ].map(s => (
              <div key={s.label} className={styles.surfaceCard}>
                <s.icon size={20} style={{ color: '#3b82f6' }} />
                <div>
                  <p className={styles.surfaceLabel}>{s.label}</p>
                  <p className={styles.surfaceDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
