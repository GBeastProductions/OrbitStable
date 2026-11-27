import React from 'react';

interface IconProps {
  className?: string;
}

/**
 * Clean monochrome white-first centered Saturn planet emblem for Orbs & Orb Shop.
 */
export const OrbIcon: React.FC<IconProps> = ({ className = 'h-4 w-4 text-white' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {/* Centered Orb sphere */}
      <circle cx="12" cy="12" r="4.6" fill="currentColor" />
      {/* Centered tilted orbital halo ring */}
      <ellipse
        cx="12"
        cy="12"
        rx="9.8"
        ry="3.4"
        transform="rotate(-26 12 12)"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Clean stark-white geometric open-book + rising star emblem for The Index.
 */
export const IndexIcon: React.FC<IconProps> = ({ className = 'h-5 w-5 text-white' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {/* Center rising 4-point sparkle */}
      <path
        d="M12 2.2L12.9 4.55L15.2 5.45L12.9 6.35L12 8.7L11.1 6.35L8.8 5.45L11.1 4.55L12 2.2Z"
        fill="currentColor"
      />
      {/* Left open book page */}
      <path
        d="M3.2 8.2L11.6 11.4V20.5L3.2 17.3V8.2Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      {/* Right open book page */}
      <path
        d="M20.8 8.2L12.4 11.4V20.5L20.8 17.3V8.2Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
};
