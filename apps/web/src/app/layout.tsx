import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClimateChain BD — Sylhet Climate & Flood Risk Intelligence',
  description: 'AI-assisted rainfall risk intelligence with tamper-evident EVM blockchain provenance for Sylhet, Bangladesh.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0B0F19] text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
