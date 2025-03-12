'use client';

import Link from 'next/link';

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for cannot be found.'
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
