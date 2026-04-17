import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DocumentEditorPage from './pages/DocumentEditorPage';
import PublicSharePage from './pages/PublicSharePage';
import { ensureSession } from './lib/apiClient';

function AppBootLoading() {
  return (
    <main className="bn-page">
      <div className="bn-stage" style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.95rem', color: '#6b7280' }}>Restoring session...</p>
      </div>
    </main>
  );
}

function RequireAuth({ isAuthed, children }) {
  if (!isAuthed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function RedirectIfAuthed({ isAuthed, children }) {
  if (isAuthed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const [authBootChecked, setAuthBootChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  function handleAuthSuccess() {
    setIsAuthed(true);
  }

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const ok = await ensureSession();
        if (!active) return;
        setIsAuthed(ok);
      } finally {
        if (active) setAuthBootChecked(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (!authBootChecked) {
    return <AppBootLoading />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={(
          <RedirectIfAuthed isAuthed={isAuthed}>
            <LoginPage onAuthSuccess={handleAuthSuccess} />
          </RedirectIfAuthed>
        )}
      />
      <Route
        path="/register"
        element={(
          <RedirectIfAuthed isAuthed={isAuthed}>
            <RegisterPage onAuthSuccess={handleAuthSuccess} />
          </RedirectIfAuthed>
        )}
      />
      <Route
        path="/dashboard"
        element={(
          <RequireAuth isAuthed={isAuthed}>
            <DashboardPage />
          </RequireAuth>
        )}
      />
      <Route
        path="/dashboard/:documentId"
        element={(
          <RequireAuth isAuthed={isAuthed}>
            <DocumentEditorPage />
          </RequireAuth>
        )}
      />
      <Route path="/share/:token" element={<PublicSharePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
