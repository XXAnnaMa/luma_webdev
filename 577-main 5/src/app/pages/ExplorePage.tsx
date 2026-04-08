import { useEffect, useRef, useState } from 'react';
import { Navbar } from "../components/Navbar";
import { useNavigate } from 'react-router-dom';
import { categories } from '../data/eventsData';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { EventCard } from '../components/EventCard';
import { Search, SlidersHorizontal, Dice5, MapPin, Smartphone, Users } from 'lucide-react';
import { extractEventDateKey, formatEventDateLabel, formatEventTimeLabel } from '../lib/eventDate';
import { ApiError, apiRequest } from '../lib/api';
import { type Event } from '../data/eventsData';

function normalizeDate(value: string) {
  return extractEventDateKey(value);
}

const DEFAULT_DISTANCE_CENTER = { lat: 34.0522, lng: -118.2437 }; // Downtown LA
const SHAKE_MATCH_WINDOW_SECONDS = 15;
const SHAKE_MATCH_ACTIVATE_ENDPOINT = '/api/v1/match/activate';
const SHAKE_MATCH_STATUS_ENDPOINT = '/api/v1/match/status';
const SHAKE_MATCH_CANCEL_ENDPOINT = '/api/v1/match/activate';

interface MatchUser {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
}

interface MatchEventRead {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface ShakeMatchResponse {
  status: 'waiting' | 'matched' | 'timeout';
  expires_in?: number;
  matched_user?: MatchUser | null;
  suggested_event?: MatchEventRead | null;
}

function requestCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not available in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      () => reject(new Error('Unable to get your location. Please allow location access.')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function distanceKmBetween(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return earthRadiusKm * c;
}

export function ExplorePage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeBucket, setSelectedTimeBucket] = useState('All');
  const [distanceKm, setDistanceKm] = useState(25);
  const [useDistanceFilter, setUseDistanceFilter] = useState(false);
  const [distanceCenter, setDistanceCenter] = useState(DEFAULT_DISTANCE_CENTER);
  const [distanceCenterLabel, setDistanceCenterLabel] = useState('Downtown LA');
  const [isLocating, setIsLocating] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [isDiceJoining, setIsDiceJoining] = useState(false);
  const [diceNotice, setDiceNotice] = useState<string | null>(null);
  const [diceCandidate, setDiceCandidate] = useState<Event | null>(null);
  const [isShakeMatching, setIsShakeMatching] = useState(false);
  const [shakeTimeLeft, setShakeTimeLeft] = useState(0);
  const [shakeNotice, setShakeNotice] = useState<string | null>(null);
  const [shakeCandidate, setShakeCandidate] = useState<Event | null>(null);
  const [matchedPartnerName, setMatchedPartnerName] = useState<string | null>(null);
  const [isListeningForShake, setIsListeningForShake] = useState(false);
  const [isRequestingShakePermission, setIsRequestingShakePermission] = useState(false);
  const shakeCooldownRef = useRef(0);
  const shakeLastMagnitudeRef = useRef<number | null>(null);
  const { events, loading, error, fetchEvents, updateEvent } = useEvents();
  const normalizedSelectedDate = normalizeDate(selectedDate);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchEvents({
        search: searchQuery || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        // Date filter is applied client-side to avoid backend date-format mismatch.
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, selectedCategory, fetchEvents]);

  const dateFilteredEvents = normalizedSelectedDate
    ? events.filter((event) => normalizeDate(event.date) === normalizedSelectedDate)
    : events;

  const timeFilteredEvents =
    selectedTimeBucket === 'All'
      ? dateFilteredEvents
      : dateFilteredEvents.filter((event) => {
          const match = event.time.match(/^(\d{2}):(\d{2})$/);
          if (!match) return false;
          const hour = Number(match[1]);
          if (!Number.isFinite(hour)) return false;

          if (selectedTimeBucket === 'Morning') return hour >= 6 && hour < 12;
          if (selectedTimeBucket === 'Afternoon') return hour >= 12 && hour < 17;
          if (selectedTimeBucket === 'Evening') return hour >= 17 && hour < 21;
          if (selectedTimeBucket === 'Night') return hour >= 21 || hour < 6;
          return true;
        });

  const filteredEvents = useDistanceFilter
    ? timeFilteredEvents.filter((event) => {
        const dist = distanceKmBetween(
          distanceCenter.lat,
          distanceCenter.lng,
          event.latitude,
          event.longitude
        );
        return dist <= distanceKm;
      })
    : timeFilteredEvents;

  const handleUseMyLocation = () => {
    setIsLocating(true);
    requestCurrentPosition()
      .then((position) => {
        setDistanceCenter({
          lat: position.lat,
          lng: position.lng,
        });
        setDistanceCenterLabel('My current location');
        setUseDistanceFilter(true);
      })
      .catch((error: unknown) => {
        setDiceNotice(
          error instanceof Error
            ? error.message
            : 'Unable to get your location. Using Downtown LA as distance center.'
        );
      })
      .finally(() => {
        setIsLocating(false);
      });
  };

  const handleRollDice = async () => {
    setDiceNotice(null);
    setDiceCandidate(null);

    if (filteredEvents.length === 0) {
      setDiceNotice('No events match current filters. Adjust filters and try again.');
      return;
    }

    setIsRollingDice(true);
    await new Promise((resolve) => window.setTimeout(resolve, 450));
    const selected = filteredEvents[Math.floor(Math.random() * filteredEvents.length)];
    setDiceCandidate(selected);
    setDiceNotice('Random event selected. Confirm below to join.');
    setIsRollingDice(false);
  };

  const handleConfirmDiceJoin = async () => {
    if (!diceCandidate || isDiceJoining) return;

    if (diceCandidate.currentParticipants >= diceCandidate.participantLimit) {
      setDiceNotice('Selected event is full. Roll again.');
      return;
    }

    setIsDiceJoining(true);
    try {
      await updateEvent(diceCandidate.id, {
        currentParticipants: diceCandidate.currentParticipants + 1,
      });
      setDiceNotice(`Joined "${diceCandidate.title}" successfully.`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setDiceNotice('Join blocked by backend permissions (403).');
      } else if (err instanceof ApiError && err.status === 401) {
        setDiceNotice('Please sign in first.');
      } else {
        setDiceNotice(err instanceof Error ? err.message : 'Failed to join selected event.');
      }
    } finally {
      setIsDiceJoining(false);
    }
  };

  const findSuggestedEvent = (payload: ShakeMatchResponse): Event | null => {
    const preferredId = payload.suggested_event?.id;
    if (!preferredId) return null;

    const exact = filteredEvents.find((event) => event.id === preferredId)
      || events.find((event) => event.id === preferredId);
    return exact || null;
  };

  const applyShakeMatchResult = (payload: ShakeMatchResponse) => {
    const suggestedEvent = findSuggestedEvent(payload);
    const partnerName = payload.matched_user?.full_name || null;

    setMatchedPartnerName(partnerName);
    setShakeCandidate(suggestedEvent);

    if (suggestedEvent && partnerName) {
      setShakeNotice(`Matched with ${partnerName}. We found an event for both of you.`);
      return;
    }

    if (partnerName) {
      setShakeNotice(`Matched with ${partnerName}.`);
      return;
    }

    if (suggestedEvent) {
      setShakeNotice('Matched successfully. We found an event for you.');
      return;
    }

    setShakeNotice('Matched successfully.');
  };

  const handleStartShakeMatch = async (trigger: 'button' | 'shake') => {
    if (isShakeMatching) return;

    setShakeCandidate(null);
    setMatchedPartnerName(null);
    setShakeNotice(null);

    if (authLoading) {
      setShakeNotice('Checking your sign-in status...');
      return;
    }

    if (!isAuthenticated) {
      setShakeNotice('Please sign in first to use Shake to Match.');
      navigate('/login', { state: { from: '/explore' } });
      return;
    }

    try {
      const position = await requestCurrentPosition();
      setDistanceCenter(position);
      setDistanceCenterLabel('My current location');
      setUseDistanceFilter(true);
      setShakeNotice(
        `Matching started by ${trigger === 'shake' ? 'device shake' : 'button'}. Searching nearby users...`
      );
      setIsShakeMatching(true);
      setShakeTimeLeft(SHAKE_MATCH_WINDOW_SECONDS);

      const activation = await apiRequest<ShakeMatchResponse>(SHAKE_MATCH_ACTIVATE_ENDPOINT, {
        method: 'POST',
        body: {
          lat: position.lat,
          lng: position.lng,
        },
      });

      if (activation.status === 'matched') {
        applyShakeMatchResult(activation);
        return;
      }

      if (activation.status === 'timeout') {
        setShakeNotice('No nearby users matched in this window. Try again.');
        return;
      }

      let expiresIn = activation.expires_in ?? SHAKE_MATCH_WINDOW_SECONDS;
      setShakeTimeLeft(expiresIn);

      while (expiresIn > 0) {
        await wait(1000);
        const status = await apiRequest<ShakeMatchResponse>(SHAKE_MATCH_STATUS_ENDPOINT);

        if (status.status === 'matched') {
          applyShakeMatchResult(status);
          return;
        }

        if (status.status === 'timeout') {
          setShakeNotice('No nearby users matched in 15 seconds. Try again.');
          return;
        }

        expiresIn = status.expires_in ?? Math.max(0, expiresIn - 1);
        setShakeTimeLeft(expiresIn);
      }

      setShakeNotice('No nearby users matched in 15 seconds. Try again.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setShakeNotice('Please sign in first to use Shake to Match.');
      } else if (err instanceof ApiError && err.status === 409) {
        setShakeNotice('You are already in the matching pool. Waiting for a nearby user...');
      } else {
        setShakeNotice(
          err instanceof Error ? err.message : 'Failed to start Shake to Match.'
        );
      }
    } finally {
      void apiRequest<Record<string, string>>(SHAKE_MATCH_CANCEL_ENDPOINT, {
        method: 'DELETE',
      }).catch(() => {
        // Ignore cleanup failures; TTL on the backend still protects the pool.
      });
      setShakeTimeLeft(0);
      setIsShakeMatching(false);
    }
  };

  const handleEnableShake = async () => {
    if (isListeningForShake) {
      setIsListeningForShake(false);
      setShakeNotice('Shake sensor stopped.');
      return;
    }

    const motionType = window.DeviceMotionEvent as
      | (typeof DeviceMotionEvent & { requestPermission?: () => Promise<'granted' | 'denied'> })
      | undefined;

    if (!motionType) {
      setShakeNotice('Device motion is not supported on this browser.');
      return;
    }

    if (typeof motionType.requestPermission === 'function') {
      setIsRequestingShakePermission(true);
      try {
        const permission = await motionType.requestPermission();
        if (permission !== 'granted') {
          setShakeNotice('Motion permission denied. You can still use the Match button.');
          return;
        }
      } catch {
        setShakeNotice('Could not request motion permission. Use the Match button instead.');
        return;
      } finally {
        setIsRequestingShakePermission(false);
      }
    }

    setIsListeningForShake(true);
    setShakeNotice('Shake sensor is active. Shake your phone to start matching.');
  };

  useEffect(() => {
    if (!isListeningForShake) return;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (isShakeMatching) return;
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;
      const magnitude = Math.sqrt(x * x + y * y + z * z);

      const previous = shakeLastMagnitudeRef.current;
      shakeLastMagnitudeRef.current = magnitude;
      if (previous === null) return;

      const delta = Math.abs(magnitude - previous);
      const now = Date.now();

      if (delta > 14 && now - shakeCooldownRef.current > 1800) {
        shakeCooldownRef.current = now;
        void handleStartShakeMatch('shake');
      }
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [isListeningForShake, isShakeMatching, authLoading, isAuthenticated, navigate, events, filteredEvents]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5F0' }}>

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        
        {/* Search Bar */}
        <div className="mb-8">
          <div
            className="flex items-center gap-4 px-6 py-4 rounded-full"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
            }}
          >
            <Search size={20} color="#6B6B6B" />

            <input
              type="text"
              placeholder="Search events, locations, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none"
              style={{
                fontSize: '16px',
                color: '#2E1A1A',
                backgroundColor: 'transparent',
                border: 'none',
              }}
            />

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg transition-all"
              style={{
                backgroundColor: showFilters ? '#C2B280' : '#F5F3EE',
                color: showFilters ? '#FFFFFF' : '#2E1A1A',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-8">

          {/* Filter Panel */}
          {showFilters && (
            <aside
              className="w-64 rounded-xl p-6 flex-shrink-0"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                height: 'fit-content',
              }}
            >
              <h3
                className="mb-4"
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#2E1A1A',
                }}
              >
                Filters
              </h3>

              {/* Category Filter */}
              <div className="mb-6">
                <h4
                  className="mb-3"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#6B6B6B',
                  }}
                >
                  Category
                </h4>

                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="w-full text-left px-3 py-2 rounded-lg transition-all"
                      style={{
                        backgroundColor:
                          selectedCategory === category
                            ? 'rgba(194, 178, 128, 0.15)'
                            : 'transparent',
                        color:
                          selectedCategory === category
                            ? '#2E1A1A'
                            : '#6B6B6B',
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight:
                          selectedCategory === category ? 500 : 400,
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Filter Placeholder */}
              <div className="mb-6">
                <h4
                  className="mb-3"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#6B6B6B',
                  }}
                >
                  Date
                </h4>

                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="YYYY-MM-DD"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg outline-none"
                  style={{
                    color: '#2E1A1A',
                    fontSize: '14px',
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#F5F3EE',
                  }}
                />
              </div>

              <div className="mb-6">
                <h4
                  className="mb-3"
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#6B6B6B',
                  }}
                >
                  Time
                </h4>
                <select
                  value={selectedTimeBucket}
                  onChange={(e) => setSelectedTimeBucket(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg outline-none"
                  style={{
                    color: '#2E1A1A',
                    fontSize: '14px',
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#F5F3EE',
                  }}
                >
                  <option value="All">All day</option>
                  <option value="Morning">Morning (06:00-11:59)</option>
                  <option value="Afternoon">Afternoon (12:00-16:59)</option>
                  <option value="Evening">Evening (17:00-20:59)</option>
                  <option value="Night">Night (21:00-05:59)</option>
                </select>
              </div>

              <div className="mb-2">
                <div className="flex items-center justify-between mb-3">
                  <h4
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#6B6B6B',
                    }}
                  >
                    Distance
                  </h4>
                  <button
                    onClick={() => setUseDistanceFilter((prev) => !prev)}
                    className="px-2 py-1 rounded-md"
                    style={{
                      fontSize: '12px',
                      border: '1px solid #E5E2DA',
                      backgroundColor: useDistanceFilter ? 'rgba(194, 178, 128, 0.15)' : '#FFFFFF',
                      color: '#2E1A1A',
                      cursor: 'pointer',
                    }}
                  >
                    {useDistanceFilter ? 'On' : 'Off'}
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={14} color="#6B6B6B" />
                  <p style={{ fontSize: '12px', color: '#6B6B6B' }}>
                    Center: {distanceCenterLabel}
                  </p>
                </div>

                <button
                  onClick={handleUseMyLocation}
                  className="w-full px-3 py-2 rounded-lg mb-3"
                  style={{
                    fontSize: '12px',
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#FFFFFF',
                    color: '#2E1A1A',
                    cursor: isLocating ? 'not-allowed' : 'pointer',
                    opacity: isLocating ? 0.7 : 1,
                  }}
                  disabled={isLocating}
                >
                  {isLocating ? 'Locating...' : 'Use my location'}
                </button>

                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full"
                  disabled={!useDistanceFilter}
                />
                <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '6px' }}>
                  Within {distanceKm} km
                </p>
              </div>
            </aside>
          )}

          {/* Events Grid */}
          <main className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p style={{ fontSize: '16px', color: '#6B6B6B' }}>
                {loading ? 'Loading events...' : error ? error : filteredEvents.length + ' events found'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    void handleRollDice();
                  }}
                  disabled={loading || isRollingDice}
                  className="px-4 py-2 rounded-full flex items-center gap-2 transition-all"
                  style={{
                    backgroundColor: '#2E1A1A',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: loading || isRollingDice ? 'not-allowed' : 'pointer',
                    opacity: loading || isRollingDice ? 0.7 : 1,
                  }}
                >
                  <Dice5 size={16} />
                  {isRollingDice ? 'Rolling...' : 'Roll a Dice'}
                </button>

                <button
                  onClick={() => {
                    void handleStartShakeMatch('button');
                  }}
                  disabled={loading || authLoading || isShakeMatching}
                  className="px-4 py-2 rounded-full flex items-center gap-2 transition-all"
                  style={{
                    backgroundColor: '#C2B280',
                    color: '#2E1A1A',
                    border: 'none',
                    cursor: loading || authLoading || isShakeMatching ? 'not-allowed' : 'pointer',
                    opacity: loading || authLoading || isShakeMatching ? 0.7 : 1,
                    fontWeight: 600,
                  }}
                >
                  <Users size={16} />
                  {isShakeMatching
                    ? `Matching ${shakeTimeLeft}s`
                    : authLoading
                      ? 'Checking...'
                      : 'Shake to Match'}
                </button>

                <button
                  onClick={() => {
                    void handleEnableShake();
                  }}
                  className="px-3 py-2 rounded-full flex items-center gap-2 transition-all"
                  style={{
                    backgroundColor: isListeningForShake ? 'rgba(194, 178, 128, 0.15)' : '#FFFFFF',
                    color: '#2E1A1A',
                    border: '1px solid #E5E2DA',
                    cursor: isRequestingShakePermission ? 'not-allowed' : 'pointer',
                    opacity: isRequestingShakePermission ? 0.7 : 1,
                  }}
                  disabled={isRequestingShakePermission}
                >
                  <Smartphone size={16} />
                  {isRequestingShakePermission
                    ? 'Authorizing...'
                    : isListeningForShake
                      ? 'Sensor On'
                      : 'Enable Shake'}
                </button>
              </div>
            </div>

            {!isAuthenticated && !authLoading && (
              <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '16px' }}>
                Sign in to unlock Shake to Match.
              </p>
            )}

            {(diceNotice || diceCandidate) && (
              <div
                className="mb-6 rounded-xl p-5"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E2DA',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                {diceNotice && (
                  <p style={{ fontSize: '14px', color: '#2E1A1A', marginBottom: diceCandidate ? '12px' : 0 }}>
                    {diceNotice}
                  </p>
                )}
                {diceCandidate && (
                  <>
                    <p style={{ fontSize: '16px', color: '#2E1A1A', fontWeight: 600, marginBottom: '8px' }}>
                      {diceCandidate.title}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '16px' }}>
                      {formatEventDateLabel(diceCandidate.date)} • {formatEventTimeLabel(diceCandidate.time)} • {diceCandidate.category}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/event/${diceCandidate.id}`)}
                        className="px-4 py-2 rounded-full"
                        style={{
                          backgroundColor: '#F5F3EE',
                          color: '#2E1A1A',
                          border: '1px solid #E5E2DA',
                          cursor: 'pointer',
                        }}
                      >
                        View Event
                      </button>
                      <button
                        onClick={() => {
                          void handleConfirmDiceJoin();
                        }}
                        disabled={isDiceJoining}
                        className="px-4 py-2 rounded-full"
                        style={{
                          backgroundColor: '#2E1A1A',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: isDiceJoining ? 'not-allowed' : 'pointer',
                          opacity: isDiceJoining ? 0.7 : 1,
                        }}
                      >
                        {isDiceJoining ? 'Joining...' : 'Confirm Join'}
                      </button>
                      <button
                        onClick={() => {
                          setDiceCandidate(null);
                          setDiceNotice(null);
                        }}
                        className="px-4 py-2 rounded-full"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#2E1A1A',
                          border: '1px solid #E5E2DA',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {(shakeNotice || shakeCandidate || isShakeMatching) && (
              <div
                className="mb-6 rounded-xl p-5"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E2DA',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p style={{ fontSize: '16px', color: '#2E1A1A', fontWeight: 600 }}>
                    Shake to Match
                  </p>
                  {isShakeMatching && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: '#2E1A1A',
                        backgroundColor: 'rgba(194, 178, 128, 0.15)',
                        borderRadius: '9999px',
                        padding: '4px 10px',
                      }}
                    >
                      {shakeTimeLeft}s left
                    </span>
                  )}
                </div>

                {shakeNotice && (
                  <p style={{ fontSize: '14px', color: '#2E1A1A', marginBottom: shakeCandidate ? '12px' : 0 }}>
                    {shakeNotice}
                  </p>
                )}

                {matchedPartnerName && (
                  <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: shakeCandidate ? '12px' : 0 }}>
                    Nearby match: {matchedPartnerName}
                  </p>
                )}

                {shakeCandidate && (
                  <>
                    <p style={{ fontSize: '16px', color: '#2E1A1A', fontWeight: 600, marginBottom: '8px' }}>
                      Suggested event: {shakeCandidate.title}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6B6B6B', marginBottom: '16px' }}>
                      {formatEventDateLabel(shakeCandidate.date)} • {formatEventTimeLabel(shakeCandidate.time)} • {shakeCandidate.category}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/event/${shakeCandidate.id}`)}
                        className="px-4 py-2 rounded-full"
                        style={{
                          backgroundColor: '#2E1A1A',
                          color: '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Open Suggested Event
                      </button>
                      <button
                        onClick={() => {
                          setShakeCandidate(null);
                          setShakeNotice(null);
                          setMatchedPartnerName(null);
                        }}
                        className="px-4 py-2 rounded-full"
                        style={{
                          backgroundColor: 'transparent',
                          color: '#2E1A1A',
                          border: '1px solid #E5E2DA',
                          cursor: 'pointer',
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {filteredEvents.length === 0 ? (
              <div
                className="text-center py-24 rounded-xl"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                <p style={{ fontSize: '18px', color: '#6B6B6B' }}>
                  No events found matching your criteria
                </p>

                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setSelectedDate('');
                    setSelectedTimeBucket('All');
                    setUseDistanceFilter(false);
                    setDistanceKm(25);
                  }}
                  className="mt-4 px-6 py-2 rounded-full"
                  style={{
                    backgroundColor: '#2E1A1A',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onClick={() => navigate(`/event/${event.id}`)}
                  />
                ))}
              </div>
            )}
          </main>

        </div>
      </div>

      {/* Footer Spacer */}
      <div style={{ height: '64px' }} />

    </div>
  );
}
