import React, { useState, useEffect } from "react";
import { eventsApi, Event } from "../api/events";

const Homepage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const categories = [
    "Tech",
    "Music",
    "Sports",
    "Arts",
    "Food",
    "Business",
    "Education",
  ];

  useEffect(() => {
    loadEvents();
  }, [selectedCategory]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsApi.getByCategory(selectedCategory || undefined);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#056733] to-[#009245] text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Amazing Events
          </h1>
          <p className="text-xl text-slate-200">
            Plan smarter, stay organized, and achieve your goals.
          </p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory("")}
            className={`px-4 py-2 rounded-full transition-colors shadow-sm ${
              selectedCategory === ""
                ? "bg-[#009245] text-white shadow-md"
                : "bg-white text-slate-700 hover:bg-[#44CE85] hover:text-white"
            }`}
          >
            All Events
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full transition-colors shadow-sm ${
                selectedCategory === category
                  ? "bg-[#009245] text-white shadow-md"
                  : "bg-white text-slate-700 hover:bg-[#44CE85] hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#009245]" />
            <p className="mt-4 text-slate-600">Loading events...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadEvents}
              className="px-6 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-600 text-lg">No events available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => {
              const minPrice = event.tickets
                ? Math.min(...event.tickets.map((t) => t.ticketPrice))
                : 0;
              const availableTickets = event.tickets
                ? event.tickets.reduce((sum, t) => sum + t.ticketsLeft, 0)
                : 0;

              return (
                <div
                  key={event.eventId}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-bold text-slate-800 flex-1">
                        {event.title}
                      </h3>
                      {minPrice > 0 && (
                        <span className="text-lg font-semibold text-slate-800 ml-2">
                          {formatPrice(minPrice)}+
                        </span>
                      )}
                    </div>

                    <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {event.location}
                      </div>

                      <div className="flex items-center text-sm text-slate-600">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDate(event.startTime)}
                      </div>

                      {availableTickets > 0 && (
                        <div className="flex items-center text-sm text-[#009245]">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                            />
                          </svg>
                          {availableTickets} tickets available
                        </div>
                      )}
                    </div>

                    {event.categories && event.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {event.categories.map((cat) => (
                          <span
                            key={cat.categoryId}
                            className="px-2 py-1 bg-[#44CE85] bg-opacity-20 text-[#056733] text-xs rounded-full"
                          >
                            {cat.value}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      className="w-full py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors"
                      onClick={() => {
                        // hook up navigation when you add an event details page
                        console.log("View event:", event.eventId);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;
