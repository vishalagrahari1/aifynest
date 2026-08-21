/* src/hooks/useSEO.ts */
import { useEffect } from 'react';

interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  schemaMarkup?: Record<string, any>;
}

export function useSEO({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  ogImage = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=630&fit=crop', // default social image
  schemaMarkup,
}: SEOMetadata) {
  useEffect(() => {
    // 1. Title
    const formattedTitle = `${title} | AI Hub Directory`;
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

    // 2. Description
    setMetaTag('name', 'description', description);

    // 3. Open Graph Metadata
    setMetaTag('property', 'og:title', formattedTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:image', ogImage);
    setMetaTag('property', 'og:url', canonicalUrl || window.location.href);
    setMetaTag('property', 'og:site_name', 'AI Hub Directory');

    // 4. Twitter / X Cards
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', formattedTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', ogImage);

    // 5. Canonical Link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl || window.location.href);

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

    // Cleanup Schema on unmount
    return () => {
      const oldScript = document.getElementById('seo-json-ld');
      if (oldScript) {
        oldScript.remove();
      }
    };
  }, [title, description, canonicalUrl, ogType, ogImage, schemaMarkup]);
}
