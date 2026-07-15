import { useState, useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { AuthForm } from '../auth/components/AuthForm';
import { UserProfilePage } from '../auth/components/UserProfilePage';
import { AnalyticsPage } from '../analytics/components/AnalyticsPage';
import { AdminPage } from '../admin/components/AdminPage';
import { Chat, ChatHistory, useChat } from '../chat';

import { AppHeader } from './components/AppHeader';
import { Sidebar } from './components/Sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { BlockedBanner } from './components/BlockedBanner';
import { useLocalStorage } from '../../shared/hooks/useLocalStorage';
import { useTranslation } from 'react-i18next';
import './App.css';

import { Outlet, useOutletContext } from 'react-router-dom';

function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const blocked = !!user?.is_blocked;
  const [selectedCatalogIds, setSelectedCatalogIds] = useState<string[]>([]);
  const chat = useChat(user!.id, selectedCatalogIds, blocked);
  const [isSidebarOpen, setIsSidebarOpen] = useLocalStorage('sidebar:open', false);

  const prevSessionIdRef = useRef(chat.activeSessionId);

  // Sync selected DBs when active session changes
  useEffect(() => {
    const isNewChatCreation = prevSessionIdRef.current === '' && chat.activeSessionId !== '';
    prevSessionIdRef.current = chat.activeSessionId;

    if (chat.activeSession?.catalogIds) {
      if (isNewChatCreation && selectedCatalogIds.length > 0 && chat.activeSession.catalogIds.length === 0) {
        // Prevent wiping selection if the user clicked before chat initialization finished
        return;
      }
      setSelectedCatalogIds(chat.activeSession.catalogIds);
    }
  }, [chat.activeSessionId]);

  return (
    <>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onNewChat={() => {
            chat.startNewChat();
            navigate('/chat');
        }}
      >
        <ChatHistory
          sessions={chat.sessions}
          activeSessionId={chat.activeSessionId}
          onSelectSession={(id) => {
              chat.setActiveSessionId(id);
              navigate('/chat');
          }}
          onNewChat={() => {
              chat.startNewChat();
              navigate('/chat');
          }}
          onRenameChat={chat.renameSession}
          onDeleteChat={chat.removeSession}
          blocked={blocked}
        />
      </Sidebar>
      <div className="app-page">
         {blocked && <BlockedBanner />}
         <Outlet context={{
            chat,
            isSidebarOpen,
            setIsSidebarOpen,
            blocked,
            selectedCatalogIds,
            onCatalogSelectionChange: (ids: string[]) => {
              setSelectedCatalogIds(ids);
              if (chat.activeSessionId) {
                chat.updateSessionCatalogs(chat.activeSessionId, ids);
              }
            },
            catalogDisabled: chat.messages.length > 0 || blocked,
          }} />
      </div>
    </>
  );
}

function ChatPage() {
  const { t } = useTranslation();
  const { chat, isSidebarOpen, setIsSidebarOpen, blocked, selectedCatalogIds, onCatalogSelectionChange, catalogDisabled } = useOutletContext<any>();

  return (
    <>
      <AppHeader
        title={chat.activeSession?.title ?? t('sidebar.chats', { defaultValue: 'Chat' })}
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
          pendingStatus={chat.pendingStatus}
          blocked={blocked}
          selectedCatalogIds={selectedCatalogIds}
          onCatalogSelectionChange={onCatalogSelectionChange}
          catalogDisabled={catalogDisabled}
        />
      </div>
    </>
  );
}

function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <AppHeader
        title={t('sidebar.settings', { defaultValue: 'Profile' })}
        variant="profile"
        onBack={() => navigate('/chat')}
      />
      <div className="app-page__content">
        <UserProfilePage />
      </div>
    </>
  );
}

function AnalyticsPageWrapper() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <>
      <AppHeader
        title={t('analytics.title')}
        variant="profile"
        onBack={() => navigate('/profile')}
      />
      <div className="app-page__content">
        <AnalyticsPage />
      </div>
    </>
  );
}

function AdminPageWrapper() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <>
      <AppHeader
        title={t('sidebar.admin', { defaultValue: 'Admin Panel' })}
        variant="profile"
        onBack={() => navigate('/profile')}
      />
      <div className="app-page__content">
        <AdminPage />
      </div>
    </>
  );
}

export default function App() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const showThemeToggle = isLoading || location.pathname === '/auth';

  if (isLoading) {
    return (
      <div className="app-container">
        {showThemeToggle && <ThemeToggle />}
        <div className="app-loading">{t('common.loading')}</div>
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
        
        <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/auth" replace />}>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/analytics" element={<AnalyticsPageWrapper />} />
          <Route path="/admin" element={<Navigate to="/admin/llm" replace />} />
          <Route path="/admin/llm" element={<AdminPageWrapper />} />
          <Route path="/admin/users" element={<AdminPageWrapper />} />
          <Route path="/admin/databases" element={<AdminPageWrapper />} />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/chat' : '/auth'} replace />}
        />
      </Routes>
    </div>
  );
}
