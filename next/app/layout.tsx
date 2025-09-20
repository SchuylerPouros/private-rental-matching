import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Private Rental Matching - FHE Privacy Platform',
  description: 'Privacy-preserving rental property matching using Fully Homomorphic Encryption',
  keywords: ['FHE', 'privacy', 'rental', 'blockchain', 'encryption', 'Zama'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
