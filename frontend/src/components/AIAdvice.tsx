import { useState } from 'react';
import { aiApi } from '../utils/api';
import type { EventAdviceRequest, StyleAdviceRequest, ApiError } from '../utils/api';

export default function AIAdvice() {
  //state for active tab (event advice or style advice)
  const [activeTab, setActiveTab] = useState<'event' | 'style'>('event');

  //event advice state
  const [eventForm, setEventForm] = useState<EventAdviceRequest>({
    eventType: '',
    budget: '',
    location: '',
    date: '',
    attendees: undefined,
  });
  const [eventAdvice, setEventAdvice] = useState<string | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  //style advice state
  const [styleForm, setStyleForm] = useState<StyleAdviceRequest>({
    eventTitle: '',
    date: '',
    location: '',
    formality: '',
    dressCode: '',
    weather: '',
    preferences: '',
    constraints: '',
  });
  const [styleAdvice, setStyleAdvice] = useState<{
    outfit?: string;
    accessories?: string;
    colors?: string;
    tips?: string;
  } | null>(null);
  const [styleLoading, setStyleLoading] = useState(false);
  const [styleError, setStyleError] = useState<string | null>(null);

  //handle event form input changes
  const handleEventInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({
      ...prev,
      [name]: name === 'attendees' ? (value ? parseInt(value, 10) : undefined) : value,
    }));
    setEventAdvice(null); //clear previous advice when form changes
    setEventError(null);
  };

  //handle style form input changes
  const handleStyleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStyleForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setStyleAdvice(null); //clear previous advice when form changes
    setStyleError(null);
  };

  //submit event advice request
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEventLoading(true);
    setEventError(null);
    setEventAdvice(null);

    try {
      //build request object (only include non-empty fields)
      const request: EventAdviceRequest = {};
      if (eventForm.eventType) request.eventType = eventForm.eventType;
      if (eventForm.budget) request.budget = eventForm.budget;
      if (eventForm.location) request.location = eventForm.location;
      if (eventForm.date) request.date = eventForm.date;
      if (eventForm.attendees) request.attendees = eventForm.attendees;

      const response = await aiApi.getEventAdvice(request);
      setEventAdvice(response.advice);
    } catch (err) {
      const apiError = err as ApiError;
      let errorMessage = apiError.message || 'Failed to get event advice';

      //handle specific error codes
      if (apiError.status === 503) {
        errorMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
      }

      setEventError(errorMessage);
    } finally {
      setEventLoading(false);
    }
  };

  //submit style advice request
  const handleStyleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    //validate required field
    if (!styleForm.eventTitle.trim()) {
      setStyleError('Event title is required');
      return;
    }

    setStyleLoading(true);
    setStyleError(null);
    setStyleAdvice(null);

    try {
      //build request object (only include non-empty fields except eventTitle)
      const request: StyleAdviceRequest = {
        eventTitle: styleForm.eventTitle,
      };
      if (styleForm.date) request.date = styleForm.date;
      if (styleForm.location) request.location = styleForm.location;
      if (styleForm.formality) request.formality = styleForm.formality;
      if (styleForm.dressCode) request.dressCode = styleForm.dressCode;
      if (styleForm.weather) request.weather = styleForm.weather;
      if (styleForm.preferences) request.preferences = styleForm.preferences;
      if (styleForm.constraints) request.constraints = styleForm.constraints;

      const response = await aiApi.getStyleAdvice(request);
      setStyleAdvice({
        outfit: response.outfit,
        accessories: response.accessories,
        colors: response.colors,
        tips: response.tips,
      });
    } catch (err) {
      const apiError = err as ApiError;
      let errorMessage = apiError.message || 'Failed to get style advice';

      //handle specific error codes
      if (apiError.status === 503) {
        errorMessage = 'AI service is temporarily unavailable. Please try again in a moment.';
      }

      setStyleError(errorMessage);
    } finally {
      setStyleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4" style={{ minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Event Planning Assistant</h1>

          {/*tab navigation*/}
          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('event')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'event'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Event Planning Advice
            </button>
            <button
              onClick={() => setActiveTab('style')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'style'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Outfit/Style Advice
            </button>
          </div>

          {/*event planning advice tab*/}
          {activeTab === 'event' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Get Event Planning Advice</h2>
              <form onSubmit={handleEventSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
                      Event Type
                    </label>
                    <input
                      type="text"
                      id="eventType"
                      name="eventType"
                      value={eventForm.eventType}
                      onChange={handleEventInputChange}
                      placeholder="e.g., Birthday party, Wedding, Conference"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
                      Budget
                    </label>
                    <input
                      type="text"
                      id="budget"
                      name="budget"
                      value={eventForm.budget}
                      onChange={handleEventInputChange}
                      placeholder="e.g., $500, $1000-2000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={eventForm.location}
                      onChange={handleEventInputChange}
                      placeholder="e.g., Calgary, AB, Indoor venue"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="text"
                      id="date"
                      name="date"
                      value={eventForm.date}
                      onChange={handleEventInputChange}
                      placeholder="e.g., March 15, 2025, Summer 2025"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="attendees" className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Attendees
                    </label>
                    <input
                      type="number"
                      id="attendees"
                      name="attendees"
                      value={eventForm.attendees || ''}
                      onChange={handleEventInputChange}
                      placeholder="e.g., 50, 100"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={eventLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {eventLoading ? 'Getting Advice...' : 'Get Event Planning Advice'}
                </button>

                {eventError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {eventError}
                  </div>
                )}

                {eventAdvice && (
                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">🤖 AI Advice:</h3>
                    <p className="text-blue-800 whitespace-pre-wrap">{eventAdvice}</p>
                  </div>
                )}
              </form>
            </div>
          )}

          {/*style advice tab*/}
          {activeTab === 'style' && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Get Outfit/Style Advice</h2>
              <form onSubmit={handleStyleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="eventTitle"
                    name="eventTitle"
                    value={styleForm.eventTitle}
                    onChange={handleStyleInputChange}
                    placeholder="e.g., Summer Wedding, Business Conference"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="text"
                      id="date"
                      name="date"
                      value={styleForm.date}
                      onChange={handleStyleInputChange}
                      placeholder="e.g., March 15, Evening event"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={styleForm.location}
                      onChange={handleStyleInputChange}
                      placeholder="e.g., Calgary, Outdoor venue, Beach"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="formality" className="block text-sm font-medium text-gray-700 mb-1">
                      Formality Level
                    </label>
                    <select
                      id="formality"
                      name="formality"
                      value={styleForm.formality}
                      onChange={handleStyleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    >
                      <option value="">Select formality...</option>
                      <option value="casual">Casual</option>
                      <option value="business casual">Business Casual</option>
                      <option value="semi-formal">Semi-Formal</option>
                      <option value="formal">Formal</option>
                      <option value="black tie">Black Tie</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dressCode" className="block text-sm font-medium text-gray-700 mb-1">
                      Dress Code
                    </label>
                    <input
                      type="text"
                      id="dressCode"
                      name="dressCode"
                      value={styleForm.dressCode}
                      onChange={handleStyleInputChange}
                      placeholder="e.g., Cocktail attire, Smart casual"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>

                  <div>
                    <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-1">
                      Weather
                    </label>
                    <input
                      type="text"
                      id="weather"
                      name="weather"
                      value={styleForm.weather}
                      onChange={handleStyleInputChange}
                      placeholder="e.g., Sunny, Cold, Rainy"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827' }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="preferences" className="block text-sm font-medium text-gray-700 mb-1">
                    Style Preferences
                  </label>
                  <textarea
                    id="preferences"
                    name="preferences"
                    value={styleForm.preferences}
                    onChange={handleStyleInputChange}
                    placeholder="e.g., Prefer dresses, Like bold colors, Comfortable shoes"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  />
                </div>

                <div>
                  <label htmlFor="constraints" className="block text-sm font-medium text-gray-700 mb-1">
                    Constraints
                  </label>
                  <textarea
                    id="constraints"
                    name="constraints"
                    value={styleForm.constraints}
                    onChange={handleStyleInputChange}
                    placeholder="e.g., Must cover shoulders, No heels, Budget friendly"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    style={{ color: '#111827' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={styleLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {styleLoading ? 'Getting Style Advice...' : 'Get Style Advice'}
                </button>

                {styleError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {styleError}
                  </div>
                )}

                {styleAdvice && (
                  <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">🤖 AI Style Advice:</h3>
                    
                    {styleAdvice.outfit && (
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">Outfit Suggestion:</h4>
                        <p className="text-blue-700 whitespace-pre-wrap">{styleAdvice.outfit}</p>
                      </div>
                    )}

                    {styleAdvice.accessories && (
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">Accessories:</h4>
                        <p className="text-blue-700 whitespace-pre-wrap">{styleAdvice.accessories}</p>
                      </div>
                    )}

                    {styleAdvice.colors && (
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">Color Recommendations:</h4>
                        <p className="text-blue-700 whitespace-pre-wrap">{styleAdvice.colors}</p>
                      </div>
                    )}

                    {styleAdvice.tips && (
                      <div>
                        <h4 className="font-semibold text-blue-800 mb-2">Additional Tips:</h4>
                        <p className="text-blue-700 whitespace-pre-wrap">{styleAdvice.tips}</p>
                      </div>
                    )}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

