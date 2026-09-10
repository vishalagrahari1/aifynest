/* src/views/Blog.tsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { SEOHead } from '../components/shared/SEOHead';
import { ArrowRight } from '../components/shared/Icons';

export const Blog: React.FC = () => {
  const { blogPosts: defaultPosts } = useDatabase();
  const [posts, setPosts] = React.useState<any[]>(defaultPosts);

  React.useEffect(() => {
    async function fetchPayloadPosts() {
      const cmsUrls = [
        'https://cms.aifynest.com/api/posts?where[status][equals]=published',
        'http://localhost:3000/api/posts?where[status][equals]=published'
      ];

      for (const url of cmsUrls) {
        try {
          const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.docs) && data.docs.length > 0) {
              const mapped = data.docs.map((doc: any) => ({
                slug: doc.slug,
                title: doc.title,
                category: typeof doc.category === 'string' ? doc.category : (doc.category?.name || 'Guides'),
                excerpt: doc.excerpt,
                author: doc.author || 'AIFynest Team',
                date: doc.publishedAt ? new Date(doc.publishedAt).toISOString().split('T')[0] : 'Recently',
                readTime: doc.readTime || '5 min read',
                image: doc.featuredImage?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop',
              }));
              setPosts(mapped);
              break;
            }
          }
        } catch (e) {
          // Try next endpoint fallback
        }
      }
    }
    fetchPayloadPosts();
  }, []);

  return (
    <div className="container section">
      <SEOHead
        title="AI Trends, Guides & Industry Blog"
        description="Read comprehensive guides, comparison reviews, tutorials, and latest news on generative artificial intelligence, marketing content tools, and IDEs."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Title Header */}
        <div>
          <h1 style={{ margin: 0, fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)' }}>
            AI Industry Blog & Guides
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: '4px 0 0 0' }}>
            In-depth tutorials, comparison guides, and industry news to help you select the best AI stack.
          </p>
        </div>

        {/* Blog listings */}
        {posts.length > 0 ? (
          <div className="grid grid-cols-2" style={{ gap: '32px' }}>
            {posts.map((post) => (
              <div
                key={post.slug}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={post.image}
                  alt={post.title}
                  style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                />
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: 'var(--color-primary)',
                        textTransform: 'uppercase',
                        backgroundColor: 'var(--color-primary-light)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {post.category}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {post.readTime}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'bold', margin: 0, lineHeight: '1.3' }}>
                    {post.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {post.excerpt}
                  </p>
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      By {post.author} on {post.date}
                    </span>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '6px 12px' }}
                    >
                      <span>Read Article</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No blog articles published yet. Check back soon!
          </div>
        )}
      </div>
    </div>
  );
};
