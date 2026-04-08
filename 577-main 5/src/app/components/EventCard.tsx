import { Calendar, MapPin, Users, Bookmark } from 'lucide-react';
import { Event } from '../data/eventsData';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { useBookmarks } from '../context/BookmarkContext';
import { formatEventDateLabel, formatEventTimeLabel } from '../lib/eventDate';

interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

function formatEventDate(date: string) {
  return formatEventDateLabel(date, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getAddressPreview(address: string) {
  if (!address) return 'Location TBD';
  return address.split(',')[0].trim() || 'Location TBD';
}

export function EventCard({ event, onClick }: EventCardProps) {
  // Safely use bookmarks - will be undefined if not in provider
  let toggleBookmark: ((id: string) => void) | undefined;
  let isBookmarked: ((id: string) => boolean) | undefined;
  
  try {
    const bookmarks = useBookmarks();
    toggleBookmark = bookmarks.toggleBookmark;
    isBookmarked = bookmarks.isBookmarked;
  } catch (e) {
    // BookmarkProvider not available - bookmark functionality will be disabled
  }
  
  const spotsLeft = event.participantLimit - event.currentParticipants;
  const bookmarked = isBookmarked ? isBookmarked(event.id) : false;
  const displayDate = formatEventDate(event.date);
  const displayTime = formatEventTimeLabel(event.time);
  const locationPreview = getAddressPreview(event.address);
  
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toggleBookmark) {
      toggleBookmark(event.id);
    }
  };
  
  return (
    <div
      onClick={onClick}
      className="rounded-xl overflow-hidden transition-all duration-200 cursor-pointer relative"
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(46, 26, 26, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 26, 26, 0.06)';
      }}
    >
      {/* Bookmark Button */}
      <button
        onClick={handleBookmarkClick}
        className="absolute top-3 right-3 z-10 p-2 rounded-full transition-all duration-200"
        style={{
          backgroundColor: bookmarked ? '#C2B280' : 'rgba(255, 255, 255, 0.9)',
          color: bookmarked ? '#FFFFFF' : '#2E1A1A',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(46, 26, 26, 0.15)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <Bookmark size={18} fill={bookmarked ? '#FFFFFF' : 'none'} />
      </button>

      {/* Image */}
      <div className="w-full h-48 overflow-hidden">
        <ImageWithFallback
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category Tag */}
        <div className="mb-3">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs"
            style={{
              backgroundColor: 'rgba(194, 178, 128, 0.15)',
              color: '#2E1A1A',
              fontWeight: 500,
            }}
          >
            {event.category}
          </span>
        </div>

        {/* Title */}
        <h3
          className="mb-3"
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#2E1A1A',
            lineHeight: 1.4,
          }}
        >
          {event.title}
        </h3>

        {/* Info Grid */}
        <div className="space-y-2">
          {/* Date & Time */}
          <div className="flex items-center gap-2">
            <Calendar size={16} color="#6B6B6B" />
            <span style={{ fontSize: '14px', color: '#6B6B6B' }}>
              {displayDate} at {displayTime}
            </span>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2">
            <MapPin size={16} color="#6B6B6B" />
            <span
              style={{ fontSize: '14px', color: '#6B6B6B' }}
              className="line-clamp-1"
            >
              {locationPreview}
            </span>
          </div>

          {/* Participants */}
          <div className="flex items-center gap-2">
            <Users size={16} color="#6B6B6B" />
            <span style={{ fontSize: '14px', color: '#6B6B6B' }}>
              {event.currentParticipants} / {event.participantLimit} joined
              {spotsLeft <= 10 && spotsLeft > 0 && (
                <span style={{ color: '#C2B280', marginLeft: '8px' }}>
                  ({spotsLeft} spots left)
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {event.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                style={{
                  fontSize: '12px',
                  color: '#6B6B6B',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#F5F3EE',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
