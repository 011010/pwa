/**
 * Equipment Outputs Page Component
 *
 * Displays and manages equipment outputs (home office).
 * Shows active and returned equipment, allows creating outputs and marking returns.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { equipmentOutputService } from '../services/equipmentOutputService';
import { BottomNav } from '../components/BottomNav';
import type { EquipmentOutput, EquipmentOutputStats } from '../types';

export const EquipmentOutputs: React.FC = () => {
  const navigate = useNavigate();
  const [outputs, setOutputs] = useState<EquipmentOutput[]>([]);
  const [stats, setStats] = useState<EquipmentOutputStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'returned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<EquipmentOutput | null>(null);
  const [returnComments, setReturnComments] = useState('');
  const [isReturning, setIsReturning] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch ALL outputs (API doesn't accept is_active parameter)
      const params = {
        per_page: 100,
      };

      const outputsResponse = await equipmentOutputService.getEquipmentOutputs(params);

      // Filter on client side based on filter selection
      let filteredOutputs = outputsResponse.data;
      if (filter === 'active') {
        filteredOutputs = outputsResponse.data.filter(output => output.is_active);
      } else if (filter === 'returned') {
        filteredOutputs = outputsResponse.data.filter(output => !output.is_active);
      }

      setOutputs(filteredOutputs);

      // Calculate stats from data (backend doesn't have /stats endpoint yet)
      const calculatedStats: EquipmentOutputStats = {
        total_outputs: outputsResponse.data.length,
        active_outputs: outputsResponse.data.filter(o => o.is_active).length,
        returned_outputs: outputsResponse.data.filter(o => !o.is_active).length,
      };
      setStats(calculatedStats);
    } catch (err: any) {
      console.error('Failed to fetch equipment outputs:', err);
      setError(err.message || 'Failed to load equipment outputs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      fetchData();
      return;
    }

    try {
      setIsLoading(true);
      // Search without is_active filter, then filter on client side
      const results = await equipmentOutputService.searchEquipmentOutputs(query);

      // Filter on client side based on filter selection
      let filteredResults = results;
      if (filter === 'active') {
        filteredResults = results.filter(output => output.is_active);
      } else if (filter === 'returned') {
        filteredResults = results.filter(output => !output.is_active);
      }

      setOutputs(filteredResults);
    } catch (err: any) {
      console.error('Search failed:', err);
      setError(err.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnClick = (output: EquipmentOutput) => {
    setSelectedOutput(output);
    setReturnComments('');
    setShowReturnModal(true);
  };

  const handleReturnSubmit = async () => {
    if (!selectedOutput || !returnComments.trim()) {
      return;
    }

    try {
      setIsReturning(true);
      await equipmentOutputService.updateEquipmentOutput(selectedOutput.id, {
        input_comments: returnComments,
        input_date: new Date().toISOString(),
      });

      setShowReturnModal(false);
      setSelectedOutput(null);
      setReturnComments('');
      fetchData();
    } catch (err: any) {
      console.error('Failed to mark as returned:', err);
      alert(err.message || 'Failed to mark equipment as returned');
    } finally {
      setIsReturning(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold">Equipment Departures</h1>
                <p className="text-blue-100 text-sm">Home Office Management</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/equipment-outputs/new')}
              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Departure
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.total_outputs}</div>
                <div className="text-xs text-blue-100">All</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.active_outputs}</div>
                <div className="text-xs text-blue-100">Active</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{stats.returned_outputs}</div>
                <div className="text-xs text-blue-100">Returned</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4 space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by employee, serial number, model..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('returned')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                filter === 'returned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Returned
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4"
          >
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : outputs.length > 0 ? (
          <div className="space-y-3">
            {outputs.map((output) => (
              <motion.div
                key={output.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/equipment-outputs/${output.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{output.equipment.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          output.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {output.is_active ? 'Active' : 'Returned'}
                      </span>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Serial:</span> {output.equipment.serial_number}
                      </p>
                      <p>
                        <span className="font-medium">Model:</span> {output.equipment.model}
                      </p>
                      <p>
                        <span className="font-medium">Employee:</span> {output.employee.full_name}
                      </p>
                      <p>
                        <span className="font-medium">Departament:</span> {output.employee.department}
                      </p>
                      <p>
                        <span className="font-medium">Output Date:</span> {formatDate(output.output_date)}
                      </p>
                      {output.input_date && (
                        <p>
                          <span className="font-medium">Input Date:</span> {formatDate(output.input_date)}
                        </p>
                      )}
                      <p className="text-xs italic mt-2">
                        <span className="font-medium">Output Comments:</span> {output.output_comments}
                      </p>
                      {output.input_comments && (
                        <p className="text-xs italic">
                          <span className="font-medium">Input Comments:</span> {output.input_comments}
                        </p>
                      )}
                    </div>

                    {/* Photo indicators */}
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      {output.output_photo && (
                        <span className="flex items-center gap-1 text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Foto salida
                        </span>
                      )}
                      {output.input_photo && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Foto entrada
                        </span>
                      )}
                      {output.input_signature && (
                        <span className="flex items-center gap-1 text-purple-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          Firma
                        </span>
                      )}
                    </div>
                  </div>

                  {output.is_active && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card click
                        handleReturnClick(output);
                      }}
                      className="ml-4 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Mark as Returned
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">There are no equipment outputs.</h3>
            <p className="text-gray-600">No equipment outputs were found with the selected filters.</p>
          </div>
        )}
      </div>

      {/* Return Modal */}
      {showReturnModal && selectedOutput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark as Returned</h3>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{selectedOutput.equipment.name}</p>
              <p className="text-xs text-gray-600">{selectedOutput.equipment.serial_number}</p>
              <p className="text-xs text-gray-600 mt-1">{selectedOutput.employee.full_name}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Comments *
              </label>
              <textarea
                value={returnComments}
                onChange={(e) => setReturnComments(e.target.value)}
                placeholder="Describe the condition of the equipment when returned..."
                rows={4}
                maxLength={350}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">{returnComments.length}/350 characters</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReturnModal(false)}
                disabled={isReturning}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnSubmit}
                disabled={isReturning || !returnComments.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isReturning ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default EquipmentOutputs;
