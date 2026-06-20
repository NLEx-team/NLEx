import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Field, PasswordField, Button } from '../../../shared/ui';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await register({
        email,
        password,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError('Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (password !== passwordRepeat && passwordRepeat.length && password.length) {
      setError('Passwords do not match');
    } else {
      setError(null);
    }
  }, [password, passwordRepeat]);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
      <Field
        label="Email"
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        mode={error ? 'error' : 'default'}
        disabled={loading}
      />
      <PasswordField
        label="Password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        mode={error ? 'error' : 'default'}
        errorText={error || undefined}
        disabled={loading}
      />
      <PasswordField
        label="Repeat password"
        placeholder="Repeat password"
        value={passwordRepeat}
        onChange={(e) => setPasswordRepeat(e.target.value)}
        mode={error ? 'error' : 'default'}
        errorText={error || undefined}
        disabled={loading}
      />
      <Button 
        type="submit" 
        disabled={loading} 
        style={{ width: '100%', marginTop: 'var(--spacing-sm)' }}
      >
        {loading ? 'Wait...' : 'Continue'}
      </Button>
    </form>
  );
};
