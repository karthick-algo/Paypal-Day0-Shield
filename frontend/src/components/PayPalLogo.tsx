import React from "react";

interface LogoProps {
  collapsed?: boolean;
  light?: boolean;
}

export const PayPalShieldLogo: React.FC<LogoProps> = ({ collapsed = false, light = false }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
      {/* PayPal iconic interlocking double-P in shield container */}
      <svg width={collapsed ? 28 : 34} height={collapsed ? 28 : 34} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#003087" />
        <path
          d="M14.5 9H23C26.5 9 29 11.2 28.5 14.8C28 18.2 25.2 20.2 21.8 20.2H18.2L16.2 32H11L14.5 9Z"
          fill="#0070BA"
        />
        <path
          d="M17.5 14.5H25C27.8 14.5 30 16.3 29.5 19.3C29 22.2 26.6 24 23.8 24H21L19.5 33H15.5L17.5 14.5Z"
          fill="#00CF65"
          fillOpacity="0.25"
        />
        <path
          d="M18 14.5H24.5C27.5 14.5 29.5 16.2 29 19C28.5 21.8 26.2 23.5 23.5 23.5H20.5L19 32.5H15L18 14.5Z"
          fill="#0079C1"
        />
        {/* Shield outline check */}
        <path
          d="M26 27L28 29L32 25"
          stroke="#00CF65"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
          <div style={{ color: light ? "#FFFFFF" : "#003087", fontWeight: 700, fontSize: 16, lineHeight: 1.2, letterSpacing: -0.3 }}>
            PayPal <span style={{ color: light ? "#00CF65" : "#0070BA", fontWeight: 800 }}>Shield</span>
          </div>
          <div style={{ color: light ? "#99B2D1" : "#597599", fontSize: 10, fontWeight: 500, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Day-0 Merchant Sentinel
          </div>
        </div>
      )}
    </div>
  );
};
