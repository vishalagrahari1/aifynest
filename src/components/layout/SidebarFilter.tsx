/* src/components/layout/SidebarFilter.tsx */
import React from 'react';
import type { Category } from '../../utils/seedData';
import { Trash } from '../shared/Icons';

export interface FilterState {
  category: string;
  subCategory: string;
  pricing: string[];
  platforms: string[];
  rating: number;
  verifiedOnly: boolean;
  openSourceOnly: boolean;
  featuredOnly?: boolean;
}

interface SidebarFilterProps {
  categories: Category[];
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
}

export const SidebarFilter: React.FC<SidebarFilterProps> = ({
  categories,
  filters,
  onChange,
}) => {
  const handleCategoryChange = (catSlug: string) => {
    onChange({
      ...filters,
      category: catSlug,
      subCategory: '', // Reset subcategory when category changes
    });
  };

  const handleSubCategoryChange = (sub: string) => {
    onChange({
      ...filters,
      subCategory: filters.subCategory === sub ? '' : sub,
    });
  };

  const handlePricingToggle = (price: string) => {
    const active = filters.pricing.includes(price);
    const updated = active
      ? filters.pricing.filter((p) => p !== price)
      : [...filters.pricing, price];
    onChange({ ...filters, pricing: updated });
  };

  const handlePlatformToggle = (plat: string) => {
    const active = filters.platforms.includes(plat);
    const updated = active
      ? filters.platforms.filter((p) => p !== plat)
      : [...filters.platforms, plat];
    onChange({ ...filters, platforms: updated });
  };

  const handleRatingChange = (minRating: number) => {
    onChange({
      ...filters,
      rating: filters.rating === minRating ? 0 : minRating,
    });
  };

  const handleToggleCheckbox = (field: 'verifiedOnly' | 'openSourceOnly') => {
    onChange({
      ...filters,
      [field]: !filters[field],
    });
  };

  const handleClearAll = () => {
    onChange({
      category: '',
      subCategory: '',
      pricing: [],
      platforms: [],
      rating: 0,
      verifiedOnly: false,
      openSourceOnly: false,
    });
  };

  // Find active category object for subcategories listing
  const activeCategory = categories.find((c) => c.slug === filters.category);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        boxSizing: 'border-box',
        height: 'fit-content',
        position: 'sticky',
        top: '94px', // 70px header + 24px space
      }}
    >
      {/* Header filter options */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', margin: 0 }}>
          Filters
        </h3>
        <button
          onClick={handleClearAll}
          className="btn btn-outline btn-sm"
          style={{ gap: '4px', padding: '4px 8px', fontSize: 'var(--text-xs)' }}
        >
          <Trash size={12} />
          <span>Clear All</span>
        </button>
      </div>

      {/* Category selector */}
      <div style={filterSectionStyle}>
        <h4 style={filterTitleStyle}>Category</h4>
        <div style={optionsContainerStyle}>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              name="filter-category"
              checked={filters.category === ''}
              onChange={() => handleCategoryChange('')}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span>All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat.slug} style={radioLabelStyle}>
              <input
                type="radio"
                name="filter-category"
                checked={filters.category === cat.slug}
                onChange={() => handleCategoryChange(cat.slug)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span>{cat.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Subcategory listing if category selected */}
      {activeCategory && activeCategory.subcategories.length > 0 && (
        <div style={filterSectionStyle}>
          <h4 style={filterTitleStyle}>Subcategory</h4>
          <div style={optionsContainerStyle}>
            {activeCategory.subcategories.map((sub) => (
              <label key={sub} style={radioLabelStyle}>
                <input
                  type="checkbox"
                  checked={filters.subCategory === sub}
                  onChange={() => handleSubCategoryChange(sub)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span>{sub}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Models */}
      <div style={filterSectionStyle}>
        <h4 style={filterTitleStyle}>Pricing Models</h4>
        <div style={optionsContainerStyle}>
          {['free', 'freemium', 'paid', 'free-trial', 'contact-sales'].map((price) => (
            <label key={price} style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={filters.pricing.includes(price)}
                onChange={() => handlePricingToggle(price)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span style={{ textTransform: 'capitalize' }}>
                {price.replace('-', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Access Platforms */}
      <div style={filterSectionStyle}>
        <h4 style={filterTitleStyle}>Platforms</h4>
        <div style={optionsContainerStyle}>
          {['Web', 'Windows', 'Mac', 'iOS', 'Android', 'Chrome Extension', 'API'].map((plat) => (
            <label key={plat} style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={filters.platforms.includes(plat)}
                onChange={() => handlePlatformToggle(plat)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span>{plat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Ratings Threshold */}
      <div style={filterSectionStyle}>
        <h4 style={filterTitleStyle}>Minimum Rating</h4>
        <div style={optionsContainerStyle}>
          {[4.5, 4.0, 3.5].map((ratingVal) => (
            <label key={ratingVal} style={radioLabelStyle}>
              <input
                type="radio"
                name="filter-rating"
                checked={filters.rating === ratingVal}
                onChange={() => handleRatingChange(ratingVal)}
                style={{ accentColor: 'var(--color-primary)' }}
              />
              <span>★ {ratingVal} & Up</span>
            </label>
          ))}
        </div>
      </div>

      {/* Verification statuses */}
      <div style={filterSectionStyle}>
        <h4 style={filterTitleStyle}>Listing Details</h4>
        <div style={optionsContainerStyle}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={filters.verifiedOnly}
              onChange={() => handleToggleCheckbox('verifiedOnly')}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span>Verified Listings Only</span>
          </label>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={filters.openSourceOnly}
              onChange={() => handleToggleCheckbox('openSourceOnly')}
              style={{ accentColor: 'var(--color-primary)' }}
            />
            <span>Open Source Only</span>
          </label>
        </div>
      </div>
    </div>
  );
};

const filterSectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
};

const filterTitleStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
  margin: 0,
  paddingBottom: '4px',
  borderBottom: '1px solid var(--border-color)',
};

const optionsContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const radioLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: 'var(--text-xs)',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
};
