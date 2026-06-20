import { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { AuthForm } from '../auth/components/AuthForm';
import { Chat, ChatHistory, useChat } from '../chat';
import { CatalogManager } from '../catalog';
import { Sidebar } from './components/Sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import './App.css';

function ChatPage() {
  const chat = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
        <ChatHistory
          sessions={chat.sessions}
          activeSessionId={chat.activeSessionId}
          onSelectSession={chat.setActiveSessionId}
        />
        <CatalogManager />
      </Sidebar>
      <Chat
        {...chat}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />
    </>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const showThemeToggle = isLoading || location.pathname === '/auth';

  if (isLoading) {
    return (
      <div className="app-container">
        {showThemeToggle && <ThemeToggle />}
        <div className="app-loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {showThemeToggle && <ThemeToggle />}
      <Routes>
        <Route
          path="/auth"
          element={isAuthenticated ? <Navigate to="/chat" replace /> : <AuthForm />}
        />
        <Route
          path="/chat"
          element={isAuthenticated ? <ChatPage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/chat' : '/auth'} replace />}
        />
      </Routes>
    </div>
  );
}
