import { useEffect, useState } from 'react';
import './MyTicketPage.css';

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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [upcomingOnly, setUpcomingOnly] = useState(false);

  useEffect(() => {
    async function loadTickets() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });
        if (statusFilter) {
          params.append('status', statusFilter);
        }
        if (upcomingOnly) {
          params.append('upcoming', 'true');
        }

        const res = await fetch(`${API_BASE_URL}/tickets?${params.toString()}`, {
          credentials: 'include', // Include cookies for authentication
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
    }

    loadTickets();
  }, [page, statusFilter, upcomingOnly]);

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
        return 'ticket-status--confirmed';
      case 'cancelled':
      case 'refunded':
        return 'ticket-status--cancelled';
      case 'pending':
        return 'ticket-status--pending';
      default:
        return 'ticket-status--default';
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="my-ticket-page">
        <div className="my-ticket-page__loading">Loading your tickets…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-ticket-page">
        <div className="my-ticket-page__error">{error}</div>
      </div>
    );
  }

  return (
    <section className="my-ticket-page">
      <header className="my-ticket-page__header">
        <h1>My Tickets</h1>
        <p className="my-ticket-page__subtitle">
          {total} {total === 1 ? 'ticket' : 'tickets'} total
        </p>
      </header>

      <div className="my-ticket-page__filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="upcoming-filter" className="checkbox-label">
            <input
              id="upcoming-filter"
              type="checkbox"
              checked={upcomingOnly}
              onChange={(e) => {
                setUpcomingOnly(e.target.checked);
                setPage(1);
              }}
            />
            <span>Upcoming events only</span>
          </label>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="my-ticket-page__empty">
          <p>No tickets found.</p>
          <p className="my-ticket-page__empty-hint">
            {statusFilter || upcomingOnly
              ? 'Try adjusting your filters'
              : 'Purchase tickets from events to see them here'}
          </p>
        </div>
      ) : (
        <>
          <ul className="ticket-list">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="ticket-card">
                <div className="ticket-card__header">
                  <div className="ticket-card__title-group">
                    <h3 className="ticket-card__event-title">{ticket.event_title || 'Untitled Event'}</h3>
                    <span className={`ticket-status ${getStatusBadgeClass(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <div className="ticket-card__price">
                    {formatCurrency(ticket.price_paid * ticket.quantity, ticket.currency)}
                  </div>
                </div>

                <div className="ticket-card__details">
                  <div className="ticket-card__detail-row">
                    <span className="ticket-card__label">Venue:</span>
                    <span className="ticket-card__value">{ticket.event_venue || 'TBA'}</span>
                  </div>
                  <div className="ticket-card__detail-row">
                    <span className="ticket-card__label">Date:</span>
                    <span className="ticket-card__value">
                      {ticket.event_start ? formatDate(ticket.event_start) : 'TBA'}
                    </span>
                  </div>
                  <div className="ticket-card__detail-row">
                    <span className="ticket-card__label">Quantity:</span>
                    <span className="ticket-card__value">{ticket.quantity}</span>
                  </div>
                  <div className="ticket-card__detail-row">
                    <span className="ticket-card__label">Price per ticket:</span>
                    <span className="ticket-card__value">
                      {formatCurrency(ticket.price_paid, ticket.currency)}
                    </span>
                  </div>
                  <div className="ticket-card__detail-row">
                    <span className="ticket-card__label">Purchased:</span>
                    <span className="ticket-card__value">
                      {ticket.created_at ? formatDate(ticket.created_at) : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="ticket-card__footer">
                  <span className="ticket-card__id">Ticket ID: #{ticket.id}</span>
                  {ticket.event_id && (
                    <button
                      type="button"
                      className="ticket-card__view-event"
                      onClick={() => {
                        // Navigate to event page - you'll need to implement routing
                        console.log('View event:', ticket.event_id);
                      }}
                    >
                      View Event
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="my-ticket-page__pagination">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="pagination-button"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="pagination-button"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}