/* src/components/shared/SEOHead.tsx */
import React from 'react';
import { useSEO } from '../../hooks/useSEO';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogType?: 'website' | 'article' | 'product';
  ogImage?: string;
  schemaMarkup?: Record<string, any>;
  robots?: string;
}

export const SEOHead: React.FC<SEOHeadProps> = (props) => {
  useSEO(props);
  return null; // Declarative component wrapper that does not render visual DOM nodes
};
