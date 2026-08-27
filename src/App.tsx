import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { DatabaseProvider } from './context/DatabaseContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/shared/Toast';

// Views imports
import { Home } from './views/Home';
import { Directory } from './views/Directory';
import { CategoryDetail } from './views/CategoryDetail';
import { ToolDetail } from './views/ToolDetail';
import { Compare } from './views/Compare';
import { SubmitTool } from './views/SubmitTool';
import { ClaimListing } from './views/ClaimListing';
import { Collections } from './views/Collections';
import { CollectionDetail } from './views/CollectionDetail';
import { Trending } from './views/Trending';
import { NewTools } from './views/NewTools';
import { Blog } from './views/Blog';
import { BlogDetail } from './views/BlogDetail';
import { Pricing } from './views/Pricing';
import { Advertise } from './views/Advertise';
import { Login } from './views/Login';
import { Signup } from './views/Signup';
import { VerifyEmail } from './views/VerifyEmail';
import { AffiliateRedirect } from './views/AffiliateRedirect';
import { Alternatives } from './views/Alternatives';
import { Info } from './views/Info';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

const OwnerDashboard = React.lazy(() => import('./views/dashboard/Overview').then(m => ({ default: m.OwnerDashboard })));
const AdminDashboard = React.lazy(() => import('./views/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const ManageTool = React.lazy(() => import('./views/dashboard/ManageTool').then(m => ({ default: m.ManageTool })));

// Import CSS Design system
import './styles/main.css';

const AppContent: React.FC<{
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  compareList: string[];
  handleCompareToggle: (toolId: string) => void;
  handleCompareClear: () => void;
}> = ({ showToast, compareList, handleCompareToggle, handleCompareClear }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return; // Wait until initial session fetch completes to avoid premature redirects

    // Redirect unverified logged-in users to /verify-email, preserving exceptions for signup/login pathways
    if (user && !user.emailConfirmedAt) {
      const allowedPaths = ['/verify-email', '/login', '/signup'];
      if (!allowedPaths.includes(location.pathname)) {
        navigate(`/verify-email?email=${encodeURIComponent(user.email)}`);
      }
    }
  }, [user, loading, location.pathname, navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <React.Suspense fallback={
          <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ border: '3px solid rgba(0,0,0,0.1)', borderTop: '3px solid var(--color-primary)', borderRadius: '50%', width: '32px', height: '32px', animation: 'spin 1s linear infinite' }}></div>
          </div>
        }>
          <Routes>
            {/* Core Public routes */}
            <Route path="/" element={<Home onToast={showToast} />} />
          <Route
            path="/ai-tools"
            element={
              <Directory
                onToast={showToast}
                compareList={compareList}
                onCompareToggle={handleCompareToggle}
                onCompareClear={handleCompareClear}
              />
            }
          />
          <Route
            path="/ai-tools/:seoSlug"
            element={
              <Directory
                onToast={showToast}
                compareList={compareList}
                onCompareToggle={handleCompareToggle}
                onCompareClear={handleCompareClear}
              />
            }
          />
          
          {/* Redirect categories index to home (homepage lists all categories anyway) */}
          <Route path="/categories" element={<Navigate to="/" replace />} />
          <Route
            path="/categories/:slug"
            element={
              <CategoryDetail
                onToast={showToast}
                compareList={compareList}
                onCompareToggle={handleCompareToggle}
              />
            }
          />
          
          <Route
            path="/tools/:slug"
            element={
              <ToolDetail
                onToast={showToast}
                compareList={compareList}
                onCompareToggle={handleCompareToggle}
              />
            }
          />
          <Route path="/go/:slug" element={<AffiliateRedirect onToast={showToast} />} />

          <Route
            path="/compare"
            element={
              <Compare
                compareList={compareList}
                onCompareToggle={handleCompareToggle}
                onCompareClear={handleCompareClear}
              />
            }
          />
          <Route
            path="/compare/:slugs"
            element={
              <Compare
                compareList={compareList}
                onCompareToggle={handleCompareToggle}
                onCompareClear={handleCompareClear}
              />
            }
          />
          <Route
            path="/alternatives/:toolSlug"
            element={
              <Alternatives />
            }
          />

          <Route path="/collections" element={<Collections />} />
          <Route
            path="/collections/:id"
            element={
              <CollectionDetail
                onToast={showToast}
                compareList={compareList}
                onCompareToggle={handleCompareToggle}
              />
            }
          />

          <Route
            path="/trending"
            element={
              <Trending
                onToast={showToast}
                compareList={compareList}
                onCompareToggle={handleCompareToggle}
              />
            }
          />

          <Route
            path="/new"
            element={
              <NewTools
                onToast={showToast}
                compareList={compareList}
                onCompareToggle={handleCompareToggle}
              />
            }
          />

          <Route path="/submit-tool" element={<SubmitTool onToast={showToast} />} />
          <Route path="/claim" element={<ClaimListing onToast={showToast} />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/advertise" element={<Advertise />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          {/* Policy & Info routes */}
          <Route path="/editorial" element={<Info initialTab="editorial" />} />
          <Route path="/reviews" element={<Info initialTab="reviews" />} />
          <Route path="/disclosure" element={<Info initialTab="disclosure" />} />
          <Route path="/privacy" element={<Info initialTab="privacy" />} />
          <Route path="/terms" element={<Info initialTab="terms" />} />

          {/* Authentication routes */}
          <Route path="/login" element={<Login onToast={showToast} />} />
          <Route path="/signup" element={<Signup onToast={showToast} />} />
          <Route path="/verify-email" element={<VerifyEmail onToast={showToast} />} />

          {/* Dashboard & Admin channels */}
          <Route path="/dashboard" element={<OwnerDashboard onToast={showToast} />} />
          <Route path="/dashboard/tools" element={<OwnerDashboard onToast={showToast} />} />
          <Route path="/dashboard/tools/:id/edit" element={<ManageTool />} />
          <Route path="/admin" element={<AdminDashboard onToast={showToast} />} />
        </Routes>
      </React.Suspense>
    </main>

      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  // Global Toast Alert system state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  // Shared Compare stack state (ids array)
  const [compareList, setCompareList] = useState<string[]>([]);

  const handleCompareToggle = (toolId: string) => {
    const active = compareList.includes(toolId);
    if (active) {
      setCompareList(compareList.filter((id) => id !== toolId));
      showToast('Removed from comparison list.', 'info');
    } else {
      if (compareList.length >= 3) {
        showToast('You can compare a maximum of 3 tools side-by-side.', 'error');
        return;
      }
      setCompareList([...compareList, toolId]);
      showToast('Added to comparison list!', 'success');
    }
  };

  const handleCompareClear = () => {
    setCompareList([]);
    showToast('Comparison stack cleared.', 'info');
  };

  return (
    <Router>
      <DatabaseProvider>
        <AuthProvider>
          <ErrorBoundary>
            <AppContent
              showToast={showToast}
              compareList={compareList}
              handleCompareToggle={handleCompareToggle}
              handleCompareClear={handleCompareClear}
            />
          </ErrorBoundary>
          {/* Render Toast Alert notifications */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AuthProvider>
      </DatabaseProvider>
    </Router>
  );
};

export default App;
