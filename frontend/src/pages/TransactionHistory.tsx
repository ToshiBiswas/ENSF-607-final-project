import React, { useState, useEffect } from "react";
import { usersApi, Payment } from "../api/users";

const TransactionHistory: React.FC = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await usersApi.getPayments();
            setPayments(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load transaction history");
            console.error("Error loading payments:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatAmount = (cents: number, currency: string = "CAD") => {
        return new Intl.NumberFormat("en-CA", {
            style: "currency",
            currency: currency,
        }).format(cents / 100);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved":
                return "bg-[#44CE85] bg-opacity-20 text-[#056733]";
            case "declined":
                return "bg-red-100 text-red-700";
            case "pending":
                return "bg-yellow-100 text-yellow-700";
            case "refunded":
                return "bg-slate-100 text-slate-700";
            default:
                return "bg-slate-100 text-slate-700";
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#009245]"></div>
                    <p className="mt-4 text-slate-600">Loading transaction history...</p>
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
                        onClick={loadPayments}
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
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Transaction History</h2>

            {payments.length === 0 ? (
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
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                    </svg>
                    <p className="text-slate-600 text-lg mb-2">No transactions found</p>
                    <p className="text-sm text-slate-500">Your payment history will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {payments.map((payment) => (
                        <div
                            key={payment.paymentId}
                            className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">
                                                {payment.event?.title || "Payment"}
                                            </h3>
                                            {payment.ticketInfo && (
                                                <p className="text-sm text-slate-600">
                                                    {payment.ticketInfo.type}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-600">
                                        <div className="flex items-center">
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
                                            {formatDate(payment.createdAt)}
                                        </div>
                                        {payment.paymentInfo && (
                                            <div className="flex items-center">
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
                                                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                                    />
                                                </svg>
                                                **** {payment.paymentInfo.last4}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-slate-800">
                                            {formatAmount(payment.amountCents, payment.currency)}
                                        </p>
                                        {payment.refundedCents > 0 && (
                                            <p className="text-sm text-slate-500">
                                                Refunded: {formatAmount(payment.refundedCents, payment.currency)}
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(
                                            payment.status
                                        )}`}
                                    >
                                        {payment.status}
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

export default TransactionHistory;

