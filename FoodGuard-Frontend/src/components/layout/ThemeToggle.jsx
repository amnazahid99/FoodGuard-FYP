import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex flex-col items-center">
      {/* Pill */}
      <motion.button
        onClick={toggleTheme}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        className="relative flex items-center cursor-pointer flex-shrink-0"
        style={{
          width: 64,
          height: 32,
          borderRadius: 50,
          background: isDark ? 'rgba(26,188,156,0.15)' : 'rgba(255,183,0,0.15)',
          border: isDark
            ? '1px solid rgba(26,188,156,0.3)'
            : '1px solid rgba(255,183,0,0.4)',
          transition: 'background 0.4s cubic-bezier(0.4,0,0.2,1), border 0.4s cubic-bezier(0.4,0,0.2,1)',
          padding: 4,
        }}
      >
        {/* Sliding circle */}
        <motion.div
          layout
          animate={{ x: isDark ? 32 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="flex items-center justify-center text-white flex-shrink-0"
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: isDark ? '#1ABC9C' : '#F5A623',
            boxShadow: isDark
              ? '0 0 8px rgba(26,188,156,0.6)'
              : '0 0 8px rgba(245,166,35,0.6)',
            fontSize: 13,
            transition: 'background 0.4s ease, box-shadow 0.4s ease',
            position: 'absolute',
            left: 4,
          }}
        >
          {isDark ? '🌙' : '☀️'}
        </motion.div>
      </motion.button>

      {/* Tooltip */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.18 }}
        className="absolute top-full mt-1.5 whitespace-nowrap pointer-events-none"
        style={{
          fontSize: 11,
          color: '#A8B2C1',
          fontFamily: 'Inter, sans-serif',
          zIndex: 100,
        }}
      >
        {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </motion.span>
    </div>
  );
}
