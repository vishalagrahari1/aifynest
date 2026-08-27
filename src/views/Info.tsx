/* src/views/Info.tsx */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';

interface InfoProps {
  initialTab: 'editorial' | 'reviews' | 'disclosure' | 'privacy' | 'terms';
}

export const Info: React.FC<InfoProps> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Keep active tab in sync with the route prop
  useEffect(() => {
    setActiveTab(initialTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [initialTab]);

  const tabs = [
    { id: 'editorial', label: 'Editorial Guidelines', emoji: '📝' },
    { id: 'reviews', label: 'Review Policy', emoji: '⭐' },
    { id: 'disclosure', label: 'Advertising Disclosure', emoji: '📢' },
    { id: 'privacy', label: 'Privacy Policy', emoji: '🔒' },
    { id: 'terms', label: 'Terms of Service', emoji: '⚖️' },
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '85vh', padding: '40px 0' }}>
      <SEOHead 
        title={`${tabs.find(t => t.id === activeTab)?.label} | AIFynest`} 
        description="AIFynest editorial guidelines, review policies, advertising disclosures, and terms of service documents."
      />
      
      <div className="container info-layout-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px' }}>
        
        {/* Left sidebar nav panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '12px', fontSize: 'var(--text-xs)', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Legal & Policy
          </div>
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={`/${tab.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
                backgroundColor: activeTab === tab.id ? 'var(--color-primary-light)' : 'transparent',
                fontWeight: activeTab === tab.id ? 'var(--font-bold)' : 'normal',
                textDecoration: 'none',
                transition: 'all 150ms ease'
              }}
              className="info-tab-link"
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </Link>
          ))}
        </div>

        {/* Right Info Page Body content */}
        <div 
          className="card" 
          style={{ 
            padding: '40px', 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid var(--border-color)', 
            borderRadius: 'var(--radius-lg)' 
          }}
        >
          {activeTab === 'editorial' && (
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>
                Editorial Guidelines
              </h1>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                At AIFynest, our mission is to deliver the most comprehensive and objective directory of AI tools, platforms, and utilities. To maintain the highest quality database of resources, our editorial team adheres to the following principles:
              </p>
              
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                1. Rigorous Vetting Process
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                Every tool submitted to AIFynest undergoes human inspection before being marked as <strong>Approved</strong>. We evaluate details including:
              </p>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)', marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Functionality</strong>: Does the utility offer genuine AI, machine learning, or automated productivity enhancements?</li>
                <li><strong>Security & Safety</strong>: Submissions with malicious URLs, malware, or copycat domains are rejected.</li>
                <li><strong>Metadata Accuracy</strong>: Pricing structures, screenshots, and descriptive taglines must accurately reflect the application's true capabilities.</li>
              </ul>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                2. Vetted & Verified Credentials
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                The <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Verified</span> badge is granted only to developers who establish verified proof of tool ownership. Verification requests are independently audited by administrators. The badge provides assurance that the listing is managed by the authentic author team.
              </p>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                3. Corrections & Moderation
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                If you encounter a listing with broken links, copycat content, or outdated details, please utilize the <strong>Report Listing</strong> button. Our moderation team reviews user flag submissions within 24 hours to enforce listing accuracy.
              </p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>
                Review Policy & Guidelines
              </h1>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                AIFynest features verified reviews from designers, developers, and creators. To ensure reviews are genuine and helpful to the community, we enforce a zero-tolerance policy against review manipulation.
              </p>
              
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                1. Authenticity Requirements
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                To submit a review:
              </p>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)', marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Users must sign in using verified email credentials.</li>
                <li>Only one review per user is permitted per tool.</li>
                <li>Owners are barred from reviewing their own tools.</li>
              </ul>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                2. Moderation & Spam Filters
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                Reviews containing promotional links, profanity, or defamatory text are automatically flagged. Our system checks review payloads for duplicated text or automated bot signatures. Violating user reviews will be permanently deleted, and offending user profiles will be restricted.
              </p>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                3. Helpful Reviews Checklist
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                We encourage reviewers to focus on concrete workflows:
              </p>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)', marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>What features did you find most useful?</li>
                <li>Are there limitations or cost factors other users should consider?</li>
                <li>How does this tool compare to similar alternatives in the space?</li>
              </ul>
            </div>
          )}

          {activeTab === 'disclosure' && (
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>
                Advertising & Monetization Disclosure
              </h1>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                To support the maintenance, development, and hosting of AIFynest, we utilize monetization models. We believe in absolute transparency regarding paid placements.
              </p>
              
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                1. Sponsored Placements
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                Developers can purchase visibility packages to boost their listings. All paid listings are strictly designated with a clear <strong>Sponsored</strong> badge on the search grids and detail pages. Paid placements have zero influence on organic directory indexes.
              </p>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                2. Cost-Per-Click (CPC) Campaigns
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                Sponsors configure active campaigns that charge them on a Cost-Per-Click basis when a user visits their link. Our monetization ledger utilizes database-level deduplication to filter duplicate clicks and ensure advertising campaign budget integrity.
              </p>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                3. Affiliate Connections
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                Some buttons on AIFynest contain referral affiliate tracking tokens. If you upgrade to a paid plan on certain tools, AIFynest may earn a percentage commission at no additional cost to you. Affiliate relationships do not affect user rating indexes.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>
                Privacy Policy
              </h1>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                Last updated: August 27, 2026. This Privacy Policy details how we collect, store, and process your logs and credentials when you browse AIFynest.
              </p>
              
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                1. Data Collection
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                We collect essential profile credentials upon account creation (name, email). Additionally, we record anonymous session identifiers for usage stats, reporting flags, and campaign click tracking.
              </p>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                2. Cookies & Local Storage
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                We utilize `localStorage` and browser sessions to persist your preferred visual theme (light/dark mode), active language settings, and comparison listing folders.
              </p>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                3. Data Security
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                Your data is stored securely using PostgreSQL and Supabase. We do not sell your personal data or user logs to third parties. Reporting submissions are anonymized by default, and user passwords are encrypted using database-level hash systems.
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-primary)' }}>
                Terms of Service
              </h1>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                By accessing AIFynest, you agree to comply with our Terms of Service. Please review these parameters carefully.
              </p>
              
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                1. User Content & Directory Listings
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                You are solely responsible for submissions, claim requests, reviews, and notes compiled under your account. Spreading misinformation, posting malware links, or submitting plagiarized descriptions will result in immediate profile suspension.
              </p>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                2. Monetization & Wallet Balances
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                For owners managing active campaign balances: budget deposits are processed securely through payment verifications. Inactive or remaining balances cannot be modified directly or spent past campaign limits. Refunds are subject to administration review.
              </p>

              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', marginTop: '24px', marginBottom: '12px' }}>
                3. Limitation of Liability
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: 'var(--text-sm)' }}>
                AIFynest provides the tools index "as is". We are not responsible for pricing shifts, defects, service outages, or security flaws in any of the listed external AI tools or services.
              </p>
            </div>
          )}
        </div>

      </div>
      
      {/* Local Page Responsive CSS styling */}
      <style>{`
        @media (max-width: 768px) {
          .info-layout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
