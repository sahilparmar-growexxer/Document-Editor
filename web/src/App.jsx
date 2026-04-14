import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import DocumentEditorPage from './pages/DocumentEditorPage';
import PublicSharePage from './pages/PublicSharePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/:documentId" element={<DocumentEditorPage />} />
      <Route path="/share/:token" element={<PublicSharePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
