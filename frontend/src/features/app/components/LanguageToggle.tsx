import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import './LanguageToggle.css';

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { i18n } = useTranslation();
  const { user, updateProfile } = useAuth();
  
  // Use user's profile language if authenticated, otherwise fallback to i18n
  const currentLang = (user?.profile?.language || i18n.language || 'ru').toLowerCase().substring(0, 2);

  const toggleLanguage = async () => {
    const newLang = currentLang === 'ru' ? 'en' : 'ru';
    
    // Update local i18n
    i18n.changeLanguage(newLang);
    
    // Update backend if authenticated
    if (user && updateProfile) {
      try {
        await updateProfile({ language: newLang });
      } catch (e) {
        console.error("Failed to update language on backend:", e);
      }
    }
  };

  return (
    <button
      className={`language-toggle ${className}`.trim()}
      onClick={toggleLanguage}
      aria-label="Toggle language"
      type="button"
      title={`Switch to ${currentLang === 'ru' ? 'English' : 'Russian'}`}
    >
      <Icon icon="mdi:translate" />
      <span className="language-toggle__text">
        {currentLang.toUpperCase()}
      </span>
    </button>
  );
}
