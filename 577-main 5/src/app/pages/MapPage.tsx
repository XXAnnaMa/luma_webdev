import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { EventMap } from '../components/EventMap';
import { EventCard } from '../components/EventCard';
import { categories, type Event } from '../data/eventsData';
import { getUserCheckinHistory } from '../lib/eventCheckin';
import { X } from 'lucide-react';
import { Navbar } from '../components/Navbar';

type MapMode = 'events' | 'footprint';
type FootprintTimeFilter = 'all' | '7d' | '30d' | '90d';

interface FootprintPoint {
  id: string;
  eventId: string;
  title: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  checkedInAt: string;
}

const LA_CENTER: [number, number] = [34.0522, -118.2437];

function isValidCoordinate(value: number): boolean {
  return Number.isFinite(value);
}

function mapPointToEvent(point: FootprintPoint): Event {
  const checkedDate = new Date(point.checkedInAt);
  const isoDate = Number.isNaN(checkedDate.getTime())
    ? '2026-01-01'
    : checkedDate.toISOString().slice(0, 10);
  const hh = Number.isNaN(checkedDate.getTime())
    ? '00'
    : String(checkedDate.getHours()).padStart(2, '0');
  const mm = Number.isNaN(checkedDate.getTime())
    ? '00'
    : String(checkedDate.getMinutes()).padStart(2, '0');

  return {
    id: point.id,
    title: point.title,
    description: `Checked in at ${new Date(point.checkedInAt).toLocaleString('en-US')}`,
    address: point.address,
    latitude: point.latitude,
    longitude: point.longitude,
    date: isoDate,
    time: `${hh}:${mm}`,
    category: point.category,
    participantLimit: 1,
    currentParticipants: 1,
    image: '',
    organizerName: 'My activity',
    organizerEmail: '',
    tags: ['Checked-in'],
  };
}

export function MapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mapMode, setMapMode] = useState<MapMode>('events');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedFootprintId, setSelectedFootprintId] = useState<string | null>(null);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [footprintCategory, setFootprintCategory] = useState('All');
  const [footprintTimeFilter, setFootprintTimeFilter] = useState<FootprintTimeFilter>('all');
  const { events, loading, error, fetchEvents } = useEvents();

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const selectedEvent = selectedEventId ? events.find((e) => e.id === selectedEventId) : null;

  const footprintPoints = useMemo<FootprintPoint[]>(() => {
    if (!user) return [];

    const history = getUserCheckinHistory(user.id);
    const points = history
      .map((item) => {
        const eventFromList = events.find((event) => event.id === item.eventId);
        const snapshot = item.eventSnapshot;

        const latitude = snapshot?.latitude ?? eventFromList?.latitude;
        const longitude = snapshot?.longitude ?? eventFromList?.longitude;
        if (latitude === undefined || longitude === undefined) return null;
        if (!isValidCoordinate(latitude) || !isValidCoordinate(longitude)) return null;

        const title = snapshot?.title || eventFromList?.title || 'Visited Event';
        const category = snapshot?.category || eventFromList?.category || 'Social';
        const address = snapshot?.address || eventFromList?.address || 'Location unavailable';

        return {
          id: `${item.eventId}:${item.checkedInAt}`,
          eventId: item.eventId,
          title,
          category,
          address,
          latitude,
          longitude,
          checkedInAt: item.checkedInAt,
        };
      })
      .filter((point): point is FootprintPoint => point !== null);

    return points.sort((a, b) => b.checkedInAt.localeCompare(a.checkedInAt));
  }, [events, user]);

  const filteredFootprintPoints = useMemo(() => {
    const now = Date.now();
    return footprintPoints.filter((point) => {
      if (footprintCategory !== 'All' && point.category !== footprintCategory) return false;

      if (footprintTimeFilter === 'all') return true;
      const checkedAt = new Date(point.checkedInAt).getTime();
      if (Number.isNaN(checkedAt)) return false;

      const maxAgeDays = footprintTimeFilter === '7d' ? 7 : footprintTimeFilter === '30d' ? 30 : 90;
      return now - checkedAt <= maxAgeDays * 24 * 60 * 60 * 1000;
    });
  }, [footprintCategory, footprintPoints, footprintTimeFilter]);

  const footprintEvents = useMemo(
    () => filteredFootprintPoints.map(mapPointToEvent),
    [filteredFootprintPoints]
  );

  const selectedFootprint = selectedFootprintId
    ? filteredFootprintPoints.find((point) => point.id === selectedFootprintId) || null
    : null;

  const mapCenter: [number, number] =
    mapMode === 'footprint' && filteredFootprintPoints.length > 0
      ? [filteredFootprintPoints[0].latitude, filteredFootprintPoints[0].longitude]
      : LA_CENTER;

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F7F5F0' }}>
      <Navbar />

      <div className="px-8 pt-6 pb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setMapMode('events');
              setSelectedFootprintId(null);
            }}
            className="px-4 py-2 rounded-full"
            style={{
              border: '1px solid #E5E2DA',
              backgroundColor: mapMode === 'events' ? '#2E1A1A' : '#FFFFFF',
              color: mapMode === 'events' ? '#FFFFFF' : '#2E1A1A',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Event Map
          </button>
          <button
            onClick={() => {
              setMapMode('footprint');
              setSelectedEventId(null);
            }}
            className="px-4 py-2 rounded-full"
            style={{
              border: '1px solid #E5E2DA',
              backgroundColor: mapMode === 'footprint' ? '#2E1A1A' : '#FFFFFF',
              color: mapMode === 'footprint' ? '#FFFFFF' : '#2E1A1A',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            My Footprint
          </button>
        </div>

        {mapMode === 'footprint' && (
          <div className="flex items-center gap-2">
            <select
              value={footprintCategory}
              onChange={(e) => setFootprintCategory(e.target.value)}
              className="px-3 py-2 rounded-lg outline-none"
              style={{
                border: '1px solid #E5E2DA',
                backgroundColor: '#FFFFFF',
                color: '#2E1A1A',
                fontSize: '14px',
              }}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={footprintTimeFilter}
              onChange={(e) => setFootprintTimeFilter(e.target.value as FootprintTimeFilter)}
              className="px-3 py-2 rounded-lg outline-none"
              style={{
                border: '1px solid #E5E2DA',
                backgroundColor: '#FFFFFF',
                color: '#2E1A1A',
                fontSize: '14px',
              }}
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        )}
      </div>

      <div className="px-8 pb-3">
        <p style={{ fontSize: '14px', color: '#6B6B6B' }}>
          {mapMode === 'events'
            ? 'Browse all available events on map.'
            : user
              ? `${filteredFootprintPoints.length} visited location(s) shown.`
              : 'Sign in to see your personal activity footprint.'}
        </p>
      </div>

      <div className="flex-1 relative">
        {error ? (
          <div className="h-full flex items-center justify-center" style={{ color: '#8A2B2B' }}>
            {error}
          </div>
        ) : loading ? (
          <div className="h-full flex items-center justify-center" style={{ color: '#6B6B6B' }}>
            Loading map...
          </div>
        ) : mapMode === 'footprint' && !user ? (
          <div className="h-full flex items-center justify-center">
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)' }}
            >
              <p style={{ fontSize: '16px', color: '#2E1A1A', marginBottom: '12px' }}>
                Please sign in to view your footprint map.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="px-5 py-2 rounded-full"
                style={{ backgroundColor: '#2E1A1A', color: '#FFFFFF', border: 'none' }}
              >
                Go to Login
              </button>
            </div>
          </div>
        ) : mapMode === 'footprint' && filteredFootprintPoints.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)' }}
            >
              <p style={{ fontSize: '16px', color: '#2E1A1A' }}>
                No check-in footprint matches your current filters.
              </p>
            </div>
          </div>
        ) : (
          <EventMap
            events={mapMode === 'events' ? events : footprintEvents}
            onMarkerClick={(id) => {
              if (mapMode === 'events') setSelectedEventId(id);
              else setSelectedFootprintId(id);
            }}
            onMarkerHover={setHoveredEventId}
            hoveredEventId={hoveredEventId}
            center={mapCenter}
            zoom={12}
          />
        )}

        {mapMode === 'events' && selectedEvent && (
          <div
            className="absolute top-4 right-4 w-96 rounded-xl overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 12px 48px rgba(46, 26, 26, 0.15)',
              maxHeight: 'calc(100% - 32px)',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={() => setSelectedEventId(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full transition-all"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#2E1A1A',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(46, 26, 26, 0.1)',
              }}
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <EventCard event={selectedEvent} onClick={() => navigate(`/event/${selectedEvent.id}`)} />
              <button
                onClick={() => navigate(`/event/${selectedEvent.id}`)}
                className="w-full mt-4 px-6 py-3 rounded-full transition-all"
                style={{
                  backgroundColor: '#2E1A1A',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                View Full Details
              </button>
            </div>
          </div>
        )}

        {mapMode === 'footprint' && selectedFootprint && (
          <div
            className="absolute top-4 right-4 w-96 rounded-xl overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 12px 48px rgba(46, 26, 26, 0.15)',
              maxHeight: 'calc(100% - 32px)',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={() => setSelectedFootprintId(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                color: '#2E1A1A',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <div className="p-6">
              <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '8px' }}>Activity footprint</p>
              <h3 style={{ fontSize: '24px', color: '#2E1A1A', fontWeight: 600, marginBottom: '10px' }}>
                {selectedFootprint.title}
              </h3>
              <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '10px' }}>
                {selectedFootprint.category}
              </p>
              <p style={{ fontSize: '15px', color: '#2E1A1A', marginBottom: '8px' }}>
                {selectedFootprint.address}
              </p>
              <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '14px' }}>
                Checked in at {new Date(selectedFootprint.checkedInAt).toLocaleString('en-US')}
              </p>
              <button
                onClick={() => navigate(`/event/${selectedFootprint.eventId}`)}
                className="w-full px-6 py-3 rounded-full"
                style={{
                  backgroundColor: '#2E1A1A',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 500,
                }}
              >
                Open Event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
