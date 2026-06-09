import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Home } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-9xl font-bold text-[#1ABC9C] mb-4">404</h1>
          <h2 className="text-4xl font-bold text-white mb-4">
            Page Not Found
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Button
            onClick={() => navigate('/')}
            className="bg-[#1ABC9C] hover:bg-[#16a085] text-white rounded-full px-8 py-6 text-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
