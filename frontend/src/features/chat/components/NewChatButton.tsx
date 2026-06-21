import { Button } from '../../../shared/ui/button';
import { Icon } from '@iconify/react';
import './NewChatButton.css';

export function NewChatButton() {
  return (
    <Button variant="secondary" className="button--field new-chat-btn">
      <Icon icon="mdi:plus" />
      <span>New Chat</span>
    </Button>
  );
}
