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
  getByCategory: async (category?: string): Promise<Event[]> => {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
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
};

