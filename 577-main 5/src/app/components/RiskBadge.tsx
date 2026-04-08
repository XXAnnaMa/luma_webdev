import { RiskLevel } from '../types';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';

interface RiskBadgeProps {
  level: RiskLevel;
  label?: string;
  showConfidence?: boolean;
  confidence?: number;
}

export function RiskBadge({ level, label, showConfidence, confidence }: RiskBadgeProps) {
  const colors = {
    low: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20',
    medium: 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20',
    high: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20'
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant="outline" 
        className={cn('capitalize', colors[level])}
      >
        {label || level} Risk
      </Badge>
      {showConfidence && confidence !== undefined && (
        <span className="text-sm text-muted-foreground">
          {confidence}% confidence
        </span>
      )}
    </div>
  );
}
