import { BookmarkProvider } from './context/BookmarkContext';
import { AuthProvider } from './context/AuthContext';
import { EventsProvider } from './context/EventsContext';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { MapPage } from './pages/MapPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { LoginPage } from './pages/LoginPage';
import { PostEventPage } from './pages/PostEventPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { AIChatbot } from './components/AIChatbot';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#F7F5F0', color: '#6B6B6B' }}
      >
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}


export default function App() {
  return (
    <AuthProvider>
      <EventsProvider>
        <BookmarkProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/post" element={<ProtectedRoute><PostEventPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Global AI Chatbot */}
        <AIChatbot />
      </BrowserRouter>
        </BookmarkProvider>
      </EventsProvider>
    </AuthProvider>
  );
}
