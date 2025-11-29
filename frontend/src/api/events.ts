/**
 * Events API
 */
import { apiClient } from './client';

export interface Event {
  eventId: number;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  ticketType: string;
  organizer?: {
    userId: number;
    name: string;
    email: string;
  };
  categories?: Array<{
    categoryId: number;
    value: string;
  }>;
  tickets?: Array<{
    ticketInfoId: number;
    ticketType: string;
    ticketPrice: number;
    ticketsQuantity: number;
    ticketsLeft: number;
  }>;
}

export interface EventsResponse {
  events: Event[];
}

export interface EventResponse {
  event: Event;
}

export interface TicketTypesResponse {
  ticketTypes: Array<{
    ticketInfoId: number;
    ticketType: string;
    ticketPrice: number;
    ticketsQuantity: number;
    ticketsLeft: number;
  }>;
}

export const eventsApi = {
  /**
   * Get events by category
   */
  getByCategory: async (category?: string, pageSize?: number): Promise<Event[]> => {
    const params = new URLSearchParams();
    if (category) {
      params.append('category', category);
    }
    if (pageSize) {
      params.append('pageSize', pageSize.toString());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<EventsResponse>(`/events${query}`);
    return response.events;
  },

  /**
   * Get a single event by ID
   */
  getById: async (id: number): Promise<Event> => {
    const response = await apiClient.get<EventResponse>(`/events/${id}`);
    return response.event;
  },

  /**
   * Get ticket types for an event
   */
  getTicketTypes: async (eventId: number): Promise<TicketTypesResponse['ticketTypes']> => {
    const response = await apiClient.get<TicketTypesResponse>(`/events/${eventId}/tickets`);
    return response.ticketTypes;
  },

  /**
   * Get events created by the current user (organizer)
   */
  getMyEvents: async (): Promise<Event[]> => {
    const response = await apiClient.get<EventsResponse>('/user/events');
    return response.events;
  },

  /**
   * Validate a ticket code for an event (organizer only)
   */
  validateTicket: async (eventId: number, code: string): Promise<{
    response: 'valid' | 'invalid';
    ticket: {
      id: number;
      code: string;
      event_id: number;
      event_title: string;
      event_location: string;
      event_start: string;
      event_end: string;
      ticket_type: string;
      ticket_price: number;
    } | null;
  }> => {
    const response = await apiClient.get<{
      response: 'valid' | 'invalid';
      ticket: any;
    }>(`/events/${eventId}/tickets/validate?code=${code}`);
    return response;
  },

  /**
   * Create a new event (organizer only)
   */
  createEvent: async (data: {
    title: string;
    description: string;
    location: string;
    startTime: string;
    endTime: string;
    categories?: string[];
    ticketInfos?: Array<{
      type: string;
      price: number;
      quantity: number;
    }>;
  }): Promise<Event> => {
    const response = await apiClient.post<EventResponse>('/events', data);
    return response.event;
  },
};

