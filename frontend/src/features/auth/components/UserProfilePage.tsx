import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        first_name: formState.first_name || undefined,
        last_name: formState.last_name || undefined,
        avatar_url: formState.avatar_url || undefined,
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
    { key: 'first_name', label: t('profile.first_name'), value: profile?.first_name || '' },
    { key: 'last_name', label: t('profile.last_name'), value: profile?.last_name || '' },
    { key: 'email', label: t('profile.email'), value: user.email },
  ];

  return (
    <div className="profile-page">
      <div className="profile-page__card">
        <div className="profile-page__avatar">
          <Avatar src={isEditing ? formState.avatar_url : profile?.avatar_url} size="lg" />
        </div>

        <div className="profile-page__fields">
          {fields.map((field) =>
            isEditing ? (
              <Field
                key={field.key}
                label={field.label}
                value={formState[field.key]}
                onChange={(e) => updateField(field.key, e.target.value)}
                disabled={loading}
              />
            ) : (
              <Field
                key={field.key}
                label={field.label}
                value={field.value}
                mode="readonly"
                placeholder={t('common.not_set')}
              />
            ),
          )}

          {isEditing && (
            <Field
              label={t('profile.avatar_url')}
              value={formState.avatar_url}
              onChange={(e) => updateField('avatar_url', e.target.value)}
              disabled={loading}
            />
          )}

          <Field label={t('profile.role')} value={user.role} mode="readonly" />
        </div>

        <div className="profile-page__actions">
          <Button className="profile-btn profile-btn--outline" onClick={() => navigate('/analytics')} disabled={loading}>
            <Icon icon="mdi:chart-bar" />
            <span>{t('profile.analytics')}</span>
          </Button>
          
          {user.role === 'admin' && (
            <Button className="profile-btn profile-btn--outline" onClick={() => navigate('/admin')} disabled={loading}>
              <Icon icon="mdi:shield-account-outline" />
              <span>{t('profile.admin_panel')}</span>
            </Button>
          )}
          
          <Button className="profile-btn profile-btn--outline" onClick={handleModeToggle} disabled={loading}>
            <Icon icon={isEditing ? "mdi:content-save" : "mdi:pencil"} />
            <span>{loading ? t('common.saving') : isEditing ? t('common.save') : t('common.edit')}</span>
          </Button>

          <Button className="profile-btn profile-btn--outline profile-btn--danger" onClick={handleLogout} disabled={loading}>
            <Icon icon="mdi:logout" />
            <span>{t('profile.log_out')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
