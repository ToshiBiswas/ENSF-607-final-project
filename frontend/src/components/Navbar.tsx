import React from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const Navbar: React.FC = () => {
    const { isAuthenticated, logout, user } = useAuth();
    const navigate = useNavigate();

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
            <Link to="/">
                <Logo variant="white-logotype" height={40} />
            </Link>

            {/* Navigation Links */}
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                {isAuthenticated ? (
                    <>
                        {user && (
                            <span style={{ fontSize: "0.9rem", opacity: 0.9 }}>
                                {user.name}
                            </span>
                        )}
                        <Link to="/MyAccount" style={linkStyle}>
                            My Account
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
                
                <Link to="/Events" style={linkStyle}>
                    Events
                </Link>
                <Link to="#" style={linkStyle}>
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