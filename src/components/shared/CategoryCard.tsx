/* src/components/shared/CategoryCard.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import type { Category } from '../../utils/seedData';
import { CategoryIcon, ArrowRight } from './Icons';

interface CategoryCardProps {
  category: Category;
  toolCount?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, toolCount = 0 }) => {
  return (
    <Link
      to={`/categories/${category.slug}`}
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        height: '100%',
        textDecoration: 'none',
      }}
    >
      {/* Icon header with counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            padding: '10px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CategoryIcon name={category.iconName} size={24} />
        </div>

        {toolCount > 0 && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-semibold)',
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            {toolCount} {toolCount === 1 ? 'tool' : 'tools'}
          </span>
        )}
      </div>

      {/* Info texts */}
      <div>
        <h3
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-semibold)',
            marginBottom: '4px',
            color: 'var(--text-primary)',
          }}
        >
          {category.name}
        </h3>
        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--text-muted)',
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
          }}
        >
          {category.description}
        </p>
      </div>

      {/* Snippet of subcategories */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        {category.subcategories.slice(0, 3).map((sub) => (
          <span
            key={sub}
            style={{
              fontSize: '10px',
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-primary)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            {sub}
          </span>
        ))}
        {category.subcategories.length > 3 && (
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', alignSelf: 'center' }}>
            +{category.subcategories.length - 3}
          </span>
        )}
      </div>

      {/* Hover action highlight */}
      <div
        className="arrow-hover-show"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-semibold)',
          color: 'var(--color-primary)',
          marginTop: '4px',
          alignSelf: 'flex-start',
        }}
      >
        <span>Explore</span>
        <ArrowRight size={12} />
      </div>
    </Link>
  );
};
