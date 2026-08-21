/* src/views/NewTools.tsx */
import React from 'react';
import { useDatabase } from '../context/DatabaseContext';
import { ToolCard } from '../components/shared/ToolCard';
import { SEOHead } from '../components/shared/SEOHead';
import { Sparkles } from '../components/shared/Icons';

interface NewToolsProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  compareList: string[];
  onCompareToggle: (toolId: string) => void;
}

export const NewTools: React.FC<NewToolsProps> = ({
  onToast,
  compareList,
  onCompareToggle,
}) => {
  const { tools } = useDatabase();

  const newTools = tools
    .filter((t) => t.status === 'approved')
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  return (
    <div className="container section">
      <SEOHead
        title="New AI Tools – Recently Added Platforms"
        description="Explore the latest artificial intelligence software, widgets, frameworks and platforms approved on the AI Tools Directory this week."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Title Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: 'var(--color-gold-light)',
              color: 'var(--color-gold-hover)',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
            }}
          >
            <Sparkles size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
              Newest AI Listings
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '4px 0 0 0' }}>
              Explore recently vetted and launched artificial intelligence tools.
            </p>
          </div>
        </div>

        {/* Tools list */}
        {newTools.length > 0 ? (
          <div className="grid grid-cols-4">
            {newTools.map((tool) => (
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
            No new tools added recently. Stay tuned!
          </div>
        )}
      </div>
    </div>
  );
};
