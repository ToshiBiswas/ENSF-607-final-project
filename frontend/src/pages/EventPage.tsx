import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './EventPage.css';

type Ticket = {
  infoId: number;
  type: string;
  price: number;
  quantity: number;
  left: number;
};

type Event = {
  eventId: number;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  organizer: { name: string };
  categories: { categoryId: number; value: string }[];
};

// Same resolver as apiClient to avoid env mismatches in teammates' machines
const resolveApiBaseUrl = (): string => {
  const envA = (import.meta as any).env?.VITE_API_BASE_URL;
  const envB = (import.meta as any).env?.VITE_API_URL;
  const env = (envA ?? envB)?.toString().trim();
  if (env) {
    const trimmed = env.replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  return '/api';
};

const API_BASE_URL = resolveApiBaseUrl();

export function EventPage({ eventId }: { eventId: number }) {
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const eventUrl = `${API_BASE_URL}/events/${eventId}`;
        const ticketsUrl = `${API_BASE_URL}/events/${eventId}/tickets`;

        const [eventRes, ticketRes] = await Promise.all([
          fetch(eventUrl),
          fetch(ticketsUrl),
        ]);

        if (!eventRes.ok) {
          const msg =
            eventRes.status === 404
              ? 'Event not found'
              : `Failed to load event (HTTP ${eventRes.status})`;
          throw new Error(msg);
        }

        const { event } = await eventRes.json();

        // Tickets may not exist yet; show empty list instead of error
        let ticketTypes: Ticket[] = [];
        if (ticketRes.ok) {
          const payload = await ticketRes.json().catch(() => ({}));
          if (Array.isArray(payload?.ticketTypes)) {
            ticketTypes = payload.ticketTypes;
          }
        }

        setEvent(event);
        setTickets(ticketTypes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [eventId]);

  if (loading) {
    return (
      <section className="event-page event-page--status">
        <p>Loading event…</p>
      </section>
    );
  }

  if (error || !event) {
    return (
      <section className="event-page event-page--status event-page--error">
        <p>{error ?? 'Event missing'}</p>
      </section>
    );
  }

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(value));

  return (
    <section className="event-page">
      <header className="event-hero">
        <p className="event-hero__eyebrow">
          {event.categories.map((c) => c.value).join(' • ') || 'Event'}
        </p>
        <h1 className="event-hero__title">{event.title}</h1>
        <p className="event-hero__meta">
          {event.location} • {formatDate(event.startTime)} – {formatDate(event.endTime)}
        </p>
        <p className="event-hero__host">
          Hosted by {event.organizer?.name ?? 'Unknown'}
        </p>
      </header>

      <div className="event-layout">
        <article className="event-body">
          <h2>About this event</h2>
          <p>{event.description}</p>
        </article>

        <section className="ticket-panel">
          <h3>Tickets</h3>

          {tickets.length === 0 ? (
            <p className="ticket-panel__empty">No tickets configured yet.</p>
          ) : (
            <ul className="ticket-list">
              {tickets.map((ticket) => (
                <li key={ticket.infoId} className="ticket-row">
                  <div className="ticket-row__info">
                    <p className="ticket-row__type">{ticket.type}</p>
                    <p className="ticket-row__left">{ticket.left} left</p>
                  </div>
                  <div className="ticket-row__cta">
                    <span className="ticket-row__price">
                      ${ticket.price.toFixed(2)}
                    </span>
                    <button type="button">Select</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

export default function EventPageWithParams() {
  const params = useParams();
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return <div className="event-page error">Invalid event id</div>;
    }
  return <EventPage eventId={id} />;
}
