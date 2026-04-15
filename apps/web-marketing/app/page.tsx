import type { Metadata } from 'next';
import { Navbar }   from '@/components/Navbar';
import { Hero }     from '@/components/Hero';
import { Features } from '@/components/Features';
import { Pricing }  from '@/components/Pricing';
import { Footer }   from '@/components/Footer';

export const metadata: Metadata = {
  title: 'DukaPOS — The POS for African Retail',
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
