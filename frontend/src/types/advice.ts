export type AskEventTypeResponse = {
  ok: boolean;
  question: string;
};

export type RecommendEventRequest = {
  eventType: string;
};

export type RecommendedEvent = {
  id: string | number;
  name: string;
  category: string;
  date: string;
  location: string;
  reason: string;
} | null;

export type RecommendEventResponse = {
  ok: boolean;
  recommended_event: RecommendedEvent;
  note?: string;
};
