import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface BookmarkContextType {
  bookmarkedEventIds: Set<string>;
  toggleBookmark: (eventId: string) => void;
  isBookmarked: (eventId: string) => boolean;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const [bookmarkedEventIds, setBookmarkedEventIds] = useState<Set<string>>(() => {
    // Load from localStorage on mount
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('luma-bookmarks');
        if (saved) {
          const parsed = JSON.parse(saved);
          return new Set(parsed);
        }
      }
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    return new Set();
  });

  // Save to localStorage whenever bookmarks change
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('luma-bookmarks', JSON.stringify(Array.from(bookmarkedEventIds)));
      }
    } catch (e) {
      console.warn('Failed to save bookmarks:', e);
    }
  }, [bookmarkedEventIds]);

  const toggleBookmark = (eventId: string) => {
    setBookmarkedEventIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const isBookmarked = (eventId: string) => bookmarkedEventIds.has(eventId);

  return (
    <BookmarkContext.Provider value={{ bookmarkedEventIds, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (!context) {
    throw new Error('useBookmarks must be used within BookmarkProvider');
  }
  return context;
}