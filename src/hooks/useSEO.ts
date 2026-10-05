/* src/hooks/useSEO.ts */
import { useEffect } from 'react';

interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  schemaMarkup?: Record<string, any>;
  robots?: string;
}

export function useSEO({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://aifynest.com/logo.png', // branded default social image
  schemaMarkup,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
}: SEOMetadata) {
  useEffect(() => {
    // 1. Title
    const formattedTitle = title.includes('AIFynest') ? title : `${title} | AIFynest`;
    document.title = formattedTitle;

    // Helper to find or create meta tag
    const setMetaTag = (attrName: string, attrValue: string, contentValue: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    const siteUrl = import.meta.env.VITE_SITE_URL || 'https://aifynest.com';
    const computedCanonical = canonicalUrl || `${siteUrl}${window.location.pathname}`;

    // 2. Description & Author
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'author', 'AIFynest Editorial Team');

    // 3. Open Graph Metadata
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage.startsWith('/') ? `${siteUrl}${ogImage}` : ogImage);
    setMetaTag('property', 'og:url', computedCanonical);
    setMetaTag('property', 'og:site_name', 'AIFynest Directory');

    // 4. Twitter / X Cards & Publisher Handles
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:site', '@aifynest');
    setMetaTag('name', 'twitter:creator', '@aifynest');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage.startsWith('/') ? `${siteUrl}${ogImage}` : ogImage);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', computedCanonical);

    // 6. Structured Schema Markup (JSON-LD)
    let schemaScript = document.getElementById('seo-json-ld') as HTMLScriptElement | null;
    if (schemaScript) {
      schemaScript.remove();
    }

    if (schemaMarkup) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'seo-json-ld';
      schemaScript.type = 'application/ld+json';
      schemaScript.innerHTML = JSON.stringify(schemaMarkup);
      document.head.appendChild(schemaScript);
    }

    // 7. Robots Metadata
    setMetaTag('name', 'robots', robots);

    // Cleanup Schema on unmount
    return () => {
      const oldScript = document.getElementById('seo-json-ld');
      if (oldScript) {
        oldScript.remove();
      }
    };
  }, [title, description, canonicalUrl, ogType, ogImage, schemaMarkup]);
}
