import { useMemo, useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../context/EventsContext';
import { ApiError, apiRequest } from '../lib/api';
import { extractEventDateKey, formatEventDateLabel, formatEventTimeLabel } from '../lib/eventDate';

type Sender = 'user' | 'ai';

interface ChatSuggestion {
  id: string;
  title: string;
  subtitle: string;
}

interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  suggestions?: ChatSuggestion[];
}

interface ChatApiResponse {
  reply: string;
  timestamp: string;
  suggestions?: ChatSuggestion[];
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Music: ['music', 'concert', 'jazz', 'live music'],
  Art: ['art', 'gallery', 'exhibition'],
  Sports: ['sports', 'sport', 'soccer', 'basketball', 'hike', 'hiking', 'fitness'],
  Food: ['food', 'dinner', 'brunch', 'coffee', 'market'],
  Tech: ['tech', 'developer', 'coding', 'code', 'startup', 'ai'],
  Wellness: ['wellness', 'yoga', 'meditation', 'health'],
  Social: ['social', 'party', 'networking', 'meetup'],
};

const STOP_WORDS = new Set([
  'find',
  'events',
  'event',
  'nearby',
  'near',
  'please',
  'show',
  'me',
  'any',
  'for',
  'the',
  'a',
  'an',
  'in',
  'on',
  'at',
  'to',
  'this',
  'that',
]);

function getRelativeDateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDetectedCategory(query: string): string | null {
  const lower = query.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return null;
}

function getDetectedDate(query: string): { dateKey?: string; weekend?: boolean } {
  const lower = query.toLowerCase();
  const explicit = lower.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (explicit) return { dateKey: explicit[0] };

  const monthMap: Record<string, number> = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };
  const monthDay = lower.match(
    /\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\b/
  );
  if (monthDay) {
    const month = monthMap[monthDay[1]];
    const day = Number(monthDay[2]);
    if (month && day >= 1 && day <= 31) {
      const now = new Date();
      const year = now.getFullYear();
      return {
        dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      };
    }
  }

  if (lower.includes('today')) return { dateKey: getRelativeDateKey(0) };
  if (lower.includes('tomorrow')) return { dateKey: getRelativeDateKey(1) };
  if (lower.includes('weekend')) return { weekend: true };

  return {};
}

function getKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

function isWeekendDate(dateText: string): boolean {
  const key = extractEventDateKey(dateText);
  if (!key) return false;
  const [year, month, day] = key.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const weekday = d.getDay();
  return weekday === 0 || weekday === 6;
}

export function AIChatbot() {
  const navigate = useNavigate();
  const { events } = useEvents();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Ask about local events, for example "music this weekend" or "tech on 2026-04-15".',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aKey = `${extractEventDateKey(a.date)} ${formatEventTimeLabel(a.time)}`;
      const bKey = `${extractEventDateKey(b.date)} ${formatEventTimeLabel(b.time)}`;
      return aKey.localeCompare(bKey);
    });
  }, [events]);

  const buildLocalResponse = (query: string): Message => {
    const detectedCategory = getDetectedCategory(query);
    const { dateKey, weekend } = getDetectedDate(query);
    const keywords = getKeywords(query);

    let matched = sortedEvents.filter((event) => {
      if (detectedCategory && event.category !== detectedCategory) return false;

      if (dateKey && extractEventDateKey(event.date) !== dateKey) return false;

      if (weekend && !isWeekendDate(event.date)) return false;

      if (keywords.length > 0) {
        const haystack = [
          event.title,
          event.description,
          event.address,
          event.category,
          ...event.tags,
        ]
          .join(' ')
          .toLowerCase();

        if (!keywords.some((kw) => haystack.includes(kw))) return false;
      }

      return true;
    });

    if (matched.length === 0 && keywords.length > 0) {
      matched = sortedEvents.filter((event) => {
        if (detectedCategory && event.category !== detectedCategory) return false;
        if (dateKey && extractEventDateKey(event.date) !== dateKey) return false;
        if (weekend && !isWeekendDate(event.date)) return false;
        return true;
      });
    }

    let mode: 'strict' | 'relaxed' | 'fallback' = 'strict';
    if (matched.length === 0) {
      // Relax 1: keep category/date, ignore weekend + keyword constraints.
      const relaxed = sortedEvents.filter((event) => {
        if (detectedCategory && event.category !== detectedCategory) return false;
        if (dateKey && extractEventDateKey(event.date) !== dateKey) return false;
        return true;
      });
      if (relaxed.length > 0) {
        matched = relaxed;
        mode = 'relaxed';
      }
    }

    if (matched.length === 0 && detectedCategory) {
      // Relax 2: keep only category.
      const byCategory = sortedEvents.filter((event) => event.category === detectedCategory);
      if (byCategory.length > 0) {
        matched = byCategory;
        mode = 'fallback';
      }
    }

    const top = matched.slice(0, 3);
    const suggestions: ChatSuggestion[] = top.map((event) => ({
      id: event.id,
      title: event.title,
      subtitle: `${formatEventDateLabel(event.date)} • ${formatEventTimeLabel(event.time)} • ${event.category}`,
    }));

    if (matched.length === 0) {
      return {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        timestamp: new Date(),
        text: 'No matching events right now. Try a category like Music/Tech or a date like 2026-03-20.',
      };
    }

    if (mode === 'relaxed') {
      return {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        timestamp: new Date(),
        text: `No exact match for that weekend/date constraint. Here are ${matched.length} closest matches:`,
        suggestions,
      };
    }

    if (mode === 'fallback') {
      return {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        timestamp: new Date(),
        text: `No exact match for your full query. Here are ${matched.length} events in ${detectedCategory}:`,
        suggestions,
      };
    }

    return {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      timestamp: new Date(),
      text: `Found ${matched.length} matching event${matched.length > 1 ? 's' : ''}. Top picks:`,
      suggestions,
    };
  };

  const handleSend = async () => {
    const query = inputValue.trim();
    if (!query || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: query,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await apiRequest<ChatApiResponse>('/api/v1/chat', {
        method: 'POST',
        body: { query },
      });

      const aiMessage: Message = {
        id: `${Date.now()}-ai`,
        text: response.reply,
        sender: 'ai',
        timestamp: new Date(response.timestamp),
        suggestions: response.suggestions,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const fallbackMessage = buildLocalResponse(query);
      const prefix =
        error instanceof ApiError && error.status === 401
          ? 'Sign in for saved AI chat history. Here are local event suggestions for now.\n\n'
          : 'Live AI is temporarily unavailable, so here are local event suggestions instead.\n\n';

      setMessages((prev) => [
        ...prev,
        {
          ...fallbackMessage,
          text: `${prefix}${fallbackMessage.text}`,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 rounded-full p-4 transition-all duration-200 z-50"
          style={{
            backgroundColor: '#2E1A1A',
            color: '#FFFFFF',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(46, 26, 26, 0.3)',
          }}
        >
          <MessageCircle size={28} />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-8 right-8 rounded-2xl overflow-hidden z-50"
          style={{
            width: '400px',
            height: '600px',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 12px 48px rgba(46, 26, 26, 0.15)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ backgroundColor: '#2E1A1A', color: '#FFFFFF' }}
          >
            <div className="flex items-center gap-3">
              <MessageCircle size={24} />
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Event Assistant</h3>
                <p style={{ fontSize: '12px', opacity: 0.9, margin: 0 }}>Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg"
              style={{ backgroundColor: 'transparent', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: '#F5F3EE' }}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="rounded-2xl px-4 py-3 max-w-[85%]"
                    style={{
                      backgroundColor: message.sender === 'user' ? '#2E1A1A' : '#FFFFFF',
                      color: message.sender === 'user' ? '#FFFFFF' : '#2E1A1A',
                      fontSize: '14px',
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.suggestions.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              navigate(`/event/${item.id}`);
                              setIsOpen(false);
                            }}
                            className="w-full text-left rounded-lg px-3 py-2"
                            style={{
                              border: '1px solid #E5E2DA',
                              backgroundColor: '#FFFFFF',
                              color: '#2E1A1A',
                              cursor: 'pointer',
                            }}
                          >
                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.title}</div>
                            <div style={{ fontSize: '12px', color: '#6B6B6B' }}>{item.subtitle}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t" style={{ backgroundColor: '#FFFFFF', borderColor: '#D4CFC4' }}>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: '#F5F3EE', border: '1px solid #D4CFC4' }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
                placeholder="Ask the assistant about events"
                disabled={isSending}
                className="flex-1 outline-none"
                style={{ fontSize: '14px', color: '#2E1A1A', backgroundColor: 'transparent', border: 'none' }}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isSending}
                className="p-2 rounded-full"
                style={{
                  backgroundColor: inputValue.trim() && !isSending ? '#2E1A1A' : '#E5E2DA',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: inputValue.trim() && !isSending ? 'pointer' : 'not-allowed',
                }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
