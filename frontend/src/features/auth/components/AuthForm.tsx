import React, { useState } from 'react';
import { AuthToggle, type AuthToggleValue } from '../../../shared/ui';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import './AuthForm.css';

export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthToggleValue>('login');

  return (
    <div className="auth-container">
      <header className="auth-header">
        <h1 className="auth-logo">NLEx</h1>
        <p className="auth-subtitle">Natural Language to Excel</p>
      </header>

      <AuthToggle 
        value={mode} 
        onChange={setMode} 
        className="auth-toggle-wrapper" 
      />

      <main className="auth-content">
        {mode === 'login' ? <LoginForm /> : <RegisterForm />}
      </main>
    </div>
  );
};
