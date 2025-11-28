import { useEffect, useState } from 'react';
import './MyPaymentInfoPage.css';
import { usersApi } from '../api/users';
import { paymentsApi } from '../api/payments';

type PaymentMethod = {
  paymentInfoId: number;
  accountId: string;
  name: string;
  last4: string;
  expMonth: number;
  expYear: number;
  currency: string;
};

export function MyPaymentInfoPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingCard, setAddingCard] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    ccv: '',
    exp_month: '',
    exp_year: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  async function loadPaymentMethods() {
    setLoading(true);
    setError(null);
    try {
      const paymentMethods = await usersApi.getPaymentMethods();
      setPaymentMethods(paymentMethods);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCard() {
    setSaving(true);
    setError(null);
    try {
      await paymentsApi.verifyCard({
        number: formData.number.replace(/\s/g, ''),
        name: formData.name,
        ccv: formData.ccv,
        exp_month: parseInt(formData.exp_month, 10),
        exp_year: parseInt(formData.exp_year, 10),
      });

      await loadPaymentMethods();
      setAddingCard(false);
      setFormData({ number: '', name: '', ccv: '', exp_month: '', exp_year: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add payment method');
    } finally {
      setSaving(false);
    }
  }

  function formatCardNumber(value: string) {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').slice(0, 19);
  }

  if (loading) {
    return (
      <div className="payment-info-page">
        <div className="payment-info-page__loading">Loading payment methods…</div>
      </div>
    );
  }

  return (
    <section className="payment-info-page">
      <header className="payment-info-page__header">
        <h1>Payment Methods</h1>
        <p className="payment-info-page__subtitle">
          Manage your saved payment methods
        </p>
      </header>

      {error && (
        <div className="payment-info-page__error-banner">{error}</div>
      )}

      {!addingCard ? (
        <>
          <div className="payment-info-page__actions">
            <button
              type="button"
              className="add-card-button"
              onClick={() => setAddingCard(true)}
            >
              + Add Payment Method
            </button>
          </div>

          {paymentMethods.length === 0 ? (
            <div className="payment-info-page__empty">
              <p>No payment methods saved.</p>
              <p className="payment-info-page__empty-hint">
                Add a payment method to make checkout faster
              </p>
            </div>
          ) : (
            <ul className="payment-methods-list">
              {paymentMethods.map((method) => (
                <li key={method.paymentInfoId} className="payment-method-card">
                  <div className="payment-method-card__icon">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect width="40" height="40" rx="8" fill="rgba(127, 90, 240, 0.2)"/>
                      <path d="M12 15h16v2H12v-2zm0 4h16v2H12v-2zm0 4h10v2H12v-2z" fill="#7f5af0"/>
                    </svg>
                  </div>
                  <div className="payment-method-card__details">
                    <h3 className="payment-method-card__name">{method.name}</h3>
                    <p className="payment-method-card__card-number">
                      •••• •••• •••• {method.last4}
                    </p>
                    <p className="payment-method-card__expiry">
                      Expires {String(method.expMonth).padStart(2, '0')}/{method.expYear}
                    </p>
                  </div>
                  <div className="payment-method-card__currency">
                    {method.currency}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <div className="add-card-form">
          <h2>Add Payment Method</h2>
          <div className="form-group">
            <label htmlFor="card-number">Card Number</label>
            <input
              id="card-number"
              type="text"
              value={formData.number}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                setFormData({ ...formData, number: formatted });
              }}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="card-name">Cardholder Name</label>
            <input
              id="card-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="form-input"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="exp-month">Expiry Month</label>
              <input
                id="exp-month"
                type="number"
                value={formData.exp_month}
                onChange={(e) => setFormData({ ...formData, exp_month: e.target.value })}
                placeholder="12"
                min="1"
                max="12"
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="exp-year">Expiry Year</label>
              <input
                id="exp-year"
                type="number"
                value={formData.exp_year}
                onChange={(e) => setFormData({ ...formData, exp_year: e.target.value })}
                placeholder="2025"
                min={new Date().getFullYear()}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ccv">CCV</label>
              <input
                id="ccv"
                type="text"
                value={formData.ccv}
                onChange={(e) => setFormData({ ...formData, ccv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                placeholder="123"
                maxLength={4}
                className="form-input"
              />
            </div>
          </div>
          <div className="form-actions">
            <button
              type="button"
              onClick={handleAddCard}
              disabled={saving || !formData.number || !formData.name || !formData.ccv || !formData.exp_month || !formData.exp_year}
              className="form-button form-button--primary"
            >
              {saving ? 'Adding...' : 'Add Payment Method'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingCard(false);
                setFormData({ number: '', name: '', ccv: '', exp_month: '', exp_year: '' });
                setError(null);
              }}
              disabled={saving}
              className="form-button form-button--secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}