/* src/views/CollectionDetail.tsx */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { ToolCard } from '../components/shared/ToolCard';
import { SEOHead } from '../components/shared/SEOHead';
import { BookOpen } from '../components/shared/Icons';

interface CollectionDetailProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  compareList: string[];
  onCompareToggle: (toolId: string) => void;
}

export const CollectionDetail: React.FC<CollectionDetailProps> = ({
  onToast,
  compareList,
  onCompareToggle,
}) => {
  const { id } = useParams<{ id: string }>();
  const { collections, tools } = useDatabase();

  const collection = collections.find((c) => c.id === id);

  if (!collection) {
    return (
      <div className="container section text-center">
        <h2>Collection Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          The requested curated collection does not exist in our system.
        </p>
        <Link to="/collections" className="btn btn-primary">
          Back to Collections
        </Link>
      </div>
    );
  }

  // Filter approved tools that belong to this collection
  const collectionTools = tools.filter(
    (t) => collection.tools.includes(t.id) && t.status === 'approved'
  );

  const seoTitle = `${collection.name} – Curated Stacks`;
  const seoDesc = `${collection.description} Read reviews, compare features, and find the best software tools.`;

  return (
    <div className="container section">
      <SEOHead title={seoTitle} description={seoDesc} />

      {/* Breadcrumbs */}
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link to="/">Home</Link> &gt; <Link to="/collections">Collections</Link> &gt; <span>{collection.name}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Header Block */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '30px',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: '12px' }}>
            <BookOpen size={16} />
            <span>Curated Collection Stacks</span>
          </div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: '0 0 8px 0' }}>
            {collection.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.5', margin: 0, maxWidth: '800px' }}>
            {collection.description}
          </p>
        </div>

        {/* Tools list */}
        {collectionTools.length > 0 ? (
          <div className="grid grid-cols-3">
            {collectionTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onToast={onToast}
                isCompareChecked={compareList.includes(tool.id)}
                onCompareToggle={() => onCompareToggle(tool.id)}
              />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
            No approved tools in this collection yet. Check back soon!
          </div>
        )}
      </div>
    </div>
  );
};
