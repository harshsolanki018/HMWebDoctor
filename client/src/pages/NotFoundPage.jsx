import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Search } from 'lucide-react';
import { SeoHead } from '../components/common/SeoHead';
import { Button } from '../components/ui/Button';

export const NotFoundPage = () => {
  return (
    <>
      <SeoHead
        title="404 - Page Not Found"
        description="The page you are looking for does not exist on HMWebDoctor."
        path="/404"
      />

      <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-2">
            <AlertCircle className="w-8 h-8" />
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            404
          </h1>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Page Not Found
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              Sorry, we couldn&apos;t find the page you are looking for. It might have been moved, removed, or the link may be broken.
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="primary" className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
            </Link>
            <Link to="/scan" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Search className="w-4 h-4 mr-2" />
                Scan Website
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};
