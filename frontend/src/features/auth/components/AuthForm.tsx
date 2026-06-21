import React, { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthToggle, Logo, type AuthToggleValue } from '../../../shared/ui';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ProfileForm } from './ProfileForm';
import './AuthForm.css';

export const AuthForm: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthToggleValue>('login');
  const [isProfileSetupMode, setIsProfileSetupMode] = useState(false);
  const credentialsRef = useRef<{ email: string; password: string } | null>(null);

  const handleRegisterSuccess = (email: string, password: string) => {
    credentialsRef.current = { email, password };
    setIsProfileSetupMode(true);
  };

  const handleProfileComplete = async () => {
    const creds = credentialsRef.current;
    if (creds) {
      await login(creds);
    }
    credentialsRef.current = null;
    setIsProfileSetupMode(false);
    setMode('login');
  };

  return (
    <div className="auth-container">
      <header className="auth-header">
        <Logo variant="full" />
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
