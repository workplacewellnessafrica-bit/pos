import { Navbar } from '@/components/Navbar';
import { Features } from '@/components/Features';
import { Footer } from '@/components/Footer';

export const metadata = { title: 'Features' };

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 40, paddingBottom: 60 }}>
        <Features />
      </main>
      <Footer />
    </>
  );
}
