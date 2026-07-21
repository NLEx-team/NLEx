import { useState, useCallback, useEffect, useRef } from 'react';
import { chatApi } from '../api';
import type { ChatMessage, ChatSession, ChatFolder, ContentBlock } from '../types';

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
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [messagesBySession, setMessagesBySession] = useState<Record<string, ChatMessage[]>>({});
  const [loadedSessions, setLoadedSessions] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState('');
  const [pendingBySession, setPendingBySession] = useState<Record<string, boolean>>({});
  const [pendingStatusBySession, setPendingStatusBySession] = useState<Record<string, string>>({});

  const pending = pendingBySession[activeSessionId] || false;
  const pendingStatus = pendingStatusBySession[activeSessionId] || '';
  const [initialized, setInitialized] = useState(false);

  // Load sessions list and folders from the server on mount
  useEffect(() => {
    if (initialized) return;
    setInitialized(true);

    Promise.all([
      chatApi.getChats(),
      chatApi.getFolders(),
    ]).then(([serverChats, serverFolders]) => {
      setFolders(serverFolders.map(f => ({ id: f.id, name: f.name, chatCount: f.chat_count })));

      if (serverChats.length > 0) {
        const mapped: ChatSession[] = serverChats.map(c => ({
          id: c.id,
          title: c.title,
          catalogIds: c.catalog_ids || [],
          folderId: c.folder_id || undefined,
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
    }).catch(() => {
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
    const pendingSessionIds = Object.keys(pendingBySession).filter(id => pendingBySession[id]);
    if (pendingSessionIds.length === 0) return;

    const interval = setInterval(() => {
      pendingSessionIds.forEach(id => {
        chatApi.getStatus(id).then((res) => {
          setPendingStatusBySession(prev => ({ ...prev, [id]: res.status }));
        }).catch(() => {
          // ignore polling errors
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingBySession]);

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
    // Check if there's already an empty "New Chat" in the sessions list
    const existingEmptySession = sessions.find(s => {
      const msgs = messagesBySession[s.id];
      return (!msgs || msgs.length === 0) && (s.title === 'New Chat' || s.title === 'Новый чат');
    });

    if (existingEmptySession) {
      // Just switch to the existing empty chat instead of creating a new one
      setActiveSessionId(existingEmptySession.id);
      setInputValue('');
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
    const sessionId = activeSessionId;
    const isPending = pendingBySession[sessionId];
    if (blocked || !text || isPending || !sessionId) return;

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
    
    setPendingBySession(prev => ({ ...prev, [sessionId]: true }));
    setPendingStatusBySession(prev => ({ ...prev, [sessionId]: '' }));

    try {
      const response = await chatApi.sendPromptStream(
        sessionId, 
        text, 
        selectedCatalogIds,
        (status) => setPendingStatusBySession(prev => ({ ...prev, [sessionId]: status }))
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
      setPendingBySession(prev => ({ ...prev, [sessionId]: false }));
      setPendingStatusBySession(prev => ({ ...prev, [sessionId]: '' }));
    }
  }, [inputValue, pendingBySession, activeSessionId, messagesBySession, selectedCatalogIds]);

  const handleClarification = useCallback(async (questionId: string, selectedOptions: string[]) => {
    const sessionId = activeSessionId;
    const isPending = pendingBySession[sessionId];
    if (!sessionId || isPending) return;

    setPendingBySession(prev => ({ ...prev, [sessionId]: true }));

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
      setPendingBySession(prev => ({ ...prev, [sessionId]: false }));
    }
  }, [pendingBySession, activeSessionId]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const currentMessages = messagesBySession[activeSessionId] || [];

  const updateSessionCatalogs = useCallback((id: string, catalogIds: string[]) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, catalogIds } : s));
  }, []);

  const createFolder = useCallback(async (name: string) => {
    try {
      const res = await chatApi.createFolder(name);
      const folder: ChatFolder = { id: res.id, name: res.name, chatCount: 0 };
      setFolders(prev => [...prev, folder]);
      return folder;
    } catch (err) {
      console.error("Failed to create folder", err);
      return null;
    }
  }, []);

  const renameFolder = useCallback(async (folderId: string, name: string) => {
    try {
      await chatApi.renameFolder(folderId, name);
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name } : f));
    } catch (err) {
      console.error("Failed to rename folder", err);
    }
  }, []);

  const deleteFolder = useCallback(async (folderId: string, deleteChats: boolean = false) => {
    try {
      await chatApi.deleteFolder(folderId, deleteChats);
      setFolders(prev => prev.filter(f => f.id !== folderId));
      if (deleteChats) {
        setSessions(prev => {
          const next = prev.filter(s => s.folderId !== folderId);
          if (next.length === 0) {
            setActiveSessionId('');
          } else if (!next.find(s => s.id === activeSessionId)) {
            setActiveSessionId(next[0].id);
          }
          return next;
        });
      } else {
        setSessions(prev => prev.map(s => s.folderId === folderId ? { ...s, folderId: undefined } : s));
      }
    } catch (err) {
      console.error("Failed to delete folder", err);
    }
  }, [activeSessionId]);

  const moveChatToFolder = useCallback(async (chatId: string, folderId: string) => {
    try {
      await chatApi.moveChatToFolder(chatId, folderId);
      setSessions(prev => prev.map(s => s.id === chatId ? { ...s, folderId } : s));
      setFolders(prev => prev.map(f => {
        if (f.id === folderId) return { ...f, chatCount: f.chatCount + 1 };
        if (f.id === sessions.find(s => s.id === chatId)?.folderId) return { ...f, chatCount: Math.max(0, f.chatCount - 1) };
        return f;
      }));
    } catch (err) {
      console.error("Failed to move chat to folder", err);
    }
  }, [sessions]);

  const removeChatFromFolder = useCallback(async (chatId: string) => {
    const oldFolderId = sessions.find(s => s.id === chatId)?.folderId;
    try {
      await chatApi.removeChatFromFolder(chatId);
      setSessions(prev => prev.map(s => s.id === chatId ? { ...s, folderId: undefined } : s));
      if (oldFolderId) {
        setFolders(prev => prev.map(f => f.id === oldFolderId ? { ...f, chatCount: Math.max(0, f.chatCount - 1) } : f));
      }
    } catch (err) {
      console.error("Failed to remove chat from folder", err);
    }
  }, [sessions]);

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
    folders,
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
    createFolder,
    renameFolder,
    deleteFolder,
    moveChatToFolder,
    removeChatFromFolder,
  };
}
