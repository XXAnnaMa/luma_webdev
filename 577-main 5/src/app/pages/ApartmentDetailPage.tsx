import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockApartments } from '../data/workspaceData';
import { ArrowLeft, Heart, Share2, MapPin, Bed, Bath, Square, Calendar, Car, Sun, Volume2, Shield } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function ApartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const apartment = mockApartments.find(apt => apt.id === id);

  if (!apartment) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F7F6F2' }}>
        <div className="text-center">
          <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#2E2E2E', marginBottom: '8px' }}>
            Apartment not found
          </h2>
          <button
            onClick={() => navigate('/explore')}
            className="px-6 py-2 rounded-full mt-4"
            style={{
              backgroundColor: '#A3B18A',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Back to listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F2' }}>
      {/* Header */}
      <header 
        className="px-8 py-4 border-b flex items-center justify-between sticky top-0"
        style={{ 
          backgroundColor: '#FFFFFF',
          borderColor: '#E8E6E1',
          zIndex: 100,
        }}
      >
        <button
          onClick={() => navigate('/explore')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
          style={{
            backgroundColor: '#F7F6F2',
            color: '#2E2E2E',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className="p-2 rounded-lg transition-all"
            style={{
              backgroundColor: isSaved ? '#A3B18A' : '#F7F6F2',
              color: isSaved ? '#FFFFFF' : '#2E2E2E',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Heart size={18} fill={isSaved ? '#FFFFFF' : 'none'} />
          </button>
          <button
            className="p-2 rounded-lg"
            style={{
              backgroundColor: '#F7F6F2',
              color: '#2E2E2E',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Photo Gallery */}
        <div className="mb-8">
          <div className="rounded-2xl overflow-hidden mb-4" style={{ height: '500px' }}>
            <ImageWithFallback
              src={apartment.photos[currentPhotoIndex]}
              alt={`${apartment.name} - Photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-3">
            {apartment.photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setCurrentPhotoIndex(index)}
                className="rounded-lg overflow-hidden transition-all"
                style={{
                  width: '120px',
                  height: '80px',
                  border: currentPhotoIndex === index ? '3px solid #A3B18A' : '1px solid #E8E6E1',
                  opacity: currentPhotoIndex === index ? 1 : 0.6,
                  cursor: 'pointer',
                }}
              >
                <ImageWithFallback
                  src={photo}
                  alt={`${apartment.name} - Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="col-span-2">
            {/* Title & Price */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#2E2E2E', marginBottom: '8px' }}>
                    {apartment.name}
                  </h1>
                  <div className="flex items-center gap-2" style={{ color: '#6B6B6B' }}>
                    <MapPin size={16} />
                    <span style={{ fontSize: '15px' }}>{apartment.address}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p style={{ fontSize: '36px', fontWeight: 600, color: '#A3B18A' }}>
                    ${apartment.rent.toLocaleString()}
                  </p>
                  <p style={{ fontSize: '14px', color: '#6B6B6B' }}>
                    per month
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Bed size={20} color="#6B6B6B" />
                  <span style={{ fontSize: '15px', color: '#2E2E2E' }}>
                    {apartment.bedrooms} Bedrooms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath size={20} color="#6B6B6B" />
                  <span style={{ fontSize: '15px', color: '#2E2E2E' }}>
                    {apartment.bathrooms} Bathrooms
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Square size={20} color="#6B6B6B" />
                  <span style={{ fontSize: '15px', color: '#2E2E2E' }}>
                    {apartment.sqft} sqft
                  </span>
                </div>
              </div>
            </div>

            {/* Trade-offs Section */}
            <div 
              className="rounded-2xl p-6 mb-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(46, 46, 46, 0.04)',
              }}
            >
              <h3 className="mb-4" style={{ fontSize: '18px', fontWeight: 600, color: '#2E2E2E' }}>
                Analysis
              </h3>

              {/* Strengths */}
              <div className="mb-6">
                <h4 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#2E2E2E' }}>
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {apartment.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span 
                        className="inline-block w-1.5 h-1.5 rounded-full mt-2"
                        style={{ backgroundColor: '#A3B18A' }}
                      />
                      <span style={{ fontSize: '14px', color: '#2E2E2E', lineHeight: 1.6 }}>
                        {strength}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Trade-offs */}
              <div className="mb-6">
                <h4 className="mb-3" style={{ fontSize: '15px', fontWeight: 600, color: '#2E2E2E' }}>
                  Trade-offs
                </h4>
                <ul className="space-y-2">
                  {apartment.tradeoffs.map((tradeoff, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span 
                        className="inline-block w-1.5 h-1.5 rounded-full mt-2"
                        style={{ backgroundColor: '#D88C8C' }}
                      />
                      <span style={{ fontSize: '14px', color: '#2E2E2E', lineHeight: 1.6 }}>
                        {tradeoff}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Explanation */}
              <div 
                className="rounded-xl p-4"
                style={{
                  backgroundColor: '#F7F6F2',
                  borderLeft: '3px solid #A3B18A',
                }}
              >
                <p style={{ fontSize: '14px', color: '#2E2E2E', lineHeight: 1.6 }}>
                  {apartment.explanation}
                </p>
              </div>
            </div>

            {/* Detailed Scores */}
            <div 
              className="rounded-2xl p-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(46, 46, 46, 0.04)',
              }}
            >
              <h3 className="mb-4" style={{ fontSize: '18px', fontWeight: 600, color: '#2E2E2E' }}>
                Detailed Scores
              </h3>
              
              <div className="space-y-4">
                {Object.entries(apartment.attributes).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between mb-2">
                      <span style={{ fontSize: '14px', color: '#6B6B6B', textTransform: 'capitalize' }}>
                        {key}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#2E2E2E' }}>
                        {value}/100
                      </span>
                    </div>
                    <div 
                      className="h-2 rounded-full overflow-hidden"
                      style={{ backgroundColor: '#E8E6E1' }}
                    >
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${value}%`,
                          backgroundColor: value >= 80 ? '#A3B18A' : value >= 60 ? '#D6CCC2' : '#D88C8C',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1">
            {/* Key Details */}
            <div 
              className="rounded-2xl p-6 mb-6"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(46, 46, 46, 0.04)',
              }}
            >
              <h3 className="mb-4" style={{ fontSize: '16px', fontWeight: 600, color: '#2E2E2E' }}>
                Key Details
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar size={18} color="#6B6B6B" />
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Available</p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#2E2E2E' }}>
                      {new Date(apartment.availableDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Car size={18} color="#6B6B6B" />
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Parking</p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#2E2E2E' }}>
                      {apartment.parkingCost === 0 ? 'Included' : `$${apartment.parkingCost}/mo`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Sun size={18} color="#6B6B6B" />
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Sunlight</p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#2E2E2E' }}>
                      {apartment.sunlight}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Volume2 size={18} color="#6B6B6B" />
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Noise Level</p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#2E2E2E' }}>
                      {apartment.noiseLevel}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield size={18} color="#6B6B6B" />
                  <div>
                    <p style={{ fontSize: '12px', color: '#6B6B6B' }}>Safety Score</p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#2E2E2E' }}>
                      {apartment.safetyScore}/100
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/workspace')}
              className="w-full py-4 rounded-xl transition-all"
              style={{
                backgroundColor: '#A3B18A',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(163, 177, 138, 0.2)',
              }}
            >
              Compare in Workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
