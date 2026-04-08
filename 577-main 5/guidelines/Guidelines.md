# LUMA Event Platform - Implementation Guidelines

> **Last Updated:** February 25, 2026  
> **Platform:** Event Discovery & Social Networking  
> **Brand:** LUMA

## ❗️❗️❗️目前是把网站可能需要的功能全部添加上了，但不一定需要全部实现，可以按需调整
---

## 🎯 Project Overview

### Mission
LUMA is a sophisticated event discovery platform that enables users to discover, share, and bookmark social events with a minimal, high-end aesthetic.

### Core Features
- ✅ **Map-Based Discovery**: Interactive Leaflet maps with custom pins
- ✅ **Event Management**: Create, view, filter, and search events
- ✅ **Bookmark System**: Save favorite events with localStorage persistence
- ✅ **AI Chatbot**: Event recommendations and assistance
- ✅ **User Authentication**: Login/Register system
- ✅ **Responsive Design**: Mobile and desktop optimized

### Design Philosophy
- **Minimal & Sophisticated**: Clean, uncluttered interfaces
- **High-End Feel**: Premium aesthetic with subtle animations
- **NOT Playful**: Calm, professional, mature design language
- **8px Grid System**: All spacing must be multiples of 8px

---

## 🎨 Design System

### Color Palette

```css
/* Primary Colors */
--background: #F7F5F0;        /* Warm beige background */
--card: #FFFFFF;              /* Pure white cards */
--primary: #2E1A1A;           /* Deep brown (text/buttons) */
--accent: #C2B280;            /* Gold accent (tags/pins) */
--border: #E5E2DA;            /* Soft border color */

/* Supporting Colors */
--secondary-bg: #F5F3EE;      /* Input backgrounds */
--text-muted: #6B6B6B;        /* Secondary text */
--shadow: rgba(46, 26, 26, 0.06); /* Card shadows */
```

### Usage Guidelines

| Element | Color | Usage |
|---------|-------|-------|
| **Page Background** | `#F7F5F0` | All page-level backgrounds |
| **Cards** | `#FFFFFF` | Event cards, forms, panels |
| **Primary Text** | `#2E1A1A` | Headings, body text, labels |
| **Secondary Text** | `#6B6B6B` | Descriptions, metadata |
| **Buttons (Primary)** | `#2E1A1A` | Main CTAs, submit buttons |
| **Accent/Hover** | `#C2B280` | Active states, tags, pins |
| **Borders** | `#E5E2DA` | Card borders, dividers |
| **Input Background** | `#F5F3EE` | Form inputs (default state) |

### Typography

```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 12px;    /* Captions, helper text */
--text-sm: 14px;    /* Labels, secondary info */
--text-base: 16px;  /* Body text, inputs */
--text-lg: 18px;    /* Subheadings */
--text-xl: 20px;    /* Section titles */
--text-2xl: 24px;   /* Logo, nav headings */
--text-3xl: 32px;   /* Page titles */
--text-4xl: 40px;   /* Hero headings */
--text-5xl: 48px;   /* Large hero text */

/* Font Weights */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
```

### Spacing System (8px Grid)

```css
/* All spacing MUST be multiples of 8px */
--space-1: 8px;    /* gap-1 */
--space-2: 16px;   /* gap-2 */
--space-3: 24px;   /* gap-3 */
--space-4: 32px;   /* gap-4 */
--space-6: 48px;   /* gap-6 */
--space-8: 64px;   /* gap-8 */
```

### Border Radius

```css
--radius-sm: 8px;    /* Small elements, tags */
--radius-md: 12px;   /* Buttons, inputs */
--radius-lg: 16px;   /* Cards, panels */
--radius-xl: 24px;   /* Large cards */
--radius-full: 9999px; /* Pills, rounded buttons */
```

### Shadows

```css
/* Elevation System */
--shadow-sm: 0 2px 8px rgba(46, 26, 26, 0.06);
--shadow-md: 0 4px 12px rgba(46, 26, 26, 0.06);
--shadow-lg: 0 8px 24px rgba(46, 26, 26, 0.08);
--shadow-xl: 0 12px 48px rgba(46, 26, 26, 0.15);
```

### Component Styling Rules

#### Buttons

```tsx
// Primary Button
backgroundColor: '#2E1A1A'
color: '#FFFFFF'
padding: '12px 24px'  // 8px grid
borderRadius: '9999px'
boxShadow: '0 4px 12px rgba(46, 26, 26, 0.2)'
hover: transform: translateY(-2px)

// Secondary Button
backgroundColor: 'transparent'
color: '#2E1A1A'
border: '1px solid #E5E2DA'
hover: borderColor: '#C2B280'
```

#### Cards

```tsx
backgroundColor: '#FFFFFF'
borderRadius: '16px'
boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)'
padding: '24px' or '32px'
```

#### Tags

```tsx
backgroundColor: 'rgba(194, 178, 128, 0.15)'
color: '#2E1A1A'
padding: '8px 16px'
borderRadius: '9999px'
fontSize: '14px'
```

---

## 📁 File Structure

```
src/
├── app/
│   ├── App.tsx                    # Main app component with routing
│   ├── components/
│   │   ├── EventCard.tsx          # Reusable event card component
│   │   ├── EventMap.tsx           # Leaflet map with event pins
│   │   ├── AIChatbot.tsx          # AI assistant chatbot
│   │   └── figma/
│   │       └── ImageWithFallback.tsx  # Image component with fallback
│   ├── pages/
│   │   ├── HomePage.tsx           # Landing page (/)
│   │   ├── ExplorePage.tsx        # Event listing with filters (/explore)
│   │   ├── MapPage.tsx            # Map view (/map)
│   │   ├── EventDetailPage.tsx    # Single event view (/event/:id)
│   │   ├── PostEventPage.tsx      # Create event form (/post)
│   │   ├── BookmarksPage.tsx      # Saved events (/bookmarks)
│   │   └── LoginPage.tsx          # Auth page (/login)
│   ├── context/
│   │   └── BookmarkContext.tsx    # Global bookmark state
│   ├── data/
│   │   └── eventsData.ts          # Mock event data
│   └── types.ts                   # TypeScript interfaces
├── styles/
│   ├── index.css                  # Global styles
│   ├── theme.css                  # CSS variables
│   └── tailwind.css               # Tailwind imports
└── vite.config.ts                 # Vite configuration
```

---

## 🎨 Frontend Guidelines

### 1. Component Development

#### EventCard Component
```tsx
// Required Props
interface EventCardProps {
  event: Event;
  onClick?: () => void;
}

// Features
- Bookmark button (top-right)
- Event image with fallback
- Category tag (accent color)
- Title, date, location
- Participant count
- Hover animations
```

#### Navigation Bar
```tsx
// Structure (All Pages)
<nav>
  <Logo>LUMA</Logo> {/* Left */}
  <Menu>             {/* Center */}
    Explore | Map | Bookmarks | Post Event
  </Menu>
  <Login Button>     {/* Right */}
</nav>

// Active state: color: #C2B280
// Inactive state: color: #2E1A1A
```

### 2. Form Inputs

```tsx
// Default State
backgroundColor: '#F5F3EE'
border: '1px solid #E5E2DA'

// Focus State
backgroundColor: '#FFFFFF'
borderColor: '#C2B280'

// All inputs must have:
- Label (14px, fontWeight: 500)
- Placeholder text
- Required field indicator (*)
```

### 3. Hover States

```tsx
// Button Hover
transform: translateY(-2px)
boxShadow: Enhanced shadow

// Link Hover
color: #C2B280 (from #2E1A1A)

// Card Hover
boxShadow: Enhanced shadow
```

### 4. Responsive Breakpoints

```tsx
// Mobile: < 768px
// Tablet: 768px - 1024px
// Desktop: > 1024px

// Grid Layouts
Mobile: grid-cols-1
Tablet: grid-cols-2
Desktop: grid-cols-3
```

### 5. Loading States

```tsx
// Use skeleton loaders with:
backgroundColor: '#F5F3EE'
animation: pulse

// OR spinner with:
color: '#C2B280'
```

---

## 🔧 Backend Guidelines

### 1. API Structure

```
Base URL: /api/v1
Authentication: JWT Bearer Token
Response Format: JSON
Error Format: { error: string, message: string, statusCode: number }
```

### 2. Authentication

```typescript
// JWT Payload
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Protected Routes Require:
Authorization: Bearer <token>
```

### 3. File Upload

```typescript
// Event Images
Max Size: 10MB
Formats: PNG, JPG, JPEG, WebP
Storage: AWS S3 / Cloudinary
Naming: {userId}_{timestamp}_{filename}
```

### 4. Database Indexes

```sql
-- Required Indexes
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_location ON events(location);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);
```

---

## 📊 Data Models

### Event Model

```typescript
interface Event {
  id: string;                    // UUID
  title: string;                 // Max 100 chars
  description: string;           // Max 2000 chars
  image: string;                 // URL
  category: CategoryType;
  date: string;                  // ISO 8601
  time: string;                  // HH:mm format
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  participantLimit: number;
  currentParticipants: number;
  tags: string[];               // Max 10 tags
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  createdAt: string;            // ISO 8601
  updatedAt: string;            // ISO 8601
  userId: string;               // Creator ID
}

type CategoryType = 
  | 'Music' 
  | 'Art' 
  | 'Sports' 
  | 'Food' 
  | 'Tech' 
  | 'Wellness' 
  | 'Social';
```

### User Model

```typescript
interface User {
  id: string;                   // UUID
  email: string;                // Unique
  passwordHash: string;
  name: string;
  avatar?: string;              // URL
  createdAt: string;
  lastLogin: string;
}
```

### Bookmark Model

```typescript
interface Bookmark {
  id: string;                   // UUID
  userId: string;               // Foreign Key
  eventId: string;              // Foreign Key
  createdAt: string;
}
```

---

## 🔌 API Endpoints

### Events

```http
# Get All Events
GET /api/v1/events
Query Params: ?category=Music&date=2026-02-25&search=concert
Response: { events: Event[], total: number }

# Get Single Event
GET /api/v1/events/:id
Response: { event: Event }

# Create Event (Protected)
POST /api/v1/events
Headers: Authorization: Bearer <token>
Body: Omit<Event, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
Response: { event: Event }

# Update Event (Protected)
PUT /api/v1/events/:id
Headers: Authorization: Bearer <token>
Body: Partial<Event>
Response: { event: Event }

# Delete Event (Protected)
DELETE /api/v1/events/:id
Headers: Authorization: Bearer <token>
Response: { success: boolean }
```

### Bookmarks

```http
# Get User Bookmarks (Protected)
GET /api/v1/bookmarks
Headers: Authorization: Bearer <token>
Response: { bookmarks: Event[] }

# Add Bookmark (Protected)
POST /api/v1/bookmarks
Headers: Authorization: Bearer <token>
Body: { eventId: string }
Response: { bookmark: Bookmark }

# Remove Bookmark (Protected)
DELETE /api/v1/bookmarks/:eventId
Headers: Authorization: Bearer <token>
Response: { success: boolean }
```

### Authentication

```http
# Register
POST /api/v1/auth/register
Body: { email: string, password: string, name: string }
Response: { token: string, user: User }

# Login
POST /api/v1/auth/login
Body: { email: string, password: string }
Response: { token: string, user: User }

# Get Current User (Protected)
GET /api/v1/auth/me
Headers: Authorization: Bearer <token>
Response: { user: User }
```

### AI Chatbot

```http
# Send Message
POST /api/v1/chat
Body: { message: string, context?: string }
Response: { reply: string, suggestions?: string[] }
```

---

## 🔄 State Management

### Bookmark Context

```typescript
// Provider wraps entire app in App.tsx
import { BookmarkProvider } from './context/BookmarkContext';

// Usage in components
const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks();

// Methods
addBookmark(eventId: string): void
removeBookmark(eventId: string): void
isBookmarked(eventId: string): boolean
```

### LocalStorage Keys

```typescript
'luma_bookmarks': string[]  // Array of event IDs
'luma_auth_token': string   // JWT token
'luma_user': User           // User object
```

---

## ✅ Best Practices

### 1. Code Organization

```typescript
// ✅ DO: Small, focused components
export function EventCard({ event, onClick }: EventCardProps) { ... }

// ❌ DON'T: Monolithic components with multiple responsibilities
```

### 2. Styling

```typescript
// ✅ DO: Use inline styles for dynamic/branded colors
style={{ color: '#2E1A1A', fontSize: '16px' }}

// ✅ DO: Use Tailwind for layout/spacing
className="flex items-center gap-4 p-6"

// ❌ DON'T: Use Tailwind color classes (breaks design system)
className="text-gray-800 bg-blue-500" // NO!
```

### 3. Spacing

```typescript
// ✅ DO: Use 8px grid
padding: 8px, 16px, 24px, 32px, 48px, 64px

// ❌ DON'T: Use arbitrary values
padding: 15px, 23px, 37px // NO!
```

### 4. Accessibility

```typescript
// ✅ DO: Add ARIA labels
<button aria-label="Bookmark event">...</button>

// ✅ DO: Use semantic HTML
<nav>, <main>, <article>, <section>

// ✅ DO: Keyboard navigation
onKeyDown, tabIndex, focus states
```

### 5. Performance

```typescript
// ✅ DO: Lazy load images
<ImageWithFallback loading="lazy" />

// ✅ DO: Memoize expensive computations
const filteredEvents = useMemo(() => ..., [deps]);

// ✅ DO: Debounce search inputs
const debouncedSearch = useDebounce(searchQuery, 300);
```

### 6. Error Handling

```typescript
// ✅ DO: Handle all async operations
try {
  const data = await fetchEvents();
} catch (error) {
  console.error('Failed to fetch events:', error);
  // Show user-friendly error message
}

// ✅ DO: Validate form inputs
if (!email.includes('@')) {
  setError('Please enter a valid email');
  return;
}
```

### 7. TypeScript

```typescript
// ✅ DO: Use strict types
interface EventCardProps {
  event: Event;
  onClick: () => void;
}

// ❌ DON'T: Use 'any'
const data: any = fetchData(); // NO!

// ✅ DO: Define return types
function formatDate(date: string): string { ... }
```

### 8. Testing

```typescript
// Component Tests
- Render without crashing
- Handle user interactions
- Display correct data
- Show loading/error states

// API Tests
- Validate request/response formats
- Test authentication
- Test error scenarios
- Test edge cases
```


---


**Last Updated:** February 25, 2026  
**Version:** 1.0.0  
**Maintained by:** LUMA Development Team
