import { RankedApartment } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, Heart, Eye } from 'lucide-react';
import { cn } from './ui/utils';

interface MapPreviewCardProps {
  apartment: RankedApartment;
  onClose: () => void;
  onViewDetails: () => void;
  onToggleSave?: () => void;
}

export function MapPreviewCard({ 
  apartment, 
  onClose, 
  onViewDetails,
  onToggleSave 
}: MapPreviewCardProps) {
  const overallScore = Math.round(apartment.totalScore);

  return (
    <Card className="w-96 overflow-hidden shadow-2xl rounded-xl border-2">
      {/* Image */}
      <div className="relative">
        <img 
          src={apartment.imageUrl} 
          alt={apartment.title}
          className="w-full h-48 object-cover"
        />
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-3 right-3 h-9 w-9 rounded-full shadow-lg"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-foreground">
              ${apartment.price.toLocaleString()}
            </span>
            <span className="text-base text-muted-foreground">/mo</span>
          </div>
          <p className="text-sm text-muted-foreground">{apartment.address.split(',').slice(0, 2).join(',')}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {apartment.tags.slice(0, 3).map((tag, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Insight */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          💡 {apartment.tradeoffSummary.explanation}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="default" onClick={onViewDetails} className="flex-1">
            View Details
          </Button>
          <Button 
            size="icon" 
            variant="outline"
            onClick={onToggleSave}
            className="h-10 w-10"
          >
            <Heart className={cn(
              "w-4 h-4",
              apartment.saved && "fill-primary text-primary"
            )} />
          </Button>
        </div>
      </div>
    </Card>
  );
}