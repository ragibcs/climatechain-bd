import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ClimateChain BD — Verifiable Climate Risk Intelligence',
    template: '%s · ClimateChain BD',
  },
  description:
    'Transparent rainfall-risk intelligence for the Surma–Kushiyara basin with tamper-evident EVM provenance. Built for the IEEE ClimateChain Global Hackathon.',
  keywords: [
    'climate risk',
    'flood risk',
    'Sylhet',
    'Bangladesh',
    'blockchain provenance',
    'ERA5',
    'Open-Meteo',
    'climate adaptation',
  ],
  authors: [{ name: 'Ragib', url: 'https://github.com/ragibcs' }],
  openGraph: {
    title: 'ClimateChain BD — Climate risk you can prove',
    description:
      'Real ECMWF/ERA5 rainfall data, a transparent Sylhet Rainfall Risk Index, and tamper-evident provenance for four Surma–Kushiyara stations.',
    type: 'website',
    locale: 'en_US',
    siteName: 'ClimateChain BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClimateChain BD — Climate risk you can prove',
    description:
      'Verifiable rainfall risk intelligence for Sylhet, Bangladesh. Register, verify, and tamper-test climate reports.',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#070B14',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-climate-bg text-slate-100 antialiased">
        <a
          href="#overview"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-cyan-400 focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-slate-950"
        >
          Skip to dashboard
        </a>
        {children}
      </body>
    </html>
  );
}
