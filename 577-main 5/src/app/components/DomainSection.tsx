import { DomainScore } from '../types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { AlertCircle } from 'lucide-react';

interface DomainSectionProps {
  title: string;
  domain: DomainScore;
}

export function DomainSection({ title, domain }: DomainSectionProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-[#16A34A]';
    if (score >= 60) return 'text-[#F59E0B]';
    return 'text-[#DC2626]';
  };

  const getMetricRiskColor = (risk?: string) => {
    if (!risk) return '';
    if (risk === 'low') return 'text-[#16A34A]';
    if (risk === 'medium') return 'text-[#F59E0B]';
    return 'text-[#DC2626]';
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{domain.explanation}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={`text-3xl font-bold ${getScoreColor(domain.score)}`}>
            {domain.score}
          </div>
          <Badge variant="secondary" className="text-xs">
            {domain.confidence}% data
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {domain.metrics.map((metric, idx) => (
          <div key={idx} className="flex justify-between items-center p-2 bg-muted/30 rounded-lg">
            <span className="text-sm text-muted-foreground">{metric.label}</span>
            <span className={`text-sm font-medium ${getMetricRiskColor(metric.risk)}`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>

      {domain.riskNotes && domain.riskNotes.length > 0 && (
        <div className="pt-3 border-t space-y-2">
          {domain.riskNotes.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-[#F59E0B]">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{note}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
