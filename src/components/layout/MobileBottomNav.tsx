/* src/components/layout/MobileBottomNav.tsx */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart } from '../shared/Icons';

const HomeIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const FlameIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

const CategoryGridIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const activePath = location.pathname;
  const searchString = location.search;

  const navItems = [
    { label: 'Home', path: '/', icon: <HomeIcon size={20} /> },
    { label: 'Explore', path: '/ai-tools', icon: <Search size={20} /> },
    { label: 'Trending', path: '/trending', icon: <FlameIcon size={20} /> },
    { label: 'Collections', path: '/collections', icon: <CategoryGridIcon size={20} /> },
    { label: 'Saved', path: '/dashboard?tab=saved', icon: <Heart size={20} /> },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map((item) => {
        let isActive = false;
        if (item.path === '/') {
          isActive = activePath === '/';
        } else if (item.path.includes('?tab=')) {
          isActive = activePath === '/dashboard' && searchString.includes('tab=saved');
        } else {
          isActive = activePath.startsWith(item.path);
        }

        return (
          <Link
            key={item.label}
            to={item.path}
            className={`mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}
          >
            <div className="mobile-nav-icon">{item.icon}</div>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
