import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WCT Question Bank',
  description: 'Question Bank Management Application',
  manifest: '/manifest.json',
  themeColor: '#000000',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192' }],
  },
};
