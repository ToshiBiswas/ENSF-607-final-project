import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, type Event } from '../api/events';

export function MyEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  async function loadEvents() {
    setLoading(true);
    setError(null);
    try {
      const data = await eventsApi.getMyEvents();
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#009245]"></div>
            <p className="mt-4 text-slate-600">Loading your events…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button
              onClick={loadEvents}
              className="px-6 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">My Events</h1>
          <p className="text-slate-600 text-lg">
            {events.length} {events.length === 1 ? 'event' : 'events'} total
          </p>
        </header>

        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-slate-700 text-lg mb-2">No events found.</p>
            <p className="text-slate-500 text-sm">Create your first event to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.eventId}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/events/${event.eventId}`)}
              >
                <div className="mb-4">
                  {event.categories && event.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {event.categories.map((cat) => (
                        <span
                          key={cat.categoryId}
                          className="px-2 py-1 bg-[#44CE85] bg-opacity-20 text-[#056733] text-xs rounded-full font-semibold"
                        >
                          {cat.value}
                        </span>
                      ))}
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{event.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-2">{event.description}</p>
                </div>

                <div className="space-y-2 text-sm text-slate-600 mb-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event.startTime)}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${event.eventId}`);
                    }}
                    className="flex-1 px-4 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors font-semibold text-sm"
                  >
                    View Event
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/events/${event.eventId}/validate`);
                    }}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold text-sm"
                  >
                    Validate Tickets
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

