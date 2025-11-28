import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../hooks/useNotifications";

const Navbar: React.FC = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();
    const { unreadCount } = useNotifications(true, 30000); // Auto-refresh every 30 seconds

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <nav
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#009245",
                padding: "1rem 2rem",
                color: "white",
            }}
        >
            {/* logo - clickable to homepage */}
            <Logo variant="white-logotype" height={40} clickable={true} />

            {/* Navigation Links */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                {isAuthenticated ? (
                    <>
                        {user && (
                            <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                                {user.name}
                            </span>
                        )}
                <Link to="/notifications" style={{ ...linkStyle, position: "relative" }}>
                    Notifications
                    {unreadCount > 0 && (
                        <span
                            style={{
                                position: "absolute",
                                top: "-8px",
                                right: "-12px",
                                backgroundColor: "#ff4444",
                                color: "white",
                                borderRadius: "50%",
                                width: "20px",
                                height: "20px",
                                fontSize: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: "bold",
                            }}
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </Link>
                <Link to="/MyAccount" style={linkStyle}>
                    My Account
                </Link>
                <Link to="/cart" style={linkStyle}>
                    Cart
                </Link>
                <Link to="/checkout" style={linkStyle}>
                    Checkout
                </Link>
                <Link to="/payment-info" style={linkStyle}>
                    Payment Info
                </Link>
                <button onClick={handleLogout} style={buttonStyle}>
                    Logout
                </button>
            </>
        ) : (
                    <>
                        <Link to="/login" style={linkStyle}>
                            Sign in
                        </Link>
                        <Link to="/register" style={linkStyle}>
                            Sign up
                        </Link>
                    </>
                )}
                
                <Link to="/events" style={linkStyle}>
                    Events
                </Link>
                <Link to="/advice" style={linkStyle}>
                    Advice
                </Link>
                <Link to="/about" style={linkStyle}>
                    About
                </Link>
            </div>

        </nav>
    );
};

const linkStyle: React.CSSProperties = {
    color: "white",
    textDecoration: "none",
    fontSize: "1rem",
};

const buttonStyle: React.CSSProperties = {
    color: "white",
    textDecoration: "none",
    fontSize: "1rem",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
};

export default Navbar;
