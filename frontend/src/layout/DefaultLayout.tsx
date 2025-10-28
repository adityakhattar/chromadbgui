import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '@/utils/constants';
import PageTransition from '@/components/PageTransition';

interface DefaultLayoutProps {
  children: ReactNode;
}

const DefaultLayout = ({ children }: DefaultLayoutProps) => {
  // Initialize sidebar state from localStorage, default to closed
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved === 'true' ? true : false;
  });
  const [totalCollections, setTotalCollections] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch total collections count
  useEffect(() => {
    async function fetchCollectionCount() {
      try {
        const response = await fetch(`${API_BASE}/api/chroma/collections`);
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const collectionsArray = Array.isArray(result.data) ? result.data : [];
            setTotalCollections(collectionsArray.length);
          }
        }
      } catch (err) {
        console.error('Error fetching collections:', err);
      }
    }
    fetchCollectionCount();
  }, []);

  // Save sidebar state to localStorage whenever it changes
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', String(newState));
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="z-1 bg-zinc-900">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          className="bg-zinc-800 border-r border-white/10 flex flex-col"
          initial={false}
          animate={{ width: sidebarOpen ? 256 : 64 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <AnimatePresence mode="wait">
              {sidebarOpen && (
                <motion.h1
                  key="logo"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-white font-semibold text-lg"
                >
                  ChromaGUI
                </motion.h1>
              )}
            </AnimatePresence>
            <motion.button
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
              </svg>
            </motion.button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-2">
            <motion.button
              onClick={() => navigate('/')}
              className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'} py-2 rounded-lg transition-colors ${
                isActive('/') || isActive('/collections') || location.pathname.startsWith('/collection/')
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    key="collections-text"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    Collections
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              onClick={() => navigate('/logs')}
              className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'} py-2 rounded-lg transition-colors ${
                isActive('/logs')
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    key="logs-text"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    Logs
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              onClick={() => navigate('/analytics')}
              className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-3' : 'justify-center px-2'} py-2 rounded-lg transition-colors ${
                isActive('/analytics')
                  ? 'bg-cyan-500 text-white'
                  : 'text-gray-300 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    key="analytics-text"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    Analytics
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </nav>

          {/* Sidebar Footer - Stats */}
          <div className="p-4 border-t border-white/10 space-y-3">
            {sidebarOpen ? (
              <>
                {/* Total Collections */}
                <div>
                  <p className="text-xs text-gray-500">Collections</p>
                  <p className="text-lg font-semibold text-white">{totalCollections}</p>
                </div>
                {/* Backend Status */}
                <div>
                  <p className="text-xs text-gray-500">Backend</p>
                  <p className="text-sm font-medium text-green-500">Connected</p>
                </div>
                {/* ChromaDB API */}
                <div>
                  <p className="text-xs text-gray-500">ChromaDB API</p>
                  <p className="text-xs font-medium text-cyan-400 truncate">
                    {process.env.VITE_API_BASE || 'localhost:3001'}
                  </p>
                </div>
                {/* Version */}
                <div className="pt-2 border-t border-white/10">
                  <p className="text-xs text-gray-600">ChromaGUI v1.0.0</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Collections</p>
                  <p className="text-sm font-semibold text-white">{totalCollections}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500" title="Backend Connected"></div>
              </div>
            )}
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <main>
            <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
              <PageTransition>{children}</PageTransition>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DefaultLayout;
