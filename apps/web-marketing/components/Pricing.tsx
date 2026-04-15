import { Check } from 'lucide-react';
import Link from 'next/link';
import styles from './Pricing.module.css';

const PLANS = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    desc: 'Perfect for trying it out',
    features: ['1 staff account','100 products','Basic sales reports','Mobile POS','Email support'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Starter',
    price: { monthly: 1499, annual: 999 },
    desc: 'For single-location stores',
    features: ['5 staff accounts','Unlimited products','Full reports + XLS export','Mobile + Desktop POS','Priority support','SMS receipts'],
    cta: 'Start Starter',
    highlight: true,
  },
  {
    name: 'Growth',
    price: { monthly: 3499, annual: 2499 },
    desc: 'For growing businesses',
    features: ['20 staff accounts','Unlimited products','All Starter features','Supplier management','Purchase orders','API access'],
    cta: 'Start Growth',
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className="badge badge-blue">Pricing</span>
          <h2 className={styles.heading}>Simple, transparent pricing</h2>
          <p className={styles.sub}>All prices in KES. No hidden charges. Cancel anytime.</p>
        </div>

        <div className={styles.grid}>
          {PLANS.map(p => (
            <div key={p.name} className={`${styles.card} ${p.highlight ? styles.highlighted : ''}`}>
              {p.highlight && <div className={styles.badge}>Most Popular</div>}
              <div className={styles.planName}>{p.name}</div>
              <div className={styles.price}>
                {p.price.monthly === 0 ? (
                  <span className={styles.priceNum}>Free</span>
                ) : (
                  <>
                    <span className={styles.priceNum}>KES {p.price.monthly.toLocaleString()}</span>
                    <span className={styles.pricePer}>/mo</span>
                  </>
                )}
              </div>
              <p className={styles.desc}>{p.desc}</p>
              <ul className={styles.features}>
                {p.features.map(f => (
                  <li key={f}><Check size={14} style={{ color: '#10b981', flexShrink: 0 }}/> {f}</li>
                ))}
              </ul>
              <Link href="#register" className={`btn ${p.highlight ? 'btn-primary' : 'btn-outline'} w-full`}
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
