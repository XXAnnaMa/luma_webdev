import { Apartment } from '../types';

export const mockApartments: Apartment[] = [
  {
    id: '1',
    title: 'Sunny Loft in Mission District',
    price: 3200,
    address: '1234 Valencia St, San Francisco, CA',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    tags: ['Pet Friendly', 'Laundry in Unit', 'Parking'],
    saved: false,
    lat: 37.7599,
    lng: -122.4148,
    
    location: {
      score: 88,
      confidence: 95,
      explanation: 'Excellent walkability and transit access with short commute times',
      metrics: [
        { label: 'Walk Score', value: 95 },
        { label: 'Transit Score', value: 100 },
        { label: 'Commute Time', value: '18 min' },
        { label: 'Crime Rate', value: 'Low', risk: 'low' },
        { label: 'Noise Level', value: 'Moderate', risk: 'medium' }
      ],
      riskNotes: []
    },
    
    buildingReliability: {
      score: 92,
      confidence: 88,
      explanation: 'Well-maintained building with excellent safety features',
      metrics: [
        { label: 'Year Built', value: 2015 },
        { label: 'Last Renovation', value: 2023 },
        { label: 'Maintenance Rating', value: '4.8/5' },
        { label: 'Safety Features', value: 'Excellent' },
        { label: 'Building Violations', value: 0 }
      ],
      riskNotes: []
    },
    
    unitComfort: {
      score: 85,
      confidence: 90,
      explanation: 'Spacious unit with great natural light',
      metrics: [
        { label: 'Size', value: '850 sq ft' },
        { label: 'Bedrooms', value: '1 BR' },
        { label: 'Natural Light', value: 'Excellent' },
        { label: 'Floor Level', value: '5th' },
        { label: 'Condition', value: 'Recently Updated' }
      ],
      riskNotes: []
    },
    
    costRisk: {
      score: 75,
      confidence: 85,
      explanation: 'Reasonable price with moderate hidden costs',
      metrics: [
        { label: 'Base Rent', value: '$3,200' },
        { label: 'Utilities Estimate', value: '$150/mo', risk: 'low' },
        { label: 'Parking Cost', value: '$200/mo', risk: 'medium' },
        { label: 'Security Deposit', value: '$3,200' },
        { label: 'Lease Flexibility', value: 'Standard', risk: 'low' }
      ],
      riskNotes: ['Parking adds significant monthly cost']
    },
    
    amenities: {
      score: 80,
      confidence: 100,
      explanation: 'Good selection of modern amenities',
      metrics: [
        { label: 'Laundry', value: 'In-Unit' },
        { label: 'Parking', value: 'Available ($)' },
        { label: 'Gym', value: 'Yes' },
        { label: 'Roof Deck', value: 'Yes' },
        { label: 'Pet Policy', value: 'Allowed' }
      ],
      riskNotes: []
    },
    
    managementTrust: {
      score: 90,
      confidence: 92,
      explanation: 'Responsive management with strong tenant reviews',
      metrics: [
        { label: 'Response Time', value: '< 24 hrs' },
        { label: 'Tenant Reviews', value: '4.6/5' },
        { label: 'Maintenance Speed', value: 'Fast' },
        { label: 'Renewal Rate', value: '85%' },
        { label: 'Legal Issues', value: 'None' }
      ],
      riskNotes: []
    },
    
    reputationRisk: {
      score: 88,
      confidence: 78,
      explanation: 'Solid reputation with few complaints',
      metrics: [
        { label: 'Online Reviews', value: '4.4/5' },
        { label: 'Complaint History', value: 'Low' },
        { label: 'Turnover Rate', value: '15%' },
        { label: 'Community Rating', value: 'High' }
      ],
      riskNotes: []
    }
  },
  
  {
    id: '2',
    title: 'Budget Studio in SOMA',
    price: 2400,
    address: '567 Howard St, San Francisco, CA',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    tags: ['Studio', 'Affordable', 'Transit Nearby'],
    saved: false,
    lat: 37.7749,
    lng: -122.4194,
    
    location: {
      score: 92,
      confidence: 95,
      explanation: 'Prime location with excellent transit access',
      metrics: [
        { label: 'Walk Score', value: 98 },
        { label: 'Transit Score', value: 100 },
        { label: 'Commute Time', value: '12 min' },
        { label: 'Crime Rate', value: 'Medium', risk: 'medium' },
        { label: 'Noise Level', value: 'High', risk: 'high' }
      ],
      riskNotes: ['Higher crime and noise in SOMA area']
    },
    
    buildingReliability: {
      score: 68,
      confidence: 75,
      explanation: 'Older building with average maintenance',
      metrics: [
        { label: 'Year Built', value: 1985 },
        { label: 'Last Renovation', value: 2018 },
        { label: 'Maintenance Rating', value: '3.5/5' },
        { label: 'Safety Features', value: 'Basic' },
        { label: 'Building Violations', value: 2, risk: 'medium' }
      ],
      riskNotes: ['2 minor building violations in past year']
    },
    
    unitComfort: {
      score: 60,
      confidence: 88,
      explanation: 'Compact studio with limited natural light',
      metrics: [
        { label: 'Size', value: '420 sq ft' },
        { label: 'Bedrooms', value: 'Studio' },
        { label: 'Natural Light', value: 'Limited', risk: 'high' },
        { label: 'Floor Level', value: '2nd' },
        { label: 'Condition', value: 'Fair' }
      ],
      riskNotes: ['Limited natural light', 'Small space']
    },
    
    costRisk: {
      score: 90,
      confidence: 90,
      explanation: 'Great value with minimal hidden costs',
      metrics: [
        { label: 'Base Rent', value: '$2,400' },
        { label: 'Utilities Estimate', value: '$80/mo', risk: 'low' },
        { label: 'Parking Cost', value: 'N/A' },
        { label: 'Security Deposit', value: '$2,400' },
        { label: 'Lease Flexibility', value: 'Flexible', risk: 'low' }
      ],
      riskNotes: []
    },
    
    amenities: {
      score: 45,
      confidence: 100,
      explanation: 'Basic amenities only',
      metrics: [
        { label: 'Laundry', value: 'Shared' },
        { label: 'Parking', value: 'Street Only' },
        { label: 'Gym', value: 'No' },
        { label: 'Roof Deck', value: 'No' },
        { label: 'Pet Policy', value: 'Not Allowed' }
      ],
      riskNotes: []
    },
    
    managementTrust: {
      score: 72,
      confidence: 85,
      explanation: 'Adequate management with mixed reviews',
      metrics: [
        { label: 'Response Time', value: '2-3 days' },
        { label: 'Tenant Reviews', value: '3.8/5' },
        { label: 'Maintenance Speed', value: 'Moderate' },
        { label: 'Renewal Rate', value: '60%' },
        { label: 'Legal Issues', value: '1 minor', risk: 'low' }
      ],
      riskNotes: ['Some tenant complaints about responsiveness']
    },
    
    reputationRisk: {
      score: 70,
      confidence: 80,
      explanation: 'Average reputation with moderate turnover',
      metrics: [
        { label: 'Online Reviews', value: '3.6/5' },
        { label: 'Complaint History', value: 'Moderate', risk: 'medium' },
        { label: 'Turnover Rate', value: '40%', risk: 'medium' },
        { label: 'Community Rating', value: 'Medium' }
      ],
      riskNotes: ['High turnover may indicate issues']
    }
  },
  
  {
    id: '3',
    title: 'Luxury Penthouse Marina',
    price: 5800,
    address: '789 Marina Blvd, San Francisco, CA',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    tags: ['Luxury', 'View', 'Parking', 'Pet Friendly'],
    saved: true,
    lat: 37.8082,
    lng: -122.4194,
    
    location: {
      score: 75,
      confidence: 95,
      explanation: 'Beautiful waterfront location but longer commute',
      metrics: [
        { label: 'Walk Score', value: 88 },
        { label: 'Transit Score', value: 70 },
        { label: 'Commute Time', value: '35 min', risk: 'high' },
        { label: 'Crime Rate', value: 'Very Low', risk: 'low' },
        { label: 'Noise Level', value: 'Low', risk: 'low' }
      ],
      riskNotes: ['Longer commute time to downtown']
    },
    
    buildingReliability: {
      score: 95,
      confidence: 98,
      explanation: 'Premium new construction with top-tier features',
      metrics: [
        { label: 'Year Built', value: 2022 },
        { label: 'Last Renovation', value: 2024 },
        { label: 'Maintenance Rating', value: '5.0/5' },
        { label: 'Safety Features', value: 'Premium' },
        { label: 'Building Violations', value: 0 }
      ],
      riskNotes: []
    },
    
    unitComfort: {
      score: 98,
      confidence: 95,
      explanation: 'Exceptional space with luxury finishes',
      metrics: [
        { label: 'Size', value: '1,400 sq ft' },
        { label: 'Bedrooms', value: '2 BR + Den' },
        { label: 'Natural Light', value: 'Exceptional' },
        { label: 'Floor Level', value: 'Penthouse' },
        { label: 'Condition', value: 'Brand New' }
      ],
      riskNotes: []
    },
    
    costRisk: {
      score: 55,
      confidence: 88,
      explanation: 'High base cost with significant additional fees',
      metrics: [
        { label: 'Base Rent', value: '$5,800' },
        { label: 'Utilities Estimate', value: '$250/mo', risk: 'medium' },
        { label: 'Parking Cost', value: '$400/mo', risk: 'high' },
        { label: 'Security Deposit', value: '$11,600', risk: 'high' },
        { label: 'Lease Flexibility', value: 'Rigid', risk: 'high' }
      ],
      riskNotes: ['High upfront costs', 'Expensive parking', 'Inflexible lease terms']
    },
    
    amenities: {
      score: 100,
      confidence: 100,
      explanation: 'World-class amenities package',
      metrics: [
        { label: 'Laundry', value: 'In-Unit + Building' },
        { label: 'Parking', value: '2 Spaces ($)' },
        { label: 'Gym', value: 'Full Fitness Center' },
        { label: 'Roof Deck', value: 'Infinity Pool' },
        { label: 'Pet Policy', value: 'All Pets Welcome' }
      ],
      riskNotes: []
    },
    
    managementTrust: {
      score: 95,
      confidence: 90,
      explanation: 'Premium management with concierge service',
      metrics: [
        { label: 'Response Time', value: '< 1 hour' },
        { label: 'Tenant Reviews', value: '4.9/5' },
        { label: 'Maintenance Speed', value: 'Immediate' },
        { label: 'Renewal Rate', value: '90%' },
        { label: 'Legal Issues', value: 'None' }
      ],
      riskNotes: []
    },
    
    reputationRisk: {
      score: 92,
      confidence: 85,
      explanation: 'Excellent reputation in luxury market',
      metrics: [
        { label: 'Online Reviews', value: '4.8/5' },
        { label: 'Complaint History', value: 'Very Low' },
        { label: 'Turnover Rate', value: '10%' },
        { label: 'Community Rating', value: 'Premium' }
      ],
      riskNotes: []
    }
  },
  
  {
    id: '4',
    title: 'Charming Victorian Noe Valley',
    price: 3800,
    address: '234 Sanchez St, San Francisco, CA',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    tags: ['Quiet', 'Garden', 'Pet Friendly'],
    saved: false,
    lat: 37.7422,
    lng: -122.4194,
    
    location: {
      score: 82,
      confidence: 92,
      explanation: 'Quiet residential area with moderate transit access',
      metrics: [
        { label: 'Walk Score', value: 90 },
        { label: 'Transit Score', value: 75 },
        { label: 'Commute Time', value: '28 min', risk: 'medium' },
        { label: 'Crime Rate', value: 'Very Low', risk: 'low' },
        { label: 'Noise Level', value: 'Very Low', risk: 'low' }
      ],
      riskNotes: []
    },
    
    buildingReliability: {
      score: 78,
      confidence: 80,
      explanation: 'Historic building with character but aging systems',
      metrics: [
        { label: 'Year Built', value: 1920 },
        { label: 'Last Renovation', value: 2020 },
        { label: 'Maintenance Rating', value: '4.2/5' },
        { label: 'Safety Features', value: 'Good' },
        { label: 'Building Violations', value: 0 }
      ],
      riskNotes: ['Older plumbing and electrical systems']
    },
    
    unitComfort: {
      score: 88,
      confidence: 92,
      explanation: 'Spacious with period details and garden access',
      metrics: [
        { label: 'Size', value: '1,100 sq ft' },
        { label: 'Bedrooms', value: '2 BR' },
        { label: 'Natural Light', value: 'Good' },
        { label: 'Floor Level', value: 'Garden Level' },
        { label: 'Condition', value: 'Renovated' }
      ],
      riskNotes: []
    },
    
    costRisk: {
      score: 80,
      confidence: 75,
      explanation: 'Fair price with some utility uncertainty',
      metrics: [
        { label: 'Base Rent', value: '$3,800' },
        { label: 'Utilities Estimate', value: '$200/mo', risk: 'medium' },
        { label: 'Parking Cost', value: 'Included' },
        { label: 'Security Deposit', value: '$3,800' },
        { label: 'Lease Flexibility', value: 'Negotiable', risk: 'low' }
      ],
      riskNotes: ['Older building may have higher utility costs']
    },
    
    amenities: {
      score: 65,
      confidence: 100,
      explanation: 'Limited amenities but unique features',
      metrics: [
        { label: 'Laundry', value: 'Shared in Building' },
        { label: 'Parking', value: '1 Space Included' },
        { label: 'Gym', value: 'No' },
        { label: 'Garden', value: 'Private Access' },
        { label: 'Pet Policy', value: 'Cats & Dogs OK' }
      ],
      riskNotes: []
    },
    
    managementTrust: {
      score: 85,
      confidence: 88,
      explanation: 'Individual landlord with good track record',
      metrics: [
        { label: 'Response Time', value: '1 day' },
        { label: 'Tenant Reviews', value: '4.5/5' },
        { label: 'Maintenance Speed', value: 'Good' },
        { label: 'Renewal Rate', value: '75%' },
        { label: 'Legal Issues', value: 'None' }
      ],
      riskNotes: []
    },
    
    reputationRisk: {
      score: 82,
      confidence: 70,
      explanation: 'Limited reviews but positive feedback',
      metrics: [
        { label: 'Online Reviews', value: '4.3/5' },
        { label: 'Complaint History', value: 'Low' },
        { label: 'Turnover Rate', value: '25%' },
        { label: 'Community Rating', value: 'High' }
      ],
      riskNotes: ['Limited data - new to market']
    }
  }
];