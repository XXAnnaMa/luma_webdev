export interface Event {
  id: string;
  title: string;
  description: string;
  
  // Location
  address: string;
  latitude: number;
  longitude: number;
  
  // Time
  date: string;
  time: string;
  
  // Details
  category: string;
  participantLimit: number;
  currentParticipants: number;
  
  // Media
  image: string;
  
  // Contact
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;

  // Ownership (from backend)
  userId?: number;
  
  // Tags
  tags: string[];
}

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Sunset Yoga in Venice Beach',
    description: 'Join us for a relaxing sunset yoga session on the beach. All levels welcome. Bring your own mat.',
    address: 'Venice Beach, Los Angeles, CA 90291',
    latitude: 33.9850,
    longitude: -118.4695,
    date: '2026-03-15',
    time: '18:00',
    category: 'Wellness',
    participantLimit: 30,
    currentParticipants: 12,
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b2dhJTIwc3Vuc2V0JTIwYmVhY2h8ZW58MXx8fHwxNzQwNDg4MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    organizerName: 'Sarah Martinez',
    organizerEmail: 'sarah@yogabeach.com',
    tags: ['Wellness', 'Outdoor', 'Free'],
  },
  {
    id: '2',
    title: 'Downtown Art Gallery Opening',
    description: 'Exclusive opening night for our new contemporary art exhibition featuring local LA artists.',
    address: '453 S Spring St, Los Angeles, CA 90013',
    latitude: 34.0479,
    longitude: -118.2506,
    date: '2026-03-08',
    time: '19:00',
    category: 'Art',
    participantLimit: 100,
    currentParticipants: 67,
    image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBnYWxsZXJ5JTIwb3BlbmluZ3xlbnwxfHx8fDE3NDA0ODgwMDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
    organizerName: 'DTLA Gallery',
    organizerEmail: 'events@dtlagallery.com',
    organizerPhone: '(213) 555-0123',
    tags: ['Art', 'Culture', 'Networking'],
  },
  {
    id: '3',
    title: 'Coffee & Code: Developer Meetup',
    description: 'Monthly meetup for developers to share projects, learn new skills, and network. Coffee and snacks provided.',
    address: '1200 Wilshire Blvd, Santa Monica, CA 90403',
    latitude: 34.0407,
    longitude: -118.4952,
    date: '2026-03-12',
    time: '10:00',
    category: 'Tech',
    participantLimit: 50,
    currentParticipants: 38,
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXZlbG9wZXIlMjBtZWV0dXAlMjBjb2ZmZWV8ZW58MXx8fHwxNzQwNDg4MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    organizerName: 'Tech Community LA',
    organizerEmail: 'hello@techcommunity.la',
    tags: ['Tech', 'Networking', 'Learning'],
  },
  {
    id: '4',
    title: 'Hollywood Hills Hiking Group',
    description: 'Weekly group hike through the beautiful Hollywood Hills trails. Moderate difficulty, 5 miles round trip.',
    address: 'Griffith Observatory, Los Angeles, CA 90027',
    latitude: 34.1184,
    longitude: -118.3004,
    date: '2026-03-09',
    time: '07:30',
    category: 'Sports',
    participantLimit: 25,
    currentParticipants: 18,
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWtpbmclMjBncm91cCUyMHN1bnJpc2V8ZW58MXx8fHwxNzQwNDg4MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    organizerName: 'LA Hiking Club',
    organizerEmail: 'info@lahikingclub.com',
    tags: ['Sports', 'Outdoor', 'Health'],
  },
  {
    id: '5',
    title: 'Live Jazz Night at The Blue Room',
    description: 'Intimate jazz performance featuring renowned saxophonist Marcus Cole. Limited seating available.',
    address: '1743 Cahuenga Blvd, Los Angeles, CA 90028',
    latitude: 34.1016,
    longitude: -118.3287,
    date: '2026-03-14',
    time: '20:30',
    category: 'Music',
    participantLimit: 80,
    currentParticipants: 52,
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxqYXp6JTIwbGl2ZSUyMG11c2ljfGVufDF8fHx8MTc0MDQ4ODAwMHww&ixlib=rb-4.1.0&q=80&w=1080',
    organizerName: 'The Blue Room',
    organizerEmail: 'bookings@theblueroom.la',
    organizerPhone: '(323) 555-0199',
    tags: ['Music', 'Social', 'Nightlife'],
  },
  {
    id: '6',
    title: 'Farmers Market & Artisan Fair',
    description: 'Weekly farmers market featuring organic produce, handmade crafts, and live music. Family-friendly event.',
    address: '1050 S Flower St, Los Angeles, CA 90015',
    latitude: 34.0407,
    longitude: -118.2624,
    date: '2026-03-10',
    time: '09:00',
    category: 'Food',
    participantLimit: 500,
    currentParticipants: 234,
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtZXJzJTIwbWFya2V0JTIwZnJ1aXR8ZW58MXx8fHwxNzQwNDg4MDAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    organizerName: 'Downtown LA Markets',
    organizerEmail: 'info@dtlamarkets.com',
    tags: ['Food', 'Family', 'Local'],
  },
];

export const categories = [
  'All',
  'Art',
  'Food',
  'Music',
  'Sports',
  'Tech',
  'Wellness',
  'Social',
];
