import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi } from '../utils/api';
import type { Cart, CartItem, ApiError } from '../utils/api';

export default function Cart() {
  const navigate = useNavigate();
  //state to store cart data
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null); //tracks which item is being updated
  const [quantityDrafts, setQuantityDrafts] = useState<Record<number, string>>({});

  //load cart when component mounts
  useEffect(() => {
    loadCart();
  }, []);

  //function to fetch cart from API
  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cartApi.getCart();
      setCart(response.cart);
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.status === 401) {
        setError('Please log in to view your cart. Set your token in the browser console: localStorage.setItem("token", "YOUR_TOKEN")');
      } else {
        setError(apiError.message || 'Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  };

  //keep editable quantities in sync with cart data
  useEffect(() => {
    if (cart?.items) {
      const map: Record<number, string> = {};
      cart.items.forEach((item) => {
        map[item.info_id] = String(item.quantity ?? 1);
      });
      setQuantityDrafts(map);
    } else {
      setQuantityDrafts({});
    }
  }, [cart]);

  const handleQuantityInputChange = (infoId: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setQuantityDrafts((prev) => ({
      ...prev,
      [infoId]: digitsOnly,
    }));
  };

  //function to update item quantity
  const handleUpdateQuantity = async (infoId: number, newQuantity: number) => {
    if (newQuantity < 0) return; //dont allow negative quantities
    
    setUpdating(infoId);
    try {
      const response = await cartApi.updateItem(infoId, newQuantity);
      setCart(response.cart);
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to update item');
    } finally {
      setUpdating(null);
    }
  };

  const commitQuantityChange = (item: CartItem) => {
    const draftValue = quantityDrafts[item.info_id];
    let nextQty = Number.parseInt(draftValue ?? '', 10);
    if (Number.isNaN(nextQty) || nextQty < 1) {
      nextQty = item.quantity;
    }

    if (nextQty === item.quantity) {
      setQuantityDrafts((prev) => ({
        ...prev,
        [item.info_id]: String(item.quantity),
      }));
      return;
    }

    handleUpdateQuantity(item.info_id, nextQty);
  };

  //function to remove item from cart (set quantity to 0)
  const handleRemoveItem = async (infoId: number) => {
    if (!confirm('Remove this item from cart?')) return;
    await handleUpdateQuantity(infoId, 0);
  };

  //function to clear entire cart
  const handleClearCart = async () => {
    if (!confirm('Clear entire cart? This cannot be undone.')) return;
    try {
      await cartApi.clearCart();
      await loadCart(); //reload to show empty cart
    } catch (err) {
      const apiError = err as ApiError;
      alert(apiError.message || 'Failed to clear cart');
    }
  };

  //helper function to format price from cents to dollars
  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  //calculate total from cart items
  const calculateTotal = (items: CartItem[]) => {
    return items.reduce((sum, item) => sum + (item.unit_price_cents * item.quantity), 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading cart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 font-semibold mb-2">⚠️ Error</p>
            <p className="text-yellow-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const totalCents = cart ? calculateTotal(cart.items) : 0;
  const hasItems = cart && cart.items.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" style={{ minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            {hasItems && (
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 font-semibold py-2 px-4 rounded-lg border border-red-200 hover:border-red-300 transition-colors"
              >
                Clear Cart
              </button>
            )}
          </div>

          {!hasItems ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">Your cart is empty</p>
              <p className="text-sm">Add some tickets to get started!</p>
            </div>
          ) : (
            <>
              {/*cart items list*/}
              <div className="space-y-4 mb-6">
                {cart!.items.map((item) => (
                  <div
                    key={item.cart_item_id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.ticket_name}</h3>
                        <p className="text-sm text-gray-600">Event ID: {item.event_id}</p>
                        <p className="text-sm text-gray-600">Price: ${formatPrice(item.unit_price_cents)} each</p>
                      </div>
                      <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <label className="text-xs text-gray-500 mb-1">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={quantityDrafts[item.info_id] ?? String(item.quantity)}
                          onChange={(e) => handleQuantityInputChange(item.info_id, e.target.value)}
                          onBlur={() => commitQuantityChange(item)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          disabled={updating === item.info_id}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                        />
                      </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">
                            ${formatPrice(item.unit_price_cents * item.quantity)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.info_id)}
                          disabled={updating === item.info_id}
                          className="text-red-600 hover:text-red-700 disabled:opacity-50 transition-colors"
                          title="Remove item"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/*cart total and checkout button*/}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xl font-semibold text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-gray-900">${formatPrice(totalCents)}</span>
                </div>
                <button
                  onClick={() => navigate('/checkout')} //navigate to checkout page
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

