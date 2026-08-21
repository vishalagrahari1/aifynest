/* src/views/BlogDetail.tsx */
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { SEOHead } from '../components/shared/SEOHead';
import { ArrowLeft } from '../components/shared/Icons';

export const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, tools } = useDatabase();

  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="container section text-center">
        <h2>Article Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          The requested blog article does not exist in our sitemap.
        </p>
        <Link to="/blog" className="btn btn-primary">
          Back to Blog
        </Link>
      </div>
    );
  }

  // Recommended tools widget: extract matching tools if post content mentions their names
  const recommendedTools = tools
    .filter((t) => t.status === 'approved' && post.content.toLowerCase().includes(t.name.toLowerCase()))
    .slice(0, 3);

  const seoTitle = `${post.title} – Guides`;

  return (
    <div className="container section" style={{ maxWidth: '900px' }}>
      <SEOHead title={seoTitle} description={post.excerpt} ogType="article" ogImage={post.image} />

      {/* Breadcrumbs */}
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '16px' }}>
        <Link to="/">Home</Link> &gt; <Link to="/blog">Blog</Link> &gt; <span>{post.title}</span>
      </div>

      {/* Back button */}
      <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', fontWeight: 'bold', marginBottom: '24px' }}>
        <ArrowLeft size={14} />
        <span>Back to Articles</span>
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '32px' }} className="blog-layout">
        {/* Main Content */}
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: '16px', lineHeight: '1.25' }}>
            {post.title}
          </h1>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '24px' }}>
            <span>By {post.author}</span>
            <span>&bull;</span>
            <span>{post.date}</span>
            <span>&bull;</span>
            <span>{post.readTime}</span>
          </div>

          <img
            src={post.image}
            alt={post.title}
            style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}
          />

          <article
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-primary)',
              lineHeight: '1.7',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              whiteSpace: 'pre-line',
            }}
          >
            {post.content}
          </article>
        </div>

        {/* Sidebar recommendations */}
        <div>
          {recommendedTools.length > 0 && (
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                position: 'sticky',
                top: '94px',
              }}
            >
              <h3 style={{ fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '16px', margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                Mentioned AI Tools
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {recommendedTools.map((t) => (
                  <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <img src={t.logoUrl} alt={t.name} style={{ width: '24px', height: '24px', borderRadius: 'var(--radius-xs)', objectFit: 'cover' }} />
                      <Link to={`/tools/${t.slug}`} style={{ fontSize: 'var(--text-xs)', fontWeight: 'bold' }}>
                        {t.name}
                      </Link>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{t.tagline}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .blog-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
