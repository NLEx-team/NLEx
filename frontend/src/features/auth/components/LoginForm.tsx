import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Field, PasswordField, Button } from '../../../shared/ui';
import { isValidEmail } from '../../../utils/validation';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const submitLogic = async () => {
    let hasError = false;
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);

    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Invalid email format');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitLogic();
    }
  };

  return (
    <div onKeyDown={handleKeyDown} className="auth-form">
      {generalError && <div style={{ color: 'var(--color-error)', marginBottom: '10px' }}>{generalError}</div>}
      <Field
        label="Email"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setEmailError(null);
        }}
        mode={emailError ? 'error' : 'default'}
        errorText={emailError || undefined}
        disabled={loading}
      />
      <PasswordField
        label="Password"
        placeholder="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setPasswordError(null);
        }}
        mode={passwordError ? 'error' : 'default'}
        errorText={passwordError || undefined}
        disabled={loading}
      />
      <Button type="button" onClick={submitLogic} disabled={loading}>
        {loading ? 'Wait...' : 'Continue'}
      </Button>
    </div>
  );
};
