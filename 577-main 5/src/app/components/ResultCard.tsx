import { RankedApartment } from '../types';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Heart, Eye, GitCompare } from 'lucide-react';
import { cn } from './ui/utils';

interface ResultCardProps {
  apartment: RankedApartment;
  rank: number;
  onView: () => void;
  onCompare: () => void;
  onToggleSave: () => void;
  isSelected?: boolean;
}

export function ResultCard({ 
  apartment, 
  rank, 
  onView, 
  onCompare, 
  onToggleSave,
  isSelected 
}: ResultCardProps) {
  return (
    <Card className={cn(
      "p-6 hover:shadow-md transition-all cursor-pointer",
      isSelected && "ring-2 ring-primary"
    )}>
      <div className="flex gap-4">
        {/* Image */}
        <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img 
            src={apartment.imageUrl} 
            alt={apartment.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs font-bold">
                  #{rank}
                </Badge>
                <span className="text-lg font-semibold truncate">{apartment.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-primary">
                  ${apartment.price.toLocaleString()}/mo
                </span>
                <span className="text-sm text-muted-foreground">{apartment.address}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave();
              }}
              className="flex-shrink-0"
            >
              <Heart 
                className={cn(
                  "w-5 h-5",
                  apartment.saved ? "fill-primary text-primary" : "text-muted-foreground"
                )} 
              />
            </Button>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {apartment.tags.map((tag, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Top Drivers */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Top Drivers:</p>
            <div className="flex flex-wrap gap-1.5">
              {apartment.topDrivers.map((driver, idx) => (
                <Badge key={idx} className="text-xs bg-primary/10 text-primary border-primary/20">
                  {driver}
                </Badge>
              ))}
            </div>
          </div>

          {/* Trade-off Summary */}
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              {apartment.tradeoffSummary.explanation}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={onView} className="flex-1">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button size="sm" variant="outline" onClick={onCompare}>
              <GitCompare className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
