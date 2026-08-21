/* src/components/shared/StarRating.tsx */
import React from 'react';
import { Star } from './Icons';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (newRating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  max = 5,
  size = 16,
  interactive = false,
  onChange,
}) => {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const displayRating = hoverRating !== null ? hoverRating : rating;

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index);
    }
  };

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  return (
    <div 
      style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starIndex = i + 1;
        
        // Calculate fill percentage for detailed fractional ratings
        let fill = 'none';
        if (displayRating >= starIndex) {
          fill = '#f59e0b'; // Full Gold
        } else if (displayRating > starIndex - 1) {
          // If we want detailed partial fills, we can use SVG gradients, 
          // but for general directory use, a half-star representation or full highlights works.
          // Let's use simple threshold logic: >= 0.5 round up to full or half.
          fill = (displayRating - (starIndex - 1) >= 0.5) ? '#f59e0b' : 'none';
        }

        const color = fill === 'none' ? 'var(--border-color-hover)' : 'var(--color-gold)';

        return (
          <span
            key={i}
            onClick={() => handleClick(starIndex)}
            onMouseEnter={() => handleMouseEnter(starIndex)}
            style={{
              cursor: interactive ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: color,
              transition: interactive ? 'transform 100ms ease' : 'none',
              transform: interactive && hoverRating === starIndex ? 'scale(1.15)' : 'none',
            }}
          >
            <Star size={size} fill={fill} />
          </span>
        );
      })}
    </div>
  );
};
