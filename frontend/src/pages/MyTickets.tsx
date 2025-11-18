import React, { useState, useEffect } from "react";
import { usersApi, Ticket } from "../api/users";

const MyTickets: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await usersApi.getTickets();
            setTickets(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load tickets");
            console.error("Error loading tickets:", err);
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

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#009245]"></div>
                    <p className="mt-4 text-slate-600">Loading your tickets...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-16">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={loadTickets}
                        className="px-6 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">My Tickets</h2>

            {tickets.length === 0 ? (
                <div className="text-center py-16">
                    <svg
                        className="w-16 h-16 mx-auto text-slate-400 mb-4"
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
                    <p className="text-slate-600 text-lg mb-2">No tickets found</p>
                    <p className="text-sm text-slate-500">Purchase tickets from events to see them here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <div
                            key={ticket.ticketId}
                            className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-12 h-12 bg-[#009245] rounded-lg flex items-center justify-center">
                                            <span className="text-white font-bold text-lg">
                                                {ticket.code}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800">
                                                {ticket.event?.title || "Event"}
                                            </h3>
                                            {ticket.ticketInfo && (
                                                <p className="text-sm text-slate-600">
                                                    {ticket.ticketInfo.type} • {formatPrice(ticket.ticketInfo.price)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {ticket.event && (
                                        <div className="space-y-1 mt-3">
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
                                                {ticket.event.location}
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
                                                {formatDate(ticket.event.startTime)}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <span className="px-3 py-1 bg-[#44CE85] bg-opacity-20 text-[#056733] text-xs rounded-full font-semibold">
                                        Ticket Code: {ticket.code}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTickets;

