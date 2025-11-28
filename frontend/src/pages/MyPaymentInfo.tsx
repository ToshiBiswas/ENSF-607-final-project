import React, { useState, useEffect } from "react";
import { usersApi } from "../api/users";
import { paymentApi, ApiError } from "../utils/api";

const MyPaymentInfo: React.FC = () => {
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        number: '',
        name: '',
        ccv: '',
        exp_month: '',
        exp_year: '',
    });

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

    const handleDeletePaymentMethod = async (paymentInfoId: number) => {
        if (confirm("Are you sure you want to remove this payment method?")) {
            try {
                setError(null);
                await usersApi.deletePaymentMethod(paymentInfoId);
                //reload payment methods after successful deletion
                await loadPaymentMethods();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to delete payment method");
                console.error("Error deleting payment method:", err);
            }
        }
    };

    const formatCardNumberInput = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        const chunks = cleaned.match(/.{1,4}/g) || [];
        return chunks.join(' ').slice(0, 19);
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        //validate form
        if (!formData.number || !formData.name || !formData.ccv || !formData.exp_month || !formData.exp_year) {
            setError('All fields are required');
            setSubmitting(false);
            return;
        }

        const cleanedNumber = formData.number.replace(/\s/g, '');

        if (!/^[A-Za-z\s]+$/.test(formData.name.trim())) {
            setError('Cardholder name can only contain letters.');
            setSubmitting(false);
            return;
        }

        if (!/^\d{13,19}$/.test(cleanedNumber)) {
            setError('Card number must be 13–19 digits.');
            setSubmitting(false);
            return;
        }

        const expMonthNum = parseInt(formData.exp_month, 10);
        const expYearNum = parseInt(formData.exp_year, 10);
        if (Number.isNaN(expMonthNum) || expMonthNum < 1 || expMonthNum > 12) {
            setError('Expiry month must be between 1 and 12.');
            setSubmitting(false);
            return;
        }
        if (!/^\d{4}$/.test(formData.exp_year)) {
            setError('Expiry year must be a 4-digit number.');
            setSubmitting(false);
            return;
        }

        if (Number.isNaN(expYearNum)) {
            setError('Expiry year is invalid.');
            setSubmitting(false);
            return;
        }

        if (expYearNum < 2025) {
            setError('Expiry year must be 2025 or later.');
            setSubmitting(false);
            return;
        }
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (expYearNum < currentYear || (expYearNum === currentYear && expMonthNum < currentMonth)) {
            setError('Card is expired. Please use a valid expiry date.');
            setSubmitting(false);
            return;
        }

        if (!/^\d{3,4}$/.test(formData.ccv)) {
            setError('CCV must be 3 or 4 digits.');
            setSubmitting(false);
            return;
        }

        try {
            await paymentApi.verifyCard({
                number: cleanedNumber,
                name: formData.name.trim(),
                ccv: formData.ccv,
                exp_month: expMonthNum,
                exp_year: expYearNum,
            });

            //success - reload payment methods and reset form
            await loadPaymentMethods();
            setFormData({ number: '', name: '', ccv: '', exp_month: '', exp_year: '' });
            setShowAddForm(false);
        } catch (err) {
            const apiError = err as ApiError;
            let errorMessage = apiError.message || 'Failed to add payment method';

            //handle specific error codes
            switch (apiError.code) {
                case 'CARD_EXPIRED':
                    errorMessage = 'This card has expired. Please use a valid card.';
                    break;
                case 'ACCOUNT_EXISTS':
                    errorMessage = 'This card is already saved to your account.';
                    break;
                case 'BAD_CCV':
                    errorMessage = 'Invalid CCV. Please check your card\'s security code.';
                    break;
                case 'MISSING_CARD':
                    errorMessage = 'Please fill in all card details.';
                    break;
                case 'ACCOUNT_NOT_FOUND':
                    errorMessage = 'Card not recognized. Please verify your card details.';
                    break;
                default:
                    errorMessage = apiError.message || 'Failed to add payment method';
            }

            setError(errorMessage);
        } finally {
            setSubmitting(false);
        }
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
                {!showAddForm && (
                    <button
                        className="px-4 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors"
                        onClick={() => {
                            setShowAddForm(true);
                            setError(null);
                            setFormData({ number: '', name: '', ccv: '', exp_month: '', exp_year: '' });
                        }}
                    >
                        Add Payment Method
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                    {error}
                </div>
            )}

            {showAddForm && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Add Payment Method</h3>
                        <button
                            type="button"
                            className="text-slate-600 hover:text-slate-800"
                            onClick={() => {
                                setShowAddForm(false);
                                setError(null);
                                setFormData({ number: '', name: '', ccv: '', exp_month: '', exp_year: '' });
                            }}
                        >
                            ✕
                        </button>
                    </div>
                    <form onSubmit={handleAddCard} className="space-y-4">
                        <div>
                            <label htmlFor="card-number" className="block text-sm font-medium text-slate-700 mb-1">
                                Card Number
                            </label>
                            <input
                                id="card-number"
                                type="text"
                                value={formData.number}
                                onChange={(e) => {
                                    const formatted = formatCardNumberInput(e.target.value);
                                    setFormData({ ...formData, number: formatted });
                                }}
                                placeholder="1234 5678 9012 3456"
                                maxLength={19}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="card-name" className="block text-sm font-medium text-slate-700 mb-1">
                                Cardholder Name
                            </label>
                            <input
                                id="card-name"
                                type="text"
                                value={formData.name}
                                onChange={(e) => {
                                    const lettersOnly = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                    setFormData({ ...formData, name: lettersOnly });
                                }}
                                placeholder="John Doe"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="exp-month" className="block text-sm font-medium text-slate-700 mb-1">
                                    Expiry Month
                                </label>
                                <input
                                    id="exp-month"
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.exp_month}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
                                        if (digits === '') {
                                            setFormData({ ...formData, exp_month: '' });
                                            return;
                                        }
                                        const parsed = Math.min(Math.max(parseInt(digits, 10), 1), 12);
                                        setFormData({ ...formData, exp_month: parsed.toString() });
                                    }}
                                    placeholder="12"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="exp-year" className="block text-sm font-medium text-slate-700 mb-1">
                                    Expiry Year
                                </label>
                                <input
                                    id="exp-year"
                                    type="text"
                                    inputMode="numeric"
                                    value={formData.exp_year}
                                    onChange={(e) => {
                                        const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        setFormData({ ...formData, exp_year: digits });
                                    }}
                                    placeholder="2025"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="ccv" className="block text-sm font-medium text-slate-700 mb-1">
                                    CCV
                                </label>
                                <input
                                    id="ccv"
                                    type="text"
                                    value={formData.ccv}
                                    onChange={(e) => setFormData({ ...formData, ccv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                    placeholder="123"
                                    maxLength={4}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#009245] focus:border-[#009245]"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={submitting || !formData.number || !formData.name || !formData.ccv || !formData.exp_month || !formData.exp_year}
                                className="px-4 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Adding...' : 'Add Payment Method'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddForm(false);
                                    setError(null);
                                    setFormData({ number: '', name: '', ccv: '', exp_month: '', exp_year: '' });
                                }}
                                disabled={submitting}
                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {paymentMethods.length === 0 && !showAddForm ? (
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
                    <p className="text-sm text-slate-500">
                        Add a payment method during checkout to save it for future use.
                    </p>
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
                                    className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
                                    onClick={() => handleDeletePaymentMethod(method.paymentInfoId)}
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

