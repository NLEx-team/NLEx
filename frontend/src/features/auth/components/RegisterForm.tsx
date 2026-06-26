import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Field, PasswordField, Button } from '../../../shared/ui';
import { isValidEmail, getPasswordValidationErrors } from '../../../utils/validation';

interface RegisterFormProps {
  onSuccess?: (email: string, password: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
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
      setEmailError('Email is required');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Invalid email format');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (!passwordValidation.isValid) {
      setPasswordError('Password does not meet requirements');
      hasError = true;
    }

    if (password && passwordRepeat && password !== passwordRepeat) {
      setRepeatPasswordError('Passwords do not match');
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
      setGeneralError(err.message || 'Failed to register. Please try again.');
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
      setRepeatPasswordError('Passwords do not match');
    } else {
      setRepeatPasswordError(null);
    }
  }, [password, passwordRepeat]);

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
      
      <div className="password-hint-container">
        <div 
          onFocus={() => setIsPasswordFocused(true)} 
          onBlur={() => setIsPasswordFocused(false)}
        >
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
        </div>
        
        <div className={`password-floating-hint ${(isPasswordFocused || passwordError) ? 'visible' : ''} ${passwordValidation.isValid ? 'success' : ''}`}>
          {passwordValidation.isValid ? (
            "✅ Password is secure"
          ) : (
            <>
              <strong>Password requirements:</strong>
              <ul style={{ margin: '4px 0 0', paddingLeft: '20px' }}>
                <li style={{ color: password.length >= 8 ? 'var(--nlex-success, #10b981)' : 'inherit' }}>At least 8 chars</li>
                <li style={{ color: /[A-Z]/.test(password) ? 'var(--nlex-success, #10b981)' : 'inherit' }}>1 uppercase letter</li>
                <li style={{ color: /[a-z]/.test(password) ? 'var(--nlex-success, #10b981)' : 'inherit' }}>1 lowercase letter</li>
                <li style={{ color: /[0-9]/.test(password) ? 'var(--nlex-success, #10b981)' : 'inherit' }}>1 number</li>
              </ul>
            </>
          )}
        </div>
      </div>

      <PasswordField
        label="Repeat password"
        placeholder="Repeat password"
        value={passwordRepeat}
        onChange={(e) => setPasswordRepeat(e.target.value)}
        mode={repeatPasswordError ? 'error' : 'default'}
        errorText={repeatPasswordError || undefined}
        disabled={loading}
      />
      <Button type="button" onClick={submitLogic} disabled={loading}>
        {loading ? 'Wait...' : 'Continue'}
      </Button>
    </div>
  );
};
