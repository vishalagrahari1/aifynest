/* src/components/layout/Header.tsx */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Layout } from '../shared/Icons';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';

const Bookmark: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
  </svg>
);

const GlobeIcon: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
    <path d="M2 12h20"/>
  </svg>
);

const ChevronDown: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' }
];

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    allTools: 'All Tools',
    popularTools: 'Popular Tools',
    blog: 'Blog',
    more: '+ More',
    trending: 'Trending AI Tools',
    newest: 'Newest Listings',
    collections: 'Curated Collections',
    compare: 'Compare Tools',
    sponsorship: 'Sponsorship Placements',
    submitTool: 'Submit Tool',
    login: 'Log in',
    signup: 'Sign up',
    getStarted: 'Get Started',
    claimTool: 'Claim Tool',
    savedTitle: 'Saved Favorites',
    noSaved: 'No saved tools yet.',
    signInPrompt: 'Sign in to save and access your favorite AI tools.',
    logout: 'Log Out',
    adminConsole: 'Admin Console',
    dashboard: 'Dashboard',
    myTools: 'My Tools',
    analytics: 'Analytics',
    myReviews: 'My Reviews',
    language: 'Language',
  },
  es: {
    allTools: 'Herramientas',
    popularTools: 'Populares',
    blog: 'Blog',
    more: '+ Más',
    trending: 'Herramientas Populares',
    newest: 'Últimas Listadas',
    collections: 'Colecciones Curadas',
    compare: 'Comparar Herramientas',
    sponsorship: 'Anuncios Patrocinados',
    submitTool: 'Publicar IA',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    getStarted: 'Empezar',
    claimTool: 'Reclamar IA',
    savedTitle: 'Favoritos Guardados',
    noSaved: 'Aún no hay herramientas guardadas.',
    signInPrompt: 'Inicia sesión para guardar tus herramientas favoritas.',
    logout: 'Cerrar Sesión',
    adminConsole: 'Panel de Admin',
    dashboard: 'Panel de Control',
    myTools: 'Mis Herramientas',
    analytics: 'Estadísticas',
    myReviews: 'Mis Reseñas',
    language: 'Idioma',
  },
  fr: {
    allTools: 'Toutes les IA',
    popularTools: 'Populaires',
    blog: 'Blog',
    more: '+ Plus',
    trending: 'Outils Populaires',
    newest: 'Dernières Nouveautés',
    collections: 'Collections Thématiques',
    compare: 'Comparer les IA',
    sponsorship: 'Placements Premium',
    submitTool: 'Soumettre IA',
    login: 'Connexion',
    signup: 'S\'inscrire',
    getStarted: 'Démarrer',
    claimTool: 'Réclamer IA',
    savedTitle: 'Favoris Enregistrés',
    noSaved: 'Aucun outil enregistré pour le moment.',
    signInPrompt: 'Connectez-vous pour enregistrer vos favoris.',
    logout: 'Déconnexion',
    adminConsole: 'Console Admin',
    dashboard: 'Tableau de bord',
    myTools: 'Mes Outils',
    analytics: 'Statistiques',
    myReviews: 'Mes Avis',
    language: 'Langue',
  },
  de: {
    allTools: 'Alle Tools',
    popularTools: 'Beliebte Tools',
    blog: 'Blog',
    more: '+ Mehr',
    trending: 'Beliebte KI-Tools',
    newest: 'Neueste Einträge',
    collections: 'Kuratierte Kollektionen',
    compare: 'Tools vergleichen',
    sponsorship: 'Sponsoring-Plätze',
    submitTool: 'Tool einreichen',
    login: 'Anmelden',
    signup: 'Registrieren',
    getStarted: 'Starten',
    claimTool: 'Tool beanspruchen',
    savedTitle: 'Gespeicherte Favoriten',
    noSaved: 'Noch keine Tools gespeichert.',
    signInPrompt: 'Melden Sie sich an, um Favoriten zu speichern.',
    logout: 'Abmelden',
    adminConsole: 'Admin-Konsole',
    dashboard: 'Dashboard',
    myTools: 'Meine Tools',
    analytics: 'Analysen',
    myReviews: 'Meine Bewertungen',
    language: 'Sprache',
  },
  hi: {
    allTools: 'सभी उपकरण',
    popularTools: 'लोकप्रिय उपकरण',
    blog: 'ब्लॉग',
    more: '+ अधिक',
    trending: 'रुझान वाले उपकरण',
    newest: 'नवीनतम लिस्टिंग',
    collections: 'विशेष संग्रह',
    compare: 'तुलना करें',
    sponsorship: 'प्रायोजित प्लेसमेंट',
    submitTool: 'उपकरण जोड़ें',
    login: 'लॉग इन',
    signup: 'साइन अप',
    getStarted: 'शुरू करें',
    claimTool: 'दावा करें',
    savedTitle: 'पसंदीदा सहेजे गए',
    noSaved: 'कोई सहेजा गया उपकरण नहीं है।',
    signInPrompt: 'पसंदीदा उपकरणों को सहेजने के लिए लॉग इन करें।',
    logout: 'लॉग आउट',
    adminConsole: 'एडमिन कंसोल',
    dashboard: 'डैशबोर्ड',
    myTools: 'मेरे उपकरण',
    analytics: 'विश्लेषण',
    myReviews: 'मेरी समीक्षाएं',
    language: 'भाषा',
  },
  ja: {
    allTools: 'すべてのツール',
    popularTools: '人気のツール',
    blog: 'ブログ',
    more: '+ もっと見る',
    trending: 'トレンドのツール',
    newest: '新着掲載',
    collections: '厳選コレクション',
    compare: 'ツール比較',
    sponsorship: 'スポンサー掲載',
    submitTool: 'ツールを送信',
    login: 'ログイン',
    signup: '会員登録',
    getStarted: '始める',
    claimTool: '申請する',
    savedTitle: '保存したお気に入り',
    noSaved: '保存されたツールはまだありません。',
    signInPrompt: 'お気に入りのツールを保存してアクセスするにはログインしてください。',
    logout: 'ログアウト',
    adminConsole: '管理コンソール',
    dashboard: 'ダッシュボード',
    myTools: '登録したツール',
    analytics: 'アナリティクス',
    myReviews: 'レビュー履歴',
    language: '言語',
  },
  zh: {
    allTools: '所有工具',
    popularTools: '热门工具',
    blog: '博客',
    more: '+ 更多',
    trending: '趋势AI工具',
    newest: '最新发布',
    collections: '精选收藏集',
    compare: '比较工具',
    sponsorship: '广告赞助合作',
    submitTool: '提交工具',
    login: '登录',
    signup: '注册',
    getStarted: '开始使用',
    claimTool: '认领工具',
    savedTitle: '已保存的收藏',
    noSaved: '暂无已保存的工具。',
    signInPrompt: '登录以保存并查看您喜爱的AI工具。',
    logout: '退出登录',
    adminConsole: '管理控制台',
    dashboard: '仪表板',
    myTools: '我的工具',
    analytics: '分析统计',
    myReviews: '我的评论',
    language: '语言',
  }
};

export const Header: React.FC = () => {
  const { user, logout, isOwner, isAdmin } = useAuth();
  const { dbError, tools, collections, toggleFavoriteTool } = useDatabase();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  
  const [isSavedDropdownOpen, setIsSavedDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState(() => {
    return localStorage.getItem('app_lang') || 'en';
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const savedDropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const t = (key: string) => {
    return TRANSLATIONS[activeLanguage]?.[key] || TRANSLATIONS['en']?.[key] || key;
  };

  const userFavorites = collections ? collections.find((c) => c.userId === user?.id && c.name === 'My Favorites') : null;
  const savedToolIds = userFavorites ? userFavorites.tools : [];
  const savedToolsList = (tools && savedToolIds.length > 0) ? tools.filter(tool => savedToolIds.includes(tool.id)) : [];

  // Apply theme class to document
  useEffect(() => {
    const savedTheme = localStorage.getItem('ai_theme') as 'light' | 'dark' | null;
    const activeTheme = savedTheme || 'dark';
    setTheme(activeTheme);
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (savedDropdownRef.current && !savedDropdownRef.current.contains(e.target as Node)) {
        setIsSavedDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('ai_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <>
      {dbError && (
        <div style={{
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '10px 20px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: 'bold',
          position: 'sticky',
          top: 0,
          zIndex: 101,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          ⚠️ Database Outage Detected: {dbError}. Stored operations are temporarily disabled. Please refresh or try again later.
        </div>
      )}
      <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--glass-bg)',
        borderBottom: '1px solid var(--border-color)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        transition: 'all var(--transition-normal)',
      }}
    >
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        {/* Brand Logo: AI + Fynest (Network/Nest visual icon) */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div
            style={{
              background: 'var(--gradient-brand)',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Unique network/grid icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-display)', display: 'flex', gap: '2px' }}>
            <span style={{ color: 'var(--text-primary)' }}>AI</span>
            <span style={{ color: 'var(--color-primary)' }}>Fynest</span>
          </span>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
          }}
          className="desktop-nav"
        >
          <Link to="/ai-tools" style={navLinkStyle}>{t('allTools')}</Link>
          <a href="/#popular-tools" style={navLinkStyle}>{t('popularTools')}</a>
          <Link to="/blog" style={navLinkStyle}>{t('blog')}</Link>
          
          <div 
            style={{ position: 'relative' }}
            onMouseEnter={() => setMoreDropdownOpen(true)}
            onMouseLeave={() => setMoreDropdownOpen(false)}
          >
            <button
              style={{
                ...navLinkStyle,
                background: 'none',
                border: 'none',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
            >
              <span>{t('more')}</span>
              <ChevronDown size={14} />
            </button>
            
            {moreDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '8px',
                  width: '190px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '6px',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <Link to="/trending" className="dropdown-link" style={{ padding: '8px 12px', fontSize: '13px' }}>
                  {t('trending')}
                </Link>
                <Link to="/new" className="dropdown-link" style={{ padding: '8px 12px', fontSize: '13px' }}>
                  {t('newest')}
                </Link>
                <Link to="/collections" className="dropdown-link" style={{ padding: '8px 12px', fontSize: '13px' }}>
                  {t('collections')}
                </Link>
                <Link to="/compare" className="dropdown-link" style={{ padding: '8px 12px', fontSize: '13px' }}>
                  {t('compare')}
                </Link>
                <Link to="/advertise" className="dropdown-link" style={{ padding: '8px 12px', fontSize: '13px' }}>
                  {t('sponsorship')}
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Action stack: Outlined Login, Prominent Get Started, Visually distinct Submit Tool */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="desktop-actions">
          {/* Bookmark Icon Container */}
          <div style={{ position: 'relative' }} ref={savedDropdownRef}>
            <button 
              onClick={() => {
                setIsSavedDropdownOpen(!isSavedDropdownOpen);
                setIsLanguageDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
              className="header-icon-btn" 
              title={t('savedTitle')}
              style={{ ...iconBtnStyle, border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <Bookmark size={18} />
            </button>

            {/* Saved Tools Dropdown */}
            {isSavedDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '320px',
                  backgroundColor: 'var(--bg-card)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '12px',
                  zIndex: 1000,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔖</span> {t('savedTitle')}
                  </span>
                  {user && savedToolsList.length > 0 && (
                    <span className="badge badge-pricing" style={{ fontSize: '10px', padding: '2px 6px' }}>
                      {savedToolsList.length}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }} className="saved-tools-list">
                  {!user ? (
                    <div style={{ padding: '12px 6px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        {t('signInPrompt')}
                      </p>
                      <Link 
                        to="/login" 
                        className="btn btn-primary btn-xs" 
                        style={{ width: '100%', display: 'block', textDecoration: 'none', textAlign: 'center' }}
                        onClick={() => setIsSavedDropdownOpen(false)}
                      >
                        {t('login')}
                      </Link>
                    </div>
                  ) : savedToolsList.length === 0 ? (
                    <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {t('noSaved')}
                    </div>
                  ) : (
                    savedToolsList.map((tool) => (
                      <div 
                        key={tool.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '6px', 
                          borderRadius: 'var(--radius-sm)', 
                          transition: 'background 150ms ease',
                          cursor: 'pointer',
                          backgroundColor: 'rgba(255,255,255,0.02)'
                        }}
                        className="saved-tool-dropdown-item"
                        onClick={() => {
                          setIsSavedDropdownOpen(false);
                          navigate(`/tools/${tool.slug}`);
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <img 
                            src={tool.logoUrl} 
                            alt={tool.name} 
                            style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} 
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=50&h=50&fit=crop';
                            }}
                          />
                          <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {tool.name}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {tool.subCategory}
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteTool(user.id, tool.id);
                          }}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--text-muted)', 
                            cursor: 'pointer', 
                            fontSize: '14px', 
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          className="saved-tool-remove-btn"
                          title="Remove"
                        >
                          &times;
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Globe Icon Container (Language Selection) */}
          <div style={{ position: 'relative' }} ref={langDropdownRef}>
            <button 
              onClick={() => {
                setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
                setIsSavedDropdownOpen(false);
                setUserDropdownOpen(false);
              }}
              className="header-icon-btn" 
              title={t('language')}
              style={{ ...iconBtnStyle, border: 'none', background: 'none', cursor: 'pointer' }}
            >
              <GlobeIcon size={18} />
            </button>

            {/* Language Selector Dropdown */}
            {isLanguageDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '180px',
                  backgroundColor: 'var(--bg-card)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '6px',
                  zIndex: 1000,
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('language')}
                </div>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setActiveLanguage(lang.code);
                      localStorage.setItem('app_lang', lang.code);
                      setIsLanguageDropdownOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '8px 10px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px',
                      color: activeLanguage === lang.code ? 'var(--color-primary)' : 'var(--text-secondary)',
                      backgroundColor: activeLanguage === lang.code ? 'rgba(var(--color-primary-rgb), 0.08)' : 'transparent',
                      transition: 'all 150ms ease',
                      textAlign: 'left'
                    }}
                    className="lang-dropdown-btn"
                  >
                    <span>{lang.flag}</span>
                    <span style={{ fontWeight: activeLanguage === lang.code ? '600' : 'normal' }}>{lang.name}</span>
                    {activeLanguage === lang.code && (
                      <span style={{ marginLeft: 'auto', fontSize: '10px' }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <button
            onClick={toggleTheme}
            className="header-icon-btn theme-btn"
            title="Toggle light/dark theme"
            style={iconBtnStyle}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>

          {/* Conditional actions based on auth state */}
          {user ? (
            /* Logged In State */
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* If builder role: show quick admin navigation inline as a cohesive group */}
              {isOwner() && (
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '2px', 
                    padding: '3px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                  }} 
                  className="builder-links"
                >
                  <Link 
                    to="/dashboard" 
                    className={`builder-tab ${location.pathname === '/dashboard' && !location.search.includes('tab=') ? 'builder-tab-active' : ''}`}
                    style={{ textDecoration: 'none' }}
                  >
                    {t('dashboard')}
                  </Link>
                  <Link 
                    to="/dashboard?tab=listings" 
                    className={`builder-tab ${location.search.includes('tab=listings') ? 'builder-tab-active' : ''}`}
                    style={{ textDecoration: 'none' }}
                  >
                    {t('myTools')}
                  </Link>
                  <Link 
                    to="/dashboard?tab=analytics" 
                    className={`builder-tab ${location.search.includes('tab=analytics') ? 'builder-tab-active' : ''}`}
                    style={{ textDecoration: 'none' }}
                  >
                    {t('analytics')}
                  </Link>
                </div>
              )}

              {/* Profile Avatar Dropdown */}
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="btn btn-outline"
                  style={{ gap: '8px', padding: '8px 14px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center' }}
                >
                  <User size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span>{user.name.split(' ')[0]}</span>
                </button>

                {userDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      width: '190px',
                      backgroundColor: 'var(--bg-card)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '6px',
                      zIndex: 1000,
                    }}
                  >
                    {isAdmin() && (
                      <Link to="/admin" className="dropdown-link" style={{ color: 'var(--color-gold)', fontWeight: 'bold' }} onClick={() => setUserDropdownOpen(false)}>
                        <Layout size={14} style={{ flexShrink: 0, color: 'var(--color-gold)' }} />
                        <span>{t('adminConsole')}</span>
                      </Link>
                    )}
                    <Link to="/dashboard" className={`dropdown-link ${location.pathname === '/dashboard' && !location.search.includes('tab=') ? 'dropdown-link-active' : ''}`} onClick={() => setUserDropdownOpen(false)}>
                      <Layout size={14} style={{ flexShrink: 0 }} />
                      <span>{t('dashboard')}</span>
                    </Link>
                    <Link to="/dashboard?tab=saved" className={`dropdown-link ${location.search.includes('tab=saved') ? 'dropdown-link-active' : ''}`} onClick={() => setUserDropdownOpen(false)}>
                      <User size={14} style={{ flexShrink: 0 }} />
                      <span>{t('savedTitle')}</span>
                    </Link>
                    <Link to="/dashboard?tab=reviews" className={`dropdown-link ${location.search.includes('tab=reviews') ? 'dropdown-link-active' : ''}`} onClick={() => setUserDropdownOpen(false)}>
                      <User size={14} style={{ flexShrink: 0 }} />
                      <span>{t('myReviews')}</span>
                    </Link>
                    {isOwner() && (
                      <Link to="/dashboard?tab=listings" className={`dropdown-link ${location.search.includes('tab=listings') ? 'dropdown-link-active' : ''}`} onClick={() => setUserDropdownOpen(false)}>
                        <Layout size={14} style={{ flexShrink: 0 }} />
                        <span>{t('myTools')}</span>
                      </Link>
                    )}
                    <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 6px' }} />
                    <button
                      onClick={handleLogout}
                      className="dropdown-link dropdown-logout"
                      style={{
                        border: 'none',
                        background: 'none',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <LogOut size={14} style={{ flexShrink: 0 }} />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Logged Out State */
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <Link to="/login" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', textDecoration: 'none' }} className="login-text-link">
                {t('login')}
              </Link>
              <Link to="/signup" style={cleanSignupBtnStyle} className="clean-signup-btn">
                {t('signup')}
              </Link>
            </div>
          )}
          
          <Link to="/submit-tool" className="btn btn-primary btn-sm" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-bold)' }}>
            {t('submitTool')}
          </Link>
        </div>

          {/* Tablet/Mobile Hamburger Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-icon mobile-menu-btn"
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      {/* Responsive Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'var(--bg-primary)',
            zIndex: 99,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflowY: 'auto',
            borderTop: '1px solid var(--border-color)',
            animation: 'fade-in-overlay 150ms ease-out',
          }}
        >
          {/* Navigation Links */}
          <Link to="/ai-tools" style={mobileNavLinkStyle}>{t('allTools')}</Link>
          <a href="/#popular-tools" style={mobileNavLinkStyle}>{t('popularTools')}</a>
          <Link to="/trending" style={mobileNavLinkStyle}>{t('trending')}</Link>
          <Link to="/new" style={mobileNavLinkStyle}>{t('newest')}</Link>
          <Link to="/collections" style={mobileNavLinkStyle}>{t('collections')}</Link>
          <Link to="/compare" style={mobileNavLinkStyle}>{t('compare')}</Link>
          <Link to="/blog" style={mobileNavLinkStyle}>{t('blog')}</Link>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '8px 0' }} />

          {/* Mobile Auth Actions */}
          {!user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/login" className="btn btn-outline w-full" style={{ padding: '12px', justifyContent: 'center' }}>
                <User size={16} />
                <span>{t('login')}</span>
              </Link>
              <Link to="/signup" className="btn btn-primary w-full" style={{ padding: '12px', justifyContent: 'center' }}>
                <span>{t('getStarted')}</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/dashboard" style={mobileNavLinkStyle}>{t('dashboard')}</Link>
              {isOwner() && <Link to="/dashboard?tab=listings" style={mobileNavLinkStyle}>{t('myTools')}</Link>}
              <button
                onClick={handleLogout}
                className="btn btn-outline w-full"
                style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '10px', justifyContent: 'center' }}
              >
                <LogOut size={16} />
                <span>{t('logout')}</span>
              </button>
            </div>
          )}

          {/* Submit Tool - Visually distinct full-width CTA at the bottom of drawer */}
          <Link
            to="/submit-tool"
            className="btn w-full"
            style={{
              marginTop: 'auto',
              padding: '14px',
              justifyContent: 'center',
              background: 'var(--gradient-brand)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'var(--font-bold)',
              boxShadow: 'var(--shadow-md)',
              textAlign: 'center',
            }}
          >
            <span>{t('submitTool')}</span>
          </Link>
        </div>
      )}

      {/* Embedded CSS rules for responsive hiding and hover triggers */}
      <style>{`
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .desktop-actions { display: none !important; }
        }
        
        /* Smooth outlined Login hover transitions */
        .login-header-btn:hover {
          background-color: var(--bg-secondary) !important;
          border-color: var(--color-primary) !important;
          color: var(--color-primary) !important;
        }

        /* Nav links hovers */
        .desktop-nav a:hover {
          color: var(--color-primary) !important;
        }

        /* Dropdown Links Layout & Styling */
        .dropdown-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          font-size: var(--text-xs);
          color: var(--text-secondary);
          text-decoration: none;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          box-sizing: border-box;
        }

        .dropdown-link svg {
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .dropdown-link:hover {
          background-color: var(--bg-tertiary) !important;
          color: var(--color-primary) !important;
        }

        .dropdown-link:hover svg {
          color: var(--color-primary) !important;
        }

        .dropdown-link-active {
          background-color: var(--color-primary-light) !important;
          color: var(--color-primary) !important;
          font-weight: var(--font-bold);
        }

        .dropdown-link-active svg {
          color: var(--color-primary) !important;
        }

        .dropdown-logout {
          color: var(--color-danger) !important;
        }

        .dropdown-logout svg {
          color: var(--color-danger) !important;
          opacity: 0.8;
        }

        .dropdown-logout:hover {
          background-color: rgba(239, 68, 68, 0.08) !important;
          color: var(--color-danger) !important;
        }

        /* Builder Dashboard Tab Group Widget styling */
        .builder-tab {
          font-size: 11px !important;
          font-weight: var(--font-semibold) !important;
          color: var(--text-secondary) !important;
          padding: 6px 12px !important;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          display: inline-flex;
          align-items: center;
        }

        .builder-tab:hover {
          background-color: rgba(255, 255, 255, 0.06);
          color: var(--text-primary) !important;
        }

        .builder-tab-active {
          background-color: var(--color-primary-light) !important;
          color: var(--color-primary) !important;
          font-weight: var(--font-bold);
        }

        .header-icon-btn {
          color: var(--text-secondary) !important;
          transition: all 0.2s ease;
        }

        .header-icon-btn:hover {
          color: var(--text-primary) !important;
          background-color: var(--bg-tertiary) !important;
        }

        .login-text-link {
          transition: color 0.2s ease;
        }

        .login-text-link:hover {
          color: var(--text-primary) !important;
        }

        .clean-signup-btn:hover {
          background-color: #1d4ed8 !important; /* Muted hover state */
        }

        .saved-tool-dropdown-item:hover {
          background-color: var(--bg-tertiary) !important;
        }

        .saved-tool-remove-btn:hover {
          color: var(--color-danger) !important;
        }

        .lang-dropdown-btn:hover {
          background-color: var(--bg-tertiary) !important;
          color: var(--color-primary) !important;
        }
      `}</style>
    </header>
    </>
  );
};

const navLinkStyle: React.CSSProperties = {
  fontSize: 'var(--text-sm)',
  fontWeight: '600',
  color: 'var(--text-secondary)',
  transition: 'color var(--transition-fast)',
  textDecoration: 'none',
};

const mobileNavLinkStyle: React.CSSProperties = {
  fontSize: 'var(--text-base)',
  fontWeight: 'var(--font-semibold)',
  color: 'var(--text-primary)',
  padding: '8px 0',
  borderBottom: '1px solid var(--border-color)',
  textDecoration: 'none',
};

const cleanSignupBtnStyle: React.CSSProperties = {
  backgroundColor: '#2563eb', // Royal Blue matching screenshot
  color: '#ffffff',
  padding: '8px 20px',
  borderRadius: '8px',
  fontWeight: '700',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '8px',
  borderRadius: 'var(--radius-full)',
  transition: 'color 0.2s, background-color 0.2s',
  textDecoration: 'none',
};
