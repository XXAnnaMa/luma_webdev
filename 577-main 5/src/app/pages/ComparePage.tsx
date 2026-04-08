import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { mockApartments } from '../data/mockApartments';
import { Apartment } from '../types';
import { ArrowLeft, MapPin } from 'lucide-react';
import { RiskBadge } from '../components/RiskBadge';

export function ComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [apartments, setApartments] = useState<Apartment[]>([]);

  useEffect(() => {
    const ids = searchParams.get('ids')?.split(',') || [];
    const selected = mockApartments.filter(apt => ids.includes(apt.id)).slice(0, 2);
    
    // If less than 2, add first available apartments
    if (selected.length < 2) {
      const remaining = mockApartments.filter(apt => !ids.includes(apt.id)).slice(0, 2 - selected.length);
      setApartments([...selected, ...remaining]);
    } else {
      setApartments(selected);
    }
  }, [searchParams]);

  if (apartments.length < 2) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Not enough apartments to compare</h2>
          <Button onClick={() => navigate('/explore')}>Back to Search</Button>
        </div>
      </div>
    );
  }

  const [apt1, apt2] = apartments;

  const CompareMetric = ({ label, value1, value2 }: { label: string; value1: any; value2: any }) => {
    const isDifferent = value1 !== value2;
    return (
      <div className="grid grid-cols-3 gap-4 py-3 border-b">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className={`text-sm font-semibold ${isDifferent ? 'text-primary' : ''}`}>
          {value1}
        </div>
        <div className={`text-sm font-semibold ${isDifferent ? 'text-primary' : ''}`}>
          {value2}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/explore')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </Button>
          
          <h1 className="text-2xl font-bold">Compare Apartments</h1>
          
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Column Headers */}
          <div /> {/* Empty for labels */}
          <div className="space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden shadow-md">
              <img src={apt1.imageUrl} alt={apt1.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">${apt1.price.toLocaleString()}/mo</h2>
              <h3 className="font-semibold mb-1">{apt1.title}</h3>
              <p className="text-sm text-muted-foreground flex items-start gap-1">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {apt1.address}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden shadow-md">
              <img src={apt2.imageUrl} alt={apt2.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">${apt2.price.toLocaleString()}/mo</h2>
              <h3 className="font-semibold mb-1">{apt2.title}</h3>
              <p className="text-sm text-muted-foreground flex items-start gap-1">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {apt2.address}
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-8 bg-card rounded-xl border p-6">
          <h3 className="text-xl font-semibold mb-6">Key Metrics</h3>
          
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-4 pb-3 border-b-2 font-semibold">
              <div>Metric</div>
              <div>{apt1.title.split(' ').slice(0, 2).join(' ')}</div>
              <div>{apt2.title.split(' ').slice(0, 2).join(' ')}</div>
            </div>

            <CompareMetric 
              label="Price" 
              value1={`$${apt1.price.toLocaleString()}/mo`}
              value2={`$${apt2.price.toLocaleString()}/mo`}
            />
            
            <CompareMetric 
              label="Location Score" 
              value1={apt1.location.score}
              value2={apt2.location.score}
            />
            
            <CompareMetric 
              label="Safety Score" 
              value1={apt1.buildingReliability.score}
              value2={apt2.buildingReliability.score}
            />
            
            <CompareMetric 
              label="Comfort Score" 
              value1={apt1.unitComfort.score}
              value2={apt2.unitComfort.score}
            />
            
            <CompareMetric 
              label="Cost Risk Score" 
              value1={apt1.costRisk.score}
              value2={apt2.costRisk.score}
            />

            {/* Tags Comparison */}
            <div className="grid grid-cols-3 gap-4 py-3 border-b">
              <div className="text-sm font-medium text-muted-foreground">Amenities</div>
              <div className="flex flex-wrap gap-1">
                {apt1.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {apt2.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Button 
            size="lg"
            onClick={() => navigate(`/apartment/${apt1.id}`)}
          >
            View {apt1.title.split(' ')[0]} Details
          </Button>
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate(`/apartment/${apt2.id}`)}
          >
            View {apt2.title.split(' ')[0]} Details
          </Button>
        </div>
      </main>
    </div>
  );
}
