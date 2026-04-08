import { RankedApartment } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Star, Heart } from 'lucide-react';
import { cn } from './ui/utils';

interface ListingCardProps {
  apartment: RankedApartment;
  onHover?: () => void;
  onLeave?: () => void;
  onClick?: () => void;
  onToggleSave?: () => void;
  isHighlighted?: boolean;
}

export function ListingCard({ 
  apartment, 
  onHover, 
  onLeave, 
  onClick,
  onToggleSave,
  isHighlighted 
}: ListingCardProps) {
  const overallScore = Math.round(apartment.totalScore);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSave?.();
  };

  return (
    <Card 
      className={cn(
        "p-4 hover:shadow-lg transition-all cursor-pointer border-2 rounded-xl",
        isHighlighted ? "border-primary shadow-lg scale-[1.02]" : "border-transparent hover:border-border"
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-28 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img 
            src={apartment.imageUrl} 
            alt={apartment.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Price & Save */}
          <div className="flex items-baseline justify-between mb-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                ${apartment.price.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">/mo</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSaveClick}
              className="h-8 w-8 -mr-2 -mt-1"
            >
              <Heart 
                className={cn(
                  "w-4 h-4",
                  apartment.saved ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            </Button>
          </div>

          {/* Location */}
          <p className="text-sm text-muted-foreground mb-2 truncate">
            {apartment.address.split(',')[0]}
          </p>

          {/* Tags - max 3 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {apartment.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Score */}
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-semibold">{overallScore}</span>
            <span className="text-xs text-muted-foreground">score</span>
          </div>

          {/* 1-line trade-off insight */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            💡 {apartment.tradeoffSummary.explanation}
          </p>
        </div>
      </div>
    </Card>
  );
}