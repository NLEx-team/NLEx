import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Field, PasswordField, Button } from '../../../shared/ui';

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
