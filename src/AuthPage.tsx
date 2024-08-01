import React from 'react';
import { SignIn, SignUp, UserButton, useUser } from "@clerk/clerk-react";
import { useNavigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const { isSignedIn, user, isLoaded } = useUser();
  const navigate = useNavigate();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (isSignedIn) {
    return (
      <div>
        <h1>Welcome, {user.firstName}!</h1>
        <UserButton afterSignOutUrl="/" />
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Authentication</h1>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div>
          <h2>Sign In</h2>
          <SignIn />
        </div>
        <div>
          <h2>Sign Up</h2>
          <SignUp />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;