import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'WCT Question Bank',
  description: 'Question Bank Management Application',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-192x192.png', sizes: '192x192' }],
  },
  viewport: 'width=device-width, initial-scale=1, theme-color=#000000',
};
