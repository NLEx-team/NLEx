import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Field, PasswordField, Button } from '../../../shared/ui';
import { isValidEmail, getPasswordValidationErrors } from '../../../utils/validation';

interface RegisterFormProps {
  onSuccess?: (email: string, password: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');
  
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [repeatPasswordError, setRepeatPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const passwordValidation = getPasswordValidationErrors(password);

  const submitLogic = async () => {
    let hasError = false;
    setEmailError(null);
    setPasswordError(null);
    setRepeatPasswordError(null);
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
    } else if (!passwordValidation.isValid) {
      setPasswordError(t('auth.password_requirements'));
      hasError = true;
    }

    if (password && passwordRepeat && password !== passwordRepeat) {
      setRepeatPasswordError(t('auth.passwords_not_match'));
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await register({
        email,
        password,
      });
      if (onSuccess) {
        onSuccess(email, password);
      }
    } catch (err: any) {
      setGeneralError(err.message || t('auth.failed_register'));
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

  useEffect(() => {
    if (password !== passwordRepeat && passwordRepeat.length && password.length) {
      setRepeatPasswordError(t('auth.passwords_not_match'));
    } else {
      setRepeatPasswordError(null);
    }
  }, [password, passwordRepeat, t]);

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
      
      <div className="password-hint-container">
        <div 
          onFocus={() => setIsPasswordFocused(true)} 
          onBlur={() => setIsPasswordFocused(false)}
        >
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
        </div>
        
        <div className={`password-floating-hint ${(isPasswordFocused || passwordError) ? 'visible' : ''} ${passwordValidation.isValid ? 'success' : ''}`}>
          {passwordValidation.isValid ? (
            t('auth.password_secure')
          ) : (
            <>
              <strong>{t('auth.password_requirements_list')}</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
                <li style={{ color: password.length >= 8 ? 'var(--nlex-success, #10b981)' : 'inherit' }}>{t('auth.req_chars')}</li>
                <li style={{ color: /[A-Z]/.test(password) ? 'var(--nlex-success, #10b981)' : 'inherit' }}>{t('auth.req_uppercase')}</li>
                <li style={{ color: /[a-z]/.test(password) ? 'var(--nlex-success, #10b981)' : 'inherit' }}>{t('auth.req_lowercase')}</li>
                <li style={{ color: /[0-9]/.test(password) ? 'var(--nlex-success, #10b981)' : 'inherit' }}>{t('auth.req_number')}</li>
              </ul>
            </>
          )}
        </div>
      </div>

      <PasswordField
        label={t('auth.repeat_password')}
        placeholder={t('auth.repeat_password')}
        value={passwordRepeat}
        onChange={(e) => setPasswordRepeat(e.target.value)}
        mode={repeatPasswordError ? 'error' : 'default'}
        errorText={repeatPasswordError || undefined}
        disabled={loading}
      />
      <Button type="button" onClick={submitLogic} disabled={loading}>
        {loading ? t('auth.wait') : t('auth.continue')}
      </Button>
    </div>
  );
};
