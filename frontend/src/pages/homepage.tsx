import React, { useState, useEffect } from "react";
import SearchInput from "../components/SearchInput";
import { eventsApi, Event } from "../api/events";
import "./Homepage.css";

const Homepage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  useEffect(() => {
    filterEvents();
  }, [searchQuery, events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventsApi.getByCategory(selectedCategory || undefined);
      setEvents(data);
      setFilteredEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = events.filter(
      (event) =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.location.toLowerCase().includes(query)
    );
    setFilteredEvents(filtered);
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
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-inner">
          <h1 className="home-hero-title">Discover Amazing Events</h1>
          <p className="home-hero-subtitle">
            Plan smarter, stay organized, and achieve your goals.
          </p>

          <div className="home-hero-search">
            <SearchInput
              placeholder="Search events by name, description, or location..."
              onSearch={setSearchQuery}
            />
          </div>
        </div>
      </section>

      {/* Category Filters */}
      <section className="home-filters">
        <div className="home-filters-inner">
          <button
            onClick={() => setSelectedCategory("")}
            className={
              "home-filter-button" +
              (selectedCategory === "" ? " home-filter-button--active" : "")
            }
          >
            All Events
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={
                "home-filter-button" +
                (selectedCategory === category
                  ? " home-filter-button--active"
                  : "")
              }
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Events Grid / States */}
      <section className="home-content">
        {loading ? (
          <div className="home-status">
            <div className="home-spinner" />
            <p className="home-status-text">Loading events...</p>
          </div>
        ) : error ? (
          <div className="home-status">
            <p className="home-status-text home-status-text--error">{error}</p>
            <button
              onClick={loadEvents}
              className="home-retry-button"
            >
              Try Again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="home-status">
            <p className="home-status-text">
              {searchQuery
                ? "No events found matching your search."
                : "No events available."}
            </p>
          </div>
        ) : (
          <div className="home-grid">
            {filteredEvents.map((event) => {
              const minPrice = event.tickets
                ? Math.min(...event.tickets.map((t) => t.ticketPrice))
                : 0;
              const availableTickets = event.tickets
                ? event.tickets.reduce((sum, t) => sum + t.ticketsLeft, 0)
                : 0;

              return (
                <article
                  key={event.eventId}
                  className="home-card"
                >
                  <div className="home-card-inner">
                    <header className="home-card-header">
                      <h3 className="home-card-title">{event.title}</h3>
                      {minPrice > 0 && (
                        <span className="home-card-price">
                          {formatPrice(minPrice)}+
                        </span>
                      )}
                    </header>

                    <p className="home-card-description">
                      {event.description}
                    </p>

                    <div className="home-card-meta">
                      <div className="home-card-meta-item">
                        <svg
                          className="home-card-icon"
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

                      <div className="home-card-meta-item">
                        <svg
                          className="home-card-icon"
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
                        <div className="home-card-meta-item home-card-meta-item--accent">
                          <svg
                            className="home-card-icon"
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
                      <div className="home-card-tags">
                        {event.categories.map((cat) => (
                          <span
                            key={cat.categoryId}
                            className="home-card-tag"
                          >
                            {cat.value}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      className="home-card-button"
                      onClick={() => {
                        // TODO: hook up navigation when ready
                        console.log("View event:", event.eventId);
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Homepage;
