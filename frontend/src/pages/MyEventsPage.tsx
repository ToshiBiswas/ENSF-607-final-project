import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi, type Event } from '../api/events';
import { getCategories, type Category } from '../api/categories';

export function MyEventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  //form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    selectedCategories: [] as string[],
    ticketInfos: [{ type: '', price: '', quantity: '' }] as Array<{ type: string; price: string; quantity: string }>,
  });

  useEffect(() => {
    loadEvents();
    loadCategories();
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

  async function loadCategories() {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }

  const addNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    
    //check if category already exists
    const exists = categories.some(cat => cat.value.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setNewCategoryInput('');
      return;
    }
    
    //add to selected categories if not already selected
    if (!formData.selectedCategories.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        selectedCategories: [...prev.selectedCategories, trimmed]
      }));
    }
    
    setNewCategoryInput('');
  };

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

  const handleCategoryToggle = (categoryValue: string) => {
    setFormData(prev => {
      const selected = prev.selectedCategories;
      if (selected.includes(categoryValue)) {
        return { ...prev, selectedCategories: selected.filter(c => c !== categoryValue) };
      } else {
        return { ...prev, selectedCategories: [...selected, categoryValue] };
      }
    });
  };

  const handleTicketInfoChange = (index: number, field: 'type' | 'price' | 'quantity', value: string) => {
    setFormData(prev => {
      const updated = [...prev.ticketInfos];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, ticketInfos: updated };
    });
  };

  const addTicketInfo = () => {
    setFormData(prev => ({
      ...prev,
      ticketInfos: [...prev.ticketInfos, { type: '', price: '', quantity: '' }]
    }));
  };

  const removeTicketInfo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ticketInfos: prev.ticketInfos.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): string | null => {
    //title validation
    if (!formData.title.trim()) {
      return 'Title is required';
    }
    if (formData.title.trim().length < 3) {
      return 'Title must be at least 3 characters';
    }

    //description validation
    if (!formData.description.trim()) {
      return 'Description is required';
    }
    if (formData.description.trim().length < 10) {
      return 'Description must be at least 10 characters';
    }

    //location validation
    if (!formData.location.trim()) {
      return 'Location is required';
    }

    //time validation
    if (!formData.startTime) {
      return 'Start time is required';
    }
    if (!formData.endTime) {
      return 'End time is required';
    }

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    const now = new Date();

    if (isNaN(start.getTime())) {
      return 'Invalid start time';
    }
    if (isNaN(end.getTime())) {
      return 'Invalid end time';
    }

    if (start <= now) {
      return 'Event must start in the future';
    }

    if (end <= start) {
      return 'End time must be after start time';
    }

    //ticket info validation
    if (formData.ticketInfos.length === 0) {
      return 'At least one ticket type is required';
    }

    for (let i = 0; i < formData.ticketInfos.length; i++) {
      const ticket = formData.ticketInfos[i];
      if (!ticket.type.trim()) {
        return `Ticket type ${i + 1}: Type is required`;
      }
      const price = parseFloat(ticket.price);
      if (isNaN(price) || price < 0) {
        return `Ticket type ${i + 1}: Price must be a valid number >= 0`;
      }
      const quantity = parseInt(ticket.quantity, 10);
      if (isNaN(quantity) || quantity < 1 || !Number.isInteger(quantity)) {
        return `Ticket type ${i + 1}: Quantity must be a positive integer`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const validationError = validateForm();
    if (validationError) {
      setCreateError(validationError);
      return;
    }

    setCreating(true);
    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        categories: formData.selectedCategories,
        ticketInfos: formData.ticketInfos.map(t => ({
          type: t.type.trim(),
          price: Math.round(parseFloat(t.price) * 100), //convert to cents
          quantity: parseInt(t.quantity, 10),
        })),
      };

      await eventsApi.createEvent(payload);
      
      //reset form and reload events
      setFormData({
        title: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        selectedCategories: [],
        ticketInfos: [{ type: '', price: '', quantity: '' }],
      });
      setNewCategoryInput('');
      await loadCategories(); //reload categories to show newly created ones
      setShowCreateForm(false);
      await loadEvents();
    } catch (err: any) {
      const errorMessage = err?.message || err?.error?.message || 'Failed to create event';
      setCreateError(errorMessage);
    } finally {
      setCreating(false);
    }
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
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">My Events</h1>
            <p className="text-slate-600 text-lg">
              {events.length} {events.length === 1 ? 'event' : 'events'} total
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-6 py-3 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors font-semibold"
          >
            {showCreateForm ? 'Cancel' : '+ Create Event'}
          </button>
        </header>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Event</h2>
            
            {createError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {createError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/*title*/}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-2">
                  Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                  required
                  minLength={3}
                />
              </div>

              {/*description*/}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                  required
                  minLength={10}
                />
              </div>

              {/*location*/}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-2">
                  Location *
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                  required
                />
              </div>

              {/*date/time*/}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    id="startTime"
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-2">
                    End Time *
                  </label>
                  <input
                    id="endTime"
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                    required
                  />
                </div>
              </div>

              {/*categories*/}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Categories
                </label>
                <div className="space-y-3">
                  {/*existing categories*/}
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.categoryId}
                        type="button"
                        onClick={() => handleCategoryToggle(cat.value)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                          formData.selectedCategories.includes(cat.value)
                            ? 'bg-[#009245] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {cat.value}
                      </button>
                    ))}
                  </div>
                  
                  {/*add new category*/}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new category"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addNewCategory();
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                    />
                    <button
                      type="button"
                      onClick={addNewCategory}
                      className="px-4 py-2 bg-[#44CE85] text-white rounded-lg hover:bg-[#009245] transition-colors font-semibold"
                    >
                      Add Category
                    </button>
                  </div>
                  
                  {/*selected categories display*/}
                  {formData.selectedCategories.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-slate-600 mb-1">Selected categories:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.selectedCategories.map((catValue, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-[#009245] text-white rounded-full text-sm font-semibold flex items-center gap-2"
                          >
                            {catValue}
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  selectedCategories: prev.selectedCategories.filter(c => c !== catValue)
                                }));
                              }}
                              className="hover:text-red-200"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/*ticket types*/}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ticket Types *
                </label>
                {formData.ticketInfos.map((ticket, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Type (e.g., General)"
                      value={ticket.type}
                      onChange={(e) => handleTicketInfoChange(index, 'type', e.target.value)}
                      className="col-span-4 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price (CAD)"
                      value={ticket.price}
                      onChange={(e) => handleTicketInfoChange(index, 'price', e.target.value)}
                      className="col-span-3 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Quantity"
                      value={ticket.quantity}
                      onChange={(e) => handleTicketInfoChange(index, 'quantity', e.target.value)}
                      className="col-span-3 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                      required
                    />
                    {formData.ticketInfos.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketInfo(index)}
                        className="col-span-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTicketInfo}
                  className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                >
                  + Add Ticket Type
                </button>
              </div>


              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create Event'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setCreateError(null);
                  }}
                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {events.length === 0 && !showCreateForm ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-slate-700 text-lg mb-2">No events found.</p>
            <p className="text-slate-500 text-sm">Create your first event to get started.</p>
          </div>
        ) : events.length > 0 ? (
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
        ) : null}
      </div>
    </div>
  );
}
