import { UserPreferences } from '../../pages/DecisionWorkspace';
import { Slider } from '../ui/slider';

interface PreferencePanelProps {
  preferences: UserPreferences;
  onChange: (updates: Partial<UserPreferences>) => void;
}

export function PreferencePanel({ preferences, onChange }: PreferencePanelProps) {
  return (
    <div 
      className="rounded-2xl p-6"
      style={{
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(46, 46, 46, 0.04)',
      }}
    >
      <h3 className="mb-8" style={{ fontSize: '18px', fontWeight: 600, color: '#2E2E2E' }}>
        Preferences
      </h3>

      {/* Hard Constraints */}
      <div className="mb-10">
        <p className="mb-4" style={{ fontSize: '13px', fontWeight: 500, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Constraints
        </p>
        
        {/* Pet Allowed Toggle */}
        <label className="flex items-center justify-between mb-4 cursor-pointer">
          <span style={{ fontSize: '14px', color: '#2E2E2E' }}>Pet allowed</span>
          <input
            type="checkbox"
            checked={preferences.petAllowed}
            onChange={(e) => onChange({ petAllowed: e.target.checked })}
            className="w-5 h-5 rounded cursor-pointer"
            style={{ accentColor: '#A3B18A' }}
          />
        </label>

        {/* Budget Range */}
        <div className="mb-2">
          <label style={{ fontSize: '14px', color: '#2E2E2E', display: 'block', marginBottom: '12px' }}>
            Budget range
          </label>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="number"
              value={preferences.budgetMin}
              onChange={(e) => onChange({ budgetMin: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                fontSize: '14px',
                borderColor: '#E8E6E1',
                backgroundColor: '#F7F6F2',
              }}
              placeholder="Min"
            />
            <span style={{ color: '#6B6B6B' }}>—</span>
            <input
              type="number"
              value={preferences.budgetMax}
              onChange={(e) => onChange({ budgetMax: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                fontSize: '14px',
                borderColor: '#E8E6E1',
                backgroundColor: '#F7F6F2',
              }}
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* Soft Preferences */}
      <div className="mb-10">
        <p className="mb-6" style={{ fontSize: '13px', fontWeight: 500, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Priorities
        </p>

        {/* Sunlight Preference */}
        <div className="mb-6">
          <div className="flex justify-between mb-3">
            <label style={{ fontSize: '14px', color: '#2E2E2E' }}>Sunlight preference</label>
            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>{preferences.sunlightPreference}</span>
          </div>
          <Slider
            value={[preferences.sunlightPreference]}
            onValueChange={([value]) => onChange({ sunlightPreference: value })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Noise Tolerance */}
        <div className="mb-6">
          <div className="flex justify-between mb-3">
            <label style={{ fontSize: '14px', color: '#2E2E2E' }}>Noise tolerance</label>
            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>{preferences.noiseTolerance}</span>
          </div>
          <Slider
            value={[preferences.noiseTolerance]}
            onValueChange={([value]) => onChange({ noiseTolerance: value })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Commute Importance */}
        <div className="mb-6">
          <div className="flex justify-between mb-3">
            <label style={{ fontSize: '14px', color: '#2E2E2E' }}>Commute importance</label>
            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>{preferences.commuteImportance}</span>
          </div>
          <Slider
            value={[preferences.commuteImportance]}
            onValueChange={([value]) => onChange({ commuteImportance: value })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Cost Sensitivity */}
        <div className="mb-6">
          <div className="flex justify-between mb-3">
            <label style={{ fontSize: '14px', color: '#2E2E2E' }}>Cost sensitivity</label>
            <span style={{ fontSize: '13px', color: '#6B6B6B' }}>{preferences.costSensitivity}</span>
          </div>
          <Slider
            value={[preferences.costSensitivity]}
            onValueChange={([value]) => onChange({ costSensitivity: value })}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Risk Tolerance */}
      <div className="mb-10">
        <p className="mb-4" style={{ fontSize: '13px', fontWeight: 500, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Risk Tolerance
        </p>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as const).map((level) => (
            <button
              key={level}
              onClick={() => onChange({ riskTolerance: level })}
              className="flex-1 py-2 px-3 rounded-lg transition-all"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: preferences.riskTolerance === level ? '#A3B18A' : '#F7F6F2',
                color: preferences.riskTolerance === level ? '#FFFFFF' : '#6B6B6B',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Lifestyle Mode */}
      <div>
        <p className="mb-4" style={{ fontSize: '13px', fontWeight: 500, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Lifestyle Mode
        </p>
        <div className="flex gap-2">
          {(['student', 'professional', 'family'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onChange({ lifestyleMode: mode })}
              className="flex-1 py-2 px-3 rounded-lg transition-all"
              style={{
                fontSize: '13px',
                fontWeight: 500,
                backgroundColor: preferences.lifestyleMode === mode ? '#A3B18A' : '#F7F6F2',
                color: preferences.lifestyleMode === mode ? '#FFFFFF' : '#6B6B6B',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
