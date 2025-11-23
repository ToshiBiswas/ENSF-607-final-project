import { useEffect, useState } from 'react';
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

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
        const [eventRes, ticketRes] = await Promise.all([
          fetch(`${API_BASE_URL}/events/${eventId}`),
          fetch(`${API_BASE_URL}/events/${eventId}/tickets`),
        ]);

        if (!eventRes.ok) throw new Error('Event not found');

        const { event } = await eventRes.json();
        const { ticketTypes } = await ticketRes.json();

        setEvent(event);
        setTickets(ticketTypes ?? []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load event'
        );
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
          {event.location} • {formatDate(event.startTime)} –{' '}
          {formatDate(event.endTime)}
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
            <p className="ticket-panel__empty">
              No tickets configured yet.
            </p>
          ) : (
            <ul className="ticket-list">
              {tickets.map((ticket) => (
                <li key={ticket.infoId} className="ticket-row">
                  <div className="ticket-row__info">
                    <p className="ticket-row__type">{ticket.type}</p>
                    <p className="ticket-row__left">
                      {ticket.left} left
                    </p>
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
