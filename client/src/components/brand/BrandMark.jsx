import React from 'react';
import HMLogo from '../../assets/logo/HMLogo.png';

/**
 * Standalone HMWebDoctor Icon Mark Component
 * Renders the standalone HMLogo branding mark.
 */
export const BrandMark = ({ className = 'w-8 h-8' }) => {
  return (
    <img
      src={HMLogo}
      alt="HMWebDoctor Mark"
      className={`object-contain ${className}`}
    />
  );
};
