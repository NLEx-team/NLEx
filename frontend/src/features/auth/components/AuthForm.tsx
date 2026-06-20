import React, { useState } from 'react';
import { AuthToggle, type AuthToggleValue } from '../../../shared/ui';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ProfileForm } from './ProfileForm';
import './AuthForm.css';

export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthToggleValue>('login');
  const [isProfileSetupMode, setIsProfileSetupMode] = useState(false);

  const handleRegisterSuccess = () => {
    setIsProfileSetupMode(true);
  };

  const handleProfileComplete = () => {
    setIsProfileSetupMode(false);
    setMode('login');
  };

  return (
    <div className="auth-container">
      <header className="auth-header">
        <h1 className="auth-logo">NLEx</h1>
        <p className="auth-subtitle">Natural Language to Excel</p>
      </header>

      {!isProfileSetupMode && (
        <AuthToggle 
          value={mode} 
          onChange={setMode} 
          className="auth-toggle-wrapper" 
        />
      )}

      <main className="auth-content">
        {isProfileSetupMode ? (
          <ProfileForm onSuccess={handleProfileComplete} />
        ) : (
          <>
            {mode === 'login' ? <LoginForm /> : <RegisterForm onSuccess={handleRegisterSuccess} />}
          </>
        )}
      </main>
    </div>
  );
};
