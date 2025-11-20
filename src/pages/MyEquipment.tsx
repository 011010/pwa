/**
 * My Equipment Page
 *
 * Allows employees to view their assigned equipment and home office requests.
 * Shows equipment details and allows uploading photos on output/input dates.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { equipmentOutputService } from '../services/equipmentOutputService';
import { BottomNav } from '../components/BottomNav';
import type { EquipmentOutput } from '../types';

export const MyEquipment: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [outputs, setOutputs] = useState<EquipmentOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'returned'>('active');

  useEffect(() => {
    fetchMyEquipment();
  }, [user]);

  const fetchMyEquipment = async () => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await equipmentOutputService.getMyEquipmentOutputs(user.email);
      setOutputs(data);
    } catch (err: any) {
      console.error('Failed to fetch my equipment:', err);
      setError(err.message || 'Failed to load equipment');
    } finally {
      setIsLoading(false);
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

  // Filter outputs
  const filteredOutputs = outputs.filter(output => {
    if (filter === 'active') return output.is_active;
    if (filter === 'returned') return !output.is_active;
    return true;
  });

  const activeCount = outputs.filter(o => o.is_active).length;
  const returnedCount = outputs.filter(o => !o.is_active).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Mis Equipos</h1>
              <p className="text-purple-100 text-sm">
                {user?.full_name || (user?.lastnames ? `${user.name} ${user.lastnames}` : user?.name)}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{outputs.length}</div>
              <div className="text-xs text-purple-100">Total</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{activeCount}</div>
              <div className="text-xs text-purple-100">Activos</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{returnedCount}</div>
              <div className="text-xs text-purple-100">Devueltos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Activos ({activeCount})
            </button>
            <button
              onClick={() => setFilter('returned')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                filter === 'returned'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Devueltos ({returnedCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos ({outputs.length})
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
          </div>
        ) : filteredOutputs.length > 0 ? (
          <div className="space-y-3">
            {filteredOutputs.map((output) => (
              <motion.div
                key={output.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/my-equipment/${output.id}`)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{output.equipment.name}</h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          output.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {output.is_active ? 'En Home Office' : 'Devuelto'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Serial: {output.equipment.serial_number}
                    </p>
                    <p className="text-sm text-gray-600">
                      Modelo: {output.equipment.model}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="text-gray-600">
                      <span className="font-medium">Salida:</span> {formatDate(output.output_date)}
                    </span>
                  </div>
                  {output.input_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="text-gray-600">
                        <span className="font-medium">Entrada:</span> {formatDate(output.input_date)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver Detalle y Fotos
                  </button>
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes equipos {filter === 'active' ? 'activos' : filter === 'returned' ? 'devueltos' : ''}
            </h3>
            <p className="text-gray-600">
              {filter === 'active'
                ? 'No tienes equipos en home office actualmente'
                : 'No se encontraron equipos con este filtro'}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MyEquipment;
