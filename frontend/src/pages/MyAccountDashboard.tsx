import React from "react";
import { Link } from "react-router-dom";

const MyAccountDashboard: React.FC = () => {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Account Dashboard</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    to="/MyAccount/MyTickets"
                    className="block p-6 bg-gradient-to-br from-[#009245] to-[#056733] rounded-lg text-white hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">My Tickets</h3>
                            <p className="text-white text-opacity-80">View all your purchased tickets</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/MyAccount/MyInfo"
                    className="block p-6 bg-gradient-to-br from-[#44CE85] to-[#009245] rounded-lg text-white hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">My Info</h3>
                            <p className="text-white text-opacity-80">Manage your profile information</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/MyAccount/MyPaymentInfo"
                    className="block p-6 bg-gradient-to-br from-[#009245] to-[#44CE85] rounded-lg text-white hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Payment Methods</h3>
                            <p className="text-white text-opacity-80">Manage your saved payment methods</p>
                        </div>
                    </div>
                </Link>

                <Link
                    to="/MyAccount/TransactionHistory"
                    className="block p-6 bg-gradient-to-br from-[#056733] to-[#009245] rounded-lg text-white hover:shadow-lg transition-shadow"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Transaction History</h3>
                            <p className="text-white text-opacity-80">View your payment history</p>
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default MyAccountDashboard;

