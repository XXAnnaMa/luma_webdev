import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Event } from '../data/eventsData';
import { formatEventDateLabel, formatEventTimeLabel } from '../lib/eventDate';

interface EventMapProps {
  events: Event[];
  onMarkerClick: (id: string) => void;
  onMarkerHover: (id: string | null) => void;
  hoveredEventId: string | null;
  center?: [number, number];
  zoom?: number;
}

function createCustomIcon(isHovered: boolean) {
  const pinSize = isHovered ? 34 : 28;
  const innerSize = isHovered ? 12 : 10;

  return L.divIcon({
    className: 'custom-event-marker',
    html: `
      <div style="
        position: relative;
        width: ${pinSize}px;
        height: ${pinSize}px;
        background: linear-gradient(180deg, #d2c392 0%, #c2b280 100%);
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 8px 20px rgba(46, 26, 26, 0.18);
        transition: transform 200ms ease, box-shadow 200ms ease;
        cursor: pointer;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          width: ${innerSize}px;
          height: ${innerSize}px;
          background-color: #ffffff;
          border-radius: 9999px;
          transform: translate(-50%, -50%) rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [pinSize, pinSize],
    iconAnchor: [pinSize / 2, pinSize],
    popupAnchor: [0, -pinSize],
  });
}

export function EventMap({
  events,
  onMarkerClick,
  onMarkerHover,
  hoveredEventId,
  center = [34.0522, -118.2437],
  zoom = 11,
}: EventMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const viewStateRef = useRef<{ center: [number, number]; zoom: number } | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      try {
        mapRef.current = L.map(mapContainerRef.current, {
          center,
          zoom,
          zoomControl: true,
        });

        // Add tile layer with custom styling
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);

        viewStateRef.current = { center, zoom };
      } catch (error) {
        console.error('Error initializing map:', error);
        return;
      }
    }

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      viewStateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    events.forEach((event) => {
      const displayDate = formatEventDateLabel(event.date, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const displayTime = formatEventTimeLabel(event.time);
      const marker = L.marker([event.latitude, event.longitude], {
        icon: createCustomIcon(false),
      });

      marker.on('click', () => onMarkerClick(event.id));
      marker.on('mouseover', () => onMarkerHover(event.id));
      marker.on('mouseout', () => onMarkerHover(null));

      // Add popup
      marker.bindPopup(
        `
        <div style="padding: 8px; min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #2E1A1A;">
            ${event.title}
          </h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B6B6B;">
            📅 ${displayDate} at ${displayTime}
          </p>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #6B6B6B;">
            📍 ${event.address.split(',')[0]}
          </p>
          <p style="margin: 0; font-size: 12px; color: #6B6B6B;">
            👥 ${event.currentParticipants} / ${event.participantLimit} joined
          </p>
        </div>
        `,
        {
          closeButton: false,
          maxWidth: 250,
        }
      );

      marker.addTo(map);
      markersRef.current.set(event.id, marker);
    });
  }, [events, onMarkerClick, onMarkerHover]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const previous = viewStateRef.current;
    const centerChanged =
      !previous || previous.center[0] !== center[0] || previous.center[1] !== center[1];
    const zoomChanged = !previous || previous.zoom !== zoom;

    if (centerChanged || zoomChanged) {
      map.setView(center, zoom);
      viewStateRef.current = { center, zoom };
    }
  }, [center, zoom]);

  useEffect(() => {
    markersRef.current.forEach((marker, eventId) => {
      const isHovered = eventId === hoveredEventId;
      marker.setIcon(createCustomIcon(isHovered));
    });
  }, [hoveredEventId]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: '500px' }}
    />
  );
}
