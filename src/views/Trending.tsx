/* src/views/Trending.tsx */
import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { ToolCard } from '../components/shared/ToolCard';
import { SEOHead } from '../components/shared/SEOHead';
import { TrendingUp } from '../components/shared/Icons';

interface TrendingProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  compareList: string[];
  onCompareToggle: (toolId: string) => void;
}

export const Trending: React.FC<TrendingProps> = ({
  onToast,
  compareList,
  onCompareToggle,
}) => {
  const { getTrendingTools } = useDatabase();

  const trendingTools = getTrendingTools(8);

  return (
    <div className="container section">
      <SEOHead
        title="Trending AI Tools & Applications"
        description="Discover the fastest growing artificial intelligence software and tools based on verified user views, clicks, and review growth."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
            }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
              Trending AI Tools
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '4px 0 0 0' }}>
              The most popular and quickly rising tools on the directory this week.
            </p>
          </div>
        </div>

        {/* Tools list */}
        {trendingTools.length > 0 ? (
          <div className="grid grid-cols-4">
            {trendingTools.map((tool) => (
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
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No trending tools recorded. Browse around to generate statistics!
          </div>
        )}
      </div>
    </div>
  );
};
