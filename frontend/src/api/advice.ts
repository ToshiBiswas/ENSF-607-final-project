import { ApiError } from '../utils/api';
import {
  AskEventTypeResponse,
  RecommendEventRequest,
  RecommendEventResponse,
} from '../types/advice';

const BASE_PATH = '/api';

async function adviceRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  


  const res = await fetch(`${BASE_PATH}${path}`, {
    ...options,
    headers,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (_) {
    // ignore JSON parse errors and handle via status
  }

  if (!res.ok) {
    const err: ApiError = {
      message: data?.message || data?.error || `Request failed (${res.status})`,
      status: res.status,
      code: data?.code,
    };
    throw err;
  }

  return data as T;
}

export const adviceApi = {
  getQuestion: (): Promise<AskEventTypeResponse> =>
    adviceRequest<AskEventTypeResponse>('/ask-event-type'),

  recommendEvent: (body: RecommendEventRequest): Promise<RecommendEventResponse> =>
    adviceRequest<RecommendEventResponse>('/recommend-event', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
