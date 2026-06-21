import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Field, Button, Avatar } from '../../../shared/ui';
import { Icon } from '@iconify/react';
import './UserProfilePage.css';

interface ProfileFormState {
  first_name: string;
  last_name: string;
  email: string;
  avatar_url: string;
}

export function UserProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<ProfileFormState>({
    first_name: '',
    last_name: '',
    email: '',
    avatar_url: '',
  });

  if (!user) return null;

  const profile = user.profile;

  const startEditing = () => {
    setFormState({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      email: user.email,
      avatar_url: profile?.avatar_url || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        first_name: formState.first_name || null,
        last_name: formState.last_name || null,
        email: formState.email,
        avatar_url: formState.avatar_url || null,
      });
      setIsEditing(false);
    } catch {
      // error handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleModeToggle = () => {
    if (isEditing) {
      void handleSave();
      return;
    }
    startEditing();
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const updateField = (key: keyof ProfileFormState, value: string) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const fields: { key: keyof ProfileFormState; label: string; value: string }[] = [
    { key: 'first_name', label: 'First name', value: profile?.first_name || '' },
    { key: 'last_name', label: 'Last name', value: profile?.last_name || '' },
    { key: 'email', label: 'Email', value: user.email },
  ];

  return (
    <div className="profile-page">
      <div className="profile-page__card">
        <div className="profile-page__avatar">
          <Avatar src={isEditing ? formState.avatar_url : profile?.avatar_url} size="lg" />
        </div>

        <div className="profile-page__fields">
          {fields.map((field) => (
            <div key={field.key} className="profile-page__field">
              <label className="profile-page__field-label">{field.label}</label>
              <div className="profile-page__field-control">
                {isEditing ? (
                  <Field
                    value={formState[field.key]}
                    onChange={(e) => updateField(field.key, e.target.value)}
                    disabled={loading}
                  />
                ) : (
                  <span
                    className={`profile-page__field-value ${!field.value ? 'profile-page__field-value--empty' : ''}`}
                  >
                    {field.value || 'Not set'}
                  </span>
                )}
              </div>
            </div>
          ))}

          {isEditing && (
            <div className="profile-page__field">
              <label className="profile-page__field-label">Avatar URL</label>
              <div className="profile-page__field-control">
                <Field
                  value={formState.avatar_url}
                  onChange={(e) => updateField('avatar_url', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="profile-page__field">
            <label className="profile-page__field-label">Role</label>
            <div className="profile-page__field-control">
              <span className="profile-page__field-value">{user.role}</span>
            </div>
          </div>
        </div>

        <div className="profile-page__actions">
          <Button variant="secondary" onClick={handleLogout} disabled={loading}>
            <Icon icon="mdi:logout" />
            <span>Log out</span>
          </Button>
          <Button variant="secondary" onClick={handleModeToggle} disabled={loading}>
            <span>{loading ? 'Saving...' : isEditing ? 'Save' : 'Edit'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
