import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockApartments } from '../data/workspaceData';
import { ArrowRight, Heart, Search, MapPin } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ApartmentMap } from '../components/ApartmentMap';

export function MapDiscoveryPage() {
  const navigate = useNavigate();
  const [hoveredApartmentId, setHoveredApartmentId] = useState<string | null>(null);
  const [savedApartments, setSavedApartments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([34.0522, -118.2437]); // LA center
  const [mapZoom, setMapZoom] = useState(12);
  const [viewMode, setViewMode] = useState<'all' | 'saved'>('all');

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedApartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleMarkerClick = (id: string) => {
    navigate(`/apartment/${id}`);
  };

  const handleMarkerHover = (id: string | null) => {
    setHoveredApartmentId(id);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // ===== GOOGLE MAPS GEOCODING API INTEGRATION =====
    // To use real Google Maps geocoding, replace the code below with:
    //
    // const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';
    // const response = await fetch(
    //   `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${GOOGLE_MAPS_API_KEY}`
    // );
    // const data = await response.json();
    // if (data.results && data.results.length > 0) {
    //   const location = data.results[0].geometry.location;
    //   setMapCenter([location.lat, location.lng]);
    //   setMapZoom(14);
    // } else {
    //   alert('Location not found');
    // }
    // =================================================
    
    // For demo: Simple city/neighborhood matching
    const locationMap: { [key: string]: [number, number] } = {
      // Los Angeles
      'los angeles': [34.0522, -118.2437],
      'la': [34.0522, -118.2437],
      'downtown la': [34.0407, -118.2468],
      'santa monica': [34.0195, -118.4912],
      'venice': [33.9850, -118.4695],
      'hollywood': [34.0928, -118.3287],
      'beverly hills': [34.0736, -118.4004],
      'west hollywood': [34.0900, -118.3617],
      'silver lake': [34.0878, -118.2704],
      'koreatown': [34.0579, -118.3009],
      'culver city': [34.0211, -118.3965],
      'pasadena': [34.1478, -118.1445],
      '90012': [34.0571, -118.2378], // Downtown LA
      '90401': [34.0195, -118.4912], // Santa Monica
      '90291': [33.9850, -118.4695], // Venice
      '90028': [34.0928, -118.3287], // Hollywood
      '90210': [34.0736, -118.4004], // Beverly Hills
    };

    const searchLower = searchQuery.toLowerCase();
    let found = false;

    // Check if query matches any location
    for (const [key, coords] of Object.entries(locationMap)) {
      if (searchLower.includes(key)) {
        setMapCenter(coords);
        setMapZoom(14);
        found = true;
        break;
      }
    }

    if (!found) {
      // Default to LA center
      alert(`No results found for "${searchQuery}". Showing all LA apartments.`);
      setMapCenter([34.0522, -118.2437]);
      setMapZoom(12);
    }
  };

  // Filter apartments based on view mode
  const displayedApartments = viewMode === 'all' 
    ? mockApartments 
    : mockApartments.filter(apt => savedApartments.has(apt.id));

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F7F6F2' }}>
      {/* Header */}
      <header 
        className="px-8 py-4 border-b flex items-center justify-between"
        style={{ 
          backgroundColor: '#FFFFFF',
          borderColor: '#E8E6E1',
          zIndex: 1000,
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#2E2E2E',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          R8APT
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/workspace')}
            className="px-6 py-2 rounded-full flex items-center gap-2 transition-all"
            style={{
              backgroundColor: '#A3B18A',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 500,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Decision Workspace
            <ArrowRight size={16} />
          </button>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Scrollable Listings */}
        <div 
          className="w-[480px] overflow-y-auto border-r"
          style={{ 
            backgroundColor: '#FFFFFF',
            borderColor: '#E8E6E1',
          }}
        >
          <div className="p-6">
            {/* View Toggle */}
            <div 
              className="mb-6 flex gap-2 p-1 rounded-full"
              style={{
                backgroundColor: '#F7F6F2',
              }}
            >
              <button
                onClick={() => setViewMode('all')}
                className="flex-1 px-4 py-2 rounded-full transition-all"
                style={{
                  backgroundColor: viewMode === 'all' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'all' ? '#2E2E2E' : '#6B6B6B',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                All Listings
              </button>
              <button
                onClick={() => setViewMode('saved')}
                className="flex-1 px-4 py-2 rounded-full transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: viewMode === 'saved' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'saved' ? '#2E2E2E' : '#6B6B6B',
                  fontSize: '14px',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'saved' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Heart size={14} fill={viewMode === 'saved' ? '#A3B18A' : 'none'} />
                Saved ({savedApartments.size})
              </button>
            </div>

            <div className="mb-6">
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2E2E2E' }}>
                {viewMode === 'all' 
                  ? `${mockApartments.length} apartments available`
                  : `${displayedApartments.length} saved apartment${displayedApartments.length !== 1 ? 's' : ''}`
                }
              </h3>
              <p className="mt-1" style={{ fontSize: '14px', color: '#6B6B6B' }}>
                {viewMode === 'all' ? 'Discover your next home' : 'Your favorites in one place'}
              </p>
            </div>

            {displayedApartments.length === 0 && viewMode === 'saved' ? (
              <div 
                className="flex flex-col items-center justify-center py-16 px-6 rounded-xl"
                style={{
                  backgroundColor: '#F7F6F2',
                  border: '1px dashed #D3D3C8',
                }}
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: '#E8E6E1',
                  }}
                >
                  <Heart size={32} color="#A3B18A" />
                </div>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2E2E2E', marginBottom: '8px' }}>
                  No saved apartments yet
                </h4>
                <p style={{ fontSize: '14px', color: '#6B6B6B', textAlign: 'center', maxWidth: '280px' }}>
                  Start exploring and save apartments to easily compare them later
                </p>
                <button
                  onClick={() => setViewMode('all')}
                  className="mt-6 px-6 py-2 rounded-full transition-all"
                  style={{
                    backgroundColor: '#A3B18A',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Browse all listings
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedApartments.map((apartment) => (
                  <div
                    key={apartment.id}
                    onClick={() => navigate(`/apartment/${apartment.id}`)}
                    onMouseEnter={() => setHoveredApartmentId(apartment.id)}
                    onMouseLeave={() => setHoveredApartmentId(null)}
                    className="rounded-xl overflow-hidden cursor-pointer transition-all"
                    style={{
                      backgroundColor: hoveredApartmentId === apartment.id ? '#F7F6F2' : '#FFFFFF',
                      border: `1px solid ${hoveredApartmentId === apartment.id ? '#A3B18A' : '#E8E6E1'}`,
                      transform: hoveredApartmentId === apartment.id ? 'scale(1.01)' : 'scale(1)',
                      boxShadow: hoveredApartmentId === apartment.id 
                        ? '0 4px 12px rgba(163, 177, 138, 0.15)' 
                        : 'none',
                    }}
                  >
                    {/* Image */}
                    <div className="relative" style={{ height: '200px' }}>
                      <ImageWithFallback
                        src={apartment.photos[0]}
                        alt={apartment.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => toggleSave(apartment.id, e)}
                        className="absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all"
                        style={{
                          backgroundColor: savedApartments.has(apartment.id) ? '#A3B18A' : 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(8px)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Heart 
                          size={18} 
                          fill={savedApartments.has(apartment.id) ? '#FFFFFF' : 'none'}
                          color={savedApartments.has(apartment.id) ? '#FFFFFF' : '#6B6B6B'}
                        />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2E2E2E' }}>
                            {apartment.name}
                          </h4>
                          <p className="mt-1" style={{ fontSize: '13px', color: '#6B6B6B' }}>
                            {apartment.neighborhood}
                          </p>
                        </div>
                        <div className="text-right">
                          <p style={{ fontSize: '18px', fontWeight: 600, color: '#2E2E2E' }}>
                            ${apartment.rent.toLocaleString()}
                          </p>
                          <p style={{ fontSize: '12px', color: '#6B6B6B' }}>
                            /month
                          </p>
                        </div>
                      </div>

                      {/* Quick Info */}
                      <div className="flex items-center gap-4 mb-3" style={{ fontSize: '13px', color: '#6B6B6B' }}>
                        <span>{apartment.bedrooms} bd</span>
                        <span>•</span>
                        <span>{apartment.bathrooms} ba</span>
                        <span>•</span>
                        <span>{apartment.sqft} sqft</span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {apartment.safetyScore >= 85 && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: '#E8F5E9',
                              color: '#2E7D32',
                            }}
                          >
                            Safe area
                          </span>
                        )}
                        {apartment.sunlight === 'High' && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: '#FFF9C4',
                              color: '#F57F17',
                            }}
                          >
                            High sunlight
                          </span>
                        )}
                        {apartment.commute <= 10 && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: '#E3F2FD',
                              color: '#1565C0',
                            }}
                          >
                            {apartment.commute} min commute
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 relative">
          {/* Search Bar Overlay */}
          <div 
            className="absolute top-6 left-1/2 z-[1000]"
            style={{
              transform: 'translateX(-50%)',
            }}
          >
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div 
                className="flex items-center gap-3 px-4 py-3 rounded-full shadow-lg"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E8E6E1',
                  minWidth: '400px',
                }}
              >
                <MapPin size={20} color="#6B6B6B" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by city, neighborhood, or zip code..."
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    color: '#2E2E2E',
                    backgroundColor: 'transparent',
                  }}
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    backgroundColor: '#A3B18A',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Search size={18} color="#FFFFFF" />
                </button>
              </div>
            </form>
          </div>

          <ApartmentMap
            apartments={mockApartments}
            hoveredApartmentId={hoveredApartmentId}
            onMarkerClick={handleMarkerClick}
            onMarkerHover={handleMarkerHover}
            center={mapCenter}
            zoom={mapZoom}
          />
        </div>
      </div>
    </div>
  );
}