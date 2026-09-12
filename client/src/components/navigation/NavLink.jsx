import React from 'react';
import { Link } from 'react-router-dom';

export const NavLink = ({ to, href, active = false, children, className = '', onClick }) => {
  const destination = to || href || '/';

  return (
    <Link
      to={destination}
      onClick={onClick}
      className={`text-sm font-medium transition-colors duration-150 rounded-md px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? 'text-primary font-semibold bg-primary/10'
          : 'text-muted hover:text-foreground hover:bg-surface-muted'
      } ${className}`}
    >
      {children}
    </Link>
  );
};

