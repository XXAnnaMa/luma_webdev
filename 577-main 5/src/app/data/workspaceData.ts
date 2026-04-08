export interface Apartment {
  id: string;
  name: string;
  rent: number;
  commute: number; // in minutes
  trustIndex: 'High' | 'Medium' | 'Low';
  noiseLevel: 'Low' | 'Medium' | 'High';
  sunlight: 'High' | 'Medium' | 'Low';
  safetyScore: number; // 0-100
  petAllowed: boolean;
  parkingCost: number;
  
  // Location data
  latitude: number;
  longitude: number;
  address: string;
  neighborhood: string;
  
  // Photos
  photos: string[];
  
  // Additional details
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  availableDate: string;
  
  // Scoring attributes
  attributes: {
    safety: number;
    commute: number;
    sunlight: number;
    noise: number;
    cost: number;
    management: number;
  };
  
  // Explainability
  strengths: string[];
  tradeoffs: string[];
  explanation: string;
}

export const mockApartments: Apartment[] = [
  {
    id: '1',
    name: 'Oakwood Residences',
    rent: 2400,
    commute: 15,
    trustIndex: 'High',
    noiseLevel: 'Low',
    sunlight: 'High',
    safetyScore: 92,
    petAllowed: true,
    parkingCost: 150,
    latitude: 34.0736,
    longitude: -118.4004,
    address: '123 Oakwood Lane, Beverly Hills, CA 90210',
    neighborhood: 'Beverly Hills',
    photos: [
      'https://images.unsplash.com/photo-1663756915301-2ba688e078cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzcxNjkxMzkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1600592858560-9fef0f602f40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmlnaHQlMjBzdW5saXQlMjBhcGFydG1lbnQlMjB3aW5kb3dzfGVufDF8fHx8MTc3MTc4MDUyMnww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1599412965471-e5f860059f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MTc2NzE3NHww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1200,
    availableDate: '2023-10-01',
    attributes: {
      safety: 92,
      commute: 85,
      sunlight: 90,
      noise: 85,
      cost: 60,
      management: 90,
    },
    strengths: [
      'Strong management reliability',
      'Excellent natural light',
      'Low crime exposure',
      'Good commute access',
    ],
    tradeoffs: [
      'Higher parking cost ($150/mo)',
      'Slightly above average rent',
    ],
    explanation: 'Best for users prioritizing safety and quality of life, with moderate cost tolerance.',
  },
  {
    id: '2',
    name: 'Metro Heights',
    rent: 1950,
    commute: 8,
    trustIndex: 'Medium',
    noiseLevel: 'High',
    sunlight: 'Low',
    safetyScore: 75,
    petAllowed: false,
    parkingCost: 0,
    latitude: 34.0407,
    longitude: -118.2468,
    address: '456 Metro Street, Los Angeles, CA 90012',
    neighborhood: 'Downtown LA',
    photos: [
      'https://images.unsplash.com/photo-1753182372047-5118a851913f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb3dudG93biUyMGNpdHklMjBhcGFydG1lbnQlMjBsb2Z0fGVufDF8fHx8MTc3MTc4MDUyMnww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1663756915301-2ba688e078cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzcxNjkxMzkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1599412965471-e5f860059f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MTc2NzE3NHww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    bedrooms: 1,
    bathrooms: 1,
    sqft: 800,
    availableDate: '2023-09-15',
    attributes: {
      safety: 75,
      commute: 95,
      sunlight: 40,
      noise: 45,
      cost: 90,
      management: 70,
    },
    strengths: [
      'Excellent commute time',
      'Lower rent',
      'Free parking included',
    ],
    tradeoffs: [
      'High noise from nearby street',
      'Limited natural sunlight',
      'No pets allowed',
      'Average management responsiveness',
    ],
    explanation: 'Ideal for budget-conscious commuters who prioritize location over comfort.',
  },
  {
    id: '3',
    name: 'Riverside Gardens',
    rent: 2200,
    commute: 22,
    trustIndex: 'High',
    noiseLevel: 'Low',
    sunlight: 'High',
    safetyScore: 88,
    petAllowed: true,
    parkingCost: 100,
    latitude: 34.0195,
    longitude: -118.4912,
    address: '789 Riverside Avenue, Santa Monica, CA 90401',
    neighborhood: 'Santa Monica',
    photos: [
      'https://images.unsplash.com/photo-1770776058258-24924b53aa98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlcnNpZGUlMjBhcGFydG1lbnQlMjB0ZXJyYWNlJTIwdmlld3xlbnwxfHx8fDE3NzE3ODA1MjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1600592858560-9fef0f602f40?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmlnaHQlMjBzdW5saXQlMjBhcGFydG1lbnQlMjB3aW5kb3dzfGVufDF8fHx8MTc3MTc4MDUyMnww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1663756915301-2ba688e078cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzcxNjkxMzkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
    availableDate: '2023-11-01',
    attributes: {
      safety: 88,
      commute: 65,
      sunlight: 95,
      noise: 90,
      cost: 70,
      management: 85,
    },
    strengths: [
      'Quiet, peaceful environment',
      'Excellent natural light',
      'Pet-friendly with amenities',
      'Safe neighborhood',
    ],
    tradeoffs: [
      'Longer commute time (22 min)',
      'Moderate parking cost',
    ],
    explanation: 'Perfect for those seeking comfort and tranquility, with flexible commute tolerance.',
  },
  {
    id: '4',
    name: 'Downtown Lofts',
    rent: 2650,
    commute: 5,
    trustIndex: 'Medium',
    noiseLevel: 'Medium',
    sunlight: 'Medium',
    safetyScore: 80,
    petAllowed: true,
    parkingCost: 200,
    latitude: 34.0928,
    longitude: -118.3287,
    address: '101 Downtown Road, Hollywood, CA 90028',
    neighborhood: 'Hollywood',
    photos: [
      'https://images.unsplash.com/photo-1663756915301-2ba688e078cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzcxNjkxMzkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1770776058258-24924b53aa98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlcnNpZGUlMjBhcGFydG1lbnQlMjB0ZXJyYWNlJTIwdmlld3xlbnwxfHx8fDE3NzE3ODA1MjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1599412965471-e5f860059f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MTc2NzE3NHww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1400,
    availableDate: '2023-08-01',
    attributes: {
      safety: 80,
      commute: 98,
      sunlight: 65,
      noise: 60,
      cost: 50,
      management: 75,
    },
    strengths: [
      'Prime location with 5-min commute',
      'Modern amenities',
      'Pet-friendly',
    ],
    tradeoffs: [
      'Highest overall cost',
      'Expensive parking ($200/mo)',
      'Moderate noise levels',
      'Average management trust',
    ],
    explanation: 'For high earners prioritizing location and time over cost savings.',
  },
  {
    id: '5',
    name: 'Parkside Terrace',
    rent: 2100,
    commute: 18,
    trustIndex: 'High',
    noiseLevel: 'Low',
    sunlight: 'Medium',
    safetyScore: 85,
    petAllowed: true,
    parkingCost: 75,
    latitude: 34.0878,
    longitude: -118.2704,
    address: '202 Parkside Drive, Silver Lake, CA 90026',
    neighborhood: 'Silver Lake',
    photos: [
      'https://images.unsplash.com/photo-1663756915301-2ba688e078cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcGFydG1lbnQlMjBpbnRlcmlvciUyMGxpdmluZyUyMHJvb218ZW58MXx8fHwxNzcxNjkxMzkxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1770776058258-24924b53aa98?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaXZlcnNpZGUlMjBhcGFydG1lbnQlMjB0ZXJyYWNlJTIwdmlld3xlbnwxfHx8fDE3NzE3ODA1MjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1599412965471-e5f860059f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBhcGFydG1lbnQlMjBidWlsZGluZyUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MTc2NzE3NHww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    bedrooms: 2,
    bathrooms: 2,
    sqft: 1300,
    availableDate: '2023-10-15',
    attributes: {
      safety: 85,
      commute: 75,
      sunlight: 70,
      noise: 80,
      cost: 75,
      management: 88,
    },
    strengths: [
      'Balanced pricing',
      'Reliable management',
      'Safe area with parks nearby',
      'Low parking cost',
    ],
    tradeoffs: [
      'Moderate sunlight exposure',
      'Average commute time',
    ],
    explanation: 'Well-rounded option for users seeking balance across all priorities.',
  },
];