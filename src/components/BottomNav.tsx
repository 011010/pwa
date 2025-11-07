/**
 * Bottom Navigation Component
 *
 * Provides mobile-friendly navigation with large touch targets.
 * Displays active state and icon for each route.
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    path: '/dashboard',
    label: 'Home',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    path: '/scanner',
    label: 'Scan',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
        />
      </svg>
    ),
  },
  {
    path: '/profile',
    label: 'Profile',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full group"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div
                className={`transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-400 group-hover:text-gray-600'
                }`}
              >
                {item.icon}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium mt-1 transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500 group-hover:text-gray-700'
                }`}
              >
                {item.label}
              </span>

              {/* Ripple effect on tap */}
              <motion.div
                className="absolute inset-0 rounded-lg"
                whileTap={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                transition={{ duration: 0.1 }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
