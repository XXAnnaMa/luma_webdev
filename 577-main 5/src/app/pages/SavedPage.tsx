import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { mockApartments } from '../data/mockApartments';
import { rankApartments, defaultPreferences } from '../utils/ranking';
import { RankedApartment } from '../types';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react';
import { ListingCard } from '../components/ListingCard';

export function SavedPage() {
  const navigate = useNavigate();
  const [savedApartments, setSavedApartments] = useState<RankedApartment[]>([]);

  useEffect(() => {
    const savedIds = localStorage.getItem('savedApartments');
    if (savedIds) {
      try {
        const ids = JSON.parse(savedIds);
        const saved = mockApartments.filter(apt => ids.includes(apt.id));
        const ranked = rankApartments(saved, defaultPreferences);
        setSavedApartments(ranked);
      } catch (e) {
        console.error('Failed to load saved apartments');
      }
    }
  }, []);

  const handleRemove = (id: string) => {
    const savedIds = localStorage.getItem('savedApartments');
    if (savedIds) {
      try {
        const ids: string[] = JSON.parse(savedIds);
        const updated = ids.filter(savedId => savedId !== id);
        localStorage.setItem('savedApartments', JSON.stringify(updated));
        setSavedApartments(prev => prev.filter(apt => apt.id !== id));
      } catch (e) {
        console.error('Failed to remove apartment');
      }
    }
  };

  const handleCompare = () => {
    if (savedApartments.length >= 2) {
      const ids = savedApartments.slice(0, 2).map(apt => apt.id).join(',');
      navigate(`/compare?ids=${ids}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/explore')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Saved Apartments</h1>
              <p className="text-sm text-muted-foreground">
                {savedApartments.length} {savedApartments.length === 1 ? 'apartment' : 'apartments'} saved
              </p>
            </div>
          </div>
          
          {savedApartments.length >= 2 && (
            <Button onClick={handleCompare}>
              Compare Top 2
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-8 py-8">
        {savedApartments.length === 0 ? (
          <div className="text-center py-24">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No saved apartments yet</h2>
            <p className="text-muted-foreground mb-6">
              Start exploring and save apartments you're interested in
            </p>
            <Button size="lg" onClick={() => navigate('/explore')}>
              Explore Apartments
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedApartments.map((apartment) => (
              <div key={apartment.id} className="relative">
                <ListingCard
                  apartment={{
                    ...apartment,
                    saved: true
                  }}
                  onClick={() => navigate(`/apartment/${apartment.id}`)}
                  onToggleSave={() => handleRemove(apartment.id)}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
