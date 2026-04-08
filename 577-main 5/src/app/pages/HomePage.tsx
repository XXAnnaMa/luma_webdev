import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventCard } from '../components/EventCard';
import { EventMap } from '../components/EventMap';
import { ArrowRight } from 'lucide-react';
import { useEvents } from '../context/EventsContext';
import { Navbar } from '../components/Navbar';

export function HomePage() {
  const navigate = useNavigate();
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const { events, loading, error } = useEvents();

  // Show only first 6 events on homepage
  const featuredEvents = events.slice(0, 6);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5F0' }}>
      {/* Navigation */}
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 py-24 text-center">
        <h1
          className="mb-6"
          style={{
            fontSize: '48px',
            fontWeight: 600,
            lineHeight: 1.2,
            color: '#2E1A1A',
            letterSpacing: '-0.02em',
          }}
        >
          Discover Moments. Join Experiences.
        </h1>

        <p
          className="mb-12 max-w-2xl mx-auto"
          style={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: '#6B6B6B',
            letterSpacing: '0.01em',
          }}
        >
          Find and share events around you.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => navigate('/explore')}
            className="px-8 py-4 rounded-full transition-all duration-200 flex items-center gap-2"
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
            <ArrowRight size={20} />
          </button>

          <button
            onClick={() => navigate('/post')}
            className="px-8 py-4 rounded-full transition-all duration-200"
            style={{
              backgroundColor: 'transparent',
              color: '#2E1A1A',
              fontSize: '16px',
              fontWeight: 500,
              border: '2px solid #2E1A1A',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2E1A1A';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#2E1A1A';
            }}
          >
            Post Event
          </button>
        </div>
      </section>

      {/* Map Section */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <h2
          className="mb-8 text-center"
          style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#2E1A1A',
          }}
        >
          Events Near You
        </h2>

        {error && (
          <div
            className="rounded-xl p-4 text-center mb-4"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 8px 24px rgba(46, 26, 26, 0.08)',
              color: '#8A2B2B',
            }}
          >
            {error}
          </div>
        )}

        <div
          className="rounded-xl overflow-hidden"
          style={{
            boxShadow: '0 8px 24px rgba(46, 26, 26, 0.08)',
          }}
        >
          <EventMap
            events={events}
            onMarkerClick={(id) => navigate(`/event/${id}`)}
            onMarkerHover={setHoveredEventId}
            hoveredEventId={hoveredEventId}
            center={[34.0522, -118.2437]}
            zoom={11}
          />
        </div>
      </section>

      {/* Featured Events Grid */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: '#2E1A1A',
            }}
          >
            Featured Events
          </h2>
          <button
            onClick={() => navigate('/explore')}
            className="flex items-center gap-2 transition-all"
            style={{
              fontSize: '16px',
              color: '#C2B280',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#2E1A1A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#C2B280';
            }}
          >
            View all events
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            <p style={{ color: '#6B6B6B' }}>Loading events...</p>
          ) : featuredEvents.length === 0 ? (
            <p style={{ color: '#6B6B6B' }}>No events yet.</p>
          ) : (
            featuredEvents.map((event) => (
              <div
                key={event.id}
                onMouseEnter={() => setHoveredEventId(event.id)}
                onMouseLeave={() => setHoveredEventId(null)}
              >
                <EventCard
                  event={event}
                  onClick={() => navigate(`/event/${event.id}`)}
                />
              </div>
            ))
          )}
        </div>
      </section>

      {/* Footer Spacer */}
      <div style={{ height: '64px' }} />
    </div>
  );
}
