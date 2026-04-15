import { Navbar } from '@/components/Navbar';
import { Pricing } from '@/components/Pricing';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Pricing' };

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 40, paddingBottom: 60 }}>
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
