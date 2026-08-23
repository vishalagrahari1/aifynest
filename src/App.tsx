/* src/App.tsx */
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DatabaseProvider } from './context/DatabaseContext';
import { AuthProvider } from './context/AuthContext';
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
import { OwnerDashboard } from './views/dashboard/Overview';
import { AdminDashboard } from './views/admin/AdminDashboard';
import { AffiliateRedirect } from './views/AffiliateRedirect';
import { ManageTool } from './views/dashboard/ManageTool';
import { Alternatives } from './views/Alternatives';

// Import CSS Design system
import './styles/main.css';

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
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

                {/* Authentication routes */}
                <Route path="/login" element={<Login onToast={showToast} />} />
                <Route path="/signup" element={<Signup onToast={showToast} />} />

                {/* Dashboard & Admin channels */}
                <Route path="/dashboard" element={<OwnerDashboard onToast={showToast} />} />
                <Route path="/dashboard/tools" element={<OwnerDashboard onToast={showToast} />} />
                <Route path="/dashboard/tools/:id/edit" element={<ManageTool />} />
                <Route path="/admin" element={<AdminDashboard onToast={showToast} />} />
              </Routes>
            </main>

            <Footer />
          </div>

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
