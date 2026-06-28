import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Field, Button } from '../../../shared/ui';
import { Icon } from '@iconify/react';
import { api } from '../../../utils/api';
import './AdminPage.css';

interface LlmConfig {
  base_url: string;
  api_key: string;
  model_name: string;
  is_shared: boolean;
  is_active: boolean;
  proxy_mode: string;
  proxy_url?: string;
  is_proxy_shared: boolean;
}

interface UserStats {
  id: string;
  email: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  created_at?: string | null;
}

export function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'llm' | 'users'>('llm');
  
  // LLM State
  const [llmConfig, setLlmConfig] = useState<LlmConfig>({ base_url: '', api_key: '', model_name: '', is_shared: false, is_active: true, proxy_mode: 'system', proxy_url: '', is_proxy_shared: false });
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmMessage, setLlmMessage] = useState('');
  
  const [testPingLoading, setTestPingLoading] = useState(false);
  const [testPingResult, setTestPingResult] = useState<{success: boolean, text: string} | null>(null);

  const [testProxyLoading, setTestProxyLoading] = useState(false);
  const [testProxyResult, setTestProxyResult] = useState<{success: boolean, text: string} | null>(null);
  const [proxyMessage, setProxyMessage] = useState('');

  // Users State
  const [users, setUsers] = useState<UserStats[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'llm') {
      fetchLlmConfig();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchLlmConfig = async () => {
    setLlmLoading(true);
    try {
      const res = await api.get<LlmConfig>('/admin/llm-config');
      if (res) {
        setLlmConfig(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLlmLoading(false);
    }
  };

  const saveLlmConfig = async (configToSave = llmConfig, source: 'llm' | 'proxy' = 'llm') => {
    setLlmLoading(true);
    if (source === 'llm') setLlmMessage('');
    else setProxyMessage('');
    try {
      await api.post('/admin/llm-config', configToSave);
      if (source === 'llm') {
        setLlmMessage('Configuration saved successfully!');
        setTimeout(() => setLlmMessage(''), 3000);
      } else {
        setProxyMessage('Configuration saved successfully!');
        setTimeout(() => setProxyMessage(''), 3000);
      }
    } catch (err: any) {
      if (source === 'llm') setLlmMessage('Failed to save configuration.');
      else setProxyMessage('Failed to save configuration.');
    } finally {
      setLlmLoading(false);
    }
  };

  const handleToggleActive = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfig = { ...llmConfig, is_active: e.target.checked };
    setLlmConfig(newConfig);
    void saveLlmConfig(newConfig, 'llm');
  };

  const testLlmConnection = async () => {
    if (!llmConfig.api_key || !llmConfig.base_url || !llmConfig.model_name) {
      setTestPingResult({ success: false, text: 'Please fill in all configuration fields first.' });
      return;
    }
    
    setTestPingLoading(true);
    setTestPingResult(null);
    try {
      const res = await api.post<{success: boolean, response?: string, error?: string}>('/admin/llm-config/test', {
        base_url: llmConfig.base_url,
        api_key: llmConfig.api_key,
        model_name: llmConfig.model_name,
        prompt: 'Привет',
        proxy_url: llmConfig.proxy_url || null
      });
      
      if (res && res.success) {
        setTestPingResult({ success: true, text: res.response || 'Empty response' });
      } else {
        setTestPingResult({ success: false, text: res?.error || 'Unknown error occurred' });
      }
    } catch (err: any) {
      setTestPingResult({ success: false, text: err.message || 'Failed to connect to the API' });
    } finally {
      setTestPingLoading(false);
    }
  };

  const testProxyConnection = async () => {
    if (llmConfig.proxy_mode === 'custom' && !llmConfig.proxy_url) {
      setTestProxyResult({ success: false, text: 'Please enter a proxy URL first.' });
      return;
    }
    
    setTestProxyLoading(true);
    setTestProxyResult(null);
    try {
      const res = await api.post<{success: boolean, error?: string}>('/admin/proxy-config/test', {
        proxy_mode: llmConfig.proxy_mode,
        proxy_url: llmConfig.proxy_url || null
      });
      
      if (res && res.success) {
        setTestProxyResult({ success: true, text: 'Proxy connection successful' });
      } else {
        setTestProxyResult({ success: false, text: res?.error || 'Proxy connection failed' });
      }
      setTimeout(() => setTestProxyResult(null), 3000);
    } catch (err: any) {
      setTestProxyResult({ success: false, text: err.message || 'Failed to connect to proxy' });
    } finally {
      setTestProxyLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get<UserStats[]>('/admin/users');
      setUsers(res);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      console.error(e);
      alert('Failed to delete user.');
    }
  };

  if (user?.role !== 'admin') return null;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div className="admin-page__tabs">
          <button 
            className={`admin-tab ${activeTab === 'llm' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('llm')}
          >
            <Icon icon="mdi:robot-outline" /> LLM Configuration
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Icon icon="mdi:account-group-outline" /> User Management
          </button>
        </div>
      </div>

      <div className="admin-page__content">
        {activeTab === 'llm' && (
          <div className="admin-panel-wrapper admin-panel-wrapper--centered">
            <div className="admin-panel">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h2>AI Configuration</h2>
                <label className="admin-switch">
                  <input 
                    type="checkbox" 
                    checked={llmConfig.is_active}
                    onChange={handleToggleActive}
                    disabled={llmLoading}
                  />
                  <span className="admin-switch__slider"></span>
                  <span className="admin-switch__label">{llmConfig.is_active ? 'Using Custom AI' : 'Using Standard AI'}</span>
                </label>
              </div>
              <p className="admin-panel__desc">Configure the AI model used by all users if shared. Turn off to use the standard built-in AI.</p>
            
            <div className={`admin-form ${!llmConfig.is_active ? 'admin-form--disabled' : ''}`}>
              <Field
                label="Base URL"
                value={llmConfig.base_url}
                onChange={e => setLlmConfig({...llmConfig, base_url: e.target.value})}
                disabled={llmLoading}
                placeholder="https://api.openai.com/v1"
              />
              <Field
                label="API Key"
                value={llmConfig.api_key}
                onChange={e => setLlmConfig({...llmConfig, api_key: e.target.value})}
                disabled={llmLoading}
                placeholder="sk-..."
                type="password"
              />
              <Field
                label="Model Name"
                value={llmConfig.model_name}
                onChange={e => setLlmConfig({...llmConfig, model_name: e.target.value})}
                disabled={llmLoading}
                placeholder="gpt-4o"
              />
              <label className="admin-checkbox">
                <input 
                  type="checkbox" 
                  checked={llmConfig.is_shared}
                  onChange={e => setLlmConfig({...llmConfig, is_shared: e.target.checked})}
                  disabled={llmLoading}
                />
                <span>Allow users to use this AI configuration globally?</span>
              </label>
              
              <div className="admin-form__actions" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                  <Button 
                    variant="secondary" 
                    onClick={testLlmConnection} 
                    disabled={testPingLoading || llmLoading}
                    style={{ padding: '12px 24px', fontSize: '15px' }}
                  >
                    <Icon icon={testPingLoading ? "mdi:loading" : "mdi:connection"} className={testPingLoading ? "spin" : ""} />
                    {testPingLoading ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={() => saveLlmConfig(llmConfig, 'llm')} 
                    disabled={llmLoading}
                    style={{ padding: '12px 24px', fontSize: '15px' }}
                  >
                    {llmLoading ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
                {llmMessage && <div style={{ textAlign: 'right' }}><span className="admin-message">{llmMessage}</span></div>}
                
                {testPingResult && (
                  <div className={`admin-ping-result ${testPingResult.success ? 'success' : 'error'}`}>
                    <div className="admin-ping-result__header">
                      <Icon icon={testPingResult.success ? "mdi:check-circle-outline" : "mdi:alert-circle-outline"} />
                      <span>{testPingResult.success ? 'Connection Successful' : 'Connection Failed'}</span>
                    </div>
                    <div className="admin-ping-result__body">
                      {testPingResult.text}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>

            <div className="admin-panel" style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h2>Proxy Configuration</h2>
              </div>
              <p className="admin-panel__desc">Configure proxy settings for outbound requests (e.g. LLM API calls).</p>

              <div className="admin-form">
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="proxy_mode"
                      value="off"
                      checked={llmConfig.proxy_mode === 'off'}
                      onChange={e => setLlmConfig({...llmConfig, proxy_mode: e.target.value})}
                      disabled={llmLoading}
                    />
                    Proxy Off
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="proxy_mode"
                      value="system"
                      checked={llmConfig.proxy_mode === 'system'}
                      onChange={e => setLlmConfig({...llmConfig, proxy_mode: e.target.value})}
                      disabled={llmLoading}
                    />
                    Standard Proxy
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="proxy_mode"
                      value="custom"
                      checked={llmConfig.proxy_mode === 'custom'}
                      onChange={e => setLlmConfig({...llmConfig, proxy_mode: e.target.value})}
                      disabled={llmLoading}
                    />
                    Custom Proxy
                  </label>
                </div>

                {llmConfig.proxy_mode === 'custom' && (
                  <Field
                    label="Proxy URL"
                    value={llmConfig.proxy_url || ''}
                    onChange={e => setLlmConfig({...llmConfig, proxy_url: e.target.value})}
                    disabled={llmLoading}
                    placeholder="http://login:password@ip:port"
                  />
                )}

                <label className="admin-checkbox" style={{ marginTop: '16px' }}>
                  <input 
                    type="checkbox" 
                    checked={llmConfig.is_proxy_shared}
                    onChange={e => setLlmConfig({...llmConfig, is_proxy_shared: e.target.checked})}
                    disabled={llmLoading}
                  />
                  <span>Allow users to use this proxy configuration globally?</span>
                </label>

                <div className="admin-form__actions" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                    {llmConfig.proxy_mode !== 'off' && (
                      <Button 
                        variant="secondary" 
                        onClick={testProxyConnection} 
                        disabled={testProxyLoading || llmLoading}
                        style={{ padding: '12px 24px', fontSize: '15px' }}
                      >
                        <Icon icon={testProxyLoading ? "mdi:loading" : "mdi:connection"} className={testProxyLoading ? "spin" : ""} />
                        {testProxyLoading ? 'Testing...' : 'Test Connection'}
                      </Button>
                    )}
                    <Button 
                      variant="primary" 
                      onClick={() => saveLlmConfig(llmConfig, 'proxy')} 
                      disabled={llmLoading}
                      style={{ padding: '12px 24px', fontSize: '15px' }}
                    >
                      {llmLoading ? 'Saving...' : 'Save Configuration'}
                    </Button>
                  </div>
                  
                  {proxyMessage && <div style={{ textAlign: 'right' }}><span className="admin-message">{proxyMessage}</span></div>}

                  {testProxyResult && (
                    <div className={`admin-ping-result ${testProxyResult.success ? 'success' : 'error'}`}>
                      <div className="admin-ping-result__header">
                        <Icon icon={testProxyResult.success ? "mdi:check-circle-outline" : "mdi:alert-circle-outline"} />
                        <strong>{testProxyResult.success ? 'Connection Successful' : 'Connection Failed'}</strong>
                      </div>
                      <div className="admin-ping-result__body">
                        {testProxyResult.text}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-panel admin-panel--wide">
            <h2>Registered Users</h2>
            {usersLoading ? <p>Loading users...</p> : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Registration Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td>{u.email}</td>
                        <td>{u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}` : '-'}</td>
                        <td><span className={`role-badge role-${u.role}`}>{u.role}</span></td>
                        <td>{u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                        <td>
                          {u.id !== user.id && (
                            <button className="btn-delete" onClick={() => deleteUser(u.id)} title="Delete User">
                              <Icon icon="mdi:trash-can-outline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={4} style={{textAlign: 'center'}}>No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
