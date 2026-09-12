import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Lightweight Route SEO Head & Canonical Metadata Manager
 */
export const SeoHead = ({
  title = 'Diagnose Your Website. Fix What Matters.',
  description = 'HMWebDoctor provides professional, safe, and actionable website health diagnostics across performance, SEO, security, accessibility, and mobile readiness.',
  canonicalPath,
}) => {
  const location = useLocation();

  useEffect(() => {
    // 1. Update Document Title
    document.title = title.includes('HMWebDoctor') ? title : `${title} — HMWebDoctor`;

    // 2. Update Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = description;

    // 3. Update Canonical URL
    const currentPath = canonicalPath || location.pathname;
    const baseUrl = window.location.origin;
    const fullCanonicalUrl = `${baseUrl}${currentPath}`;

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = fullCanonicalUrl;

    // 4. Update OpenGraph Tags
    const ogTags = [
      { property: 'og:title', content: document.title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: fullCanonicalUrl },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'HMWebDoctor' },
    ];

    ogTags.forEach(({ property, content }) => {
      let ogMeta = document.querySelector(`meta[property="${property}"]`);
      if (!ogMeta) {
        ogMeta = document.createElement('meta');
        ogMeta.setAttribute('property', property);
        document.head.appendChild(ogMeta);
      }
      ogMeta.content = content;
    });
  }, [title, description, canonicalPath, location]);

  return null;
};
