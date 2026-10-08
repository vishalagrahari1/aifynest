/* src/views/WriteForUs.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/shared/SEOHead';
import { Sparkles, Check, Globe, ShieldCheck, Zap, BookOpen, Clock, ArrowRight } from '../components/shared/Icons';

export const WriteForUs: React.FC = () => {
  const benefits = [
    {
      title: 'Dofollow SEO Backlink',
      description: 'Get a permanent dofollow link to your product, boosting your domain authority and organic search rankings.',
      icon: <Globe size={24} style={{ color: 'var(--color-primary)' }} />,
    },
    {
      title: 'Indexed by LLMs & AI Search',
      description: 'Articles published on AIFynest are indexed by ChatGPT, Perplexity, Claude, Gemini, and SearchGPT for AI citations.',
      icon: <Zap size={24} style={{ color: 'var(--color-warning)' }} />,
    },
    {
      title: 'Targeted Tech & AI Audience',
      description: 'Reach thousands of software founders, engineers, marketers, and decision-makers looking for top AI solutions.',
      icon: <BookOpen size={24} style={{ color: 'var(--color-info)' }} />,
    },
    {
      title: '24-Hour Fast Turnaround',
      description: 'Our editorial team reviews and publishes approved guest submissions within 24 hours of approval.',
      icon: <Clock size={24} style={{ color: 'var(--color-success)' }} />,
    },
  ];

  const guidelines = [
    'Original & High-Quality Content: Minimum 800+ words. Must be 100% original and not published elsewhere.',
    'Relevant Topics: Generative AI, AI tool comparisons, machine learning guides, developer workflows, or automation case studies.',
    'Dofollow Links: Up to 2 clean contextual dofollow links to your website or product.',
    'Clear Formatting: Use H2 and H3 headings, short readable paragraphs, and include screenshots or diagrams where relevant.',
    'No Unverifiable Claims: Content must provide genuine value to readers with accurate data and unbiased reviews.',
  ];

  return (
    <div className="container section">
      <SEOHead
        title="Write For Us — Guest Post Opportunities on AIFynest"
        description="Publish your guest post article on AIFynest. Get permanent dofollow SEO backlinks, targeted AI traffic, and citations in ChatGPT, Perplexity & AI Search engines."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', maxWidth: '960px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-xs)',
              fontWeight: 'bold',
            }}
          >
            <Sparkles size={14} />
            <span>Official Guest Post & Editorial Program</span>
          </div>

          <h1 style={{ margin: 0, fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-bold)', lineHeight: '1.2' }}>
            Write For Us: Guest Post Opportunities
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-lg)', margin: 0, maxWidth: '720px', lineHeight: '1.6' }}>
            Amplify your reach, earn high-quality <strong>dofollow SEO backlinks</strong>, and get your AI product cited in <strong>ChatGPT, Perplexity, and AI Search Engines</strong>.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a
              href="mailto:aifynestofficial@gmail.com?subject=Guest%20Post%20Submission%20Inquiry%20-%20AIFynest"
              className="btn btn-primary btn-lg"
              style={{ textDecoration: 'none' }}
            >
              Submit Guest Post Request ($99) <ArrowRight size={18} />
            </a>
            <Link to="/advertise" className="btn btn-outline btn-lg">
              View All Promo Plans
            </Link>
          </div>
        </div>

        {/* Benefits Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }} className="benefits-grid">
          {benefits.map((b, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {b.icon}
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: 'var(--text-base)', fontWeight: 'bold' }}>{b.title}</h3>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Guest Post Offer Pricing Package Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '2px solid var(--color-primary)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px',
            position: 'relative',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-14px',
              right: '32px',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '4px 14px',
              borderRadius: 'var(--radius-full)',
              letterSpacing: '0.5px',
            }}
          >
            🔥 FEATURED GUEST POST PACKAGE
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <h2 style={{ margin: '0 0 8px 0', fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>
                Guest Post Article Package
              </h2>
              <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', maxWidth: '540px', lineHeight: '1.5' }}>
                Full editorial review published permanently on AIFynest with featured listing promotion and dofollow backlinks.
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--color-primary)' }}>$99</div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Lifetime Article / One-Time Payment</span>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '24px 0' }} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '28px' }} className="features-grid">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Dedicated Editorial Article Published</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Permanent Dofollow SEO Backlink</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Indexed by ChatGPT, Perplexity & SearchGPT</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Featured Section & Trending Promotion</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>24-Hour Express Editorial Review</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Check size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Social & Community Distribution</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <a
              href="mailto:aifynestofficial@gmail.com?subject=Guest%20Post%20Package%20Inquiry%20($99)"
              className="btn btn-primary btn-md"
              style={{ textDecoration: 'none', fontWeight: 'bold' }}
            >
              Order Guest Post ($99) →
            </a>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Or email topic pitches to <strong>aifynestofficial@gmail.com</strong>
            </span>
          </div>
        </div>

        {/* Editorial Guidelines */}
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '32px',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
            <span>Editorial Submission Guidelines</span>
          </h2>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {guidelines.map((g, idx) => (
              <li key={idx} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {g}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .benefits-grid, .features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};
