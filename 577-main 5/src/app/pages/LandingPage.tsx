import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Sliders, TrendingUp } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F6F2' }}>
      {/* Header */}
      <header 
        className="px-8 py-6 flex items-center justify-between"
        style={{ 
          backgroundColor: 'transparent',
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#2E2E2E', letterSpacing: '-0.01em' }}>
          R8APT
        </h2>
        <button
          onClick={() => navigate('/workspace')}
          className="px-6 py-2 rounded-full transition-all"
          style={{
            backgroundColor: 'transparent',
            color: '#6B6B6B',
            fontSize: '14px',
            fontWeight: 500,
            border: '1px solid #E8E6E1',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#A3B18A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#E8E6E1';
          }}
        >
          Go to Workspace
        </button>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-8 pt-24 pb-24 text-center">
        <h1 className="mb-6 max-w-3xl" style={{ 
          fontSize: '48px', 
          fontWeight: 600,
          lineHeight: 1.2,
          color: '#2E2E2E',
          letterSpacing: '-0.02em'
        }}>
          Make better apartment decisions
        </h1>
        
        <p className="mb-12 max-w-2xl" style={{ 
          fontSize: '18px',
          lineHeight: 1.6,
          color: '#6B6B6B',
          letterSpacing: '0.01em'
        }}>
          Structured, explainable, and personalized decision support
        </p>
        
        <button
          onClick={() => navigate('/explore')}
          className="px-12 py-4 rounded-full transition-all duration-200"
          style={{
            backgroundColor: '#A3B18A',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(163, 177, 138, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(163, 177, 138, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(163, 177, 138, 0.2)';
          }}
        >
          Start your decision
        </button>
      </section>

      {/* How It Works Section */}
      <section className="px-8 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: '#A3B18A' }}
              >
                <Sliders size={32} color="#FFFFFF" />
              </div>
              <h3 className="mb-4" style={{ color: '#2E2E2E', fontSize: '20px', fontWeight: 600 }}>
                Input your preferences
              </h3>
              <p style={{ color: '#6B6B6B', fontSize: '15px', lineHeight: 1.6 }}>
                Set your priorities, constraints, and risk tolerance to personalize your evaluation
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: '#A3B18A' }}
              >
                <CheckCircle2 size={32} color="#FFFFFF" />
              </div>
              <h3 className="mb-4" style={{ color: '#2E2E2E', fontSize: '20px', fontWeight: 600 }}>
                See structured profiles
              </h3>
              <p style={{ color: '#6B6B6B', fontSize: '15px', lineHeight: 1.6 }}>
                Review apartments through clear, organized attributes designed for decision-making
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
                style={{ backgroundColor: '#A3B18A' }}
              >
                <TrendingUp size={32} color="#FFFFFF" />
              </div>
              <h3 className="mb-4" style={{ color: '#2E2E2E', fontSize: '20px', fontWeight: 600 }}>
                Understand trade-offs
              </h3>
              <p style={{ color: '#6B6B6B', fontSize: '15px', lineHeight: 1.6 }}>
                Get clear explanations of strengths, weaknesses, and personalized rankings
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="flex flex-col items-center justify-center px-8 py-24">
        <button
          onClick={() => navigate('/explore')}
          className="px-12 py-4 rounded-full transition-all duration-200"
          style={{
            backgroundColor: '#A3B18A',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(163, 177, 138, 0.2)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(163, 177, 138, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(163, 177, 138, 0.2)';
          }}
        >
          Start your decision
        </button>
      </section>
    </div>
  );
}