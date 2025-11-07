import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRScanner } from '../components/QRScanner';
import { BottomNav } from '../components/BottomNav';
import { assetsService } from '../services/assetsService';

export const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScanSuccess = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Find the equipment by code
      const asset = await assetsService.getAssetByCode(code);

      // Clear loading state before navigation to prevent modal from staying open
      setIsLoading(false);

      // If equipment has an assigned person, show all their equipment
      if (asset.assigned_to && asset.assigned_to.id) {
        navigate(`/employee-equipment/${asset.assigned_to.id}`, {
          state: { employeeName: asset.assigned_to.name },
          replace: true // Replace history to prevent back button issues
        });
      } else {
        // If not assigned, just show the equipment details
        navigate(`/equipment/${asset.id}`, {
          replace: true // Replace history to prevent back button issues
        });
      }
    } catch (err: any) {
      setError(err.message || 'Equipment not found');
      setIsLoading(false);
    }
  };

  const handleScanError = (err: Error) => {
    setError(err.message);
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Scan Asset</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scanner */}
      <div className="h-[calc(100vh-10rem)]">
        <QRScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} />
      </div>

      {/* Loading/Error Overlay */}
      {(isLoading || error) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 mx-4 max-w-sm">
            {isLoading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                <p className="text-gray-700">Loading asset...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-900 font-medium mb-4">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  Try Again
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>
      )}

      <BottomNav />
    </div>
  );
};

export default Scanner;
