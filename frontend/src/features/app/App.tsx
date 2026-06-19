import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      setStatus({ type: 'error', message: 'Введите Email и пароль' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      let response;
      
      if (activeTab === 'signup') {
        // Регистрация
        response = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.detail || 'Ошибка регистрации');
        }
        
        // После успешной регистрации сразу делаем логин
      }

      // Логин (или логин сразу после регистрации)
      response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.detail || 'Ошибка входа: неверный Email или пароль');
      }
      
      const data = await response.json();
      if (data.jwt_token) {
        localStorage.setItem('jwt_token', data.jwt_token);
        setIsLoggedIn(true);
        setStatus({ type: 'success', message: 'Авторизация успешна!' });
      } else {
        throw new Error('Токен не получен');
      }
      
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Ошибка подключения к бэкенду' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setIsLoggedIn(false);
    setEmail('');
    setPassword('');
    setStatus(null);
  };

  // Экран после успешной авторизации
  if (isLoggedIn) {
    return (
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="logo-section">
          <h1 className="logo-title">NLEx</h1>
          <p className="logo-subtitle">Natural Language to Excel</p>
        </div>
        
        <div style={{ margin: '40px 0' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Добро пожаловать! 🎉</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Вы успешно авторизованы в системе.</p>
        </div>

        <button className="continue-btn" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="logo-section">
        <h1 className="logo-title">NLEx</h1>
        <p className="logo-subtitle">Natural Language to Excel</p>
      </div>

      <div className="auth-toggle">
        <button 
          className={activeTab === 'login' ? 'active' : ''} 
          onClick={() => setActiveTab('login')}
        >
          Log in
        </button>
        <button 
          className={activeTab === 'signup' ? 'active' : ''} 
          onClick={() => setActiveTab('signup')}
        >
          Sign up
        </button>
      </div>

      <div className="form-group">
        <input 
          type="email" 
          placeholder="Email" 
          className="input-field" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="form-group">
        <input 
          type={showPassword ? "text" : "password"} 
          placeholder="Password" 
          className="input-field" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span 
          className="password-icon" 
          title="Toggle password visibility"
          onClick={() => setShowPassword(!showPassword)}
          style={{ cursor: 'pointer' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {showPassword ? (
              <>
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </>
            ) : (
              <>
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </>
            )}
          </svg>
        </span>
      </div>

      <button className="continue-btn" onClick={handleAuth} disabled={loading}>
        {loading ? 'Подождите...' : 'Continue'}
      </button>

      {status && (
        <div className={`status-alert status-${status.type}`}>
          {status.message}
        </div>
      )}
    </div>
  );
}

export default App;
