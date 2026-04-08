import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PreferencePanel } from '../components/workspace/PreferencePanel';
import { RankingPanel } from '../components/workspace/RankingPanel';
import { TradeoffPanel } from '../components/workspace/TradeoffPanel';
import { mockApartments, Apartment } from '../data/workspaceData';
import { ArrowLeft } from 'lucide-react';

export interface UserPreferences {
  // Hard Constraints
  petAllowed: boolean;
  budgetMin: number;
  budgetMax: number;
  
  // Soft Preferences (0-100)
  sunlightPreference: number;
  noiseTolerance: number;
  commuteImportance: number;
  costSensitivity: number;
  
  // Risk Tolerance
  riskTolerance: 'low' | 'medium' | 'high';
  
  // Lifestyle Mode
  lifestyleMode: 'student' | 'professional' | 'family';
}

const defaultPreferences: UserPreferences = {
  petAllowed: false,
  budgetMin: 1500,
  budgetMax: 3000,
  sunlightPreference: 50,
  noiseTolerance: 50,
  commuteImportance: 50,
  costSensitivity: 50,
  riskTolerance: 'medium',
  lifestyleMode: 'professional',
};

function rankApartments(apartments: Apartment[], preferences: UserPreferences): Apartment[] {
  return apartments
    .filter(apt => {
      // Hard constraints
      if (preferences.petAllowed && !apt.petAllowed) return false;
      if (apt.rent < preferences.budgetMin || apt.rent > preferences.budgetMax) return false;
      return true;
    })
    .map(apt => {
      // Calculate score based on preferences
      let score = 0;
      
      // Commute (inverse - lower is better)
      score += (100 - (apt.commute / 30) * 100) * (preferences.commuteImportance / 100);
      
      // Sunlight
      const sunlightScore = apt.sunlight === 'High' ? 100 : apt.sunlight === 'Medium' ? 60 : 30;
      score += sunlightScore * (preferences.sunlightPreference / 100);
      
      // Noise (inverse tolerance - lower noise is better for low tolerance)
      const noiseScore = apt.noiseLevel === 'Low' ? 100 : apt.noiseLevel === 'Medium' ? 60 : 30;
      score += noiseScore * ((100 - preferences.noiseTolerance) / 100);
      
      // Cost (inverse - lower is better)
      const costScore = ((preferences.budgetMax - apt.rent) / (preferences.budgetMax - preferences.budgetMin)) * 100;
      score += costScore * (preferences.costSensitivity / 100);
      
      // Safety
      score += apt.safetyScore * 0.5;
      
      // Management
      const managementScore = apt.trustIndex === 'High' ? 100 : apt.trustIndex === 'Medium' ? 60 : 30;
      score += managementScore * 0.3;
      
      return { ...apt, score };
    })
    .sort((a, b) => (b as any).score - (a as any).score);
}

export function DecisionWorkspace() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [rankedApartments, setRankedApartments] = useState<Apartment[]>([]);

  useEffect(() => {
    const ranked = rankApartments(mockApartments, preferences);
    setRankedApartments(ranked);
    
    // Auto-select first apartment
    if (ranked.length > 0 && !selectedApartment) {
      setSelectedApartment(ranked[0]);
    }
  }, [preferences]);

  const handlePreferenceChange = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }));
  };

  const handleSelectApartment = (apartment: Apartment) => {
    setSelectedApartment(apartment);
  };

  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F2' }}>
      {/* Header */}
      <header 
        className="px-8 py-4 border-b flex items-center justify-between"
        style={{ 
          backgroundColor: '#FFFFFF',
          borderColor: '#E8E6E1',
        }}
      >
        <div className="flex items-center gap-4">
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
          <span style={{ fontSize: '14px', color: '#6B6B6B' }}>
            / Decision Workspace
          </span>
        </div>
        <button
          onClick={() => navigate('/explore')}
          className="px-4 py-2 rounded-lg transition-all flex items-center gap-2"
          style={{
            backgroundColor: 'transparent',
            color: '#6B6B6B',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid #E8E6E1',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
          Back to Explore
        </button>
      </header>

      {/* Three Column Layout */}
      <div className="max-w-[1600px] mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Preferences */}
          <div className="col-span-3">
            <PreferencePanel 
              preferences={preferences}
              onChange={handlePreferenceChange}
            />
          </div>

          {/* Center Panel - Rankings */}
          <div className="col-span-5">
            <RankingPanel 
              apartments={rankedApartments}
              selectedApartment={selectedApartment}
              onSelect={handleSelectApartment}
            />
          </div>

          {/* Right Panel - Trade-offs */}
          <div className="col-span-4">
            <TradeoffPanel apartment={selectedApartment} />
          </div>
        </div>
      </div>
    </div>
  );
}