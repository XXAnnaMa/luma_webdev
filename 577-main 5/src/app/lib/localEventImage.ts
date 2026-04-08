const LOCAL_EVENT_IMAGE_KEY = 'luma_local_event_images';

function readStore(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_EVENT_IMAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, string>) {
  localStorage.setItem(LOCAL_EVENT_IMAGE_KEY, JSON.stringify(store));
}

export function getLocalEventImage(eventId: string): string | null {
  const store = readStore();
  return store[eventId] || null;
}

export function setLocalEventImage(eventId: string, dataUrl: string): void {
  const store = readStore();
  store[eventId] = dataUrl;
  writeStore(store);
}
