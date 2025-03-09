'use client';

import React from 'react';
import { AuthProvider } from './AuthProvider';

interface ClientAuthProviderProps {
  children: React.ReactNode;
}

/**
 * This component provides authentication context to the client-side application.
 * It wraps the children with the actual AuthProvider component.
 */
const ClientAuthProvider: React.FC<ClientAuthProviderProps> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export default ClientAuthProvider; 