import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Field, PasswordField, Button } from '../../../shared/ui';
import { isValidEmail } from '../../../utils/validation';

export const LoginForm: React.FC = () => {
  const { t } = useTranslation();
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
      setEmailError(t('auth.email_required'));
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError(t('auth.invalid_email'));
      hasError = true;
    }

    if (!password) {
      setPasswordError(t('auth.password_required'));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setGeneralError(err.message || t('auth.failed_login'));
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
        label={t('auth.email')}
        type="email"
        placeholder={t('auth.email')}
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
        label={t('auth.password')}
        placeholder={t('auth.password')}
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
        {loading ? t('auth.wait') : t('auth.continue')}
      </Button>
    </div>
  );
};

