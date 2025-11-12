import React, { useState, useEffect } from "react";
import { usersApi } from "../api/users";

const MyPaymentInfo: React.FC = () => {
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadPaymentMethods();
    }, []);

    const loadPaymentMethods = async () => {
        try {
            setLoading(true);
            setError(null);
            const methods = await usersApi.getPaymentMethods();
            setPaymentMethods(methods);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load payment methods");
            console.error("Error loading payment methods:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatCardNumber = (last4: string) => {
        return `**** **** **** ${last4}`;
    };

    const formatExpiry = (month: number, year: number) => {
        return `${month.toString().padStart(2, "0")}/${year}`;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center py-16">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#009245]"></div>
                    <p className="mt-4 text-slate-600">Loading payment methods...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Payment Methods</h2>
                <button
                    className="px-4 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors"
                    onClick={() => {
                        // TODO: Implement add payment method functionality
                        alert("Add payment method functionality coming soon!");
                    }}
                >
                    Add Payment Method
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {paymentMethods.length === 0 ? (
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
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                    </svg>
                    <p className="text-slate-600 mb-4">No payment methods saved</p>
                    <p className="text-sm text-slate-500 mb-6">
                        Add a payment method during checkout to save it for future use.
                    </p>
                    <button
                        className="px-6 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors"
                        onClick={() => {
                            // TODO: Implement add payment method functionality
                            alert("Add payment method functionality coming soon!");
                        }}
                    >
                        Add Payment Method
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {paymentMethods.map((method) => (
                        <div
                            key={method.paymentInfoId}
                            className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-[#009245] rounded flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">CARD</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-800">
                                        {formatCardNumber(method.last4)}
                                    </p>
                                    <p className="text-sm text-slate-600">
                                        {method.name} • Expires{" "}
                                        {formatExpiry(method.expMonth, method.expYear)}
                                    </p>
                                </div>
                                {method.primary && (
                                    <span className="px-2 py-1 bg-[#44CE85] bg-opacity-20 text-[#056733] text-xs rounded-full">
                                        Primary
                                    </span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                                    onClick={() => {
                                        // TODO: Implement set as primary functionality
                                        alert("Set as primary functionality coming soon!");
                                    }}
                                >
                                    Set as Primary
                                </button>
                                <button
                                    className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
                                    onClick={() => {
                                        if (confirm("Are you sure you want to remove this payment method?")) {
                                            // TODO: Implement delete functionality
                                            alert("Delete functionality coming soon!");
                                        }
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyPaymentInfo;

