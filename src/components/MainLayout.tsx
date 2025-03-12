import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Main layout component that wraps the application content.
 * Provides consistent layout structure across pages.
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  );
};

export default MainLayout; 