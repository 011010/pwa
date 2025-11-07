/**
 * Asset Card Component
 *
 * Displays asset information in a card format for lists and grids.
 * Shows key details like name, status, location, and assigned user.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { AssetCardProps, AssetStatus } from '../types';

/**
 * Get status badge styling
 */
const getStatusBadge = (status: AssetStatus) => {
  const styles = {
    available: 'bg-green-100 text-green-800 border-green-200',
    in_use: 'bg-blue-100 text-blue-800 border-blue-200',
    maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    retired: 'bg-gray-100 text-gray-800 border-gray-200',
    lost: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels = {
    available: 'Available',
    in_use: 'In Use',
    maintenance: 'Maintenance',
    retired: 'Retired',
    lost: 'Lost',
  };

  return {
    className: styles[status],
    label: labels[status],
  };
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onClick }) => {
  const statusBadge = getStatusBadge(asset.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-lg shadow-soft hover:shadow-medium transition-all duration-200 overflow-hidden cursor-pointer"
    >
      <div className="p-4">
        {/* Header - Code and Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-1">
              {asset.name}
            </h3>
            <p className="text-sm text-gray-500 font-mono">{asset.code}</p>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Asset Details */}
        <div className="space-y-2">
          {/* Model & Serial Number */}
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
              />
            </svg>
            <span className="line-clamp-1">
              <span className="font-medium">{asset.model}</span>
              {asset.serial_number && (
                <span className="text-gray-400 ml-1">• {asset.serial_number}</span>
              )}
            </span>
          </div>

          {/* Location */}
          {asset.location && (
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="line-clamp-1">{asset.location}</span>
            </div>
          )}

          {/* Assigned User */}
          {asset.assigned_to && (
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="line-clamp-1">{asset.assigned_to.name}</span>
            </div>
          )}

          {/* Category */}
          {asset.category && (
            <div className="flex items-center text-sm text-gray-600">
              <svg
                className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <span className="line-clamp-1">{asset.category}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Last Updated */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Updated {new Date(asset.updated_at).toLocaleDateString()}
        </p>
      </div>
    </motion.div>
  );
};

export default AssetCard;
