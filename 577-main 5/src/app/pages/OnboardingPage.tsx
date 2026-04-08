import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { ArrowRight, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '../types';

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState<Preferences>({
    constraints: {
      maxBudget: 4000,
      maxCommute: 30,
      petsAllowed: false
    },
    weights: {
      location: 0.20,
      buildingReliability: 0.15,
      unitComfort: 0.15,
      costRisk: 0.20,
      amenities: 0.10,
      managementTrust: 0.10,
      reputationRisk: 0.10
    },
    riskTolerance: 'medium'
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Save preferences and navigate to workspace
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      navigate('/workspace');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">R8</span>
            </div>
            <span className="text-xl font-bold">R8APT</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Home
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Conversational Input */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Let's Start With Your Must-Haves</h2>
                    <p className="text-muted-foreground">
                      Tell us your hard constraints - these are non-negotiable requirements.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget">Maximum Monthly Budget</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="budget"
                          type="number"
                          value={preferences.constraints.maxBudget}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            constraints: {
                              ...preferences.constraints,
                              maxBudget: parseInt(e.target.value) || 0
                            }
                          })}
                          className="max-w-xs"
                        />
                        <span className="text-muted-foreground">per month</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="commute">Maximum Commute Time</Label>
                      <div className="flex items-center gap-4">
                        <Input
                          id="commute"
                          type="number"
                          value={preferences.constraints.maxCommute}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            constraints: {
                              ...preferences.constraints,
                              maxCommute: parseInt(e.target.value) || 0
                            }
                          })}
                          className="max-w-xs"
                        />
                        <span className="text-muted-foreground">minutes</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pets"
                        checked={preferences.constraints.petsAllowed}
                        onCheckedChange={(checked) => setPreferences({
                          ...preferences,
                          constraints: {
                            ...preferences.constraints,
                            petsAllowed: checked === true
                          }
                        })}
                      />
                      <Label htmlFor="pets" className="cursor-pointer">
                        I need a pet-friendly apartment
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">What Matters Most to You?</h2>
                    <p className="text-muted-foreground">
                      Rank these factors by importance. We'll use this to personalize your results.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'location', label: 'Location & Transportation', desc: 'Walkability, transit, commute time' },
                      { key: 'costRisk', label: 'Cost & Value', desc: 'True cost, hidden fees, lease flexibility' },
                      { key: 'unitComfort', label: 'Unit Comfort', desc: 'Size, light, condition, layout' },
                      { key: 'buildingReliability', label: 'Building Quality', desc: 'Age, maintenance, safety features' },
                      { key: 'amenities', label: 'Amenities', desc: 'Laundry, parking, gym, outdoor space' },
                      { key: 'managementTrust', label: 'Management Trust', desc: 'Responsiveness, reviews, track record' },
                      { key: 'reputationRisk', label: 'Reputation & Reviews', desc: 'Tenant feedback, turnover rate' }
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <Label className="text-base">{label}</Label>
                            <p className="text-sm text-muted-foreground">{desc}</p>
                          </div>
                          <Badge variant="secondary">
                            {Math.round((preferences.weights[key as keyof typeof preferences.weights] || 0) * 100)}%
                          </Badge>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="5"
                          value={(preferences.weights[key as keyof typeof preferences.weights] || 0) * 100}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) / 100;
                            setPreferences({
                              ...preferences,
                              weights: {
                                ...preferences.weights,
                                [key]: newValue
                              }
                            });
                          }}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">One Last Thing: Risk Tolerance</h2>
                    <p className="text-muted-foreground">
                      How comfortable are you with uncertainty in apartment selection?
                    </p>
                  </div>

                  <RadioGroup
                    value={preferences.riskTolerance}
                    onValueChange={(value) => setPreferences({
                      ...preferences,
                      riskTolerance: value as 'low' | 'medium' | 'high'
                    })}
                  >
                    <div className="space-y-3">
                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="low" id="low" className="mt-1" />
                          <Label htmlFor="low" className="cursor-pointer flex-1">
                            <div className="font-medium mb-1">Low Risk - Play It Safe</div>
                            <p className="text-sm text-muted-foreground">
                              I prefer established buildings with proven track records, even if it costs more.
                            </p>
                          </Label>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="medium" id="medium" className="mt-1" />
                          <Label htmlFor="medium" className="cursor-pointer flex-1">
                            <div className="font-medium mb-1">Medium Risk - Balanced Approach</div>
                            <p className="text-sm text-muted-foreground">
                              I'm open to newer buildings or individual landlords if the value is there.
                            </p>
                          </Label>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value="high" id="high" className="mt-1" />
                          <Label htmlFor="high" className="cursor-pointer flex-1">
                            <div className="font-medium mb-1">High Risk - Value Hunter</div>
                            <p className="text-sm text-muted-foreground">
                              I'm willing to take chances on unknowns to get the best deal or unique features.
                            </p>
                          </Label>
                        </div>
                      </Card>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </Card>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button onClick={handleNext}>
                {step === totalSteps ? 'Generate Rankings' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>

          {/* Right: Real-time Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 space-y-6 sticky top-24">
              <div>
                <h3 className="font-semibold mb-4">Your Preferences</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Hard Constraints</Label>
                    <div className="mt-2 space-y-1.5 text-sm">
                      <div>Budget: <span className="font-medium">${preferences.constraints.maxBudget.toLocaleString()}/mo</span></div>
                      <div>Commute: <span className="font-medium">{preferences.constraints.maxCommute} min max</span></div>
                      <div>Pets: <span className="font-medium">{preferences.constraints.petsAllowed ? 'Required' : 'Not required'}</span></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-sm text-muted-foreground">Top Priorities</Label>
                    <div className="mt-2 space-y-1.5">
                      {Object.entries(preferences.weights)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="mr-2">
                            {key.replace(/([A-Z])/g, ' $1').trim()}: {Math.round(value * 100)}%
                          </Badge>
                        ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-sm text-muted-foreground">Risk Tolerance</Label>
                    <div className="mt-2">
                      <Badge className="capitalize">{preferences.riskTolerance}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
