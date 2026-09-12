import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { NavLink } from '../navigation/NavLink';
import { ThemeToggle } from '../navigation/ThemeToggle';
import { MobileNavigation } from '../navigation/MobileNavigation';

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const pathname = location.pathname;

  const navLinks = [
    { label: 'Home', href: '/', active: pathname === '/' },
    { label: 'How It Works', href: '/how-it-works', active: pathname === '/how-it-works' },
    { label: 'Scan Website', href: '/scan', active: pathname === '/scan' },
    { label: 'About', href: '/about', active: pathname === '/about' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link
          to="/"
          className="flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Logo className="h-8" />
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
          {navLinks.map((link) => (
            <NavLink key={link.href} to={link.href} active={link.active}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open main navigation menu"
            className="lg:hidden p-2 rounded-lg text-muted hover:text-foreground bg-surface border border-border hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={navLinks}
      />
    </header>
  );
};

