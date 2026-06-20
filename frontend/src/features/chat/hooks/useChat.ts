import { useState, useCallback } from 'react';
import type { ChatMessage, ChatSession } from '../types';

const MOCK_SESSIONS: ChatSession[] = [
  { id: '1', title: 'Data Analysis - Sales 2023' },
  { id: '2', title: 'Inventory Report' },
  { id: '3', title: 'User Feedback Summary' },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  { role: 'assistant', content: 'Hello! How can I help you with your data today?' },
];

export function useChat() {
  const [sessions] = useState<ChatSession[]>(MOCK_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(MOCK_SESSIONS[0]?.id ?? '');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = useCallback(() => {
    const text = inputValue.trim();
    if (!text) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    const assistantMessage: ChatMessage = { role: 'assistant', content: `This is a mock response to: ${text}` };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');
  }, [inputValue]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return {
    sessions,
    activeSessionId,
    activeSession,
    messages,
    inputValue,
    setInputValue,
    setActiveSessionId,
    handleSendMessage,
  };
}
