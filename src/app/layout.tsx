import { Inter } from 'next/font/google';
import './globals.css';
import { Metadata } from 'next';
import ClientDatabaseInitializer from '@/components/ClientDatabaseInitializer';
import ClientAuthProvider from '@/components/ClientAuthProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'WCT Exam Creation Manager',
  description: 'A tool for creating and managing WCT exams',
  manifest: '/manifest.json',
  themeColor: '#000000',
  icons: [
    { rel: 'icon', url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    { rel: 'icon', url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    { rel: 'apple-touch-icon', url: '/icons/icon-192x192.png', sizes: '192x192' }
  ]
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`base-body ${inter.variable}`}>
        <ClientAuthProvider>
          <ClientDatabaseInitializer />
          {children}
        </ClientAuthProvider>
      </body>
    </html>
  );
}
