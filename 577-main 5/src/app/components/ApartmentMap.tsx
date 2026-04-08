import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Apartment } from '../data/workspaceData';

interface ApartmentMapProps {
  apartments: Apartment[];
  hoveredApartmentId: string | null;
  onMarkerClick: (id: string) => void;
  onMarkerHover: (id: string | null) => void;
  center: [number, number];
  zoom: number;
}

export function ApartmentMap({ 
  apartments, 
  hoveredApartmentId,
  onMarkerClick,
  onMarkerHover,
  center,
  zoom
}: ApartmentMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    // Wait for the container to be ready
    if (!mapContainerRef.current) return;

    // Initialize map only once
    if (!mapRef.current) {
      try {
        mapRef.current = L.map(mapContainerRef.current, {
          center: center,
          zoom: zoom,
          zoomControl: true,
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapRef.current);
      } catch (error) {
        console.error('Error initializing map:', error);
        return;
      }
    }

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (mapRef.current) {
        marker.remove();
      }
    });
    markersRef.current.clear();

    // Add markers for each apartment
    apartments.forEach(apartment => {
      if (!mapRef.current) return;

      const marker = L.marker([apartment.latitude, apartment.longitude], {
        icon: L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        })
      });

      // Popup content
      marker.bindPopup(`
        <div style="min-width: 200px;">
          <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">
            ${apartment.name}
          </h4>
          <p style="font-size: 16px; font-weight: 600; color: #A3B18A; margin-bottom: 4px;">
            $${apartment.rent.toLocaleString()}/mo
          </p>
          <p style="font-size: 12px; color: #6B6B6B;">
            ${apartment.bedrooms} bd • ${apartment.bathrooms} ba • ${apartment.sqft} sqft
          </p>
        </div>
      `);

      // Event handlers
      marker.on('click', () => onMarkerClick(apartment.id));
      marker.on('mouseover', () => onMarkerHover(apartment.id));
      marker.on('mouseout', () => onMarkerHover(null));

      marker.addTo(mapRef.current!);
      markersRef.current.set(apartment.id, marker);
    });

    // Cleanup function
    return () => {
      // Only clear markers, don't remove the map on every render
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
    };
  }, [apartments, onMarkerClick, onMarkerHover]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Handle hover state changes from external source
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      if (id === hoveredApartmentId) {
        // Highlight hovered marker
        marker.setZIndexOffset(1000);
      } else {
        marker.setZIndexOffset(0);
      }
    });
  }, [hoveredApartmentId]);

  // Update map center and zoom when props change
  useEffect(() => {
    if (mapRef.current && center && center.length === 2) {
      mapRef.current.setView(center, zoom, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [center, zoom]);

  return (
    <div 
      ref={mapContainerRef}
      style={{ 
        height: '100%', 
        width: '100%',
        zIndex: 1,
      }} 
    />
  );
}