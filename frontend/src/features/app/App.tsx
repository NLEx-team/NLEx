import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { AuthForm } from '../auth/components/AuthForm';
import { UserProfilePage } from '../auth/components/UserProfilePage';
import { Chat, ChatHistory, useChat } from '../chat';
import { CatalogManager } from '../catalog';
import { AppHeader } from './components/AppHeader';
import { Sidebar } from './components/Sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import './App.css';

function ChatPage() {
  const chat = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      <div className="app-page">
        <AppHeader
          title={chat.activeSession?.title ?? 'Chat'}
          variant="chat"
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
        />
        <div className="app-page__content">
          <Chat
            messages={chat.messages}
            inputValue={chat.inputValue}
            setInputValue={chat.setInputValue}
            handleSendMessage={chat.handleSendMessage}
            handleClarification={chat.handleClarification}
            pending={chat.pending}
          />
        </div>
      </div>
    </>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
        <ChatHistory
          sessions={[]}
          activeSessionId=""
          onSelectSession={() => navigate('/chat')}
        />
        <CatalogManager />
      </Sidebar>
      <div className="app-page">
        <AppHeader
          title="Profile"
          variant="profile"
          onBack={() => navigate('/chat')}
        />
        <div className="app-page__content">
          <UserProfilePage />
        </div>
      </div>
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
          path="/profile"
          element={isAuthenticated ? <ProfilePage /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/chat' : '/auth'} replace />}
        />
      </Routes>
    </div>
  );
}
