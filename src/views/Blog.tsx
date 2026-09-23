/* src/views/Blog.tsx */
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDatabase } from '../context/DatabaseContext';
import { SEOHead } from '../components/shared/SEOHead';
import { ArrowRight, Search, BookOpen, Clock, Calendar, User } from '../components/shared/Icons';

export const Blog: React.FC = () => {
  const { blogPosts: defaultPosts } = useDatabase();
  const [posts, setPosts] = useState<any[]>(defaultPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

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
          // Fallback to default posts
        }
      }
    }
    fetchPayloadPosts();
  }, []);

  // Filter categories
  const categories = useMemo(() => {
    const cats = new Set<string>(['All']);
    posts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [posts]);

  // Filtered posts based on search query & selected category
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.category && post.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const featuredPost = posts.length > 0 ? posts[0] : null;
  const gridPosts = selectedCategory === 'All' && searchQuery.trim() === '' ? filteredPosts.slice(1) : filteredPosts;

  return (
    <div className="container section">
      <SEOHead
        title="AI Trends, Guides & Industry Blog — AIFynest"
        description="Read comprehensive guides, comparison reviews, tutorials, and latest news on generative artificial intelligence, marketing content tools, and IDEs."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
        {/* Header Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span
            style={{
              alignSelf: 'center',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <BookOpen size={13} />
            <span>AI Knowledge & Resource Hub</span>
          </span>
          <h1 style={{ margin: 0, fontSize: 'var(--text-4xl)', fontWeight: 'var(--font-bold)', lineHeight: '1.2' }}>
            AI Industry Blog & Insights
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', margin: 0, lineHeight: '1.6' }}>
            In-depth tutorials, comparison guides, and industry news to help you select, automate, and scale your AI stack.
          </p>
        </div>

        {/* Filter Controls Bar: Category Pills & Search */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            padding: '16px 20px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  border: selectedCategory === cat ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                  backgroundColor: selectedCategory === cat ? 'var(--color-primary)' : 'transparent',
                  color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                fontSize: 'var(--text-xs)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Featured Story Hero (Shown when on "All" and no search active) */}
        {featuredPost && selectedCategory === 'All' && searchQuery.trim() === '' && (
          <div
            className="card"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px',
              padding: 0,
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)',
              transition: 'all 0.3s ease',
            }}
          >
            <Link
              to={`/blog/${featuredPost.slug}`}
              style={{ display: 'block', overflow: 'hidden', position: 'relative', minHeight: '300px' }}
            >
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '300px',
                  maxHeight: '420px',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
              <span
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                Featured Guide
              </span>
            </Link>

            <div style={{ padding: '32px 32px 32px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={13} /> {featuredPost.date}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} /> {featuredPost.readTime}
                </span>
              </div>

              <Link
                to={`/blog/${featuredPost.slug}`}
                style={{ textDecoration: 'none', color: 'var(--text-primary)' }}
              >
                <h2
                  style={{
                    fontSize: 'var(--text-2xl)',
                    fontWeight: 'var(--font-bold)',
                    margin: 0,
                    lineHeight: '1.3',
                    transition: 'color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                >
                  {featuredPost.title}
                </h2>
              </Link>

              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: '1.6', margin: 0 }}>
                {featuredPost.excerpt}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} /> {featuredPost.author}
                </span>

                <Link to={`/blog/${featuredPost.slug}`} className="btn btn-primary btn-sm" style={{ padding: '8px 18px', fontWeight: 600 }}>
                  <span>Read Full Guide</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Section Heading for Grid */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            {selectedCategory === 'All' && searchQuery.trim() === '' ? 'More Articles & Roundups' : 'Articles'}
          </h2>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Showing {gridPosts.length} {gridPosts.length === 1 ? 'article' : 'articles'}
          </span>
        </div>

        {/* Blog Listings Grid */}
        {gridPosts.length > 0 ? (
          <div className="grid grid-cols-3" style={{ gap: '28px' }}>
            {gridPosts.map((post) => (
              <div
                key={post.slug}
                className="card blog-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                }}
              >
                {/* Clickable Feature Image */}
                <Link
                  to={`/blog/${post.slug}`}
                  style={{ display: 'block', height: '210px', overflow: 'hidden', position: 'relative' }}
                >
                  <img
                    src={post.image}
                    alt={post.title}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      backdropFilter: 'blur(8px)',
                      color: 'var(--color-primary-light)',
                      border: '1px solid var(--color-primary-alpha)',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-sm)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {post.category}
                  </span>
                </Link>

                {/* Card Content */}
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {post.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {post.readTime}
                    </span>
                  </div>

                  {/* Clickable Title */}
                  <Link
                    to={`/blog/${post.slug}`}
                    style={{ textDecoration: 'none', color: 'var(--text-primary)' }}
                  >
                    <h3
                      style={{
                        fontSize: 'var(--text-base)',
                        fontWeight: 700,
                        margin: 0,
                        lineHeight: '1.4',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        transition: 'color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                    >
                      {post.title}
                    </h3>
                  </Link>

                  <p
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.6',
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
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      By {post.author}
                    </span>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="btn btn-outline btn-sm"
                      style={{ padding: '6px 14px', fontSize: 'var(--text-xs)', fontWeight: 600 }}
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
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            <BookOpen size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', margin: '0 0 8px 0' }}>
              No Articles Found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
              No blog posts matched your search criteria or category filter. Try clearing your search.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="btn btn-outline btn-sm"
              style={{ marginTop: '16px' }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

