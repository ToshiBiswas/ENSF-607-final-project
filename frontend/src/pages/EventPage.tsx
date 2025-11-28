import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cartApi, ApiError } from '../utils/api';
import { eventsApi, type Event } from '../api/events';

type Ticket = {
  infoId: number;
  type: string;
  price: number;
  quantity: number;
  left: number;
};

export function EventPage({ eventId }: { eventId: number }) {
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [eventData, ticketTypes] = await Promise.all([
          eventsApi.getById(eventId),
          eventsApi.getTicketTypes(eventId).catch(() => []),
        ]);

        setEvent(eventData);
        setTickets(ticketTypes as Ticket[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [eventId]);

  const formatDate = (value: string) => {
    const date = new Date(value);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(price);
  };

  const handleSelectTicket = async (ticketInfoId: number) => {
    if (addingToCart === ticketInfoId) return; // Prevent double-clicks
    
    setAddingToCart(ticketInfoId);
    try {
      await cartApi.addItem({
        ticket_info_id: ticketInfoId,
        quantity: 1,
      });
      //navigate to cart after successful add
      navigate('/cart');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        alert('Please log in to add items to your cart.');
      } else {
        alert(apiError.message || 'Failed to add ticket to cart');
      }
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#009245]" />
            <p className="mt-4 text-slate-600">Loading event…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error ?? 'Event missing'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#056733] to-[#009245] text-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="mb-4">
            {event.categories && event.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {event.categories.map((cat) => (
                  <span
                    key={cat.categoryId}
                    className="px-3 py-1 bg-white bg-opacity-20 text-white text-xs rounded-full font-semibold"
                  >
                    {cat.value}
                  </span>
                ))}
              </div>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.title}</h1>
          <div className="space-y-2 text-slate-200">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {event.location}
            </div>
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formatDate(event.startTime)} – {formatDate(event.endTime)}
            </div>
            <div className="flex items-center text-slate-300">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Hosted by {event.organizer?.name ?? 'Unknown'}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* About Section */}
          <article className="lg:col-span-2 bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">About this event</h2>
            <p className="text-slate-600 leading-relaxed">{event.description}</p>
          </article>

          {/* Tickets Panel */}
          <section className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Tickets</h3>

            {tickets.length === 0 ? (
              <p className="text-slate-600">No tickets configured yet.</p>
            ) : (
              <ul className="space-y-3">
                {tickets.map((ticket) => (
                  <li
                    key={ticket.infoId}
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-800">{ticket.type}</p>
                        <p className="text-sm text-[#009245]">{ticket.left} tickets left</p>
                      </div>
                      <span className="text-lg font-bold text-slate-800">
                        {formatPrice(ticket.price)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectTicket(ticket.infoId)}
                      disabled={addingToCart === ticket.infoId || ticket.left === 0}
                      className="w-full py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingToCart === ticket.infoId ? 'Adding...' : ticket.left === 0 ? 'Sold Out' : 'Select'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default function EventPageWithParams() {
  const params = useParams();
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center py-16">
            <p className="text-red-600">Invalid event id</p>
          </div>
        </div>
      </div>
    );
  }
  return <EventPage eventId={id} />;
}
