/* src/views/About.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { Sparkles, Check, Shield } from '../components/shared/Icons';
import { BUSINESS_CONFIG } from '../config/businessConfig';

export const About: React.FC = () => {
  return (
    <div className="container section">
      <SEOHead
        title="About AIFynest — AI Software Discovery Platform"
        description="Learn about AIFynest's mission to help individuals, professionals, and businesses discover, compare, and evaluate Artificial Intelligence tools."
      />

      <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'bold',
              marginBottom: '16px',
            }}
          >
            <Sparkles size={14} />
            <span>Platform Overview</span>
          </div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'bold', margin: '0 0 12px 0' }}>
            About {BUSINESS_CONFIG.name}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: '1.6', margin: 0 }}>
            {BUSINESS_CONFIG.name} is an artificial intelligence software discovery platform designed to help individuals, creative professionals, and businesses find, compare, and evaluate AI tools for their workflows.
          </p>
        </div>

        {/* Core Pillars */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', margin: '0 0 20px 0' }}>
            Our Mission & What We Do
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.7', margin: '0 0 16px 0' }}>
            The rapid growth of artificial intelligence has created thousands of new software applications across image generation, voice synthesis, video creation, code assistance, and enterprise productivity. Finding the right tool for specific requirements can be overwhelming.
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
            {BUSINESS_CONFIG.name} provides a structured directory where users can browse cataloged AI tools, read detailed feature breakdowns, view high-resolution interface screenshots, inspect pricing models, and compare alternatives side-by-side.
          </p>
        </div>

        {/* How It Works Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Shield size={20} style={{ color: 'var(--color-primary)' }} />
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', margin: 0 }}>Curated & Moderated</h3>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
              Every tool submission undergoes editorial review. We verify destination URLs, product details, pricing accuracy, and category classification before publishing listings.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Check size={20} style={{ color: 'var(--color-success)' }} />
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', margin: 0 }}>For AI Tool Builders</h3>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
              AI software developers can submit their products for directory indexing, claim existing listing profiles, request verified builder badges, and track traffic referral analytics.
            </p>
          </div>
        </div>

        {/* Contact & Support Channels */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '0 0 12px 0' }}>
            Get in Touch with Us
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 20px 0' }}>
            Have questions about tool directory listings, partnership proposals, listing updates, or general feedback? Reach out to our team directly:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }} className="contact-emails-grid">
            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                Primary Contact Email
              </span>
              <a 
                href={`mailto:${BUSINESS_CONFIG.contactEmail}`} 
                style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary)', fontWeight: 'bold', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                {BUSINESS_CONFIG.contactEmail}
              </a>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                For general support, tool submissions, and directory inquiries.
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                Official Business Email
              </span>
              <a 
                href={`mailto:${BUSINESS_CONFIG.officialEmail}`} 
                style={{ fontSize: 'var(--text-base)', color: 'var(--color-primary)', fontWeight: 'bold', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                {BUSINESS_CONFIG.officialEmail}
              </a>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: '1.5' }}>
                For official business communications, partnerships, and press.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Link to="/ai-tools" className="btn btn-primary btn-md">
            Explore All AI Tools
          </Link>
          <span style={{ margin: '0 12px', color: 'var(--text-muted)' }}>|</span>
          <Link to="/contact" className="btn btn-outline btn-md">
            Contact Support Form
          </Link>
        </div>
      </div>
    </div>
  );
};
