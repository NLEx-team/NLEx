import { useState, useCallback, useEffect, useRef } from 'react';
import { chatApi } from '../api';
import type { ChatMessage, ChatSession, ContentBlock } from '../types';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function parseBlocks(response: { result: { status: string; question?: string; options?: string[]; data?: any[][]; headers?: string[]; explanation?: string; sql?: string; message?: string; total_rows?: number; chart?: { type: string; title?: string; x_column?: string; y_columns?: string[]; category_column?: string; value_column?: string; stacked?: boolean } } }): ContentBlock[] {
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
        totalRows: r.total_rows,
      });
      // Add chart block if chart spec is present
      if (r.chart) {
        blocks.push({
          type: 'chart',
          chartType: r.chart.type as 'bar' | 'line' | 'pie' | 'area' | 'scatter',
          title: r.chart.title,
          xColumn: r.chart.x_column,
          yColumns: r.chart.y_columns,
          categoryColumn: r.chart.category_column,
          valueColumn: r.chart.value_column,
          stacked: r.chart.stacked,
          data: r.data,
          headers: r.headers,
        });
      }
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

export function useChat(_userId: string, selectedCatalogIds: string[], blocked: boolean = false) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({});
  const [loadedSessions, setLoadedSessions] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [pending, setPending] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [initialized, setInitialized] = useState(false);

  // Load sessions list from the server on mount
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    chatApi.getChats()
      .then(serverChats => {
        if (serverChats.length > 0) {
          const mapped: ChatSession[] = serverChats.map(c => ({
            id: c.id,
            title: c.title,
            catalogIds: c.catalog_ids || [],
          }));
          setSessions(mapped);
          setActiveSessionId(mapped[0].id);
        } else if (!blocked) {
          // No chats yet — create one. Blocked users are read-only, so skip.
          chatApi.create(selectedCatalogIds).then(chat => {
            const session: ChatSession = { id: chat.id, title: chat.name, catalogIds: chat.catalog_ids || [] };
            setSessions([session]);
            setActiveSessionId(chat.id);
          });
        }
      })
      .catch(() => {
        // Fallback: create a new chat (skip for blocked users)
        if (blocked) return;
        chatApi.create().then(chat => {
          const session: ChatSession = { id: chat.id, title: chat.name, catalogIds: chat.catalog_ids || [] };
          setSessions([session]);
          setActiveSessionId(chat.id);
        }).catch(() => {});
      });
  }, [initialized]);

  // Poll status when pending
  useEffect(() => {
    if (!pending || !activeSessionId) {
      setPendingStatus('');
      return;
    }

    const interval = setInterval(() => {
      chatApi.getStatus(activeSessionId).then((res) => {
        setPendingStatus(res.status);
      }).catch(() => {
        // ignore polling errors
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pending, activeSessionId]);

  // Load messages when switching to a session that hasn't been loaded yet
  useEffect(() => {
    if (!activeSessionId || loadedSessions.has(activeSessionId)) return;

    setLoadedSessions(prev => new Set(prev).add(activeSessionId));

    chatApi.getMessages(activeSessionId)
      .then(serverMessages => {
            const mapped: ChatMessage[] = serverMessages.map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              blocks: m.blocks,
              timestamp: m.created_at,
              exportUrl: m.export_url || undefined,
              exportFilename: m.export_filename || undefined,
            }));
        setMessagesBySession(prev => ({
          ...prev,
          [activeSessionId]: mapped,
        }));
      })
      .catch(() => {
        // If load fails, just start with empty
        setMessagesBySession(prev => ({
          ...prev,
          [activeSessionId]: prev[activeSessionId] || [],
        }));
      });
  }, [activeSessionId, loadedSessions]);

  const isCreatingChat = useRef(false);

  const initChat = useCallback(() => {
    if (blocked) return; // blocked users cannot create chats
    // Prevent creating a new chat if the current active session is already empty
    const currentMessages = activeSessionId ? messagesBySession[activeSessionId] : undefined;
    const currentSession = sessions.find(s => s.id === activeSessionId);
    
    // If it's a newly created chat (no messages or still loading) and it's named "New Chat", prevent duplicates
    if (
      activeSessionId && 
      (!currentMessages || currentMessages.length === 0) &&
      currentSession?.title === 'New Chat'
    ) {
      return;
    }

    if (isCreatingChat.current) return;
    isCreatingChat.current = true;

    chatApi.create(selectedCatalogIds).then(chat => {
      const session: ChatSession = { id: chat.id, title: chat.name, catalogIds: chat.catalog_ids || [] };
      setSessions(prev => [session, ...prev]);
      setMessagesBySession(prev => ({
        ...prev,
        [chat.id]: []
      }));
      setActiveSessionId(chat.id);
      setInputValue('');
    }).catch(() => {
      // fallback: keep welcome message only
    }).finally(() => {
      isCreatingChat.current = false;
    });
  }, [selectedCatalogIds, activeSessionId, messagesBySession, sessions]);

  const handleSendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (blocked || !text || pending || !activeSessionId) return;

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
      const response = await chatApi.sendPromptStream(
        activeSessionId, 
        text, 
        selectedCatalogIds,
        (status) => setPendingStatus(status)
      );
      const blocks = parseBlocks(response);
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        blocks,
        timestamp: new Date().toISOString(),
        exportUrl: response.export_url,
        exportFilename: response.export_filename,
      };
      
      if (response.chat_title) {
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, title: response.chat_title as string } : s));
      }
      
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
      setPendingStatus('');
    }
  }, [inputValue, pending, activeSessionId, messagesBySession, selectedCatalogIds]);

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
        exportFilename: response.export_filename,
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

  const updateSessionCatalogs = useCallback((id: string, catalogIds: string[]) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, catalogIds } : s));
  }, []);

  const renameSession = useCallback(async (id: string, newTitle: string) => {
    try {
      await chatApi.update(id, newTitle);
      setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
    } catch (err) {
      console.error("Failed to rename session", err);
    }
  }, []);

  const removeSession = useCallback(async (id: string) => {
    try {
      await chatApi.delete(id);
      setSessions(prev => {
        const nextSessions = prev.filter(s => s.id !== id);
        if (activeSessionId === id) {
          setActiveSessionId(nextSessions[0]?.id || '');
        }
        return nextSessions;
      });
      setMessagesBySession(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error("Failed to remove session", err);
    }
  }, [activeSessionId]);

  return {
    sessions,
    activeSessionId,
    activeSession,
    messages: currentMessages,
    inputValue,
    pending,
    pendingStatus,
    setInputValue,
    setActiveSessionId,
    handleSendMessage,
    handleClarification,
    startNewChat: initChat,
    renameSession,
    removeSession,
    updateSessionCatalogs,
  };
}
