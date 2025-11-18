import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi, paymentApi } from '../utils/api';
import type { Cart, PaymentMethod, CheckoutRequest, ApiError } from '../utils/api';

export default function Checkout() {
  const navigate = useNavigate();
  //state for cart and payment methods
  const [cart, setCart] = useState<Cart | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string[] | null>(null); //stores ticket codes after successful checkout

  //payment method selection
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<number | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);

  //new card form state
  const [newCard, setNewCard] = useState({
    number: '',
    name: '',
    ccv: '',
    exp_month: '',
    exp_year: '',
  });

  //load cart and payment methods when component mounts
  useEffect(() => {
    loadData();
  }, []);

  //function to load cart and payment methods
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      //load cart and payment methods in parallel
      const [cartResponse, paymentResponse] = await Promise.all([
        cartApi.getCart(),
        paymentApi.getPaymentMethods().catch(() => ({ paymentMethods: [] })), //dont fail if no payment methods
      ]);

      setCart(cartResponse.cart);
      setPaymentMethods(paymentResponse.paymentMethods);

      //auto-select first payment method if available
      if (paymentResponse.paymentMethods.length > 0) {
        setSelectedPaymentMethod(paymentResponse.paymentMethods[0].paymentInfoId);
      } else {
        setUseNewCard(true); //if no saved cards, show new card form
      }
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        setError('Please log in to checkout. Set your token in the browser console: localStorage.setItem("token", "YOUR_TOKEN")');
      } else {
        setError(apiError.message || 'Failed to load checkout data');
      }
    } finally {
      setLoading(false);
    }
  };

  //handle input changes for new card form
  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCard((prev) => ({ ...prev, [name]: value }));
  };

  //format card number with spaces
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setNewCard((prev) => ({ ...prev, number: formatted }));
  };

  //handle checkout submission
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutLoading(true);
    setError(null);
    setSuccess(null);

    try {
      //validate payment method selection
      if (!useNewCard && !selectedPaymentMethod) {
        setError('Please select a payment method');
        setCheckoutLoading(false);
        return;
      }

      //validate new card if using new card
      if (useNewCard) {
        if (!newCard.number || !newCard.name || !newCard.ccv || !newCard.exp_month || !newCard.exp_year) {
          setError('Please fill in all card details');
          setCheckoutLoading(false);
          return;
        }
      }

      //prepare checkout request
      const checkoutRequest: CheckoutRequest = {};
      
      if (useNewCard) {
        //clean card number (remove spaces)
        const cleanNumber = newCard.number.replace(/\s/g, '');
        checkoutRequest.newCard = {
          number: cleanNumber,
          name: newCard.name.trim(),
          ccv: newCard.ccv,
          exp_month: parseInt(newCard.exp_month, 10),
          exp_year: parseInt(newCard.exp_year, 10),
        };
      } else {
        checkoutRequest.usePaymentInfoId = selectedPaymentMethod!;
      }

      //call checkout API
      const response = await cartApi.checkout(checkoutRequest);
      
      //success! show ticket codes
      setSuccess(response.tickets);
      
      //clear cart state (cart is cleared on backend)
      setCart({ owner: { userId: 0 }, items: [] });
      
    } catch (err) {
      const apiError = err as ApiError;
      let errorMessage = apiError.message || 'Checkout failed';

      //handle specific error codes
      switch (apiError.code) {
        case 'CARD_EXPIRED':
          errorMessage = 'This card has expired. Please use a valid card.';
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
          errorMessage = apiError.message || 'Checkout failed';
      }

      setError(errorMessage);
    } finally {
      setCheckoutLoading(false);
    }
  };

  //calculate total from cart
  const calculateTotal = () => {
    if (!cart || !cart.items.length) return 0;
    return cart.items.reduce((sum, item) => sum + (item.unit_price_cents * item.quantity), 0);
  };

  //format price helper
  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading checkout...</div>
      </div>
    );
  }

  //show success message if checkout was successful
  if (success && success.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4" style={{ minHeight: '100vh' }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Checkout Successful!</h1>
              <p className="text-lg text-gray-600 mb-6">Your tickets have been purchased successfully.</p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-green-900 mb-4">Your Ticket Codes:</h2>
                <div className="space-y-2">
                  {success.map((ticketCode, index) => (
                    <div key={index} className="text-lg font-mono bg-white p-3 rounded border border-green-200 text-green-800">
                      {ticketCode}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate('/cart')} //navigate to cart page
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalCents = calculateTotal();
  const hasItems = cart && cart.items.length > 0;

  //show error if cart is empty
  if (!hasItems) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4" style={{ minHeight: '100vh' }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Your cart is empty</p>
              <p className="text-sm mb-4">Add some tickets to your cart before checkout.</p>
              <button
                onClick={() => navigate('/cart')} //navigate to cart page
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                View Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" style={{ minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/*left column - order summary*/}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Order Summary</h2>
              <div className="space-y-4 mb-6">
                {cart!.items.map((item) => (
                  <div key={item.cart_item_id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold text-gray-900">{item.ticket_name}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ${formatPrice(item.unit_price_cents * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-gray-900">${formatPrice(totalCents)}</span>
                </div>
              </div>
            </div>

            {/*right column - payment method*/}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Payment Method</h2>
              
              <form onSubmit={handleCheckout}>
                {/*saved payment methods*/}
                {paymentMethods.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <input
                        type="radio"
                        checked={!useNewCard}
                        onChange={() => setUseNewCard(false)}
                        className="mr-2"
                      />
                      Use Saved Card
                    </label>
                    {!useNewCard && (
                      <div className="mt-2 space-y-2">
                        {paymentMethods.map((method) => (
                          <label
                            key={method.paymentInfoId}
                            className={`block p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedPaymentMethod === method.paymentInfoId
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.paymentInfoId}
                              checked={selectedPaymentMethod === method.paymentInfoId}
                              onChange={() => setSelectedPaymentMethod(method.paymentInfoId)}
                              className="mr-2"
                            />
                            <span className="font-semibold text-gray-900">•••• •••• •••• {method.last4}</span>
                            <span className="block text-sm text-gray-600">{method.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/*new card option*/}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <input
                      type="radio"
                      checked={useNewCard}
                      onChange={() => setUseNewCard(true)}
                      className="mr-2"
                    />
                      {paymentMethods.length > 0 ? 'Use New Card' : 'Enter Card Details'}
                    </label>
                  
                  {useNewCard && (
                    <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label htmlFor="number" className="block text-sm font-medium text-gray-700 mb-1">
                          Card Number
                        </label>
                        <input
                          type="text"
                          id="number"
                          name="number"
                          value={newCard.number}
                          onChange={handleCardNumberChange}
                          placeholder="1234 5678 9012 3456"
                          maxLength={19}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                          style={{ color: '#111827' }}
                          required={useNewCard}
                        />
                      </div>

                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={newCard.name}
                          onChange={handleCardInputChange}
                          placeholder="John Doe"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                          style={{ color: '#111827' }}
                          required={useNewCard}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="exp_month" className="block text-sm font-medium text-gray-700 mb-1">
                            Expiry Month
                          </label>
                          <input
                            type="number"
                            id="exp_month"
                            name="exp_month"
                            value={newCard.exp_month}
                            onChange={handleCardInputChange}
                            placeholder="MM"
                            min="1"
                            max="12"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                            style={{ color: '#111827' }}
                            required={useNewCard}
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
                            value={newCard.exp_year}
                            onChange={handleCardInputChange}
                            placeholder="YYYY"
                            min={new Date().getFullYear()}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                            style={{ color: '#111827' }}
                            required={useNewCard}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="ccv" className="block text-sm font-medium text-gray-700 mb-1">
                          CCV
                        </label>
                        <input
                          type="text"
                          id="ccv"
                          name="ccv"
                          value={newCard.ccv}
                          onChange={handleCardInputChange}
                          placeholder="123"
                          maxLength={4}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                          style={{ color: '#111827' }}
                          required={useNewCard}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/*checkout button*/}
                <button
                  type="submit"
                  disabled={checkoutLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {checkoutLoading ? 'Processing...' : `Pay $${formatPrice(totalCents)}`}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

