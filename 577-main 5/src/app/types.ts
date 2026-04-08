export type RiskLevel = 'low' | 'medium' | 'high';

export interface Apartment {
  id: string;
  title: string;
  price: number;
  address: string;
  imageUrl: string;
  tags: string[];
  saved: boolean;
  lat: number;
  lng: number;
  
  // 7 Domain Scores
  location: DomainScore;
  buildingReliability: DomainScore;
  unitComfort: DomainScore;
  costRisk: DomainScore;
  amenities: DomainScore;
  managementTrust: DomainScore;
  reputationRisk: DomainScore;
}

export interface DomainScore {
  score: number; // 0-100
  confidence: number; // 0-100 (data completeness)
  metrics: Metric[];
  riskNotes?: string[];
  explanation?: string;
}

export interface Metric {
  label: string;
  value: string | number;
  risk?: RiskLevel;
}

export interface Preferences {
  constraints: {
    maxBudget: number;
    maxCommute: number;
    petsAllowed: boolean;
  };
  weights: {
    location: number;
    buildingReliability: number;
    unitComfort: number;
    costRisk: number;
    amenities: number;
    managementTrust: number;
    reputationRisk: number;
  };
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface RankedApartment extends Apartment {
  totalScore: number;
  topDrivers: string[];
  tradeoffSummary: {
    strengths: string[];
    weaknesses: string[];
    explanation: string;
  };
}