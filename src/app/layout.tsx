import { Inter } from 'next/font/google';
import './globals.css';
import { Metadata } from 'next';
import ClientLayout from '@/components/ClientLayout';
import { setupDatabase } from '@/lib/database/setupDatabase';

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

// Initialize the database when the app starts
if (typeof window !== 'undefined') {
  // Only run on client-side
  setupDatabase()
    .then(result => {
      console.log('Database setup result:', result);
    })
    .catch(error => {
      console.error('Error setting up database:', error);
    });
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`base-body ${inter.variable}`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
