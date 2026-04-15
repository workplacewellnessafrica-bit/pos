import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'DukaPOS — The POS for African Retail', template: '%s | DukaPOS' },
  description: 'A complete point-of-sale and inventory platform for African SME retail. Run your entire store from your phone, tablet, or laptop.',
  keywords: ['POS', 'point of sale', 'inventory', 'Kenya', 'Africa', 'M-Pesa', 'retail'],
  openGraph: {
    title: 'DukaPOS — The POS for African Retail',
    description: 'A complete POS and inventory platform built for African businesses.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
