import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

type NavItem = { label: string; path: string };

const NAV_ITEMS: NavItem[] = [
  { label: 'Explore', path: '/explore' },
  { label: 'Map', path: '/map' },
  { label: 'Bookmarks', path: '/bookmarks' },
  { label: 'Post Event', path: '/post' },
  { label: 'Profile', path: '/profile' },
];

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleAuthClick = async () => {
    if (isAuthenticated) {
      await logout();
      navigate('/');
      return;
    }

    navigate('/login');
  };

  return (
    <nav
      className="w-full px-8 py-6 grid grid-cols-[1fr_auto_1fr] items-center gap-6"
      style={{ backgroundColor: 'transparent' }}
    >
      <h2
        onClick={() => navigate('/')}
        className="justify-self-start"
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#2E1A1A',
          letterSpacing: '-0.01em',
          cursor: 'pointer',
        }}
      >
        LUMA
      </h2>

      <div className="flex items-center justify-center gap-8">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="transition-all"
            style={{
              fontSize: '16px',
              color: isActive(item.path) ? '#C2B280' : '#2E1A1A',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: isActive(item.path) ? 500 : 400,
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) e.currentTarget.style.color = '#C2B280';
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) e.currentTarget.style.color = '#2E1A1A';
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <button
        onClick={() => {
          void handleAuthClick();
        }}
        className="justify-self-end px-6 py-2 rounded-full transition-all"
        style={{
          backgroundColor: 'transparent',
          color: '#2E1A1A',
          fontSize: '16px',
          fontWeight: 500,
          border: '1px solid #E5E2DA',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#FFFFFF';
          e.currentTarget.style.borderColor = '#C2B280';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = '#E5E2DA';
        }}
      >
        {isAuthenticated ? 'Logout' : 'Login'}
      </button>
    </nav>
  );
}
