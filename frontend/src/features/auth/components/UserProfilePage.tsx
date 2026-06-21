import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Field, Button, Avatar } from '../../../shared/ui';
import { Icon } from '@iconify/react';
import './UserProfilePage.css';

export function UserProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingField) return;
    setLoading(true);
    try {
      await updateProfile({ [editingField]: editValue || null });
      setEditingField(null);
      setEditValue('');
    } catch {
      // error handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const profile = user.profile;
  const fields = [
    { key: 'first_name', label: 'First name', value: profile?.first_name || '' },
    { key: 'last_name', label: 'Last name', value: profile?.last_name || '' },
    { key: 'email', label: 'Email', value: user.email },
  ];

  return (
    <div className="profile-page">
      <div className="profile-page__card">
        <div className="profile-page__avatar">
          <Avatar src={profile?.avatar_url} size="lg" />
          <button
            className="profile-page__avatar-edit"
            onClick={() => startEdit('avatar_url', profile?.avatar_url || '')}
            aria-label="Edit avatar"
          >
            <Icon icon="mdi:pencil" />
          </button>
        </div>

        <div className="profile-page__fields">
          {fields.map(field => (
            <div key={field.key} className="profile-page__field">
              <label className="profile-page__field-label">{field.label}</label>
              <div className="profile-page__field-control">
                {editingField === field.key ? (
                  <div className="profile-page__field-edit">
                    <Field
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      autoFocus
                      disabled={loading}
                    />
                    <div className="profile-page__field-actions">
                      <button
                        className="profile-page__action-btn"
                        onClick={saveEdit}
                        disabled={loading}
                        aria-label="Save"
                      >
                        <Icon icon="mdi:check" />
                      </button>
                      <button
                        className="profile-page__action-btn"
                        onClick={cancelEdit}
                        disabled={loading}
                        aria-label="Cancel"
                      >
                        <Icon icon="mdi:close" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-page__field-display">
                    <span className={`profile-page__field-value ${!field.value ? 'profile-page__field-value--empty' : ''}`}>
                      {field.value || 'Not set'}
                    </span>
                    <button
                      className="profile-page__edit-btn"
                      onClick={() => startEdit(field.key, field.value)}
                      aria-label={`Edit ${field.label}`}
                    >
                      <Icon icon="mdi:pencil" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div className="profile-page__field">
            <label className="profile-page__field-label">Role</label>
            <div className="profile-page__field-control">
              <span className="profile-page__field-value">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="profile-page__actions">
          <Button variant="secondary" onClick={handleLogout}>
            <Icon icon="mdi:logout" />
            <span>Log out</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
