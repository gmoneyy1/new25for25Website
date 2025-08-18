import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/react';
import QueryProvider from '../components/QueryProvider';
import { Toaster } from '../components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Jetblue 25 for 25 Route Optimizer',
  description: 'Optimize your JetBlue route to visit 25 new airports for the 25for25 challenge',
  icons: {
    icon: [
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Settings', href: '/settings' },
  { label: 'Contact Us', href: '/contact' },
];

function Navigation() {
  return (
    <nav className="w-full bg-white shadow-sm sticky top-0 z-30">
      <div className="container mx-auto flex justify-between items-center px-4 py-3">
        <span className="font-bold text-xl text-blue-700">25for25</span>
        <ul className="flex gap-6">
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-150"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <head>
        <link rel="icon" href="/favicon.ico?v=3" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
      </head>
      <body className={inter.className}>
        {/* Google Analytics - Simple gtag approach */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-J9NJT60HYC"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-J9NJT60HYC');
          `}
        </Script>

        <QueryProvider>
          <Navigation />
          {children}
          <Analytics />
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
