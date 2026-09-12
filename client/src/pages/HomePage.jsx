import React from 'react';
import { SeoHead } from '../components/common/SeoHead';
import { HeroSection } from '../components/sections/HeroSection';
import { FeatureGrid } from '../components/sections/FeatureGrid';
import { HowItWorksSteps } from '../components/sections/HowItWorksSteps';
import { ProductPrinciples } from '../components/sections/ProductPrinciples';
import { FinalCta } from '../components/sections/FinalCta';

export const HomePage = () => {
  return (
    <>
      <SeoHead
        title="Diagnose Your Website. Fix What Matters."
        description="HMWebDoctor provides professional, safe, and actionable website health diagnostics across performance, SEO, passive security headers, accessibility, and mobile readiness."
        canonicalPath="/"
      />
      <div className="w-full">
        <HeroSection />
        <FeatureGrid />
        <HowItWorksSteps />
        <ProductPrinciples />
        <FinalCta />
      </div>
    </>
  );
};
