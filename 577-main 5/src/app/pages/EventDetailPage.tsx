import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { categories } from '../data/eventsData';
import { ApiError } from '../lib/api';
import { ArrowLeft, Calendar, MapPin, Users, Mail, Phone, Share2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  formatEventDateLabel,
  formatEventTimeLabel,
  isValidEventDate,
  isValidEventTime,
} from '../lib/eventDate';
import {
  getEventCheckins,
  getOrCreateEventCheckinCode,
  hasUserCheckedIn,
  recordEventCheckin,
  verifyEventCheckinCode,
  type EventCheckinRecord,
} from '../lib/eventCheckin';
import { awardBadgesForUser, CHECKIN_POINTS_PER_EVENT, computeBadgeStats } from '../lib/badges';

function formatEventDate(date: string) {
  return formatEventDateLabel(date, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function splitAddress(address: string) {
  if (!address) return { primary: 'Location TBD', secondary: '' };
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  return {
    primary: parts[0] || 'Location TBD',
    secondary: parts.slice(1).join(', '),
  };
}

export function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, getEventById, registerEvent, unregisterEvent, updateEvent, deleteEvent } = useEvents();
  const { user } = useAuth();

  const [event, setEvent] = useState(events.find((e) => e.id === id) || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkinCodeInput, setCheckinCodeInput] = useState('');
  const [eventCheckinCode, setEventCheckinCode] = useState('');
  const [checkinRecords, setCheckinRecords] = useState<EventCheckinRecord[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);
  const [checkinNotice, setCheckinNotice] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    time: '',
    address: '',
    participantLimit: '',
    image: '',
    tags: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
  });

  useEffect(() => {
    let mounted = true;
    if (!id) return;

    const local = events.find((e) => e.id === id);
    if (local) {
      setEvent(local);
      return;
    }

    void getEventById(id).then((fetched) => {
      if (mounted) setEvent(fetched);
    });

    return () => {
      mounted = false;
    };
  }, [id, events, getEventById]);

  useEffect(() => {
    if (!event) return;
    setEditForm({
      title: event.title,
      description: event.description,
      category: event.category,
      date: event.date,
      time: event.time,
      address: event.address,
      participantLimit: String(event.participantLimit),
      image: event.image || '',
      tags: event.tags.join(', '),
      organizerName: event.organizerName,
      organizerEmail: event.organizerEmail,
      organizerPhone: event.organizerPhone || '',
    });
  }, [event]);

  useEffect(() => {
    if (!event) {
      setIsCheckedIn(false);
      return;
    }

    setEventCheckinCode(getOrCreateEventCheckinCode(event.id));
    setCheckinRecords(getEventCheckins(event.id));

    if (!user) {
      setIsCheckedIn(false);
      return;
    }

    setIsCheckedIn(hasUserCheckedIn(event.id, user.id));
  }, [event, user]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F5F0' }}>
        <div className="text-center">
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#2E1A1A', marginBottom: '8px' }}>
            Event not found
          </h2>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-2 rounded-full mt-4"
            style={{
              backgroundColor: '#2E1A1A',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Back to events
          </button>
        </div>
      </div>
    );
  }

  const spotsLeft = event.participantLimit - event.currentParticipants;
  const isOwner = Boolean(user && event.userId === user.id);
  const isRegistered = Boolean(event.isRegistered);
  const isFull = event.currentParticipants >= event.participantLimit;
  const categoryOptions = categories.filter((item) => item !== 'All');
  const displayDate = formatEventDate(event.date);
  const displayTime = formatEventTimeLabel(event.time);
  const addressParts = splitAddress(event.address);

  const handleEditFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (!isValidEventTime(editForm.time)) {
      setActionError('Time must be a valid 24-hour value (00:00 to 23:59).');
      return;
    }
    if (!isValidEventDate(editForm.date)) {
      setActionError('Date must be in YYYY-MM-DD format.');
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      const updated = await updateEvent(id, {
        title: editForm.title,
        description: editForm.description,
        category: editForm.category,
        date: editForm.date,
        time: editForm.time,
        address: editForm.address,
        participantLimit: Number(editForm.participantLimit),
        image: editForm.image,
        tags: editForm.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 10),
        organizerName: editForm.organizerName,
        organizerEmail: editForm.organizerEmail,
        organizerPhone: editForm.organizerPhone || undefined,
      });

      setEvent(updated);
      setIsEditing(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to update event.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm('Delete this event permanently?');
    if (!confirmed) return;

    setIsDeleting(true);
    setActionError(null);

    try {
      await deleteEvent(id);
      navigate('/explore');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to delete event.');
      setIsDeleting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!id) return;
    const eventUrl = `${window.location.origin}/event/${id}`;
    try {
      await navigator.clipboard.writeText(eventUrl);
      setShareNotice('Link copied.');
    } catch {
      setShareNotice('Unable to copy link on this browser.');
    }
  };

  const attemptJoinEvent = async () => {
    if (isJoining || !event) return;
    setIsJoining(true);
    try {
      const updated = await registerEvent(event.id);
      setEvent(updated);
      setJoinNotice('Joined successfully.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setJoinNotice(error.message);
      } else if (error instanceof ApiError && error.status === 401) {
        setJoinNotice('Please sign in first.');
      } else if (error instanceof ApiError && error.status === 400) {
        setJoinNotice(error.message);
      } else {
        setJoinNotice(error instanceof Error ? error.message : 'Failed to join event.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const attemptCancelJoinEvent = async () => {
    if (isJoining || !event) return;
    setIsJoining(true);
    try {
      const updated = await unregisterEvent(event.id);
      setEvent(updated);
      setJoinNotice('Join canceled.');
    } catch (error) {
      if (error instanceof ApiError && (error.status === 409 || error.status === 400)) {
        setJoinNotice(error.message);
      } else if (error instanceof ApiError && error.status === 401) {
        setJoinNotice('Please sign in first.');
      } else {
        setJoinNotice(error instanceof Error ? error.message : 'Failed to cancel join.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinEvent = async () => {
    if (isJoining) return;
    setActionError(null);

    if (!user) {
      navigate('/login');
      return;
    }
    if (isOwner) {
      setJoinNotice('You are the organizer of this event.');
      return;
    }
    if (isFull) {
      setJoinNotice('This event is full.');
      return;
    }

    await attemptJoinEvent();
  };

  const handleCancelJoin = async () => {
    if (isJoining) return;
    setActionError(null);

    if (!user) {
      navigate('/login');
      return;
    }
    if (isOwner) {
      setJoinNotice('You are the organizer of this event.');
      return;
    }

    await attemptCancelJoinEvent();
  };

  const handleEventCheckin = async () => {
    if (isCheckingIn) return;
    setCheckinNotice(null);

    if (!user) {
      navigate('/login');
      return;
    }

    if (isOwner) {
      setCheckinNotice('Organizer does not need attendee check-in.');
      return;
    }

    if (!event) return;

    if (isCheckedIn) {
      setCheckinNotice('You are already checked in.');
      return;
    }

    const normalizedCode = checkinCodeInput.trim().toUpperCase();
    if (!normalizedCode) {
      setCheckinNotice('Enter the event check-in code first.');
      return;
    }

    if (!verifyEventCheckinCode(event.id, normalizedCode)) {
      setCheckinNotice('Invalid check-in code. Please ask organizer for the correct code.');
      return;
    }

    setIsCheckingIn(true);
    try {
      const previousStats = computeBadgeStats(user.id);
      const record = recordEventCheckin(event.id, user.id, {
        title: event.title,
        category: event.category,
        address: event.address,
        latitude: event.latitude,
        longitude: event.longitude,
      });
      const badgeResult = awardBadgesForUser(user.id);
      const pointsEarned = Math.max(
        CHECKIN_POINTS_PER_EVENT,
        badgeResult.stats.totalPoints - previousStats.totalPoints
      );
      setIsCheckedIn(true);
      setCheckinRecords((prev) => [record, ...prev]);
      setCheckinCodeInput('');
      const badgeSuffix =
        badgeResult.newlyAwarded.length > 0
          ? ` New badge${badgeResult.newlyAwarded.length > 1 ? 's' : ''}: ${badgeResult.newlyAwarded
              .map((badge) => badge.name)
              .join(', ')}.`
          : '';
      setCheckinNotice(
        `Check-in completed at ${new Date(record.checkedInAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}. You earned ${pointsEarned} pts. Total points: ${badgeResult.stats.totalPoints}.${badgeSuffix}`
      );
    } catch (error) {
      setCheckinNotice(error instanceof Error ? error.message : 'Check-in failed.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5F0' }}>
      {/* Navigation */}
      <nav
        className="px-8 py-6 flex items-center justify-between max-w-6xl mx-auto"
        style={{ backgroundColor: 'transparent' }}
      >
        <button
          onClick={() => navigate('/explore')}
          className="flex items-center gap-2 transition-all"
          style={{
            fontSize: '16px',
            color: '#2E1A1A',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#C2B280')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#2E1A1A')}
        >
          <ArrowLeft size={20} />
          Back to events
        </button>

        <button
          onClick={() => {
            void handleCopyLink();
          }}
          className="p-2 rounded-lg transition-all"
          style={{
            backgroundColor: '#FFFFFF',
            color: '#2E1A1A',
            border: '1px solid #E5E2DA',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#C2B280';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#E5E2DA';
          }}
        >
          <Share2 size={20} />
        </button>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero Image */}
            <div className="rounded-2xl overflow-hidden" style={{ height: '400px' }}>
              <ImageWithFallback
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Event Info */}
            <div
              className="rounded-xl p-8"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
              }}
            >
              {/* Category Tag */}
              <div className="mb-4">
                <span
                  className="inline-block px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: 'rgba(194, 178, 128, 0.15)',
                    color: '#2E1A1A',
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                >
                  {event.category}
                </span>
              </div>

              {/* Title */}
              <h1
                className="mb-6"
                style={{
                  fontSize: '40px',
                  fontWeight: 600,
                  color: '#2E1A1A',
                  lineHeight: 1.3,
                }}
              >
                {event.title}
              </h1>

              {/* Quick Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <Calendar size={20} color="#C2B280" className="mt-1" />
                  <div>
                    <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '4px' }}>
                      Date & Time
                    </p>
                    <p style={{ fontSize: '16px', color: '#2E1A1A', fontWeight: 500 }}>
                      {displayDate}
                    </p>
                    <p style={{ fontSize: '14px', color: '#6B6B6B' }}>{displayTime}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin size={20} color="#C2B280" className="mt-1" />
                  <div>
                    <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '4px' }}>
                      Location
                    </p>
                    <p style={{ fontSize: '16px', color: '#2E1A1A', fontWeight: 500 }}>
                      {addressParts.primary}
                    </p>
                    {addressParts.secondary && (
                      <p style={{ fontSize: '14px', color: '#6B6B6B' }}>
                        {addressParts.secondary}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users size={20} color="#C2B280" className="mt-1" />
                  <div>
                    <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '4px' }}>
                      Attendees
                    </p>
                    <p style={{ fontSize: '16px', color: '#2E1A1A', fontWeight: 500 }}>
                      {event.currentParticipants} / {event.participantLimit}
                    </p>
                    {spotsLeft <= 10 && spotsLeft > 0 && (
                      <p style={{ fontSize: '14px', color: '#C2B280' }}>
                        {spotsLeft} spots left
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3
                  className="mb-3"
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#2E1A1A',
                  }}
                >
                  About this event
                </h3>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#6B6B6B',
                    lineHeight: 1.7,
                  }}
                >
                  {event.description || 'Details will be added soon.'}
                </p>
              </div>

              {/* Tags */}
              {event.tags.length > 0 && (
                <div className="mt-6">
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          fontSize: '14px',
                          color: '#6B6B6B',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          backgroundColor: '#F5F3EE',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Actions & Contact */}
          <div className="space-y-6">
            {/* Join Event Card */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
              }}
            >
              <button
                onClick={() => {
                  if (isRegistered) {
                    void handleCancelJoin();
                    return;
                  }
                  void handleJoinEvent();
                }}
                disabled={isJoining || isOwner || (!isRegistered && isFull)}
                className="w-full py-3 rounded-full transition-all duration-200 mb-4"
                style={{
                  backgroundColor:
                    isOwner || (!isRegistered && isFull)
                      ? '#C7C7C7'
                      : isRegistered
                        ? 'transparent'
                        : '#2E1A1A',
                  color: isRegistered ? '#2E1A1A' : '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 500,
                  border: isRegistered ? '1px solid #E5E2DA' : 'none',
                  cursor: isJoining || isOwner || (!isRegistered && isFull) ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.2)',
                  opacity: isJoining ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (isJoining || isOwner || (!isRegistered && isFull)) return;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 26, 26, 0.3)';
                }}
                onMouseLeave={(e) => {
                  if (isJoining || isOwner || (!isRegistered && isFull)) return;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 26, 26, 0.2)';
                }}
              >
                {isOwner
                  ? 'Organizer Event'
                  : !isRegistered && isFull
                    ? 'Event Full'
                    : isJoining
                      ? (isRegistered ? 'Cancelling...' : 'Joining...')
                      : (isRegistered ? 'Cancel Join' : 'Join Event')}
              </button>

              <p style={{ fontSize: '12px', color: '#6B6B6B', textAlign: 'center' }}>
                Free • No registration fee
              </p>
              {joinNotice && (
                <p className="mt-3" style={{ fontSize: '13px', color: '#2E1A1A', textAlign: 'center' }}>
                  {joinNotice}
                </p>
              )}
              {actionError && (
                <p className="mt-3" style={{ fontSize: '13px', color: '#B45309', textAlign: 'center' }}>
                  {actionError}
                </p>
              )}
            </div>

            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
              }}
            >
              {isOwner ? (
                <>
                  <h3
                    className="mb-3"
                    style={{ fontSize: '18px', fontWeight: 600, color: '#2E1A1A' }}
                  >
                    Event Check-in Code
                  </h3>
                  <div
                    className="rounded-lg px-4 py-3 mb-3"
                    style={{
                      border: '1px dashed #C2B280',
                      backgroundColor: '#F5F3EE',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '8px' }}>
                      Share this code at the venue
                    </p>
                    <p
                      style={{
                        fontSize: '24px',
                        letterSpacing: '2px',
                        fontWeight: 600,
                        color: '#2E1A1A',
                      }}
                    >
                      {eventCheckinCode}
                    </p>
                  </div>

                  <p style={{ fontSize: '12px', color: '#6B6B6B', textAlign: 'center' }}>
                    Attendees must enter this code to complete check-in
                  </p>

                  <div className="mt-4">
                    <p style={{ fontSize: '14px', color: '#2E1A1A', fontWeight: 500, marginBottom: '8px' }}>
                      Recent Check-ins
                    </p>
                    {checkinRecords.length === 0 ? (
                      <p style={{ fontSize: '13px', color: '#6B6B6B' }}>No check-ins yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {checkinRecords.slice(0, 5).map((record) => (
                          <div
                            key={`${record.userId}-${record.checkedInAt}`}
                            className="rounded-lg px-3 py-2"
                            style={{ backgroundColor: '#F5F3EE' }}
                          >
                            <p style={{ fontSize: '13px', color: '#2E1A1A', fontWeight: 500 }}>
                              User #{record.userId}
                            </p>
                            <p style={{ fontSize: '12px', color: '#6B6B6B' }}>
                              {new Date(record.checkedInAt).toLocaleString('en-US')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <h3
                    className="mb-3"
                    style={{ fontSize: '18px', fontWeight: 600, color: '#2E1A1A' }}
                  >
                    Event Check-in
                  </h3>
                  <input
                    value={checkinCodeInput}
                    onChange={(e) => setCheckinCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter check-in code"
                    className="w-full px-4 py-3 rounded-lg outline-none mb-3"
                    style={{
                      border: '1px solid #E5E2DA',
                      backgroundColor: '#F5F3EE',
                      fontSize: '14px',
                      color: '#2E1A1A',
                      textTransform: 'uppercase',
                    }}
                  />
                  <button
                    onClick={() => {
                      void handleEventCheckin();
                    }}
                    disabled={isCheckingIn || isCheckedIn}
                    className="w-full py-3 rounded-full transition-all duration-200 mb-3"
                    style={{
                      backgroundColor: isCheckedIn ? '#C7C7C7' : '#2E1A1A',
                      color: '#FFFFFF',
                      fontSize: '16px',
                      fontWeight: 500,
                      border: 'none',
                      cursor: isCheckingIn || isCheckedIn ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(46, 26, 26, 0.2)',
                      opacity: isCheckingIn ? 0.7 : 1,
                    }}
                  >
                    {isCheckedIn ? 'Checked In' : isCheckingIn ? 'Checking In...' : 'Confirm Check-in'}
                  </button>

                  <p style={{ fontSize: '12px', color: '#6B6B6B', textAlign: 'center' }}>
                    Enter organizer code to verify attendance
                  </p>
                </>
              )}
              {checkinNotice && (
                <p className="mt-3" style={{ fontSize: '13px', color: '#2E1A1A', textAlign: 'center' }}>
                  {checkinNotice}
                </p>
              )}
            </div>

            {isOwner && (
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
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
                  Manage Event
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setActionError(null);
                      setIsEditing((prev) => !prev);
                    }}
                    className="w-full py-2 rounded-full transition-all"
                    style={{
                      backgroundColor: isEditing ? '#F5F3EE' : '#2E1A1A',
                      color: isEditing ? '#2E1A1A' : '#FFFFFF',
                      border: isEditing ? '1px solid #E5E2DA' : 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                    }}
                  >
                    {isEditing ? 'Cancel editing' : 'Edit event'}
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full py-2 rounded-full transition-all"
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#2E1A1A',
                      border: '1px solid #E5E2DA',
                      cursor: isDeleting ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 500,
                      opacity: isDeleting ? 0.6 : 1,
                    }}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete event'}
                  </button>
                </div>

                {actionError && (
                  <p className="mt-3" style={{ fontSize: '14px', color: '#B45309' }}>
                    {actionError}
                  </p>
                )}
              </div>
            )}

            {isOwner && isEditing && (
              <form
                onSubmit={handleSave}
                className="rounded-xl p-6 space-y-4"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#2E1A1A',
                  }}
                >
                  Edit Details
                </h3>

                <input
                  name="title"
                  value={editForm.title}
                  onChange={handleEditFieldChange}
                  placeholder="Title"
                  required
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#F5F3EE',
                    fontSize: '14px',
                    color: '#2E1A1A',
                  }}
                />

                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFieldChange}
                  placeholder="Description"
                  required
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg outline-none resize-none"
                  style={{
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#F5F3EE',
                    fontSize: '14px',
                    color: '#2E1A1A',
                  }}
                />

                <select
                  name="category"
                  value={editForm.category}
                  onChange={handleEditFieldChange}
                  required
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#F5F3EE',
                    fontSize: '14px',
                    color: '#2E1A1A',
                  }}
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="date"
                    type="text"
                    inputMode="numeric"
                    placeholder="YYYY-MM-DD"
                    value={editForm.date}
                    onChange={handleEditFieldChange}
                    required
                    className="w-full px-4 py-2 rounded-lg outline-none"
                    style={{
                      border: '1px solid #E5E2DA',
                      backgroundColor: '#F5F3EE',
                      fontSize: '14px',
                      color: '#2E1A1A',
                    }}
                  />
                  <input
                    name="time"
                    type="time"
                    value={editForm.time}
                    onChange={handleEditFieldChange}
                    required
                    className="w-full px-4 py-2 rounded-lg outline-none"
                    style={{
                      border: '1px solid #E5E2DA',
                      backgroundColor: '#F5F3EE',
                      fontSize: '14px',
                      color: '#2E1A1A',
                    }}
                  />
                </div>

                <input
                  name="address"
                  value={editForm.address}
                  onChange={handleEditFieldChange}
                  placeholder="Address"
                  required
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#F5F3EE',
                    fontSize: '14px',
                    color: '#2E1A1A',
                  }}
                />

                <div className="grid grid-cols-2 gap-3">
                  <input
                    name="participantLimit"
                    type="number"
                    min={1}
                    value={editForm.participantLimit}
                    onChange={handleEditFieldChange}
                    placeholder="Participant limit"
                    required
                    className="w-full px-4 py-2 rounded-lg outline-none"
                    style={{
                      border: '1px solid #E5E2DA',
                      backgroundColor: '#F5F3EE',
                      fontSize: '14px',
                      color: '#2E1A1A',
                    }}
                  />
                  <input
                    name="image"
                    value={editForm.image}
                    onChange={handleEditFieldChange}
                    placeholder="Image URL"
                    className="w-full px-4 py-2 rounded-lg outline-none"
                    style={{
                      border: '1px solid #E5E2DA',
                      backgroundColor: '#F5F3EE',
                      fontSize: '14px',
                      color: '#2E1A1A',
                    }}
                  />
                </div>

                <input
                  name="tags"
                  value={editForm.tags}
                  onChange={handleEditFieldChange}
                  placeholder="Tags (comma separated)"
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#F5F3EE',
                    fontSize: '14px',
                    color: '#2E1A1A',
                  }}
                />

                <input
                  name="organizerName"
                  value={editForm.organizerName}
                  onChange={handleEditFieldChange}
                  placeholder="Organizer name"
                  required
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#F5F3EE',
                    fontSize: '14px',
                    color: '#2E1A1A',
                  }}
                />

                <input
                  name="organizerEmail"
                  type="email"
                  value={editForm.organizerEmail}
                  onChange={handleEditFieldChange}
                  placeholder="Organizer email"
                  required
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#F5F3EE',
                    fontSize: '14px',
                    color: '#2E1A1A',
                  }}
                />

                <input
                  name="organizerPhone"
                  value={editForm.organizerPhone}
                  onChange={handleEditFieldChange}
                  placeholder="Organizer phone (optional)"
                  className="w-full px-4 py-2 rounded-lg outline-none"
                  style={{
                    border: '1px solid #E5E2DA',
                    backgroundColor: '#F5F3EE',
                    fontSize: '14px',
                    color: '#2E1A1A',
                  }}
                />

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2 rounded-full"
                  style={{
                    backgroundColor: '#2E1A1A',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 500,
                    opacity: isSaving ? 0.7 : 1,
                  }}
                >
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              </form>
            )}

            {/* Organizer Contact */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
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
                Contact Organizer
              </h3>

              <div className="space-y-3">
                {event.organizerEmail && (
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: '#F5F3EE' }}
                    >
                      <Mail size={18} color="#2E1A1A" />
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: '#6B6B6B' }}>Email</p>
                      <p style={{ fontSize: '14px', color: '#2E1A1A', fontWeight: 500 }}>
                        {event.organizerEmail}
                      </p>
                    </div>
                  </div>
                )}

                {event.organizerPhone && (
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: '#F5F3EE' }}
                    >
                      <Phone size={18} color="#2E1A1A" />
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', color: '#6B6B6B' }}>Phone</p>
                      <p style={{ fontSize: '14px', color: '#2E1A1A', fontWeight: 500 }}>
                        {event.organizerPhone}
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t" style={{ borderColor: '#E5E2DA' }}>
                  <p style={{ fontSize: '14px', color: '#6B6B6B' }}>Organized by</p>
                  <p style={{ fontSize: '16px', color: '#2E1A1A', fontWeight: 500 }}>
                    {event.organizerName}
                  </p>
                </div>
              </div>
            </div>

            {/* Share Event */}
            <div
              className="rounded-xl p-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
              }}
            >
              <h3
                className="mb-3"
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#2E1A1A',
                }}
              >
                Share Event
              </h3>
              <button
                onClick={() => {
                  void handleCopyLink();
                }}
                className="w-full py-2 rounded-full transition-all"
                style={{
                  backgroundColor: 'transparent',
                  color: '#2E1A1A',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: '1px solid #E5E2DA',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5F3EE';
                  e.currentTarget.style.borderColor = '#C2B280';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = '#E5E2DA';
                }}
              >
                Copy Link
              </button>
              {shareNotice && (
                <p className="mt-3" style={{ fontSize: '13px', color: '#6B6B6B', textAlign: 'center' }}>
                  {shareNotice}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Spacer */}
      <div style={{ height: '64px' }} />
    </div>
  );
}
