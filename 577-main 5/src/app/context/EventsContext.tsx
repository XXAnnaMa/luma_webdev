import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { mockEvents, type Event } from '../data/eventsData';
import { apiRequest } from '../lib/api';
import { getLocalEventImage } from '../lib/localEventImage';
import { isValidEventTime } from '../lib/eventDate';

interface EventRead {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  date: string;
  time: string;
  address: string;
  location?: {
    lat: number;
    lng: number;
  };
  participantLimit: number;
  currentParticipants: number;
  tags: string[];
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string | null;
  userId: number;
}

interface EventListResponse {
  events: EventRead[];
  total: number;
}

interface EventResponse {
  event: EventRead;
}

interface ListEventsParams {
  category?: string;
  date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

interface CreateEventInput {
  title: string;
  description: string;
  image?: string;
  category: string;
  date: string;
  time: string;
  address: string;
  participantLimit: number;
  tags: string[];
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

type UpdateEventInput = Partial<
  CreateEventInput & {
    currentParticipants: number;
  }
>;

interface EventsContextType {
  events: Event[];
  total: number;
  loading: boolean;
  error: string | null;
  fetchEvents: (params?: ListEventsParams) => Promise<void>;
  getEventById: (id: string) => Promise<Event | null>;
  createEvent: (input: CreateEventInput) => Promise<Event>;
  updateEvent: (id: string, input: UpdateEventInput) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);
const DEFAULT_LOCATION = { lat: 34.0522, lng: -118.2437 };

function cleanText(value: string | null | undefined, fallback = '') {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (trimmed.toLowerCase() === 'string') return fallback;
  return trimmed;
}

function normalizeEvent(raw: EventRead): Event {
  const safeLocation =
    raw.location &&
    Number.isFinite(raw.location.lat) &&
    Number.isFinite(raw.location.lng)
      ? raw.location
      : DEFAULT_LOCATION;

  const localImage = getLocalEventImage(raw.id);

  return {
    id: raw.id,
    title: cleanText(raw.title, 'Untitled Event'),
    description: cleanText(raw.description),
    image: cleanText(raw.image) || localImage || '',
    category: cleanText(raw.category, 'Social'),
    date: cleanText(raw.date),
    time: cleanText(raw.time),
    address: cleanText(raw.address),
    latitude: safeLocation.lat,
    longitude: safeLocation.lng,
    participantLimit: raw.participantLimit,
    currentParticipants: raw.currentParticipants,
    tags: (raw.tags ?? []).map((tag) => cleanText(tag)).filter(Boolean),
    organizerName: cleanText(raw.organizerName, 'Organizer TBD'),
    organizerEmail: cleanText(raw.organizerEmail),
    organizerPhone: cleanText(raw.organizerPhone ?? undefined) || undefined,
    userId: raw.userId,
  };
}

function shouldHideEvent(event: Event): boolean {
  const emptyAddress = !event.address.trim();
  const emptyDescription = !event.description.trim();
  const emptyOrganizer = !event.organizerName.trim() || event.organizerName === 'Organizer TBD';
  const badTime = !isValidEventTime(event.time);
  const placeholderTitle = event.title === 'Untitled Event';
  const badDate = !event.date.trim() || event.date.length < 10;

  // Hide obvious placeholder/seed garbage records from backend.
  return placeholderTitle && emptyAddress && emptyDescription && emptyOrganizer && (badTime || badDate);
}

function buildEventsQuery(params: ListEventsParams = {}) {
  const query = new URLSearchParams();

  if (params.category && params.category !== 'All') query.set('category', params.category);
  if (params.date) query.set('date', params.date);
  if (params.search) query.set('search', params.search);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));

  const queryText = query.toString();
  return queryText ? `?${queryText}` : '';
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async (params?: ListEventsParams) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<EventListResponse>(`/api/v1/events${buildEventsQuery(params)}`);
      const normalized = data.events.map(normalizeEvent).filter((event) => !shouldHideEvent(event));
      setEvents(normalized);
      setTotal(normalized.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch events.';
      // Keep UI usable when backend is unstable (e.g., temporary 500 on list endpoint).
      setEvents(mockEvents);
      setTotal(mockEvents.length);
      setError(`Backend unavailable: ${message}. Showing fallback events.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents]);

  const getEventById = useCallback(async (id: string): Promise<Event | null> => {
    const existing = events.find((event) => event.id === id);
    if (existing) return existing;

    try {
      const data = await apiRequest<EventResponse>(`/api/v1/events/${id}`);
      const normalized = normalizeEvent(data.event);
      if (shouldHideEvent(normalized)) return null;
      setEvents((prev) => {
        if (prev.some((item) => item.id === normalized.id)) return prev;
        return [normalized, ...prev];
      });
      return normalized;
    } catch (err) {
      console.error('Failed to fetch event detail:', err);
      return null;
    }
  }, [events]);

  const createEvent = useCallback(async (input: CreateEventInput) => {
    const payload = {
      title: input.title,
      description: input.description,
      image: input.image ?? '',
      category: input.category,
      date: input.date,
      time: input.time,
      address: input.address,
      participantLimit: input.participantLimit,
      tags: input.tags,
      organizerName: input.organizerName,
      organizerEmail: input.organizerEmail,
      organizerPhone: input.organizerPhone || null,
      location: input.location ?? DEFAULT_LOCATION,
    };

    const data = await apiRequest<EventResponse>('/api/v1/events', {
      method: 'POST',
      body: payload,
    });

    const normalized = normalizeEvent(data.event);
    setEvents((prev) => [normalized, ...prev]);
    setTotal((prev) => prev + 1);
    return normalized;
  }, []);

  const updateEvent = useCallback(
    async (id: string, input: UpdateEventInput) => {
      const payload = {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.image !== undefined ? { image: input.image } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.date !== undefined ? { date: input.date } : {}),
        ...(input.time !== undefined ? { time: input.time } : {}),
        ...(input.address !== undefined ? { address: input.address } : {}),
        ...(input.participantLimit !== undefined
          ? { participantLimit: input.participantLimit }
          : {}),
        ...(input.currentParticipants !== undefined
          ? { currentParticipants: input.currentParticipants }
          : {}),
        ...(input.tags !== undefined ? { tags: input.tags } : {}),
        ...(input.organizerName !== undefined ? { organizerName: input.organizerName } : {}),
        ...(input.organizerEmail !== undefined ? { organizerEmail: input.organizerEmail } : {}),
        ...(input.organizerPhone !== undefined
          ? { organizerPhone: input.organizerPhone || null }
          : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
      };

      const data = await apiRequest<EventResponse>(`/api/v1/events/${id}`, {
        method: 'PUT',
        body: payload,
      });

      const normalized = normalizeEvent(data.event);
      setEvents((prev) => prev.map((event) => (event.id === id ? normalized : event)));
      return normalized;
    },
    []
  );

  const deleteEvent = useCallback(async (id: string) => {
    await apiRequest<{ success: boolean }>(`/api/v1/events/${id}`, {
      method: 'DELETE',
    });

    setEvents((prev) => prev.filter((event) => event.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
  }, []);

  const value = useMemo(
    () => ({
      events,
      total,
      loading,
      error,
      fetchEvents,
      getEventById,
      createEvent,
      updateEvent,
      deleteEvent,
    }),
    [events, total, loading, error, fetchEvents, getEventById, createEvent, updateEvent, deleteEvent]
  );

  return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) throw new Error('useEvents must be used within EventsProvider');
  return context;
}
