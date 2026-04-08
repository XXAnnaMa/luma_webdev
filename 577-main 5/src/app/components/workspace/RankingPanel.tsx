import { Apartment } from '../../data/workspaceData';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface RankingPanelProps {
  apartments: Apartment[];
  selectedApartment: Apartment | null;
  onSelect: (apartment: Apartment) => void;
}

export function RankingPanel({ apartments, selectedApartment, onSelect }: RankingPanelProps) {
  return (
    <div>
      <div className="mb-6">
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#2E2E2E' }}>
          Rankings
        </h3>
        <p className="mt-1" style={{ fontSize: '14px', color: '#6B6B6B' }}>
          {apartments.length} apartments match your criteria
        </p>
      </div>

      <div className="space-y-4">
        {apartments.map((apartment, index) => {
          const isSelected = selectedApartment?.id === apartment.id;
          
          return (
            <div
              key={apartment.id}
              onClick={() => onSelect(apartment)}
              className="rounded-2xl overflow-hidden cursor-pointer transition-all"
              style={{
                backgroundColor: isSelected ? '#A3B18A' : '#FFFFFF',
                boxShadow: isSelected 
                  ? '0 4px 12px rgba(163, 177, 138, 0.2)' 
                  : '0 1px 3px rgba(46, 46, 46, 0.04)',
                transform: isSelected ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              {/* Photo */}
              <div className="relative" style={{ height: '140px' }}>
                <ImageWithFallback
                  src={apartment.photos[0]}
                  alt={apartment.name}
                  className="w-full h-full object-cover"
                />
                <div 
                  className="absolute top-3 left-3 flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#A3B18A',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  {index + 1}
                </div>
                {index === 0 && (
                  <div 
                    className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      color: '#A3B18A',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    Top match
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: isSelected ? '#FFFFFF' : '#2E2E2E',
                      marginBottom: '2px',
                    }}>
                      {apartment.name}
                    </h4>
                    <p style={{ fontSize: '13px', color: isSelected ? 'rgba(255,255,255,0.8)' : '#6B6B6B' }}>
                      {apartment.neighborhood}
                    </p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontSize: '18px', fontWeight: 600, color: isSelected ? '#FFFFFF' : '#2E2E2E' }}>
                      ${apartment.rent.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {apartment.safetyScore >= 85 && (
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : '#E8F5E9',
                        color: isSelected ? '#FFFFFF' : '#2E7D32',
                      }}
                    >
                      Safe area
                    </span>
                  )}
                  {apartment.sunlight === 'High' && (
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : '#FFF9C4',
                        color: isSelected ? '#FFFFFF' : '#F57F17',
                      }}
                    >
                      High sunlight
                    </span>
                  )}
                  {apartment.commute <= 10 && (
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : '#E3F2FD',
                        color: isSelected ? '#FFFFFF' : '#1565C0',
                      }}
                    >
                      Great commute
                    </span>
                  )}
                  {apartment.rent >= 2500 && (
                    <span 
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : '#FFEBEE',
                        color: isSelected ? '#FFFFFF' : '#C62828',
                      }}
                    >
                      High cost
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p style={{ 
                      fontSize: '12px', 
                      color: isSelected ? 'rgba(255,255,255,0.7)' : '#6B6B6B',
                      marginBottom: '4px' 
                    }}>
                      Rent
                    </p>
                    <p style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: isSelected ? '#FFFFFF' : '#2E2E2E' 
                    }}>
                      ${apartment.rent.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p style={{ 
                      fontSize: '12px', 
                      color: isSelected ? 'rgba(255,255,255,0.7)' : '#6B6B6B',
                      marginBottom: '4px' 
                    }}>
                      Commute
                    </p>
                    <p style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: isSelected ? '#FFFFFF' : '#2E2E2E' 
                    }}>
                      {apartment.commute} min
                    </p>
                  </div>
                  <div>
                    <p style={{ 
                      fontSize: '12px', 
                      color: isSelected ? 'rgba(255,255,255,0.7)' : '#6B6B6B',
                      marginBottom: '4px' 
                    }}>
                      Trust index
                    </p>
                    <p style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: isSelected ? '#FFFFFF' : '#2E2E2E' 
                    }}>
                      {apartment.trustIndex}
                    </p>
                  </div>
                  <div>
                    <p style={{ 
                      fontSize: '12px', 
                      color: isSelected ? 'rgba(255,255,255,0.7)' : '#6B6B6B',
                      marginBottom: '4px' 
                    }}>
                      Noise level
                    </p>
                    <p style={{ 
                      fontSize: '16px', 
                      fontWeight: 600, 
                      color: isSelected ? '#FFFFFF' : '#2E2E2E' 
                    }}>
                      {apartment.noiseLevel}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}