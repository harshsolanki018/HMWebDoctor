import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      <Header />
      <main className="flex-1 w-full" id="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

