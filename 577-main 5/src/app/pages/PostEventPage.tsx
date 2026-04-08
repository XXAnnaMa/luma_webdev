import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Upload, MapPin, FileSpreadsheet, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { isValidEventDate, isValidEventTime } from '../lib/eventDate';
import { setLocalEventImage } from '../lib/localEventImage';

interface GeocodeResult {
  lat: string;
  lon: string;
}

interface EventFormData {
  title: string;
  description: string;
  address: string;
  date: string;
  time: string;
  category: string;
  participantLimit: string;
  email: string;
  phone: string;
  imageUrl: string;
}

interface ImportedEventRow {
  rowNumber: number;
  values: EventFormData;
  validationError: string | null;
}

const EVENT_CATEGORIES = ['Music', 'Art', 'Sports', 'Food', 'Tech', 'Wellness', 'Social'] as const;

const IMPORT_FIELD_ALIASES: Record<keyof EventFormData, string[]> = {
  title: ['title', 'eventtitle', 'name', 'eventname'],
  description: ['description', 'details', 'summary', 'eventdescription'],
  address: ['address', 'location', 'venue', 'eventaddress'],
  date: ['date', 'eventdate', 'startdate'],
  time: ['time', 'eventtime', 'starttime'],
  category: ['category', 'type'],
  participantLimit: ['participantlimit', 'capacity', 'limit', 'maxparticipants', 'maxattendees'],
  email: ['email', 'organizeremail', 'contactemail'],
  phone: ['phone', 'organizerphone', 'contactphone'],
  imageUrl: ['imageurl', 'image', 'coverimage', 'coverurl'],
};

function createInitialFormData(email = ''): EventFormData {
  return {
    title: '',
    description: '',
    address: '',
    date: '',
    time: '',
    category: '',
    participantLimit: '',
    email,
    phone: '',
    imageUrl: '',
  };
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeImportedDate(value: string): string {
  const trimmed = toText(value);
  if (!trimmed) return '';
  if (isValidEventDate(trimmed)) return trimmed;

  const directMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (directMatch) {
    return `${directMatch[1]}-${directMatch[2].padStart(2, '0')}-${directMatch[3].padStart(2, '0')}`;
  }

  const monthFirstMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (monthFirstMatch) {
    const year = monthFirstMatch[3].length === 2 ? `20${monthFirstMatch[3]}` : monthFirstMatch[3];
    return `${year}-${monthFirstMatch[1].padStart(2, '0')}-${monthFirstMatch[2].padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return toIsoDate(parsed);

  return trimmed;
}

function normalizeImportedTime(value: string): string {
  const trimmed = toText(value);
  if (!trimmed) return '';
  if (isValidEventTime(trimmed)) return trimmed;

  const hhmmss = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})$/);
  if (hhmmss) {
    return `${hhmmss[1].padStart(2, '0')}:${hhmmss[2]}`;
  }

  const upper = trimmed.toUpperCase().replace(/\s+/g, ' ');
  const ampmMatch = upper.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (!ampmMatch) return trimmed;

  let hours = Number(ampmMatch[1]);
  const minutes = normalizeImportedMinutes(ampmMatch[2]);
  const period = normalizeImportedPeriod(ampmMatch[3]);

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

function normalizeImportedMinutes(value: string | undefined): string {
  return value ? value.padStart(2, '0') : '00';
}

function normalizeImportedPeriod(value: string): 'AM' | 'PM' {
  return value === 'PM' ? 'PM' : 'AM';
}

function normalizeImportedCategory(value: string): string {
  const trimmed = toText(value);
  if (!trimmed) return '';
  const matched = EVENT_CATEGORIES.find((item) => item.toLowerCase() === trimmed.toLowerCase());
  return matched ?? trimmed;
}

function normalizeParticipantLimit(value: string): string {
  const trimmed = toText(value).replace(/,/g, '');
  if (!trimmed) return '';
  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) return trimmed;
  return String(Math.trunc(numeric));
}

function getImportedCell(row: Record<string, unknown>, field: keyof EventFormData): string {
  const normalizedEntries = Object.entries(row).map(([key, value]) => [normalizeHeader(key), toText(value)] as const);

  for (const alias of IMPORT_FIELD_ALIASES[field]) {
    const match = normalizedEntries.find(([key, value]) => key === alias && value);
    if (match) return match[1];
  }

  return '';
}

function mapImportedRowToFormData(row: Record<string, unknown>, fallbackEmail: string): EventFormData {
  return {
    title: getImportedCell(row, 'title'),
    description: getImportedCell(row, 'description'),
    address: getImportedCell(row, 'address'),
    date: normalizeImportedDate(getImportedCell(row, 'date')),
    time: normalizeImportedTime(getImportedCell(row, 'time')),
    category: normalizeImportedCategory(getImportedCell(row, 'category')),
    participantLimit: normalizeParticipantLimit(getImportedCell(row, 'participantLimit')),
    email: getImportedCell(row, 'email') || fallbackEmail,
    phone: getImportedCell(row, 'phone'),
    imageUrl: getImportedCell(row, 'imageUrl'),
  };
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const query = new URLSearchParams({
    q: address,
    format: 'jsonv2',
    limit: '1',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/search?${query.toString()}`);
  if (!response.ok) return null;

  const results = (await response.json()) as GeocodeResult[];
  if (!results.length) return null;

  const lat = Number(results[0].lat);
  const lng = Number(results[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

export function PostEventPage() {
  const navigate = useNavigate();
  const { createEvent } = useEvents();
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState('');
  const [bulkImportMessage, setBulkImportMessage] = useState('');
  const [bulkImportError, setBulkImportError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [localImagePreview, setLocalImagePreview] = useState('');
  const [localImageDataUrl, setLocalImageDataUrl] = useState('');
  const [localImageName, setLocalImageName] = useState('');
  const [bulkImportRows, setBulkImportRows] = useState<ImportedEventRow[]>([]);
  const [bulkImportFileName, setBulkImportFileName] = useState('');
  const [formData, setFormData] = useState<EventFormData>(createInitialFormData(user?.email ?? ''));

  const validateEventData = (values: EventFormData) => {
    if (!values.title.trim()) return 'Please enter an event title.';
    if (!values.description.trim()) return 'Please enter an event description.';
    if (!values.address.trim()) return 'Please enter an event address.';
    if (!values.category) return 'Please choose a category.';
    if (!EVENT_CATEGORIES.includes(values.category as (typeof EVENT_CATEGORIES)[number])) {
      return `Category must be one of: ${EVENT_CATEGORIES.join(', ')}.`;
    }

    const limit = Number(values.participantLimit);
    if (!Number.isInteger(limit) || limit <= 0) return 'Participant limit must be a positive integer.';
    if (limit > 5000) return 'Participant limit is too large.';

    if (!values.date) return 'Please choose a date.';
    if (!isValidEventDate(values.date)) return 'Date must be in YYYY-MM-DD format.';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(values.date);
    if (Number.isNaN(selectedDate.getTime())) return 'Date format is invalid.';
    if (selectedDate < today) return 'Event date cannot be in the past.';

    if (!isValidEventTime(values.time)) {
      return 'Time must be a valid 24-hour value (00:00 to 23:59).';
    }

    if (!values.email.trim()) return 'Please provide an organizer email.';

    if (values.phone && !/^[0-9()+\-\s]{7,25}$/.test(values.phone)) {
      return 'Phone format is invalid.';
    }

    if (values.imageUrl) {
      try {
        const parsed = new URL(values.imageUrl);
        if (!(parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
          return 'Image URL must start with http:// or https://';
        }
      } catch {
        return 'Image URL is invalid.';
      }
    }

    return null;
  };

  const validateForm = () => validateEventData(formData);

  const createEventFromValues = async (values: EventFormData) => {
    const location = await geocodeAddress(values.address);
    return createEvent({
      title: values.title,
      description: values.description,
      image: values.imageUrl || undefined,
      category: values.category,
      date: values.date,
      time: values.time,
      address: values.address,
      participantLimit: Number(values.participantLimit),
      tags: values.category ? [values.category] : [],
      organizerName: user?.full_name || 'LUMA Organizer',
      organizerEmail: values.email || user?.email || 'organizer@luma.app',
      organizerPhone: values.phone || undefined,
      location: location || undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setBulkImportMessage('');
    setBulkImportError('');

    if (!user) {
      setErrorMessage('Please sign in before posting an event.');
      navigate('/login');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createEventFromValues(formData);

      if (!formData.imageUrl && localImageDataUrl) {
        setLocalEventImage(created.id, localImageDataUrl);
      }

      navigate('/event/' + created.id);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setErrorMessage('Your session expired. Please sign in again.');
        navigate('/login');
      } else {
        const message = error instanceof Error ? error.message : 'Failed to publish event.';
        setErrorMessage(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLocalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setErrorMessage('Failed to load image preview.');
        return;
      }

      setLocalImagePreview(result);
      setLocalImageDataUrl(result);
      setLocalImageName(file.name);
      setErrorMessage('');
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read the selected image.');
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadImportTemplate = () => {
    void (async () => {
      const { utils, writeFile } = await import('xlsx');

      const templateRows = [
        {
          title: 'Sunset Rooftop Jazz',
          description: 'Live jazz session with city views and casual networking.',
          address: '1200 S Figueroa St, Los Angeles, CA',
          date: '2026-04-10',
          time: '19:30',
          category: 'Music',
          participantLimit: '40',
          email: user?.email || 'organizer@example.com',
          phone: '310-555-0101',
          imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80',
        },
        {
          title: 'AI Product Meetup',
          description: 'Founder talks, product demos, and startup discussion night.',
          address: '300 S Grand Ave, Los Angeles, CA',
          date: '2026-04-15',
          time: '18:30',
          category: 'Tech',
          participantLimit: '80',
          email: user?.email || 'organizer@example.com',
          phone: '',
          imageUrl: '',
        },
      ];

      const workbook = utils.book_new();
      const worksheet = utils.json_to_sheet(templateRows);
      utils.book_append_sheet(workbook, worksheet, 'Events');
      writeFile(workbook, 'luma-bulk-event-template.xlsx');
    })();
  };

  const handleBulkFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setBulkImportError('');
    setBulkImportMessage('');
    setErrorMessage('');

    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, {
        type: 'array',
        cellDates: false,
      });

      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setBulkImportRows([]);
        setBulkImportFileName('');
        setBulkImportError('The spreadsheet is empty.');
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        raw: false,
      });

      if (!rows.length) {
        setBulkImportRows([]);
        setBulkImportFileName(file.name);
        setBulkImportError('No data rows were found. Add a header row and at least one event.');
        return;
      }

      const importedRows = rows.map((row, index) => {
        const values = mapImportedRowToFormData(row, user?.email ?? formData.email);
        return {
          rowNumber: index + 2,
          values,
          validationError: validateEventData(values),
        } satisfies ImportedEventRow;
      });

      setBulkImportFileName(file.name);
      setBulkImportRows(importedRows);
      const validCount = importedRows.filter((row) => !row.validationError).length;
      setBulkImportMessage(
        `Parsed ${importedRows.length} rows from ${file.name}. ${validCount} row(s) are ready to import.`
      );
    } catch (error) {
      setBulkImportRows([]);
      setBulkImportFileName(file.name);
      setBulkImportError(
        error instanceof Error ? error.message : 'Failed to read the spreadsheet.'
      );
    }
  };

  const handleBulkImport = async () => {
    setBulkImportError('');
    setBulkImportMessage('');
    setErrorMessage('');

    if (!user) {
      setBulkImportError('Please sign in before importing events.');
      navigate('/login');
      return;
    }

    const validRows = bulkImportRows.filter((row) => !row.validationError);
    if (!validRows.length) {
      setBulkImportError('No valid rows are ready for import yet.');
      return;
    }

    setBulkImporting(true);

    let successCount = 0;
    const failedRows: string[] = [];

    try {
      for (const row of validRows) {
        try {
          await createEventFromValues(row.values);
          successCount += 1;
        } catch (error) {
          const detail = error instanceof Error ? error.message : 'Unknown error';
          failedRows.push(`Row ${row.rowNumber} (${row.values.title || 'Untitled Event'}): ${detail}`);
        }
      }

      if (failedRows.length === 0) {
        setBulkImportMessage(`Imported ${successCount} event(s) successfully.`);
        setBulkImportRows([]);
        setBulkImportFileName('');
      } else {
        setBulkImportError(
          `Imported ${successCount} event(s), but ${failedRows.length} row(s) failed. ${failedRows
            .slice(0, 3)
            .join(' ')}`
        );
      }
    } finally {
      setBulkImporting(false);
    }
  };

  const validBulkImportRows = bulkImportRows.filter((row) => !row.validationError);
  const invalidBulkImportRows = bulkImportRows.filter((row) => Boolean(row.validationError));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F7F5F0' }}>
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Cancel (keep original UX) */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/explore')}
            className="transition-all"
            style={{
              fontSize: '14px',
              color: '#6B6B6B',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#2E1A1A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6B6B6B')}
          >
            ← Cancel
          </button>
        </div>

        <h1
          className="mb-8"
          style={{
            fontSize: '40px',
            fontWeight: 600,
            color: '#2E1A1A',
          }}
        >
          Create New Event
        </h1>
        {errorMessage && (
          <div
            className="mb-6 px-4 py-3 rounded-lg"
            style={{
              backgroundColor: '#FFF7ED',
              border: '1px solid #FED7AA',
              color: '#9A3412',
              fontSize: '14px',
            }}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Card */}
              <div
                className="rounded-xl p-8"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                <h2
                  className="mb-6"
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#2E1A1A',
                  }}
                >
                  Basic Information
                </h2>

                <div className="space-y-6">
                  {/* Event Title */}
                  <div>
                    <label
                      htmlFor="title"
                      className="block mb-2"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2E1A1A',
                      }}
                    >
                      Event Title *
                    </label>
                    <input
                      id="title"
                      name="title"
                      type="text"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Give your event a clear title"
                      required
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                      style={{
                        fontSize: '16px',
                        color: '#2E1A1A',
                        backgroundColor: '#F5F3EE',
                        border: '1px solid #E5E2DA',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#C2B280';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E5E2DA';
                        e.currentTarget.style.backgroundColor = '#F5F3EE';
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block mb-2"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2E1A1A',
                      }}
                    >
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Describe what your event is about..."
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all resize-none"
                      style={{
                        fontSize: '16px',
                        color: '#2E1A1A',
                        backgroundColor: '#F5F3EE',
                        border: '1px solid #E5E2DA',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#C2B280';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E5E2DA';
                        e.currentTarget.style.backgroundColor = '#F5F3EE';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Location & Time Card */}
              <div
                className="rounded-xl p-8"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                <h2
                  className="mb-6"
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#2E1A1A',
                  }}
                >
                  Location & Time
                </h2>

                <div className="space-y-6">
                  {/* Address */}
                  <div>
                    <label
                      htmlFor="address"
                      className="block mb-2"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2E1A1A',
                      }}
                    >
                      Address *
                    </label>
                    <div className="relative">
                      <MapPin
                        size={20}
                        color="#6B6B6B"
                        className="absolute left-4 top-1/2 transform -translate-y-1/2"
                      />
                      <input
                        id="address"
                        name="address"
                        type="text"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="123 Main St, Los Angeles, CA"
                        required
                        className="w-full pl-12 pr-4 py-3 rounded-lg outline-none transition-all"
                        style={{
                          fontSize: '16px',
                          color: '#2E1A1A',
                          backgroundColor: '#F5F3EE',
                          border: '1px solid #E5E2DA',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#C2B280';
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E5E2DA';
                          e.currentTarget.style.backgroundColor = '#F5F3EE';
                        }}
                      />
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="date"
                        className="block mb-2"
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#2E1A1A',
                        }}
                      >
                        Date *
                      </label>
                      <input
                        id="date"
                        name="date"
                        type="text"
                        inputMode="numeric"
                        placeholder="YYYY-MM-DD"
                        value={formData.date}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                        style={{
                          fontSize: '16px',
                          color: '#2E1A1A',
                          backgroundColor: '#F5F3EE',
                          border: '1px solid #E5E2DA',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#C2B280';
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E5E2DA';
                          e.currentTarget.style.backgroundColor = '#F5F3EE';
                        }}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="time"
                        className="block mb-2"
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: '#2E1A1A',
                        }}
                      >
                        Time *
                      </label>
                      <input
                        id="time"
                        name="time"
                        type="time"
                        value={formData.time}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                        style={{
                          fontSize: '16px',
                          color: '#2E1A1A',
                          backgroundColor: '#F5F3EE',
                          border: '1px solid #E5E2DA',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#C2B280';
                          e.currentTarget.style.backgroundColor = '#FFFFFF';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#E5E2DA';
                          e.currentTarget.style.backgroundColor = '#F5F3EE';
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Details Card */}
              <div
                className="rounded-xl p-8"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                <h2
                  className="mb-6"
                  style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#2E1A1A',
                  }}
                >
                  Event Details
                </h2>

                <div className="space-y-6">
                  {/* Category */}
                  <div>
                    <label
                      htmlFor="category"
                      className="block mb-2"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2E1A1A',
                      }}
                    >
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                      style={{
                        fontSize: '16px',
                        color: '#2E1A1A',
                        backgroundColor: '#F5F3EE',
                        border: '1px solid #E5E2DA',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#C2B280';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E5E2DA';
                        e.currentTarget.style.backgroundColor = '#F5F3EE';
                      }}
                    >
                      <option value="">Select a category</option>
                      <option value="Music">Music</option>
                      <option value="Art">Art</option>
                      <option value="Sports">Sports</option>
                      <option value="Food">Food</option>
                      <option value="Tech">Tech</option>
                      <option value="Wellness">Wellness</option>
                      <option value="Social">Social</option>
                    </select>
                  </div>

                  {/* Participant Limit */}
                  <div>
                    <label
                      htmlFor="participantLimit"
                      className="block mb-2"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2E1A1A',
                      }}
                    >
                      Participant Limit *
                    </label>
                    <input
                      id="participantLimit"
                      name="participantLimit"
                      type="number"
                      value={formData.participantLimit}
                      onChange={handleChange}
                      placeholder="50"
                      required
                      min="1"
                      className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                      style={{
                        fontSize: '16px',
                        color: '#2E1A1A',
                        backgroundColor: '#F5F3EE',
                        border: '1px solid #E5E2DA',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#C2B280';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E5E2DA';
                        e.currentTarget.style.backgroundColor = '#F5F3EE';
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Contact & Media */}
            <div className="space-y-6">
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3
                      className="mb-2"
                      style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#2E1A1A',
                      }}
                    >
                      Bulk Import
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.6 }}>
                      Upload an Excel or CSV file to create multiple events at once. One row equals one event.
                    </p>
                  </div>
                  <div
                    className="rounded-full p-3"
                    style={{ backgroundColor: 'rgba(194, 178, 128, 0.12)', color: '#2E1A1A' }}
                  >
                    <FileSpreadsheet size={20} />
                  </div>
                </div>

                <div
                  className="rounded-xl p-4 mb-4"
                  style={{
                    backgroundColor: '#F9F7F2',
                    border: '1px solid #E5E2DA',
                  }}
                >
                  <p style={{ fontSize: '13px', color: '#2E1A1A', marginBottom: '8px', fontWeight: 500 }}>
                    Supported columns
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.7 }}>
                    `title`, `description`, `address`, `date`, `time`, `category`, `participantLimit`
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.7 }}>
                    Optional: `email`, `phone`, `imageUrl`
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.7 }}>
                    Date format: `YYYY-MM-DD` or `MM/DD/YYYY`, time format: `19:30` or `7:30 PM`
                  </p>
                </div>

                <div className="flex gap-3 mb-4">
                  <label
                    htmlFor="bulkImportFile"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#2E1A1A',
                      backgroundColor: '#F5F3EE',
                      border: '1px solid #E5E2DA',
                      cursor: 'pointer',
                    }}
                  >
                    <Upload size={16} />
                    Upload Excel
                  </label>
                  <input
                    id="bulkImportFile"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleBulkFileSelect}
                    style={{ display: 'none' }}
                  />

                  <button
                    type="button"
                    onClick={handleDownloadImportTemplate}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#2E1A1A',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E2DA',
                      cursor: 'pointer',
                    }}
                  >
                    <Download size={16} />
                    Template
                  </button>
                </div>

                {bulkImportFileName && (
                  <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '12px' }}>
                    Selected file: {bulkImportFileName}
                  </p>
                )}

                {bulkImportMessage && (
                  <div
                    className="mb-4 px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      color: '#166534',
                      fontSize: '13px',
                    }}
                  >
                    {bulkImportMessage}
                  </div>
                )}

                {bulkImportError && (
                  <div
                    className="mb-4 px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: '#FFF7ED',
                      border: '1px solid #FED7AA',
                      color: '#9A3412',
                      fontSize: '13px',
                    }}
                  >
                    {bulkImportError}
                  </div>
                )}

                {bulkImportRows.length > 0 && (
                  <div
                    className="rounded-xl p-4 mb-4"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E2DA',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p style={{ fontSize: '13px', color: '#2E1A1A', fontWeight: 600 }}>
                        Import Preview
                      </p>
                      <p style={{ fontSize: '12px', color: '#6B6B6B' }}>
                        {validBulkImportRows.length} valid • {invalidBulkImportRows.length} needs fixes
                      </p>
                    </div>

                    <div className="space-y-3" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                      {bulkImportRows.slice(0, 6).map((row) => (
                        <div
                          key={`${row.rowNumber}-${row.values.title}`}
                          className="rounded-lg p-3"
                          style={{
                            backgroundColor: row.validationError ? '#FFF7ED' : '#F9F7F2',
                            border: `1px solid ${row.validationError ? '#FED7AA' : '#E5E2DA'}`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p style={{ fontSize: '13px', color: '#2E1A1A', fontWeight: 600, marginBottom: '4px' }}>
                                Row {row.rowNumber}: {row.values.title || 'Untitled Event'}
                              </p>
                              <p style={{ fontSize: '12px', color: '#6B6B6B', lineHeight: 1.6 }}>
                                {row.values.date || 'No date'} • {row.values.time || 'No time'} •{' '}
                                {row.values.category || 'No category'}
                              </p>
                            </div>

                            {row.validationError ? (
                              <AlertCircle size={16} color="#C2410C" />
                            ) : (
                              <CheckCircle2 size={16} color="#15803D" />
                            )}
                          </div>

                          {row.validationError && (
                            <p style={{ fontSize: '12px', color: '#9A3412', marginTop: '8px', lineHeight: 1.5 }}>
                              {row.validationError}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {bulkImportRows.length > 6 && (
                      <p style={{ fontSize: '12px', color: '#6B6B6B', marginTop: '10px' }}>
                        Showing first 6 rows of {bulkImportRows.length}.
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={bulkImporting || validBulkImportRows.length === 0}
                  className="w-full py-3 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: '#2E1A1A',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: bulkImporting || validBulkImportRows.length === 0 ? 'not-allowed' : 'pointer',
                    opacity: bulkImporting || validBulkImportRows.length === 0 ? 0.6 : 1,
                  }}
                >
                  {bulkImporting
                    ? 'Importing Events...'
                    : validBulkImportRows.length > 0
                      ? `Import ${validBulkImportRows.length} Event(s)`
                      : 'Import Events'}
                </button>
              </div>

              {/* Contact Information */}
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                <h3
                  className="mb-4"
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#2E1A1A',
                  }}
                >
                  Contact Info
                </h3>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2E1A1A',
                      }}
                    >
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-2 rounded-lg outline-none transition-all"
                      style={{
                        fontSize: '14px',
                        color: '#2E1A1A',
                        backgroundColor: '#F5F3EE',
                        border: '1px solid #E5E2DA',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#C2B280';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E5E2DA';
                        e.currentTarget.style.backgroundColor = '#F5F3EE';
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block mb-2"
                      style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2E1A1A',
                      }}
                    >
                      Phone (Optional)
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(123) 456-7890"
                      className="w-full px-4 py-2 rounded-lg outline-none transition-all"
                      style={{
                        fontSize: '14px',
                        color: '#2E1A1A',
                        backgroundColor: '#F5F3EE',
                        border: '1px solid #E5E2DA',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#C2B280';
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E5E2DA';
                        e.currentTarget.style.backgroundColor = '#F5F3EE';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Event Image Upload */}
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                <h3
                  className="mb-4"
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#2E1A1A',
                  }}
                >
                  Event Image
                </h3>

                <div
                  className="w-full p-6 rounded-lg transition-all"
                  style={{
                    border: '2px dashed #E5E2DA',
                    backgroundColor: '#F5F3EE',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#C2B280';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#E5E2DA';
                    e.currentTarget.style.backgroundColor = '#F5F3EE';
                  }}
                >
                  <Upload size={40} color="#6B6B6B" className="mx-auto mb-4" />
                  <p style={{ fontSize: '16px', color: '#2E1A1A', marginBottom: '8px', textAlign: 'center' }}>
                    Paste an image URL
                  </p>
                  <p style={{ fontSize: '14px', color: '#6B6B6B', marginBottom: '16px', textAlign: 'center' }}>
                    Quick option: choose a local file for preview. Publish uses URL unless backend supports uploads.
                  </p>

                  <label
                    htmlFor="localImageFile"
                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-lg transition-all"
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#2E1A1A',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E2DA',
                      cursor: 'pointer',
                      marginBottom: '12px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#C2B280';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E2DA';
                    }}
                  >
                    Choose from device
                  </label>
                  <input
                    id="localImageFile"
                    type="file"
                    accept="image/*"
                    onChange={handleLocalImageSelect}
                    style={{ display: 'none' }}
                  />
                  {localImageName && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#6B6B6B',
                        textAlign: 'center',
                        marginBottom: '12px',
                      }}
                    >
                      Selected: {localImageName}
                    </p>
                  )}

                  <input
                    name="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/event-cover.jpg"
                    className="w-full px-4 py-3 rounded-lg outline-none transition-all"
                    style={{
                      fontSize: '14px',
                      color: '#2E1A1A',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E2DA',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#C2B280';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E5E2DA';
                    }}
                  />

                  {(formData.imageUrl || localImagePreview) && (
                    <div className="mt-4 rounded-lg overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
                      <img
                        src={formData.imageUrl || localImagePreview}
                        alt="Event preview"
                        className="w-full object-cover"
                        style={{ height: '180px' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div
                className="rounded-xl p-6"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 12px rgba(46, 26, 26, 0.06)',
                }}
              >
                <h3
                  className="mb-4"
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#2E1A1A',
                  }}
                >
                  Ready to publish?
                </h3>
                <button
                  type="submit"
                  disabled={submitting || bulkImporting}
                  className="w-full py-3 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: '#2E1A1A',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: submitting || bulkImporting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(46, 26, 26, 0.2)',
                    opacity: submitting || bulkImporting ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (submitting || bulkImporting) return;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 26, 26, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    if (submitting || bulkImporting) return;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 26, 26, 0.2)';
                  }}
                >
                  {submitting ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div style={{ height: '64px' }} />
    </div>
  );
}
