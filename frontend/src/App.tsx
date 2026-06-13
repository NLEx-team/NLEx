import { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Подключение к бэкенду для прохождения MVP v0
  const handleContinue = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const response = await fetch('http://localhost:8000/');
      if (!response.ok) throw new Error('Network Error');
      await response.json();
      setStatus({ type: 'success', message: 'Успешное подключение к API!' });
    } catch (err) {
      setStatus({ type: 'error', message: 'Ошибка подключения к бэкенду' });
    } finally {
      setLoading(false);
    }
  };

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
        <input type="email" placeholder="Email" className="input-field" />
      </div>

      <div className="form-group">
        <input type="password" placeholder="Password" className="input-field" />
        <span className="password-icon" title="Toggle password visibility">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </span>
      </div>

      <button className="continue-btn" onClick={handleContinue} disabled={loading}>
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
