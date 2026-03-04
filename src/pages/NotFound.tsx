import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  usePageTitle('Page Not Found');

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6" style={{ backgroundColor: '#F5F3FF' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        <div className="text-7xl mb-4">🍳</div>
        <h1 className="text-5xl font-bold mb-2" style={{ color: '#7C3AED' }}>404</h1>
        <p className="text-lg font-medium mb-1" style={{ color: '#1E1B4B' }}>
          This page doesn't exist
        </p>
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          Looks like this recipe was never written. Let's get you back to the kitchen.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 rounded-xl text-white font-semibold text-sm"
          style={{ backgroundColor: '#7C3AED' }}
        >
          ← Back Home
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
