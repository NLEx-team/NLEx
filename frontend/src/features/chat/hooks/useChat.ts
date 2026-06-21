import { useState, useCallback, useEffect } from 'react';
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

export function useChat(userId: string) {
  const sessionsKey = `nlex_sessions_${userId}`;
  const messagesKey = `nlex_messages_${userId}`;
  const activeKey = `nlex_active_session_${userId}`;

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(sessionsKey);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return localStorage.getItem(activeKey) || '';
  });
  
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem(messagesKey);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  
  const [inputValue, setInputValue] = useState('');
  const [pending, setPending] = useState(false);

  const initChat = useCallback(() => {
    chatApi.create().then(chat => {
      const session: ChatSession = { id: chat.id, title: chat.name };
      setSessions(prev => [...prev, session]);
      setMessagesBySession(prev => ({
        ...prev,
        [chat.id]: []
      }));
      setActiveSessionId(chat.id);
      setInputValue('');
    }).catch(() => {
      // fallback: keep welcome message only
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(sessionsKey, JSON.stringify(sessions));
  }, [sessions, sessionsKey]);

  useEffect(() => {
    localStorage.setItem(messagesKey, JSON.stringify(messagesBySession));
  }, [messagesBySession, messagesKey]);

  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem(activeKey, activeSessionId);
    }
  }, [activeSessionId, activeKey]);

  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) {
      if (sessions.length === 0) {
        initChat();
      } else if (!activeSessionId && sessions.length > 0) {
        setActiveSessionId(sessions[0].id);
      }
      setInitialized(true);
    }
  }, [initChat, sessions.length, activeSessionId, initialized]);

  const handleSendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || pending || !activeSessionId) return;

    setInputValue('');

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      blocks: [{ type: 'text', text }],
      timestamp: new Date().toISOString(),
    };

    const prevMessages = messagesBySession[activeSessionId] || [];
    const isFirstMessage = prevMessages.length === 0;
    if (isFirstMessage) {
      const newTitle = text.length > 30 ? text.slice(0, 30) + '...' : text;
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: newTitle } : s));
    }
    
    setMessagesBySession(prev => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), userMsg]
    }));
    
    setPending(true);

    try {
      const response = await chatApi.sendPrompt(activeSessionId, text);
      const blocks = parseBlocks(response);
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        blocks,
        timestamp: new Date().toISOString(),
        exportUrl: response.export_url,
      };
      
      setMessagesBySession(prev => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), assistantMsg]
      }));
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        blocks: [{ type: 'error', message: err.message || 'Something went wrong' }],
        timestamp: new Date().toISOString(),
      };
      setMessagesBySession(prev => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), errorMsg]
      }));
    } finally {
      setPending(false);
    }
  }, [inputValue, pending, activeSessionId]);

  const handleClarification = useCallback(async (questionId: string, selectedOptions: string[]) => {
    if (!activeSessionId || pending) return;

    setPending(true);

    try {
      const response = await chatApi.sendClarification(activeSessionId, questionId, selectedOptions);
      const blocks = parseBlocks(response);
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        blocks,
        timestamp: new Date().toISOString(),
        exportUrl: response.export_url,
      };
      
      setMessagesBySession(prev => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), assistantMsg]
      }));
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        blocks: [{ type: 'error', message: err.message || 'Something went wrong' }],
        timestamp: new Date().toISOString(),
      };
      setMessagesBySession(prev => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), errorMsg]
      }));
    } finally {
      setPending(false);
    }
  }, [pending, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentMessages = messagesBySession[activeSessionId] || [];

  return {
    sessions,
    activeSessionId,
    activeSession,
    messages: currentMessages,
    inputValue,
    pending,
    setInputValue,
    setActiveSessionId,
    handleSendMessage,
    handleClarification,
    startNewChat: initChat,
  };
}
