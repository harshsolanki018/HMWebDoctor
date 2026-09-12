import React from 'react';

export const Skeleton = ({ className = '', variant = 'text', width, height }) => {
  const variantStyles = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width || undefined,
    height: height || undefined,
  };

  return (
    <div
      style={style}
      className={`animate-pulse bg-surface-hover/80 ${variantStyles[variant] || variantStyles.text} ${className}`}
    />
  );
};
