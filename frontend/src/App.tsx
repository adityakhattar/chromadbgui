import { Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';

// Import our simplified pages
import CollectionsHome from '@/pages/CollectionsHome';
import CollectionDetail from '@/pages/CollectionDetail';
import Logs from '@/pages/Logs';
import Analytics from '@/pages/Analytics';

// Import loading components
import { FullPageSpinner } from '@/components/Loading';

// Keep the loading fallback
function LoadingFallback() {
  return <FullPageSpinner />;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Simplified routing - no authentication required */}
        <Route path="/" element={<CollectionsHome />} />
        <Route path="/collections" element={<CollectionsHome />} />
        <Route path="/collection/:name" element={<CollectionDetail />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/analytics" element={<Analytics />} />

        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<CollectionsHome />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <AnimatedRoutes />
      </Suspense>
      <ToastContainer />
    </>
  );
}

export default App;
