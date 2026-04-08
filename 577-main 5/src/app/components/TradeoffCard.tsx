import { Card } from './ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TradeoffCardProps {
  strengths: string[];
  weaknesses: string[];
  explanation: string;
}

export function TradeoffCard({ strengths, weaknesses, explanation }: TradeoffCardProps) {
  return (
    <Card className="p-6 space-y-4">
      <div>
        <h4 className="mb-2">Trade-off Analysis</h4>
        <p className="text-sm text-muted-foreground">{explanation}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#16A34A]">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Strengths</span>
          </div>
          <ul className="space-y-1.5">
            {strengths.map((strength, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-[#16A34A] mt-1">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[#DC2626]">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">Weaknesses</span>
          </div>
          <ul className="space-y-1.5">
            {weaknesses.map((weakness, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-[#DC2626] mt-1">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}
