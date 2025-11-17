import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MyAccount: React.FC = () => {
    const { isAuthenticated, logout } = useAuth();

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Please Sign In</h2>
                    <p className="text-slate-600 mb-6">
                        You need to be signed in to view your account.
                    </p>
                    <Link
                        to="/"
                        className="inline-block px-6 py-2 bg-[#009245] text-white rounded-lg hover:bg-[#056733] transition-colors"
                    >
                        Go to Homepage
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 mb-2">My Account</h1>
                            <p className="text-slate-600">Manage your account settings and information</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Sidebar Navigation */}
                    <div className="lg:col-span-1">
                        <nav className="bg-white rounded-lg shadow-md p-4">
                            <ul className="space-y-2">
                                <li>
                                    <NavLink
                                        to="/MyAccount"
                                        end
                                        className={({ isActive }) =>
                                            `block px-4 py-3 rounded-lg transition-colors ${
                                                isActive
                                                    ? "bg-[#009245] text-white"
                                                    : "text-slate-700 hover:bg-[#44CE85] hover:text-white"
                                            }`
                                        }
                                    >
                                        Dashboard
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/MyAccount/MyTickets"
                                        className={({ isActive }) =>
                                            `block px-4 py-3 rounded-lg transition-colors ${
                                                isActive
                                                    ? "bg-[#009245] text-white"
                                                    : "text-slate-700 hover:bg-[#44CE85] hover:text-white"
                                            }`
                                        }
                                    >
                                        My Tickets
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/MyAccount/MyInfo"
                                        className={({ isActive }) =>
                                            `block px-4 py-3 rounded-lg transition-colors ${
                                                isActive
                                                    ? "bg-[#009245] text-white"
                                                    : "text-slate-700 hover:bg-[#44CE85] hover:text-white"
                                            }`
                                        }
                                    >
                                        My Info
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/MyAccount/MyPaymentInfo"
                                        className={({ isActive }) =>
                                            `block px-4 py-3 rounded-lg transition-colors ${
                                                isActive
                                                    ? "bg-[#009245] text-white"
                                                    : "text-slate-700 hover:bg-[#44CE85] hover:text-white"
                                            }`
                                        }
                                    >
                                        Payment Methods
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/MyAccount/TransactionHistory"
                                        className={({ isActive }) =>
                                            `block px-4 py-3 rounded-lg transition-colors ${
                                                isActive
                                                    ? "bg-[#009245] text-white"
                                                    : "text-slate-700 hover:bg-[#44CE85] hover:text-white"
                                            }`
                                        }
                                    >
                                        Transaction History
                                    </NavLink>
                                </li>
                            </ul>
                        </nav>
                    </div>

                    {/* Main Content Area */}
                    <div className="lg:col-span-3">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyAccount;
