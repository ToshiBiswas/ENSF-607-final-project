import { useEffect, useMemo, useState, type FormEvent } from 'react';

type Category = {
  categoryId: number;
  value: string;
};

type Organizer = {
  userId: number;
  name: string;
  email: string;
};

type EventSummary = {
  eventId: number;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  categories?: Category[];
  organizer?: Organizer;
};

type EventsResponse = {
  events?: EventSummary[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

/** Displays a filterable list of events pulled from the backend. */
export function EventBrowser() {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftCategory, setDraftCategory] = useState('Tech');
  const [draftQuery, setDraftQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tech');
  const [activeQuery, setActiveQuery] = useState('');

  useEffect(() => {
    if (!activeCategory.trim()) {
      setEvents([]);
      return;
    }

    const controller = new AbortController();
    async function loadEvents() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ category: activeCategory.trim() });
        const res = await fetch(`${API_BASE_URL}/events?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`Unable to load events (status ${res.status})`);
        }
        const data: EventsResponse = await res.json();
        setEvents(data.events ?? []);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : 'Unexpected error while loading events');
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
    return () => controller.abort();
  }, [activeCategory]);

  const filteredEvents = useMemo(() => {
    if (!activeQuery.trim()) return events;
    const q = activeQuery.trim().toLowerCase();
    return events.filter((evt) =>
      [evt.title, evt.description, evt.location].some((field) =>
        field?.toLowerCase().includes(q),
      ),
    );
  }, [events, activeQuery]);

  const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));

  const handleSubmit = (evt: FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
    setActiveCategory(draftCategory.trim());
    setActiveQuery(draftQuery.trim());
  };

  const showEmptyState = !loading && !error && filteredEvents.length === 0;

  return (
    <section className="event-browser">
      <header className="event-browser__hero">
        <p className="event-browser__eyebrow">Discover</p>
        <h1>Upcoming events</h1>
        <p className="event-browser__subtitle">
          Browse what&apos;s happening next and jump in as an attendee or host. Start by picking a
          category you care about, then refine with a keyword search.
        </p>
      </header>

      <form className="event-browser__filters" onSubmit={handleSubmit}>
        <label className="event-browser__field">
          <span>Category</span>
          <input
            type="text"
            placeholder="e.g., Tech, Music, Comedy"
            value={draftCategory}
            onChange={(e) => setDraftCategory(e.target.value)}
          />
        </label>

        <label className="event-browser__field">
          <span>Search</span>
          <input
            type="text"
            placeholder="Keyword"
            value={draftQuery}
            onChange={(e) => setDraftQuery(e.target.value)}
          />
        </label>

        <button type="submit" disabled={!draftCategory.trim()}>
          {loading ? 'Searching…' : 'Show events'}
        </button>
      </form>

      {!activeCategory.trim() && (
        <div className="event-browser__hint">
          Enter a category to load events. Categories match whatever organizers used when creating
          events (e.g., Tech, Music, Comedy).
        </div>
      )}

      {error && <div className="event-browser__error">{error}</div>}

      {showEmptyState && (
        <div className="event-browser__empty">
          <p>No events match those filters yet.</p>
          <p>Try another category or search term.</p>
        </div>
      )}

      <div className="event-browser__grid">
        {filteredEvents.map((evt) => (
          <article key={evt.eventId} className="event-card">
            <div className="event-card__header">
              <p className="event-card__time">
                {formatDateTime(evt.startTime)} &mdash; {formatDateTime(evt.endTime)}
              </p>
              {evt.organizer?.name && (
                <p className="event-card__organizer">Hosted by {evt.organizer.name}</p>
              )}
            </div>
            <h2>{evt.title}</h2>
            <p className="event-card__location">{evt.location}</p>
            <p className="event-card__description">{evt.description}</p>
            <div className="event-card__meta">
              <div className="event-card__categories">
                {(evt.categories ?? []).map((cat) => (
                  <span key={cat.categoryId}>{cat.value}</span>
                ))}
                {!evt.categories?.length && <span className="event-card__chip">General</span>}
              </div>
              <button
                type="button"
                className="event-card__cta"
                onClick={() => window.alert('Ticket flow coming soon!')}
              >
                View details
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
