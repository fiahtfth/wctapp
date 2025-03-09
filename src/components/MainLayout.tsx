import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

/**
 * Main layout component that wraps the application content.
 * Provides consistent layout structure across pages.
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  );
};

export default MainLayout; 