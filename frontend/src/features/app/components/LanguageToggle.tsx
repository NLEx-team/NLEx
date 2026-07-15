import { useState } from 'react';
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
  const [switching, setSwitching] = useState(false);

  // Use user's profile language if authenticated, otherwise fallback to i18n
  const currentLang = (user?.profile?.language || i18n.language || 'ru').toLowerCase().substring(0, 2);
  const flagIcon = currentLang === 'ru' ? 'circle-flags:ru' : 'circle-flags:us';

  const toggleLanguage = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    const newLang = currentLang === 'ru' ? 'en' : 'ru';

    // Trigger the switch animation (reset on animationend).
    setSwitching(true);

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
      style={{ pointerEvents: 'auto' }}
    >
      <span className={`language-toggle__icon ${switching ? 'language-toggle__icon--switching' : ''}`}>
        <Icon icon={flagIcon} />
      </span>
      <span
        className={`language-toggle__text ${switching ? 'language-toggle__text--switching' : ''}`}
        onAnimationEnd={() => setSwitching(false)}
      >
        {currentLang.toUpperCase()}
      </span>
    </button>
  );
}
