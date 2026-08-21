/* src/views/Collections.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { SEOHead } from '../components/shared/SEOHead';
import { ArrowRight, BookOpen } from '../components/shared/Icons';

export const Collections: React.FC = () => {
  const { collections } = useDatabase();

  const publicCollections = collections.filter((c) => c.isPublic);

  return (
    <div className="container section">
      <SEOHead
        title="Curated AI Tool Collections"
        description="Explore curated stacks of artificial intelligence applications selected for creators, students, advertisers, and software engineers."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Header Title */}
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
            Curated AI Collections
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '4px 0 0 0' }}>
            Handpicked lists of the best artificial intelligence tools tailored for specific roles and stacks.
          </p>
        </div>

        {/* Public Stacks list */}
        {publicCollections.length > 0 ? (
          <div className="grid grid-cols-2">
            {publicCollections.map((coll) => (
              <div
                key={coll.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  justifyContent: 'space-between',
                  padding: '24px',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 'bold',
                      color: 'var(--color-primary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    <BookOpen size={14} />
                    <span>Curated Stack</span>
                  </div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginTop: '8px', marginBottom: '8px' }}>
                    {coll.name}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                    {coll.description}
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    Contains {coll.tools.length} AI tools
                  </span>
                  <Link
                    to={`/collections/${coll.id}`}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '6px 12px' }}
                  >
                    <span>View Collection</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No curated collections available at this moment.
          </div>
        )}
      </div>
    </div>
  );
};
