import { useNavigate } from 'react-router-dom';
import { EventCard } from '../components/EventCard';
import { useBookmarks } from '../context/BookmarkContext';
import { useEvents } from '../context/EventsContext';
import { Bookmark } from 'lucide-react';
import { Navbar } from '../components/Navbar';

export function BookmarksPage() {
  const navigate = useNavigate();
  const { bookmarkedEventIds } = useBookmarks();
  const { events } = useEvents();

  // Filter events to only show bookmarked ones
  const bookmarkedEvents = events.filter((event) =>
    bookmarkedEventIds.has(event.id)
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5F0' }}>
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="p-3 rounded-xl"
              style={{
                backgroundColor: '#C2B280',
                color: '#FFFFFF',
              }}
            >
              <Bookmark size={28} fill="#FFFFFF" />
            </div>
            <h1
              style={{
                fontSize: '40px',
                fontWeight: 600,
                color: '#2E1A1A',
              }}
            >
              My Bookmarks
            </h1>
          </div>
          <p
            style={{
              fontSize: '18px',
              color: '#6B6B6B',
              lineHeight: 1.6,
            }}
          >
            {bookmarkedEvents.length === 0
              ? 'You haven\'t bookmarked any events yet. Explore events and save your favorites!'
              : `You have ${bookmarkedEvents.length} bookmarked event${bookmarkedEvents.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Bookmarked Events Grid */}
        {bookmarkedEvents.length === 0 ? (
          <div
            className="text-center py-24 rounded-xl"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
            }}
          >
            <div
              className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(194, 178, 128, 0.15)',
              }}
            >
              <Bookmark size={40} color="#C2B280" />
            </div>
            <h3
              className="mb-3"
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#2E1A1A',
              }}
            >
              No bookmarks yet
            </h3>
            <p
              className="mb-6"
              style={{
                fontSize: '16px',
                color: '#6B6B6B',
                maxWidth: '400px',
                margin: '0 auto 24px',
              }}
            >
              Start exploring events and bookmark your favorites to see them here
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="px-8 py-3 rounded-full transition-all duration-200"
              style={{
                backgroundColor: '#2E1A1A',
                color: '#FFFFFF',
                fontSize: '16px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(46, 26, 26, 0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 26, 26, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 26, 26, 0.2)';
              }}
            >
              Explore Events
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarkedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => navigate(`/event/${event.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Spacer */}
      <div style={{ height: '64px' }} />
    </div>
  );
}
