import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const Navbar: React.FC = () => {
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
            <Logo variant="white-logotype" height={40} />

            {/* Navigation Links */}
            <div style={{ display: "flex", gap: "1.5rem" }}>
                <Link to="/" style={linkStyle}>
                    Sign in
                </Link>
                <Link to="/MyAccount" style={linkStyle}>
                    My Account
                </Link>
                
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

export default Navbar;