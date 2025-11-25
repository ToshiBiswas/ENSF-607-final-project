import React from 'react';
import { RecommendedEvent } from '../../types/advice';
import { Link } from 'react-router-dom';

interface EventCardProps {
  event: Exclude<RecommendedEvent, null>;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="rounded-xl bg-white shadow-md border border-slate-200 p-6 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 font-medium">{event.category}</p>
          <h3 className="text-xl font-bold text-slate-900 leading-tight">{event.name}</h3>
        </div>
        <span className="inline-flex items-center rounded-full bg-[#44CE85] bg-opacity-20 text-[#056733] px-3 py-1 text-xs font-semibold">
          Recommended
        </span>
      </div>
      <div className="text-sm text-slate-600 space-y-1">
        <p>
          <span className="font-semibold text-slate-700">Date:</span> {event.date}
        </p>
        <p>
          <span className="font-semibold text-slate-700">Location:</span> {event.location}
        </p>
      </div>
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-800 mb-1">Why this event:</p>
        <p className="text-sm text-slate-700 leading-relaxed">{event.reason}</p>
      </div>
      <div className="flex justify-end">
        <Link
          to={`/events/${event.id}`}
          className="inline-flex items-center justify-center rounded-lg bg-[#009245] px-4 py-2 text-white text-sm font-semibold shadow-sm transition-colors hover:bg-[#056733] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#009245]"
        >
          View event
        </Link>
      </div>
    </div>
  );
};

export default EventCard;
