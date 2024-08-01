import React from 'react';
import { useUser } from '@clerk/clerk-react';
import AuthPage from './AuthPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn) {
    return <AuthPage />
  }

  return <>{children}</>;
};

export default ProtectedRoute;