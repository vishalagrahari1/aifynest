/* src/components/shared/ToolDetailActions.tsx */
import React from 'react';
import { Heart, Plus, Check, Share2 } from './Icons';

interface ToolDetailActionsProps {
  isFavorited: boolean;
  isInCompare: boolean;
  onFavoriteClick: () => void;
  onCompareClick: () => void;
  onShareClick: () => void;
  onReportClick: () => void;
}

export const ToolDetailActions: React.FC<ToolDetailActionsProps> = ({
  isFavorited,
  isInCompare,
  onFavoriteClick,
  onCompareClick,
  onShareClick,
  onReportClick,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
      {/* 3-Button Row: Save (Heart), Add to Collection/Compare (+), Share */}
      <div 
        className="tool-action-buttons-row"
        style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          alignItems: 'center',
          gap: '8px', 
          marginTop: '4px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <button 
          type="button"
          onClick={onFavoriteClick} 
          className={`btn btn-outline tool-action-button-item ${isFavorited ? 'btn-save-active' : ''}`} 
          style={{ 
            flex: '1 1 0%', 
            minWidth: 0, 
            minHeight: '44px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '0 8px',
            boxSizing: 'border-box'
          }} 
          title="Save to Favorites"
          aria-label="Save to Favorites"
        >
          <Heart size={18} fill={isFavorited ? 'var(--color-danger)' : 'none'} />
        </button>

        <button 
          type="button"
          onClick={onCompareClick} 
          className="btn btn-outline tool-action-button-item" 
          style={{ 
            flex: '1 1 0%', 
            minWidth: 0, 
            minHeight: '44px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '0 8px',
            boxSizing: 'border-box'
          }} 
          title={isInCompare ? 'In Comparison List' : 'Add to Comparison / Collection'}
          aria-label="Add to Collection or Compare"
        >
          {isInCompare ? <Check size={18} /> : <Plus size={18} />}
        </button>

        <button 
          type="button"
          onClick={onShareClick} 
          className="btn btn-outline tool-action-button-item" 
          style={{ 
            flex: '1 1 0%', 
            minWidth: 0, 
            minHeight: '44px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '0 8px',
            boxSizing: 'border-box'
          }} 
          title="Share Listing"
          aria-label="Share Listing"
        >
          <Share2 size={18} />
        </button>
      </div>

      {/* Full-Width Report / Flag Listing Button below */}
      <button 
        type="button"
        onClick={onReportClick} 
        className="btn btn-outline btn-xs w-full"
        style={{ 
          marginTop: '4px', 
          minHeight: '36px',
          fontSize: '11px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '6px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <span>🚩 Report / Flag Listing</span>
      </button>
    </div>
  );
};
