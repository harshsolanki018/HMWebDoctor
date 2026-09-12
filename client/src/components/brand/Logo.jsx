import React from 'react';

/**
 * HMWebDoctor Wordmark Logo Component
 */
export const Logo = ({ className = 'h-8' }) => {
  return (
    <div className={`inline-flex items-center space-x-2.5 ${className}`}>
      {/* Icon Mark */}
      <svg
        className="h-full w-auto aspect-square text-primary"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
          {/* HM Monogram */}
          <path d="M18 88V32l25 25 25-25v56" />
          <path d="M78 32v56" />
          {/* Medical Doctor Cross Accent */}
          <path d="M78 60h20" />
          <path d="M88 50v20" />
        </g>
      </svg>
      {/* Wordmark Text */}
      <span className="font-bold tracking-tight text-foreground text-lg sm:text-xl flex items-center">
        <span>HM</span>
        <span className="text-primary font-bold ml-0.5">WebDoctor</span>
      </span>
    </div>
  );
};
