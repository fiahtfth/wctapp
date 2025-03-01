'use client';

import Link from 'next/link';

export default function CustomError({ statusCode }: { statusCode?: number }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">
          {statusCode ? `${statusCode}` : 'Error'}
        </h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          {statusCode ? `An error ${statusCode} occurred` : 'An error occurred'}
        </h2>
        <p className="text-gray-600 mb-6">
          Please try again later or contact support if the problem persists.
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
