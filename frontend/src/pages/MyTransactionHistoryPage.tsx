import { useEffect, useState } from 'react';
import './MyTransactionHistoryPage.css';

type Transaction = {
  paymentId: number;
  userId: number;
  eventId: number | null;
  ticketInfoId: number | null;
  paymentInfoId: number | null;
  amountCents: number;
  currency: string;
  status: string;
  refundedCents: number;
  providerPaymentId: string | null;
  createdAt: string;
  updatedAt: string;
  eventTitle: string | null;
  eventVenue: string | null;
  cardLast4: string | null;
  cardName: string | null;
};

type TransactionsResponse = {
  message: string;
  page: number;
  pageSize: number;
  total: number;
  data: Transaction[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';

export function MyTransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadTransactions();
  }, [page, statusFilter]);

  async function loadTransactions() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to view your transaction history');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const res = await fetch(`${API_BASE_URL}/payments/history?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please log in to view your transaction history');
        }
        throw new Error(`Failed to load transactions (status ${res.status})`);
      }

      const data: TransactionsResponse = await res.json();
      setTransactions(data.data ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (cents: number, currency: string) => {
    const amount = cents / 100;
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(
      new Date(value),
    );

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'transaction-status--approved';
      case 'declined':
        return 'transaction-status--declined';
      case 'refunded':
        return 'transaction-status--refunded';
      case 'pending':
        return 'transaction-status--pending';
      default:
        return 'transaction-status--default';
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className="transaction-history-page">
        <div className="transaction-history-page__loading">Loading transaction history…</div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="transaction-history-page">
        <div className="transaction-history-page__error">{error}</div>
      </div>
    );
  }

  return (
    <section className="transaction-history-page">
      <header className="transaction-history-page__header">
        <h1>Transaction History</h1>
        <p className="transaction-history-page__subtitle">
          {total} {total === 1 ? 'transaction' : 'transactions'} total
        </p>
      </header>

      <div className="transaction-history-page__filters">
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
            <option value="approved">Approved</option>
            <option value="declined">Declined</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="transaction-history-page__error-banner">{error}</div>
      )}

      {transactions.length === 0 ? (
        <div className="transaction-history-page__empty">
          <p>No transactions found.</p>
          <p className="transaction-history-page__empty-hint">
            {statusFilter
              ? 'Try adjusting your filters'
              : 'Your transaction history will appear here'}
          </p>
        </div>
      ) : (
        <>
          <ul className="transaction-list">
            {transactions.map((transaction) => (
              <li key={transaction.paymentId} className="transaction-card">
                <div className="transaction-card__header">
                  <div className="transaction-card__title-group">
                    <h3 className="transaction-card__title">
                      {transaction.eventTitle || 'Payment'}
                    </h3>
                    <span className={`transaction-status ${getStatusBadgeClass(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  <div className="transaction-card__amount">
                    {formatCurrency(transaction.amountCents, transaction.currency)}
                  </div>
                </div>

                <div className="transaction-card__details">
                  <div className="transaction-card__detail-row">
                    <span className="transaction-card__label">Transaction ID:</span>
                    <span className="transaction-card__value">#{transaction.paymentId}</span>
                  </div>
                  {transaction.eventVenue && (
                    <div className="transaction-card__detail-row">
                      <span className="transaction-card__label">Venue:</span>
                      <span className="transaction-card__value">{transaction.eventVenue}</span>
                    </div>
                  )}
                  {transaction.cardLast4 && (
                    <div className="transaction-card__detail-row">
                      <span className="transaction-card__label">Payment Method:</span>
                      <span className="transaction-card__value">
                        {transaction.cardName} •••• {transaction.cardLast4}
                      </span>
                    </div>
                  )}
                  <div className="transaction-card__detail-row">
                    <span className="transaction-card__label">Date:</span>
                    <span className="transaction-card__value">
                      {formatDate(transaction.createdAt)}
                    </span>
                  </div>
                  {transaction.refundedCents > 0 && (
                    <div className="transaction-card__detail-row">
                      <span className="transaction-card__label">Refunded:</span>
                      <span className="transaction-card__value transaction-card__value--refund">
                        {formatCurrency(transaction.refundedCents, transaction.currency)}
                      </span>
                    </div>
                  )}
                  {transaction.providerPaymentId && (
                    <div className="transaction-card__detail-row">
                      <span className="transaction-card__label">Provider ID:</span>
                      <span className="transaction-card__value transaction-card__value--mono">
                        {transaction.providerPaymentId}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div className="transaction-history-page__pagination">
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