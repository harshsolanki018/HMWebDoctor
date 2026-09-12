import React from 'react';

/**
 * Standalone HMWebDoctor Icon Mark Component
 */
export const BrandMark = ({ className = 'w-8 h-8' }) => {
  return (
    <svg
      className={`text-primary ${className}`}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HMWebDoctor Mark"
      role="img"
    >
      <g stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 88V32l25 25 25-25v56" />
        <path d="M78 32v56" />
        <path d="M78 60h20" />
        <path d="M88 50v20" />
      </g>
    </svg>
  );
};
