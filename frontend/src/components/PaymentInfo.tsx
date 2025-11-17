import { useState, useEffect } from 'react';
import { paymentApi } from '../utils/api';
import type { PaymentMethod, ApiError } from '../utils/api';

export default function PaymentInfo() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    ccv: '',
    exp_month: '',
    exp_year: '',
  });

  // Fetch payment methods on mount
  useEffect(() => {
    console.log('PaymentInfo component mounted, loading payment methods...');
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching payment methods from API...');
      const response = await paymentApi.getPaymentMethods();
      console.log('Payment methods received:', response);
      setPaymentMethods(response.paymentMethods);
    } catch (err) {
      console.error('Error loading payment methods:', err);
      const apiError = err as ApiError;
      // Don't show error for 401 - it's expected if not logged in
      if (apiError.status === 401) {
        setError('Please log in to view your payment methods. Set your token in the browser console: localStorage.setItem("token", "YOUR_TOKEN")');
      } else {
        setError(apiError.message || 'Failed to load payment methods');
      }
    } finally {
      setLoading(false);
      console.log('Loading complete');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear form error when user starts typing
    if (formError) setFormError(null);
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormData((prev) => ({
      ...prev,
      number: formatted,
    }));
    if (formError) setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    // Validate form
    if (!formData.number || !formData.name || !formData.ccv || !formData.exp_month || !formData.exp_year) {
      setFormError('All fields are required');
      setSubmitting(false);
      return;
    }

    // Clean card number (remove spaces)
    const cleanNumber = formData.number.replace(/\s/g, '');

    try {
      await paymentApi.verifyCard({
        number: cleanNumber,
        name: formData.name.trim(),
        ccv: formData.ccv,
        exp_month: parseInt(formData.exp_month, 10),
        exp_year: parseInt(formData.exp_year, 10),
      });

      // Success - reload payment methods and reset form
      await loadPaymentMethods();
      setFormData({
        number: '',
        name: '',
        ccv: '',
        exp_month: '',
        exp_year: '',
      });
      setShowAddForm(false);
    } catch (err) {
      const apiError = err as ApiError;
      let errorMessage = apiError.message || 'Failed to add payment method';

      // Handle specific error codes
      switch (apiError.code) {
        case 'CARD_EXPIRED':
          errorMessage = 'This card has expired. Please use a valid card.';
          break;
        case 'ACCOUNT_EXISTS':
          errorMessage = 'This card is already saved to your account.';
          break;
        case 'BAD_CCV':
          errorMessage = 'Invalid CCV. Please check your card\'s security code.';
          break;
        case 'MISSING_CARD':
          errorMessage = 'Please fill in all card details.';
          break;
        case 'ACCOUNT_NOT_FOUND':
          errorMessage = 'Card not recognized. Please verify your card details.';
          break;
        default:
          errorMessage = apiError.message || 'Failed to add payment method';
      }

      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const formatExpiry = (month: number, year: number) => {
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString().slice(-2);
    return `${monthStr}/${yearStr}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading payment methods...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" style={{ minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Payment Methods</h1>
            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setFormError(null);
                setFormData({
                  number: '',
                  name: '',
                  ccv: '',
                  exp_month: '',
                  exp_year: '',
                });
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {showAddForm ? 'Cancel' : '+ Add Card'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              <p className="font-semibold mb-1">⚠️ Authentication Required</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2 text-yellow-700">
                To get a token, register or login via API, then set it in the browser console.
              </p>
            </div>
          )}

          {/* Add Card Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Card</h2>
              
              {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleCardNumberChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="exp_month" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Month
                  </label>
                  <input
                    type="number"
                    id="exp_month"
                    name="exp_month"
                    value={formData.exp_month}
                    onChange={handleInputChange}
                    placeholder="MM"
                    min="1"
                    max="12"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="exp_year" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Year
                  </label>
                  <input
                    type="number"
                    id="exp_year"
                    name="exp_year"
                    value={formData.exp_year}
                    onChange={handleInputChange}
                    placeholder="YYYY"
                    min={new Date().getFullYear()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ccv" className="block text-sm font-medium text-gray-700 mb-1">
                    CCV
                  </label>
                  <input
                    type="text"
                    id="ccv"
                    name="ccv"
                    value={formData.ccv}
                    onChange={handleInputChange}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {submitting ? 'Adding Card...' : 'Add Card'}
                </button>
              </div>
            </form>
          )}

          {/* Payment Methods List */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Saved Cards</h2>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">No payment methods saved yet.</p>
                <p className="text-sm mt-2">Click "Add Card" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.paymentInfoId}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            CARD
                          </div>
                          <span className="text-lg font-semibold text-gray-900">
                            •••• •••• •••• {method.last4}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">{method.name}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Expires {formatExpiry(method.expMonth, method.expYear)} • {method.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

