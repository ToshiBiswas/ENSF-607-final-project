//API client utility for making authenticated requests
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  userId?: number;
  accountId?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    //If response is not JSON, create error from status
    const error: ApiError = {
      message: response.status === 401 
        ? 'Authentication required. Please log in.' 
        : `Request failed with status ${response.status}`,
      status: response.status,
    };
    throw error;
  }

  if (!response.ok) {
    let message: string = 'An error occurred';
    let code: string | undefined = undefined;

    if (typeof data?.error === 'string') {
      message = data.error;
    } else if (data?.error && typeof data.error === 'object') {
      if (typeof data.error.message === 'string') {
        message = data.error.message;
      }
      if (typeof data.error.code === 'string') {
        code = data.error.code;
      }
    } else if (typeof data?.message === 'string') {
      message = data.message;
    }

    if (!code && typeof data?.code === 'string') {
      code = data.code;
    }

    const error: ApiError = {
      message,
      code,
      status: response.status,
      userId: data?.userId,
      accountId: data?.accountId,
    };
    throw error;
  }

  return data;
}

//Payment method types
export interface PaymentMethod {
  paymentInfoId: number;
  accountId: string;
  name: string;
  last4: string;
  expMonth: number;
  expYear: number;
  currency: string;
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
}

export interface VerifyCardRequest {
  number: string;
  name: string;
  ccv: string;
  exp_month: number;
  exp_year: number;
}

export interface VerifyCardResponse {
  paymentMethod: PaymentMethod;
}

//Cart types
export interface CartItem {
  cart_item_id: number;
  info_id: number;
  quantity: number;
  unit_price_cents: number;
  ticket_name: string;
  event_id: number;
}

export interface Cart {
  owner: { userId: number };
  items: CartItem[];
}

export interface CartResponse {
  cart: Cart;
  total_cents?: number;
}

export interface AddToCartRequest {
  ticket_info_id: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

//Checkout types
export interface CheckoutRequest {
  usePaymentInfoId?: { id: number; ccv: string };
  newCard?: {
    number: string;
    name: string;
    ccv: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface CheckoutResponse {
  tickets: string[];
}

//AI Advice types
export interface EventAdviceRequest {
  eventType?: string;
  budget?: string;
  location?: string;
  date?: string;
  attendees?: number;
  [key: string]: any;
}

export interface EventAdviceResponse {
  ok: boolean;
  advice: string;
}

export interface StyleAdviceRequest {
  eventTitle: string;
  date?: string;
  location?: string;
  formality?: string;
  dressCode?: string;
  weather?: string;
  preferences?: string;
  constraints?: string;
}

export interface StyleAdviceResponse {
  ok: boolean;
  outfit?: string;
  accessories?: string;
  colors?: string;
  tips?: string;
  //backend may return full gemini structure
  summary?: string;
  outfits?: Array<{
    label?: string;
    items?: string[];
    accessories?: string[];
    notes?: string;
    estimatedCost?: string;
  }>;
  dos?: string[];
  donts?: string[];
  shoppingList?: string[];
  error?: string;
}

//API functions
export const paymentApi = {
  getPaymentMethods: (): Promise<PaymentMethodsResponse> =>
    apiRequest<PaymentMethodsResponse>('/me/payment-methods'),

  verifyCard: (card: VerifyCardRequest): Promise<VerifyCardResponse> =>
    apiRequest<VerifyCardResponse>('/payments/verify-card', {
      method: 'POST',
      body: JSON.stringify(card),
    }),
};

export const cartApi = {
  getCart: (): Promise<CartResponse> =>
    apiRequest<CartResponse>('/cart'),

  addItem: (item: AddToCartRequest): Promise<CartResponse> =>
    apiRequest<CartResponse>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(item),
    }),

  updateItem: (ticketInfoId: number, quantity: number): Promise<CartResponse> =>
    apiRequest<CartResponse>(`/cart/items/${ticketInfoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    }),

  clearCart: (): Promise<CartResponse> =>
    apiRequest<CartResponse>('/cart', {
      method: 'DELETE',
    }),

  checkout: (request: CheckoutRequest): Promise<CheckoutResponse> =>
    apiRequest<CheckoutResponse>('/cart/checkout', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

export const aiApi = {
  getEventAdvice: (request: EventAdviceRequest): Promise<EventAdviceResponse> =>
    apiRequest<EventAdviceResponse>('/advice', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  getStyleAdvice: (request: StyleAdviceRequest): Promise<StyleAdviceResponse> =>
    apiRequest<StyleAdviceResponse>('/advice/style', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  getStyleAdviceChat: (request: {
    eventTitle: string;
    date?: string;
    location?: string;
    question: string;
    originalAdvice?: any;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<{ ok: boolean; response: string }> =>
    apiRequest<{ ok: boolean; response: string }>('/advice/style/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

//user tickets (for outfit advice)
export interface UserTicket {
  ticket_id: number;
  code: string;
  event?: {
    eventId?: number;
    title?: string;
    location?: string;
    startTime?: string;
    endTime?: string;
  };
}
export interface UserTicketsResponse {
  tickets?: UserTicket[];
  data?: UserTicket[]; //backend may return 'data' instead of 'tickets'
}

export const userApi = {
  getMyTickets: (): Promise<UserTicketsResponse> =>
    apiRequest<UserTicketsResponse>('/me/tickets'),
};

