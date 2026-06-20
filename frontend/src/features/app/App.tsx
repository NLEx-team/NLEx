import { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth';
import { AuthForm } from '../auth/components/AuthForm';
import { Chat, ChatHistory, useChat } from '../chat';
import { Sidebar } from './components/Sidebar';
import './App.css';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const chat = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="app-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Routes>
        <Route
          path="/auth"
          element={isAuthenticated ? <Navigate to="/chat" replace /> : <AuthForm />}
        />
        <Route
          path="/chat"
          element={isAuthenticated ? (
            <>
              <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
                <ChatHistory
                  sessions={chat.sessions}
                  activeSessionId={chat.activeSessionId}
                  onSelectSession={chat.setActiveSessionId}
                />
              </Sidebar>
              <Chat
                {...chat}
                onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
              />
            </>
          ) : <Navigate to="/auth" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/chat' : '/auth'} replace />}
        />
      </Routes>
    </div>
  );
}
