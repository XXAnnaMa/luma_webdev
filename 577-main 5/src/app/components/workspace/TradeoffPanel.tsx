import { Apartment } from '../../data/workspaceData';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface TradeoffPanelProps {
  apartment: Apartment | null;
}

export function TradeoffPanel({ apartment }: TradeoffPanelProps) {
  if (!apartment) {
    return (
      <div 
        className="rounded-2xl p-6 flex items-center justify-center"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(46, 46, 46, 0.04)',
          minHeight: '400px',
        }}
      >
        <p style={{ fontSize: '14px', color: '#6B6B6B', textAlign: 'center' }}>
          Select an apartment to see detailed trade-offs
        </p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-2xl p-6"
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(46, 46, 46, 0.04)',
      }}
    >
      <h3 className="mb-6" style={{ fontSize: '18px', fontWeight: 600, color: '#2E2E2E' }}>
        Trade-off Analysis
      </h3>

      {/* Strengths Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={18} color="#A3B18A" />
          <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#2E2E2E' }}>
            Strengths
          </h4>
        </div>
        
        <ul className="space-y-3">
          {apartment.strengths.map((strength, index) => (
            <li 
              key={index}
              className="flex items-start gap-3"
            >
              <span 
                className="inline-block w-1.5 h-1.5 rounded-full mt-2"
                style={{ backgroundColor: '#A3B18A' }}
              />
              <span style={{ fontSize: '14px', color: '#2E2E2E', lineHeight: 1.6 }}>
                {strength}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trade-offs Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={18} color="#D88C8C" />
          <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#2E2E2E' }}>
            Trade-offs
          </h4>
        </div>
        
        <ul className="space-y-3">
          {apartment.tradeoffs.map((tradeoff, index) => (
            <li 
              key={index}
              className="flex items-start gap-3"
            >
              <span 
                className="inline-block w-1.5 h-1.5 rounded-full mt-2"
                style={{ backgroundColor: '#D88C8C' }}
              />
              <span style={{ fontSize: '14px', color: '#2E2E2E', lineHeight: 1.6 }}>
                {tradeoff}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Explanation */}
      <div 
        className="rounded-xl p-4"
        style={{
          backgroundColor: '#F7F6F2',
          borderLeft: '3px solid #A3B18A',
        }}
      >
        <p className="mb-1" style={{ fontSize: '12px', fontWeight: 600, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Recommendation
        </p>
        <p style={{ fontSize: '14px', color: '#2E2E2E', lineHeight: 1.6 }}>
          {apartment.explanation}
        </p>
      </div>

      {/* Attribute Scores */}
      <div className="mt-8">
        <h4 className="mb-4" style={{ fontSize: '14px', fontWeight: 600, color: '#2E2E2E' }}>
          Detailed Scores
        </h4>
        
        <div className="space-y-3">
          {Object.entries(apartment.attributes).map(([key, value]) => (
            <div key={key}>
              <div className="flex justify-between mb-2">
                <span style={{ fontSize: '13px', color: '#6B6B6B', textTransform: 'capitalize' }}>
                  {key}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#2E2E2E' }}>
                  {value}
                </span>
              </div>
              <div 
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: '#E8E6E1' }}
              >
                <div 
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${value}%`,
                    backgroundColor: value >= 80 ? '#A3B18A' : value >= 60 ? '#D6CCC2' : '#D88C8C',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
