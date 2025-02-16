"use client";

import { Geist } from "next/font/google";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import "./globals.css";
import ErrorBoundary from '@/components/ErrorBoundary';
import { useState, useEffect, useCallback } from 'react';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

interface RootLayoutProps {
  children: React.ReactNode;
}

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export default function RootLayout({ children }: RootLayoutProps) {
  const [error, setError] = useState<Error | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const resetErrorBoundary = useCallback(() => {
    setError(null);
  }, []);

  return (
    <html lang="en" className={geistSans.className}>
      <body className={`base-body ${geistSans.variable}`}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {isClient ? (
            error ? (
              <ErrorBoundary error={error} reset={resetErrorBoundary} />
            ) : (
              <>{children}</>
            )
          ) : (
            <>{children}</>
          )}
        </ThemeProvider>
      </body>
    </html>
  );
}
