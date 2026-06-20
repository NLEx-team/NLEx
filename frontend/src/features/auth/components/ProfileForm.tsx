import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Field, Button, Avatar } from '../../../shared/ui';
import { Icon } from "@iconify/react";
import './ProfileForm.css';

interface ProfileFormProps {
  onSuccess?: () => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess }) => {
  const { updateProfile, user } = useAuth();
  const [firstName, setFirstName] = useState(user?.profile?.first_name || '');
  const [lastName, setLastName] = useState(user?.profile?.last_name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || '');
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mock upload - in reality we would upload the file to backend and get a URL
    console.log('Uploading file:', file.name);
    const mockUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${file.name}`;
    setAvatarUrl(mockUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
      });
      // Ideally we would redirect or show success here
      console.log('Profile updated successfully');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Allow user to skip this form
    console.log('Profile setup skipped');
    // Implement navigation to main app here
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="profile-form-container">
      <header className="profile-header">
        <h2>Complete Your Profile</h2>
      </header>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="avatar-upload">
          <label className="avatar-label">
            <Avatar src={avatarUrl} size="lg" />
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
            <div className="avatar-edit-icon">
              <Icon icon="mdi:pencil" aria-hidden="true" />
            </div>
          </label>
        </div>

        <div className="fields-group">
          <Field
            label="First Name"
            placeholder="Enter your first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Field
            label="Last Name"
            placeholder="Enter your last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>

        <div className="button-group">
          <Button 
            variant="secondary" 
            onClick={handleSkip}
            disabled={loading}
          >
            Skip for now
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
          >
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
};
