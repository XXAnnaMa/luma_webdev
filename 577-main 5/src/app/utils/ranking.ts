import { Apartment, Preferences, RankedApartment } from '../types';

export function rankApartments(
  apartments: Apartment[],
  preferences: Preferences
): RankedApartment[] {
  const ranked = apartments.map(apt => {
    const scores = {
      location: apt.location.score * preferences.weights.location,
      buildingReliability: apt.buildingReliability.score * preferences.weights.buildingReliability,
      unitComfort: apt.unitComfort.score * preferences.weights.unitComfort,
      costRisk: apt.costRisk.score * preferences.weights.costRisk,
      amenities: apt.amenities.score * preferences.weights.amenities,
      managementTrust: apt.managementTrust.score * preferences.weights.managementTrust,
      reputationRisk: apt.reputationRisk.score * preferences.weights.reputationRisk
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    // Calculate top 3 drivers
    const sortedScores = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const topDrivers = sortedScores.map(([key]) => formatDomainName(key));

    // Generate tradeoff summary
    const allScores = Object.entries({
      location: apt.location.score,
      buildingReliability: apt.buildingReliability.score,
      unitComfort: apt.unitComfort.score,
      costRisk: apt.costRisk.score,
      amenities: apt.amenities.score,
      managementTrust: apt.managementTrust.score,
      reputationRisk: apt.reputationRisk.score
    });

    const strengths = allScores
      .filter(([_, score]) => score >= 80)
      .map(([key]) => formatDomainName(key))
      .slice(0, 3);

    const weaknesses = allScores
      .filter(([_, score]) => score < 70)
      .map(([key]) => formatDomainName(key))
      .slice(0, 3);

    const explanation = generateExplanation(strengths, weaknesses);

    const rankedApt: RankedApartment = {
      ...apt,
      totalScore,
      topDrivers,
      tradeoffSummary: {
        strengths,
        weaknesses,
        explanation
      }
    };

    return rankedApt;
  });

  return ranked.sort((a, b) => b.totalScore - a.totalScore);
}

function formatDomainName(key: string): string {
  const names: Record<string, string> = {
    location: 'Location',
    buildingReliability: 'Building Quality',
    unitComfort: 'Unit Comfort',
    costRisk: 'Cost Value',
    amenities: 'Amenities',
    managementTrust: 'Management',
    reputationRisk: 'Reputation'
  };
  return names[key] || key;
}

function generateExplanation(strengths: string[], weaknesses: string[]): string {
  if (strengths.length === 0 && weaknesses.length === 0) {
    return 'Balanced option across all factors.';
  }
  
  if (weaknesses.length === 0) {
    return `Strong ${strengths.join(', ').toLowerCase()} with no major trade-offs.`;
  }
  
  if (strengths.length === 0) {
    return `Some concerns with ${weaknesses.join(', ').toLowerCase()}.`;
  }
  
  return `Strong ${strengths.slice(0, 2).join(' and ').toLowerCase()}, but ${weaknesses.slice(0, 2).join(' and ').toLowerCase()} are weaker.`;
}

export const defaultPreferences: Preferences = {
  constraints: {
    maxBudget: 5000,
    maxCommute: 45,
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
};

export const presetScenarios = {
  'Commute First': {
    ...defaultPreferences,
    weights: {
      location: 0.35,
      buildingReliability: 0.10,
      unitComfort: 0.10,
      costRisk: 0.20,
      amenities: 0.10,
      managementTrust: 0.10,
      reputationRisk: 0.05
    }
  },
  'Budget First': {
    ...defaultPreferences,
    weights: {
      location: 0.15,
      buildingReliability: 0.10,
      unitComfort: 0.10,
      costRisk: 0.35,
      amenities: 0.10,
      managementTrust: 0.10,
      reputationRisk: 0.10
    }
  },
  'Luxury Living': {
    ...defaultPreferences,
    weights: {
      location: 0.15,
      buildingReliability: 0.20,
      unitComfort: 0.25,
      costRisk: 0.05,
      amenities: 0.20,
      managementTrust: 0.10,
      reputationRisk: 0.05
    }
  },
  'Safe & Reliable': {
    ...defaultPreferences,
    weights: {
      location: 0.10,
      buildingReliability: 0.25,
      unitComfort: 0.10,
      costRisk: 0.15,
      amenities: 0.05,
      managementTrust: 0.25,
      reputationRisk: 0.10
    }
  }
};
