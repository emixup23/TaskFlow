import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-8 h-8', size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="tf-gradient-bg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="tf-gradient-accent" x1="8" y1="8" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0f2fe" />
        </linearGradient>
      </defs>

      {/* Rounded container with gradient background and refined border */}
      <rect width="36" height="36" rx="8" fill="url(#tf-gradient-bg)" />

      {/* Stylized Modern Workflow Glyphs */}
      {/* Top horizontal flow header */}
      <rect x="8" y="8" width="20" height="4.5" rx="2.25" fill="url(#tf-gradient-accent)" />
      
      {/* Vertical task backbone */}
      <rect x="8" y="14.5" width="5" height="13.5" rx="2.5" fill="url(#tf-gradient-accent)" fillOpacity="0.9" />

      {/* Active task check & forward flow line */}
      <path
        d="M16 20.5L20.5 24.5L28 15"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Cyan flow accent dot */}
      <circle cx="28" cy="15" r="1.75" fill="#38bdf8" />
    </svg>
  );
};
