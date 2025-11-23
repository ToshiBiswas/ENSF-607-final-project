import React, { useState } from 'react';

interface EventFormProps {
  question: string;
  loading: boolean;
  onSubmit: (eventType: string) => void;
}

const EventForm: React.FC<EventFormProps> = ({ question, loading, onSubmit }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    onSubmit(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label htmlFor="eventType" className="block text-sm font-semibold text-slate-800">
        {question || 'What type of events are you interested in?'}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="eventType"
          name="eventType"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g., workshops, concerts, tech meetups"
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-[#009245] focus:ring-2 focus:ring-[#44CE85] focus:outline-none"
          aria-label="Event type"
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="inline-flex items-center justify-center rounded-lg bg-[#009245] px-5 py-3 text-white font-semibold shadow-sm transition-colors disabled:opacity-60 hover:bg-[#056733] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009245]"
        >
          {loading ? 'Recommending...' : 'Recommend'}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
