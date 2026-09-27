/* src/views/About.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { Sparkles, ArrowRight } from '../components/shared/Icons';
import { BUSINESS_CONFIG } from '../config/businessConfig';

export const About: React.FC = () => {
  return (
    <div className="container section">
      <SEOHead
        title="About AIFynest — Discover Better AI Tools & Get Your Product Discovered"
        description="AIFynest is an AI software discovery platform helping creators, professionals, and businesses discover the right AI tools while giving builders a platform to get discovered."
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
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <Sparkles size={14} />
            <span>Platform Overview</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            About AIFynest
          </h1>

          <p style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.3rem)', fontWeight: 700, color: '#E2603A', margin: '0 0 16px 0', lineHeight: '1.4' }}>
            Discover Better AI Tools. Get Your Product Discovered.
          </p>

          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', lineHeight: '1.6', margin: '0 auto', maxWidth: '760px' }}>
            AIFynest is an AI software discovery platform built to make it easier for people, creators, professionals, and businesses to discover the right AI tools and software for their needs.
          </p>
        </div>

        {/* Discovery & Exploration Card */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
            With thousands of AI products launching every day, finding the right tool can be overwhelming. AIFynest brings useful AI tools, SaaS products, and software into one place, making it easier to discover, explore, compare, and evaluate products before choosing what works best.
          </p>
        </div>

        {/* Built for Builders Card */}
        <div 
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            border: '1px solid rgba(226, 96, 58, 0.3)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '32px',
            background: 'linear-gradient(135deg, rgba(226, 96, 58, 0.05) 0%, rgba(124, 58, 237, 0.04) 100%)'
          }}
        >
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', margin: '0 0 14px 0', color: 'var(--text-primary)' }}>
            Built for Software Seekers & Builders
          </h2>
          <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 600, lineHeight: '1.6', margin: '0 0 14px 0' }}>
            But AIFynest isn't just built for people looking for software — it's built for the people building it, too.
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0 }}>
            If you've created an AI tool, SaaS product, or startup, listing it on AIFynest gives your product another place to be discovered. Your dedicated listing can help expand your online presence, build your SEO footprint, earn a quality backlink, and give search engines and AI-powered systems more opportunities to discover, understand, and potentially surface your product.
          </p>
        </div>

        {/* Built for Discovery Callout */}
        <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Built for Discovery. Built for Builders.
          </h2>
          <p style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: '#E2603A', margin: '0 0 16px 0' }}>
            We believe great products shouldn't stay hidden.
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.7', margin: '0 0 12px 0', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' }}>
            AIFynest connects the people searching for better software with the builders creating it.
          </p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.7', margin: 0, maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto' }}>
            Whether you're looking for your next AI tool or launching one of your own, AIFynest is built to help you find what's next — and get found.
          </p>
        </div>

        {/* Primary Action CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '12px 0' }}>
          <Link 
            to="/ai-tools" 
            className="btn btn-primary btn-lg"
            style={{
              padding: '12px 28px',
              fontSize: 'var(--text-base)',
              fontWeight: 'bold',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(226, 96, 58, 0.3)'
            }}
          >
            <span>Explore AI Tools</span>
            <ArrowRight size={18} />
          </Link>

          <Link 
            to="/submit-tool" 
            className="btn btn-outline btn-lg"
            style={{
              padding: '12px 28px',
              fontSize: 'var(--text-base)',
              fontWeight: 'bold',
              borderRadius: 'var(--radius-lg)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none'
            }}
          >
            <span>List Your Product</span>
            <ArrowRight size={18} />
          </Link>
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
      </div>
    </div>
  );
};
