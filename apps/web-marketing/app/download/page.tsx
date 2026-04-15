import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Smartphone, Monitor } from 'lucide-react';

export const metadata = { title: 'Download' };

export default function DownloadPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 100, paddingBottom: 100, textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 20 }}>Download DukaPOS</h1>
          <p style={{ color: '#94a3b8', fontSize: 18, marginBottom: 60, maxWidth: 600, margin: '0 auto 60px' }}>
            Get the right app for your device. All apps sync automatically when you're online.
          </p>

          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Mobile App */}
            <div style={{ background: '#0a1628', border: '1px solid #1a2d4a', borderRadius: 16, padding: 40, width: 340 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(59,130,246,.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Smartphone size={32} />
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 12 }}>Mobile POS</h3>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>Scan barcodes with your camera, take M-Pesa, and manage an offline cart.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-outline" style={{ justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}>App Store (Coming soon)</button>
                <button className="btn btn-outline" style={{ justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}>Play Store (Coming soon)</button>
              </div>
            </div>

            {/* Desktop App */}
            <div style={{ background: '#0a1628', border: '1px solid #1a2d4a', borderRadius: 16, padding: 40, width: 340 }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(99,102,241,.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Monitor size={32} />
              </div>
              <h3 style={{ fontSize: 20, marginBottom: 12 }}>Desktop POS</h3>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32, lineHeight: 1.6 }}>Connect USB scanners, receipt printers, and cash drawers for fast checkout.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn-outline" style={{ justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}>Download for Windows</button>
                <button className="btn btn-outline" style={{ justifyContent: 'center', opacity: 0.5, cursor: 'not-allowed' }}>Download for macOS</button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
