import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../auth';
import { AuthForm } from '../auth/components/AuthForm';
import { Chat } from '../chat';
import './App.css';

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();

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
          element={isAuthenticated ? <Chat /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? '/chat' : '/auth'} replace />}
        />
      </Routes>
    </div>
  );
}
