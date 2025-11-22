import React from "react";
import { Link } from "react-router-dom";

// Import all logo variants (using underscore versions for compatibility)
import whiteLogotype from "../assets/white_logotype.png";
import whiteLogo from "../assets/white_logo.png";
import greenLogotype from "../assets/green_logotype.png";
import greenLogo from "../assets/green_logo.png";

// Note: Files with spaces ("Green Logo.png", "white logo.png") are not easily importable
// Using underscore versions instead. If you need the spaced versions, consider renaming them.

export type LogoVariant = "white-logotype" | "white-logo" | "green-logotype" | "green-logo";

interface LogoProps {
    variant?: LogoVariant;
    height?: number | string;
    clickable?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
    variant = "white-logotype", 
    height = 40,
    clickable = true,
    className = ""
}) => {
    const logoMap: Record<LogoVariant, string> = {
        "white-logotype": whiteLogotype,
        "white-logo": whiteLogo,
        "green-logotype": greenLogotype,
        "green-logo": greenLogo,
    };

    const logoImage = (
        <img 
            src={logoMap[variant]} 
            alt="Mindplanner" 
            style={{ 
                height: typeof height === "number" ? `${height}px` : height,
                width: "auto"
            }}
            className={className}
        />
    );

    if (clickable) {
        return (
            <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
                {logoImage}
            </Link>
        );
    }

    return logoImage;
};

export default Logo;

