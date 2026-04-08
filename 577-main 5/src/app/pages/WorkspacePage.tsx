import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ResultCard } from '../components/ResultCard';
import { TradeoffCard } from '../components/TradeoffCard';
import { Home, RotateCcw, Save, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Preferences, RankedApartment } from '../types';
import { mockApartments } from '../data/mockApartments';
import { rankApartments, defaultPreferences, presetScenarios } from '../utils/ranking';

export function WorkspacePage() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [rankedApartments, setRankedApartments] = useState<RankedApartment[]>([]);
  const [selectedApartment, setSelectedApartment] = useState<RankedApartment | null>(null);
  const [savedApartments, setSavedApartments] = useState<Set<string>>(new Set());

  // Load saved preferences on mount
  useEffect(() => {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load preferences');
      }
    }
  }, []);

  // Recalculate rankings when preferences change
  useEffect(() => {
    const ranked = rankApartments(mockApartments, preferences);
    setRankedApartments(ranked);
    if (!selectedApartment && ranked.length > 0) {
      setSelectedApartment(ranked[0]);
    }
  }, [preferences]);

  const handleWeightChange = (domain: keyof Preferences['weights'], value: number) => {
    setPreferences({
      ...preferences,
      weights: {
        ...preferences.weights,
        [domain]: value / 100
      }
    });
  };

  const handlePresetChange = (preset: string) => {
    if (preset in presetScenarios) {
      setPreferences(presetScenarios[preset as keyof typeof presetScenarios]);
    }
  };

  const handleReset = () => {
    setPreferences(defaultPreferences);
  };

  const handleToggleSave = (id: string) => {
    setSavedApartments(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-primary-foreground">R8</span>
              </div>
              <span className="text-xl font-bold">Decision Workspace</span>
            </div>
            <Badge variant="secondary">{rankedApartments.length} Results</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/saved')}>
              <Heart className="w-4 h-4 mr-2" />
              Saved ({savedApartments.size})
            </Button>
            <Button variant="ghost" onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1280px] mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="col-span-3 space-y-4">
            <Card className="p-6 space-y-4 sticky top-24">
              <div>
                <h3 className="font-semibold mb-4">Scenario Presets</h3>
                <Select onValueChange={handlePresetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Commute First">Commute First</SelectItem>
                    <SelectItem value="Budget First">Budget First</SelectItem>
                    <SelectItem value="Luxury Living">Luxury Living</SelectItem>
                    <SelectItem value="Safe & Reliable">Safe & Reliable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Adjust Weights</h3>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'location', label: 'Location' },
                    { key: 'costRisk', label: 'Cost & Value' },
                    { key: 'unitComfort', label: 'Unit Comfort' },
                    { key: 'buildingReliability', label: 'Building Quality' },
                    { key: 'amenities', label: 'Amenities' },
                    { key: 'managementTrust', label: 'Management' },
                    { key: 'reputationRisk', label: 'Reputation' }
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">{label}</Label>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round((preferences.weights[key as keyof typeof preferences.weights] || 0) * 100)}%
                        </Badge>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="5"
                        value={(preferences.weights[key as keyof typeof preferences.weights] || 0) * 100}
                        onChange={(e) => handleWeightChange(
                          key as keyof Preferences['weights'],
                          parseInt(e.target.value)
                        )}
                        className="w-full accent-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" onClick={() => navigate('/compare')}>
                  Compare Selected
                </Button>
              </div>
            </Card>
          </div>

          {/* Center Panel - Ranked Results */}
          <div className="col-span-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Ranked Results</h2>
              <p className="text-sm text-muted-foreground">
                Adjust weights to see rankings update
              </p>
            </div>

            <div className="space-y-4">
              {rankedApartments.map((apartment, idx) => (
                <div
                  key={apartment.id}
                  onClick={() => setSelectedApartment(apartment)}
                >
                  <ResultCard
                    apartment={{
                      ...apartment,
                      saved: savedApartments.has(apartment.id)
                    }}
                    rank={idx + 1}
                    onView={() => navigate(`/apartment/${apartment.id}`)}
                    onCompare={() => navigate('/compare')}
                    onToggleSave={() => handleToggleSave(apartment.id)}
                    isSelected={selectedApartment?.id === apartment.id}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Explanation & Simulation */}
          <div className="col-span-3 space-y-4">
            <div className="sticky top-24 space-y-4">
              {selectedApartment && (
                <>
                  <Card className="p-6">
                    <h3 className="font-semibold mb-3">Selected Apartment</h3>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{selectedApartment.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          ${selectedApartment.price.toLocaleString()}
                        </span>
                        <Badge variant="secondary">
                          Score: {Math.round(selectedApartment.totalScore)}
                        </Badge>
                      </div>
                    </div>
                  </Card>

                  <TradeoffCard
                    strengths={selectedApartment.tradeoffSummary.strengths}
                    weaknesses={selectedApartment.tradeoffSummary.weaknesses}
                    explanation={selectedApartment.tradeoffSummary.explanation}
                  />

                  <Card className="p-6 space-y-3">
                    <h4 className="font-semibold">Risk Indicators</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">True Monthly Cost</Label>
                        <p className="text-lg font-semibold">
                          ${(selectedApartment.price + 200).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Base rent + estimated utilities
                        </p>
                      </div>

                      <div className="pt-3 border-t">
                        <Label className="text-xs text-muted-foreground">Lease Risk</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant="outline"
                            className={
                              selectedApartment.costRisk.score >= 80 
                                ? 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20'
                                : selectedApartment.costRisk.score >= 60
                                ? 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20'
                                : 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
                            }
                          >
                            {selectedApartment.costRisk.score >= 80 ? 'Low' : selectedApartment.costRisk.score >= 60 ? 'Medium' : 'High'}
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <Label className="text-xs text-muted-foreground">Trust Index</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${selectedApartment.managementTrust.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {selectedApartment.managementTrust.score}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/apartment/${selectedApartment.id}`)}
                  >
                    View Full Profile
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
