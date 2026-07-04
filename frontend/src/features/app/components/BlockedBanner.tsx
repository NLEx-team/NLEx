import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import './BlockedBanner.css';

/**
 * Prominent full-width banner shown at the top of the app for blocked users.
 * Blocked users keep read-only access to their own chats; this explains why
 * sending requests and editing chats is disabled.
 */
export function BlockedBanner() {
  const { t } = useTranslation();

  return (
    <div className="blocked-banner" role="alert">
      <div className="blocked-banner__icon">
        <Icon icon="mdi:lock-alert-outline" width="28" height="28" />
      </div>
      <div className="blocked-banner__text">
        <div className="blocked-banner__title">{t('blocked.title')}</div>
        <div className="blocked-banner__subtitle">{t('blocked.subtitle')}</div>
      </div>
    </div>
  );
}
