import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsApi } from '../api/events';

export function ValidateTicketPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<{
    response: 'valid' | 'invalid';
    ticket: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<any>(null);

  useEffect(() => {
    if (eventId) {
      loadEvent();
    }
  }, [eventId]);

  async function loadEvent() {
    if (!eventId) return;
    try {
      const eventData = await eventsApi.getById(parseInt(eventId, 10));
      setEvent(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
    }
  }

  async function handleValidate() {
    if (!eventId || !code.trim()) {
      setError('Please enter a 15-digit ticket code');
      return;
    }

    const cleanCode = code.trim().replace(/\s/g, '');
    if (!/^\d{15}$/.test(cleanCode)) {
      setError('Ticket code must be exactly 15 digits');
      return;
    }

    setValidating(true);
    setError(null);
    setResult(null);

    try {
      const validationResult = await eventsApi.validateTicket(parseInt(eventId, 10), cleanCode);
      setResult(validationResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate ticket');
    } finally {
      setValidating(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="text-slate-600 hover:text-slate-800 mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Validate Ticket</h1>
            {event && (
              <p className="text-slate-600">
                Event: <span className="font-semibold">{event.title}</span>
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="ticket-code" className="block text-sm font-medium text-slate-700 mb-2">
                Enter 15-Digit Ticket Code
              </label>
              <div className="flex gap-3">
                <input
                  id="ticket-code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    //only allow digits, max 15
                    const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                    setCode(value);
                    setResult(null);
                    setError(null);
                  }}
                  placeholder="000000000000000"
                  maxLength={15}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245] text-lg font-mono"
                />
                <button
                  onClick={handleValidate}
                  disabled={validating || code.length !== 15}
                  className="px-8 py-3 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {validating ? 'Validating...' : 'Validate'}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Enter the 15-digit code from the ticket
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {result && (
              <div className={`border rounded-lg p-6 ${result.response === 'valid' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {result.response === 'valid' && result.ticket ? (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="text-xl font-bold text-green-800">Valid Ticket</h3>
                    </div>
                    <div className="space-y-3 text-slate-700">
                      <div>
                        <span className="text-sm font-medium text-slate-600">Ticket Code:</span>
                        <p className="text-lg font-mono font-semibold">{result.ticket.code}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Ticket Type:</span>
                        <p className="text-lg">{result.ticket.ticket_type}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Price:</span>
                        <p className="text-lg">${(result.ticket.ticket_price / 100).toFixed(2)}</p>
                      </div>
                      {result.ticket.event_title && (
                        <div>
                          <span className="text-sm font-medium text-slate-600">Event:</span>
                          <p className="text-lg">{result.ticket.event_title}</p>
                        </div>
                      )}
                      {result.ticket.event_location && (
                        <div>
                          <span className="text-sm font-medium text-slate-600">Location:</span>
                          <p className="text-lg">{result.ticket.event_location}</p>
                        </div>
                      )}
                      {result.ticket.event_start && (
                        <div>
                          <span className="text-sm font-medium text-slate-600">Event Date:</span>
                          <p className="text-lg">{formatDate(result.ticket.event_start)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-xl font-bold text-red-800">Invalid Ticket</h3>
                      <p className="text-red-700 mt-1">This ticket code is not valid for this event.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

