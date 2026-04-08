import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Upload, MapPin } from 'lucide-react';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';
import { isValidEventDate, isValidEventTime } from '../lib/eventDate';
import { setLocalEventImage } from '../lib/localEventImage';

interface GeocodeResult {
  lat: string;
  lon: string;
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
  const [submitting, setSubmitting] = useState(false);
  const [localImagePreview, setLocalImagePreview] = useState('');
  const [localImageDataUrl, setLocalImageDataUrl] = useState('');
  const [localImageName, setLocalImageName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    date: '',
    time: '',
    category: '',
    participantLimit: '',
    email: user?.email ?? '',
    phone: '',
    imageUrl: '',
  });

  const validateForm = () => {
    if (!formData.title.trim()) return 'Please enter an event title.';
    if (!formData.description.trim()) return 'Please enter an event description.';
    if (!formData.address.trim()) return 'Please enter an event address.';
    if (!formData.category) return 'Please choose a category.';

    const limit = Number(formData.participantLimit);
    if (!Number.isInteger(limit) || limit <= 0) return 'Participant limit must be a positive integer.';
    if (limit > 5000) return 'Participant limit is too large.';

    if (!formData.date) return 'Please choose a date.';
    if (!isValidEventDate(formData.date)) return 'Date must be in YYYY-MM-DD format.';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.date);
    if (Number.isNaN(selectedDate.getTime())) return 'Date format is invalid.';
    if (selectedDate < today) return 'Event date cannot be in the past.';

    if (!isValidEventTime(formData.time)) {
      return 'Time must be a valid 24-hour value (00:00 to 23:59).';
    }

    if (formData.phone && !/^[0-9()+\-\s]{7,25}$/.test(formData.phone)) {
      return 'Phone format is invalid.';
    }

    if (formData.imageUrl) {
      try {
        const parsed = new URL(formData.imageUrl);
        if (!(parsed.protocol === 'http:' || parsed.protocol === 'https:')) {
          return 'Image URL must start with http:// or https://';
        }
      } catch {
        return 'Image URL is invalid.';
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

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
      const location = await geocodeAddress(formData.address);
      const created = await createEvent({
        title: formData.title,
        description: formData.description,
        image: formData.imageUrl || undefined,
        category: formData.category,
        date: formData.date,
        time: formData.time,
        address: formData.address,
        participantLimit: Number(formData.participantLimit),
        tags: formData.category ? [formData.category] : [],
        organizerName: user?.full_name || 'LUMA Organizer',
        organizerEmail: formData.email || user?.email || 'organizer@luma.app',
        organizerPhone: formData.phone || undefined,
        location: location || undefined,
      });

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
                  disabled={submitting}
                  className="w-full py-3 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: '#2E1A1A',
                    color: '#FFFFFF',
                    fontSize: '16px',
                    fontWeight: 500,
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(46, 26, 26, 0.2)',
                    opacity: submitting ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (submitting) return;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 26, 26, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    if (submitting) return;
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
