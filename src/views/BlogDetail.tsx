/* src/views/BlogDetail.tsx */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { SEOHead } from '../components/shared/SEOHead';
import { ArrowLeft, Copy, Check, Clock, Calendar, User, BookOpen } from '../components/shared/Icons';
import { getToolLogoUrl, handleLogoError } from '../utils/toolHelpers';
import { MarkdownRenderer } from '../components/shared/MarkdownRenderer';

export const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, tools } = useDatabase();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTocId, setActiveTocId] = useState<string>('');

  // Scroll Progress Bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Robust Article Lookup by Slug, Clean Slug, or Title
  const cleanSlug = (slug || '').toLowerCase().trim().replace(/-[0-9]+$/, '');
  const post = blogPosts.find((p) => {
    if (!p || !p.slug) return false;
    const pCleanSlug = p.slug.toLowerCase().trim().replace(/-[0-9]+$/, '');
    return p.slug === slug || pCleanSlug === cleanSlug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanSlug;
  });

  // Extract Table of Contents items from Markdown headings (## Heading)
  const tocItems: { id: string; text: string; level: number }[] = [];
  if (post && post.content) {
    const lines = post.content.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        const text = trimmed.replace(/^##\s+/, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (text && id) tocItems.push({ id, text, level: 2 });
      } else if (trimmed.startsWith('### ')) {
        const text = trimmed.replace(/^###\s+/, '').trim();
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        if (text && id) tocItems.push({ id, text, level: 3 });
      }
    });
  }

  // Active TOC Highlight on Scroll
  useEffect(() => {
    if (tocItems.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTocId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );

    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [post?.slug, tocItems.length]);

  if (!post) {
    return (
      <div className="container section" style={{ maxWidth: '800px', textAlign: 'center', padding: '60px 16px' }}>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold', marginBottom: '16px' }}>Article Not Found</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
          The requested guide or blog article does not exist or may have been moved.
        </p>
        <Link to="/blog" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} />
          <span>Browse All Articles</span>
        </Link>
      </div>
    );
  }

  // Related Articles (excluding current post)
  const relatedPosts = blogPosts
    .filter((b) => b.slug !== post.slug && (b.status === 'published' || !b.status))
    .slice(0, 3);

  // Recommended tools mentioned in the article
  const recommendedTools = tools
    .filter((t) => t.status === 'approved' && post.content.toLowerCase().includes(t.name.toLowerCase()))
    .slice(0, 4);

  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://aifynest.com';
  const postImageUrl = post.image?.startsWith('http') ? post.image : `${siteUrl}${post.image || '/logo.png'}`;
  const articleUrl = `${siteUrl}/blog/${post.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const schemaMarkup = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': post.title,
      'description': post.excerpt,
      'author': {
        '@type': 'Person',
        'name': post.author || 'AIFynest Editorial Team'
      },
      'datePublished': post.date,
      'dateModified': post.date,
      'image': postImageUrl,
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': articleUrl
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'AIFynest',
        'logo': {
          '@type': 'ImageObject',
          'url': `${siteUrl}/logo.png`
        }
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': siteUrl
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Blog',
          'item': `${siteUrl}/blog`
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': post.title,
          'item': articleUrl
        }
      ]
    }
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Scroll Progress Bar at very top */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: `${scrollProgress}%`,
          height: '3px',
          backgroundColor: 'var(--color-primary)',
          zIndex: 9999,
          transition: 'width 0.1s linear',
          boxShadow: '0 0 10px var(--color-primary)'
        }}
      />

      <SEOHead
        title={`${post.title} — AIFynest Blog`}
        description={post.excerpt}
        ogType="article"
        ogImage={postImageUrl}
        canonicalUrl={articleUrl}
        schemaMarkup={schemaMarkup}
      />

      <div className="container section" style={{ maxWidth: '1100px', padding: '32px 16px' }}>
        {/* Breadcrumb Navigation */}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>Home</Link>
          <span>&gt;</span>
          <Link to="/blog" style={{ color: 'var(--text-muted)' }}>Blog</Link>
          <span>&gt;</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {post.title}
          </span>
        </div>

        {/* Back Link */}
        <Link
          to="/blog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-primary)',
            marginBottom: '24px',
            textDecoration: 'none'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to All Articles</span>
        </Link>

        {/* HERO HEADER */}
        <header style={{ marginBottom: '32px' }}>
          {post.category && (
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '20px',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '16px'
              }}
            >
              {post.category}
            </span>
          )}

          <h1
            style={{
              fontSize: 'clamp(1.8rem, 4vw, 2.75rem)',
              fontWeight: 800,
              lineHeight: '1.2',
              color: 'var(--text-primary)',
              marginBottom: '20px',
              letterSpacing: '-0.02em'
            }}
          >
            {post.title}
          </h1>

          {/* Author & Meta Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                <User size={15} style={{ color: 'var(--color-primary)' }} />
                <span>{post.author || 'AIFynest Editorial Team'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={14} />
                <span>{post.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} />
                <span>{post.readTime || '8 min read'}</span>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleCopyLink}
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  cursor: 'pointer'
                }}
              >
                {copiedLink ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(articleUrl)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  textDecoration: 'none'
                }}
                title="Share on Twitter"
              >
                𝕏
              </a>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} - ${articleUrl}`)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#25D36615',
                  border: '1px solid #25D36640',
                  fontSize: '14px',
                  color: '#25D366',
                  textDecoration: 'none'
                }}
                title="Share on WhatsApp"
              >
                💬
              </a>
            </div>
          </div>
        </header>

        {/* Hero Featured Image */}
        {post.image && (
          <div style={{ marginBottom: '36px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
            <img
              src={post.image}
              alt={post.title}
              style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* TWO COLUMN ARTICLE LAYOUT */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px' }} className="blog-article-grid">
          {/* LEFT MAIN ARTICLE COLUMN */}
          <main>
            {/* Lead Excerpt Summary Box */}
            {post.excerpt && (
              <div
                style={{
                  padding: '20px 24px',
                  backgroundColor: 'var(--bg-card)',
                  borderLeft: '4px solid var(--color-primary)',
                  border: '1px solid var(--border-color)',
                  borderLeftWidth: '4px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '32px',
                  fontSize: '17px',
                  fontWeight: 500,
                  lineHeight: '1.6',
                  color: 'var(--text-primary)'
                }}
              >
                {post.excerpt}
              </div>
            )}

            {/* Main Article Body Rendered with Upgraded MarkdownRenderer */}
            <article style={{ fontSize: '17px', lineHeight: '1.8' }}>
              <MarkdownRenderer content={post.content} />
            </article>
          </main>

          {/* RIGHT STICKY SIDEBAR COLUMN */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Table of Contents (TOC) */}
            {tocItems.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px',
                  position: 'sticky',
                  top: '90px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  <BookOpen size={16} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, color: 'var(--text-primary)' }}>
                    Table of Contents
                  </h3>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
                  {tocItems.map((item) => {
                    const isActive = activeTocId === item.id;
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(item.id);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            setActiveTocId(item.id);
                          }
                        }}
                        style={{
                          fontSize: item.level === 3 ? '12px' : '13px',
                          paddingLeft: item.level === 3 ? '14px' : '8px',
                          color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                          fontWeight: isActive ? 700 : 400,
                          textDecoration: 'none',
                          lineHeight: '1.4',
                          borderLeft: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {item.text}
                      </a>
                    );
                  })}
                </nav>
              </div>
            )}

            {/* Mentioned AI Tools Sidebar Widget */}
            {recommendedTools.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px'
                }}
              >
                <h3
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--text-muted)',
                    margin: '0 0 16px 0',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border-color)'
                  }}
                >
                  Featured AI Tools Mentioned
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {recommendedTools.map((t) => (
                    <div key={t.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <img
                        src={getToolLogoUrl(t)}
                        alt={t.name}
                        style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }}
                        onError={(e) => handleLogoError(e, t.name)}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link to={`/tools/${t.slug}`} style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', textDecoration: 'none' }}>
                          {t.name}
                        </Link>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.tagline}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sidebar Guest Post Promo Widget */}
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px dashed var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-primary)', backgroundColor: 'var(--color-primary-light)', padding: '3px 8px', borderRadius: '4px' }}>
                GUEST POSTING ($99)
              </span>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '10px 0 6px 0', color: 'var(--text-primary)' }}>
                Publish Your Article Here
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: '1.4' }}>
                Get dofollow backlinks, traffic, and LLM citations on AIFynest.
              </p>
              <Link to="/write-for-us" className="btn btn-primary btn-sm w-full" style={{ fontSize: '12px', textAlign: 'center', justifyContent: 'center' }}>
                Write For Us Guidelines →
              </Link>
            </div>
          </aside>
        </div>

        {/* BOTTOM SECTION: RELATED ARTICLES */}
        {relatedPosts.length > 0 && (
          <section style={{ marginTop: '64px', paddingTop: '40px', borderTop: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--text-primary)' }}>
              Related Guides & Articles
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/blog/${rel.slug}`}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  className="related-article-card"
                >
                  {rel.image && (
                    <img src={rel.image} alt={rel.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  )}
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px' }}>
                      {rel.category || 'Guide'}
                    </span>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', lineHeight: '1.4', margin: '0 0 8px 0', flex: 1 }}>
                      {rel.title}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                      <span>{rel.date}</span>
                      <span>&bull;</span>
                      <span>{rel.readTime}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .blog-article-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .related-article-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  );
};
