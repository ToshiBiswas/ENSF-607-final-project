import React, { useEffect, useMemo, useState } from 'react';
import { adviceApi } from '../api/advice';
import { AskEventTypeResponse, RecommendedEvent } from '../types/advice';
import EventForm from '../components/advice/EventForm';
import EventCard from '../components/advice/EventCard';
import Alert from '../components/common/Alert';
import { aiApi, StyleAdviceResponse, userApi, UserTicket } from '../utils/api';

/**
 * Styling audit (observed):
 * - Primary: green palette (#009245 primary, #056733 hover, #44CE85 accent); gradients used in heroes.
 * - Typography: sans (Inter/Kantumruy), headings ~text-3xl/4xl in heroes, body text slate-600/800.
 * - Cards: bg-white, rounded-lg/rounded-xl, shadow-md, border-slate-200, padding p-6.
 * - Buttons: bg-[#009245] with hover bg-[#056733], rounded-lg/full, font-semibold, focus rings.
 * - Inputs: rounded-lg, border-slate-200, bg-white, focus:ring-[#44CE85]/border-[#009245].
 * - Spacing: sections use py-12–16 with max-width containers (max-w-3xl/7xl), gap-6 grids.
 * Recommendations: standardize card padding to p-6 rounded-lg shadow-md; use text-sm/leading-relaxed for helper text;
 * keep primary buttons bg-[#009245]/hover-[#056733] with focus rings; keep inputs border-slate-200 with green focus ring;
 * use consistent section spacing (py-12, gap-6) and max-w-3xl container for single-column flows.
 */

type FetchState = 'idle' | 'question' | 'recommend';

const AdvicePage: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [recommended, setRecommended] = useState<RecommendedEvent>(null);
  const [note, setNote] = useState<string | undefined>('');
  const [loadingQuestion, setLoadingQuestion] = useState<boolean>(true);
  const [loadingRecommend, setLoadingRecommend] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEventType, setLastEventType] = useState<string>('');
  const [lastAction, setLastAction] = useState<FetchState>('idle');
  // Outfit for owned events
  const [myTickets, setMyTickets] = useState<UserTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [styleAdvice, setStyleAdvice] = useState<StyleAdviceResponse | null>(null);
  const [styleLoading, setStyleLoading] = useState<boolean>(false);
  const [styleError, setStyleError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestion();
    fetchMyTickets();
  }, []);

  const fetchQuestion = async () => {
    setLoadingQuestion(true);
    setError(null);
    setLastAction('question');
    try {
      const res: AskEventTypeResponse = await adviceApi.getQuestion();
      setQuestion(res.question);
    } catch (err: any) {
      setError(err?.message || 'Unable to load question. Please try again.');
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleRecommend = async (eventType: string) => {
    setLastEventType(eventType);
    setRecommended(null);
    setNote('');
    setError(null);
    setLoadingRecommend(true);
    setLastAction('recommend');
    try {
      const res = await adviceApi.recommendEvent({ eventType });
      setRecommended(res.recommended_event);
      setNote(res.note);
    } catch (err: any) {
      setError(err?.message || 'We could not recommend an event. Please try again.');
    } finally {
      setLoadingRecommend(false);
    }
  };

  const retry = () => {
    if (lastAction === 'question') {
      fetchQuestion();
    } else if (lastAction === 'recommend' && lastEventType) {
      handleRecommend(lastEventType);
    } else {
      fetchQuestion();
    }
  };

  const showEmptyState = useMemo(() => !loadingRecommend && !error && recommended === null && !!note, [loadingRecommend, error, recommended, note]);

  const fetchMyTickets = async () => {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const res = await userApi.getMyTickets();
      // Backend returns { data: [...] } but frontend expects { tickets: [...] }
      const tickets = res.tickets || res.data || [];
      // Transform tickets to match expected structure
      const transformedTickets = tickets.map((ticket: any) => ({
        ticket_id: ticket.id || ticket.ticketId || ticket.ticket_id,
        code: ticket.code,
        event: ticket.event || (ticket.event_id ? {
          eventId: ticket.event_id,
          title: ticket.event_title,
          location: ticket.event_venue || ticket.event_location,
          startTime: ticket.event_start,
          endTime: ticket.event_end,
        } : undefined),
        //keep raw event_id for deduplication fallback
        event_id: ticket.event_id,
      }));
      //deduplicate by event_id - keep first ticket for each unique event
      const uniqueEventsMap = new Map<number, UserTicket>();
      transformedTickets.forEach((ticket: any) => {
        //use event.eventId if available, otherwise fall back to raw event_id
        const eventId = ticket.event?.eventId || ticket.event_id;
        if (eventId && !uniqueEventsMap.has(eventId)) {
          uniqueEventsMap.set(eventId, ticket);
        }
      });
      const uniqueTickets = Array.from(uniqueEventsMap.values());
      setMyTickets(uniqueTickets);
      if (uniqueTickets.length > 0) {
        setSelectedTicketId(uniqueTickets[0].ticket_id);
      }
    } catch (err: any) {
      const msg =
        err?.status === 401
          ? 'Please sign in to see your tickets for outfit recommendations.'
          : err?.message || 'Unable to load your tickets.';
      setTicketsError(msg);
    } finally {
      setTicketsLoading(false);
    }
  };

  const fetchStyleForTicket = async () => {
    if (!selectedTicketId) return;
    const ticket = myTickets.find((t) => t.ticket_id === selectedTicketId);
    if (!ticket?.event) {
      setStyleError('This ticket has no event details.');
      return;
    }
    setStyleLoading(true);
    setStyleError(null);
    setStyleAdvice(null);
    try {
      const res = await aiApi.getStyleAdvice({
        eventTitle: ticket.event.title || 'My Event',
        date: ticket.event.startTime,
        location: ticket.event.location,
      });
      // Backend returns full Gemini JSON structure, transform to match frontend expectations
      if (res.ok && res.outfits && Array.isArray(res.outfits) && res.outfits.length > 0) {
        // Transform Gemini response to frontend format
        const firstOutfit = res.outfits[0];
        setStyleAdvice({
          ok: true,
          outfit: firstOutfit.items ? firstOutfit.items.join(', ') : firstOutfit.label,
          accessories: firstOutfit.accessories ? firstOutfit.accessories.join(', ') : undefined,
          colors: res.summary || undefined,
          tips: [
            ...(res.dos || []),
            ...(res.donts ? res.donts.map((d: string) => `Avoid: ${d}`) : [])
          ].join('. ') || undefined,
        });
      } else if (res.ok) {
        // Fallback if structure is different
        setStyleAdvice(res);
      } else {
        throw new Error(res.error || 'Failed to get style advice');
      }
    } catch (err: any) {
      const msg =
        err?.status === 401
          ? 'Please sign in to get outfit advice for your tickets.'
          : err?.message || 'Unable to get outfit advice for this event.';
      setStyleError(msg);
    } finally {
      setStyleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-gradient-to-r from-[#056733] to-[#009245] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-sm uppercase tracking-wide text-white/80">AI Event Planner</p>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">Get a tailored event recommendation</h1>
          <p className="text-white/80 mt-3 max-w-3xl">
            Tell us what type of events you want, and we’ll suggest one from the current listings.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
          {loadingQuestion ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-10 bg-slate-200 rounded w-full"></div>
            </div>
          ) : (
            <EventForm question={question} loading={loadingRecommend} onSubmit={handleRecommend} />
          )}
        </div>

        {error && (
          <Alert variant="error" message={error} onRetry={retry} />
        )}

        {loadingRecommend && !error && (
          <div className="flex items-center gap-3 text-slate-700" aria-live="polite">
            <div className="h-10 w-10 rounded-full border-2 border-[#009245] border-t-transparent animate-spin" aria-hidden="true" />
            <span className="text-sm font-medium">Finding a great event for you...</span>
          </div>
        )}

        {!loadingRecommend && recommended && (
          <EventCard event={recommended} />
        )}

        {showEmptyState && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700">
            <p className="font-semibold text-slate-800 mb-2">No match found yet.</p>
            <p className="text-sm leading-relaxed">{note}</p>
          </div>
        )}

        {/* Outfit recommendation for owned events */}
        <div className="rounded-xl bg-white shadow-md border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Outfit recommendation for your tickets</h3>
              <p className="text-sm text-slate-600">Choose an event you already have tickets for.</p>
            </div>
            {ticketsLoading && (
              <div className="h-6 w-6 rounded-full border-2 border-[#009245] border-t-transparent animate-spin" aria-hidden="true" />
            )}
          </div>

          {ticketsError && <Alert variant="error" message={ticketsError} onRetry={fetchMyTickets} />}

          {!ticketsLoading && !ticketsError && myTickets.length === 0 && (
            <p className="text-sm text-slate-600">No tickets found. Purchase a ticket to get outfit recommendations.</p>
          )}

          {!ticketsLoading && !ticketsError && myTickets.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label htmlFor="ticketSelect" className="text-sm font-medium text-slate-800">
                  Select an event
                </label>
                <select
                  id="ticketSelect"
                  value={selectedTicketId ?? ''}
                  onChange={(e) => setSelectedTicketId(Number(e.target.value))}
                  className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-[#009245] focus:ring-2 focus:ring-[#44CE85] focus:outline-none"
                >
                  {myTickets.map((t) => (
                    <option key={t.ticket_id} value={t.ticket_id}>
                      {t.event?.title ?? 'Event'} {t.event?.location ? `— ${t.event.location}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={fetchStyleForTicket}
                  disabled={styleLoading || !selectedTicketId}
                  className="inline-flex items-center justify-center rounded-lg bg-[#009245] px-4 py-2 text-white text-sm font-semibold shadow-sm transition-colors disabled:opacity-60 hover:bg-[#056733] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009245]"
                >
                  {styleLoading ? 'Getting advice...' : 'Get outfit advice'}
                </button>
              </div>

              {styleError && <Alert variant="error" message={styleError} onRetry={fetchStyleForTicket} />}

              {!styleLoading && !styleError && styleAdvice && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2 text-sm text-slate-700">
                  {styleAdvice.outfit && (
                    <div>
                      <p className="font-semibold text-slate-800">Outfit:</p>
                      <p className="leading-relaxed">{styleAdvice.outfit}</p>
                    </div>
                  )}
                  {styleAdvice.accessories && (
                    <div>
                      <p className="font-semibold text-slate-800">Accessories:</p>
                      <p className="leading-relaxed">{styleAdvice.accessories}</p>
                    </div>
                  )}
                  {styleAdvice.colors && (
                    <div>
                      <p className="font-semibold text-slate-800">Colors:</p>
                      <p className="leading-relaxed">{styleAdvice.colors}</p>
                    </div>
                  )}
                  {styleAdvice.tips && (
                    <div>
                      <p className="font-semibold text-slate-800">Tips:</p>
                      <p className="leading-relaxed">{styleAdvice.tips}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdvicePage;
