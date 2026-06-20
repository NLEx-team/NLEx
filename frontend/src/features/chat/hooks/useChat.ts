import { useState, useCallback, useEffect, useRef } from 'react';
import { chatApi } from '../api';
import type { ChatMessage, ChatSession, ContentBlock } from '../types';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function parseBlocks(response: { result: { status: string; question?: string; options?: string[]; data?: any[][]; headers?: string[]; explanation?: string; sql?: string; message?: string } }): ContentBlock[] {
  const r = response.result;
  const blocks: ContentBlock[] = [];

  if (r.status === 'clarification') {
    blocks.push({
      type: 'options',
      questionId: generateId(),
      question: r.question || '',
      options: r.options || [],
    });
  } else if (r.status === 'success') {
    if (r.explanation) {
      blocks.push({ type: 'text', text: r.explanation });
    }
    if (r.data && r.headers) {
      blocks.push({
        type: 'table',
        headers: r.headers,
        rows: r.data,
        sql: r.sql,
        explanation: r.explanation,
      });
    }
    if (!r.explanation && !r.data) {
      blocks.push({ type: 'text', text: 'Request completed successfully.' });
    }
  } else if (r.status === 'error') {
    blocks.push({
      type: 'error',
      message: r.message || 'An error occurred',
      sql: r.sql,
    });
  }

  return blocks;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  blocks: [{ type: 'text', text: 'Hello! How can I help you with your data today?' }],
  timestamp: new Date().toISOString(),
};

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [pending, setPending] = useState(false);
  const chatIdRef = useRef<string | null>(null);

  useEffect(() => {
    chatApi.create().then(chat => {
      chatIdRef.current = chat.id;
      const session: ChatSession = { id: chat.id, title: chat.name };
      setSessions([session]);
      setActiveSessionId(chat.id);
    }).catch(() => {
      // fallback: keep welcome message only
    });
  }, []);

  const handleSendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || pending || !chatIdRef.current) return;

    setInputValue('');

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      blocks: [{ type: 'text', text }],
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setPending(true);

    try {
      const response = await chatApi.sendPrompt(chatIdRef.current, text);
      const blocks = parseBlocks(response);
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        blocks,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        blocks: [{ type: 'error', message: err.message || 'Something went wrong' }],
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setPending(false);
    }
  }, [inputValue, pending]);

  const handleClarification = useCallback(async (questionId: string, selectedOptions: string[]) => {
    if (!chatIdRef.current || pending) return;

    setPending(true);

    try {
      const response = await chatApi.sendClarification(chatIdRef.current, questionId, selectedOptions);
      const blocks = parseBlocks(response);
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        blocks,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        blocks: [{ type: 'error', message: err.message || 'Something went wrong' }],
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setPending(false);
    }
  }, [pending]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return {
    sessions,
    activeSessionId,
    activeSession,
    messages,
    inputValue,
    pending,
    setInputValue,
    setActiveSessionId,
    handleSendMessage,
    handleClarification,
  };
}
