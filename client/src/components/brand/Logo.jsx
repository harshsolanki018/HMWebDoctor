import React from 'react';
import HMLogo from '../../assets/logo/HMLogo.png';

/**
 * HMWebDoctor Wordmark Logo Component
 * Renders the primary HMLogo branding asset.
 */
export const Logo = ({ className = 'h-8' }) => {
  return (
    <div className={`inline-flex items-center space-x-2.5 ${className}`}>
      <img
        src={HMLogo}
        alt="HMWebDoctor"
        className="h-full w-auto object-contain"
      />
      <span className="font-bold tracking-tight text-foreground text-lg sm:text-xl flex items-center">
        <span>HM</span>
        <span className="text-primary font-bold ml-0.5">WebDoctor</span>
      </span>
    </div>
  );
};
