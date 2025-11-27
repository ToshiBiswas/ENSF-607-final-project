import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';

type Ticket = {
  id: number;
  event_id: number;
  user_id: number;
  quantity: number;
  price_paid: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  event_title: string;
  event_venue: string;
  event_start: string;
  event_end: string;
  ticket_type: string;
  payment_id?: number;
  account_id?: string;
};

type TicketsResponse = {
  message: string;
  page: number;
  pageSize: number;
  total: number;
  data: Ticket[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export function MyTicketPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [eventFilter, setEventFilter] = useState<string>('');
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [refundingTicketId, setRefundingTicketId] = useState<number | null>(null);
  const [uniqueEvents, setUniqueEvents] = useState<Array<{ event_id: number; event_title: string }>>([]);

  // Check for purchase success parameter
  useEffect(() => {
    const purchaseParam = searchParams.get('purchase');
    if (purchaseParam === 'success') {
      setShowSuccessBanner(true);
      // Remove the parameter from URL
      searchParams.delete('purchase');
      setSearchParams(searchParams, { replace: true });
      // Auto-hide banner after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  //load unique events for filter dropdown
  useEffect(() => {
    async function loadUniqueEvents() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/me/tickets?page=1&pageSize=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.ok) {
          const data: TicketsResponse = await res.json();
          const eventsMap = new Map<number, { event_id: number; event_title: string }>();
          (data.data ?? []).forEach((ticket) => {
            if (ticket.event_id && ticket.event_title && !eventsMap.has(ticket.event_id)) {
              eventsMap.set(ticket.event_id, {
                event_id: ticket.event_id,
                event_title: ticket.event_title,
              });
            }
          });
          setUniqueEvents(Array.from(eventsMap.values()).sort((a, b) => a.event_title.localeCompare(b.event_title)));
        }
      } catch (err) {
        console.error('Failed to load unique events:', err);
      }
    }

    loadUniqueEvents();
  }, []);

  //extract loadTickets function so it can be called from refund handler
  //use useCallback to memoize and ensure it uses current filter values
  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (eventFilter) {
        params.append('eventId', eventFilter);
      }
      if (upcomingOnly) {
        params.append('upcoming', 'true');
      }

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to view your tickets');
      }

      const res = await fetch(`${API_BASE_URL}/me/tickets?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please log in to view your tickets');
        }
        throw new Error(`Failed to load tickets (status ${res.status})`);
      }

      const data: TicketsResponse = await res.json();
      setTickets(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, eventFilter, upcomingOnly]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(
      new Date(value),
    );

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#009245]"></div>
            <p className="mt-4 text-slate-600">Loading your tickets…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">My Tickets</h1>
          <p className="text-slate-600 text-lg">
            {total} {total === 1 ? 'ticket' : 'tickets'} total
          </p>
        </header>

        {/* Success Banner */}
        {showSuccessBanner && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-r-lg shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-6 h-6 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold text-lg">Purchase Successful!</h3>
                  <p className="text-sm">Your tickets have been purchased and are now available below.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessBanner(false)}
                className="text-green-700 hover:text-green-900 ml-4"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-3">
            <label htmlFor="event-filter" className="text-sm font-medium text-slate-700">
              Filter by event:
            </label>
            <select
              id="event-filter"
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#009245] focus:border-transparent min-w-[200px]"
            >
              <option value="">All Events</option>
              {uniqueEvents.map((event) => (
                <option key={event.event_id} value={event.event_id.toString()}>
                  {event.event_title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="upcoming-filter"
              type="checkbox"
              checked={upcomingOnly}
              onChange={(e) => {
                setUpcomingOnly(e.target.checked);
                setPage(1);
              }}
              className="w-5 h-5 text-[#009245] border-slate-300 rounded focus:ring-[#009245]"
            />
            <label htmlFor="upcoming-filter" className="text-sm font-medium text-slate-700 cursor-pointer">
              Upcoming events only
            </label>
          </div>
        </div>

        {/* Tickets List */}
        {tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-slate-700 text-lg mb-2">No tickets found.</p>
            <p className="text-slate-500 text-sm">
              {eventFilter || upcomingOnly
                ? 'Try adjusting your filters'
                : 'Purchase tickets from events to see them here'}
            </p>
          </div>
        ) : (
          <>
            <ul className="space-y-6">
              {tickets.map((ticket) => (
                <li key={ticket.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">
                        {ticket.event_title || 'Untitled Event'}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadgeClass(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[#009245] ml-4">
                      {formatCurrency((ticket.price_paid / 100) * ticket.quantity, ticket.currency)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Ticket Type</span>
                      <span className="text-slate-800 font-medium">{ticket.ticket_type || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Venue</span>
                      <span className="text-slate-800 font-medium">{ticket.event_venue || 'TBA'}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Date</span>
                      <span className="text-slate-800 font-medium">
                        {ticket.event_start ? formatDate(ticket.event_start) : 'TBA'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Quantity</span>
                      <span className="text-slate-800 font-medium">{ticket.quantity}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Price per ticket</span>
                      <span className="text-slate-800 font-medium">
                        {formatCurrency(ticket.price_paid / 100, ticket.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wide text-slate-500 block mb-1">Purchased</span>
                      <span className="text-slate-800 font-medium">
                        {ticket.created_at ? formatDate(ticket.created_at) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <span className="text-sm text-slate-500 font-mono">Ticket ID: #{ticket.id}</span>
                    <div className="flex gap-3">
                      {ticket.event_id && (
                        <button
                          type="button"
                          onClick={() => navigate(`/events/${ticket.event_id}`)}
                          className="px-6 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors font-semibold"
                        >
                          View Event
                        </button>
                      )}
                      {ticket.payment_id && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('Are you sure you want to refund this ticket? This action cannot be undone.')) {
                              return;
                            }
                            setRefundingTicketId(ticket.id);
                            try {
                              await usersApi.refundTicket(ticket.id);
                              //reload tickets using the same function that preserves filters
                              await loadTickets();
                              alert('Refund processed successfully!');
                            } catch (err: any) {
                              //extract error message from backend error format
                              const errorMessage = err?.data?.error?.message || err?.message || 'Failed to process refund';
                              alert(errorMessage);
                              console.error('Refund error:', err);
                            } finally {
                              setRefundingTicketId(null);
                            }
                          }}
                          disabled={refundingTicketId === ticket.id}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {refundingTicketId === ticket.id ? 'Processing...' : 'Refund'}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-6 flex justify-center items-center gap-6">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300"
                >
                  Previous
                </button>
                <span className="text-slate-600 text-sm font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-6 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed border border-slate-300"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
